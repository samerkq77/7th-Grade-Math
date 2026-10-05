// Content checker: node tools/validate.js [unitNumber ...]
// Loads js/data/unitN.js files and reports schema / answer problems.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const only = process.argv.slice(2).map(Number);
const dir = path.join(__dirname, "..", "js", "data");
const files = fs.readdirSync(dir).filter((f) => /^unit\d+\.js$/.test(f))
  .filter((f) => !only.length || only.includes(+f.match(/\d+/)[0]));

function normalize(s) {
  return String(s)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[٫,]/g, ".").replace(/[−–—]/g, "-").replace(/÷/g, "/").replace(/\s+/g, " ").trim();
}
function parseNum(raw) {
  if (typeof raw === "number") return raw;
  let s = normalize(raw).replace(/[^0-9.\-\/ ]/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/\s*\/\s*/g, "/").replace(/-\s+/g, "-");
  let m;
  if ((m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/))) { const v = +m[2] + +m[3] / +m[4]; return m[1] ? -v : v; }
  if ((m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/))) return +m[2] === 0 ? NaN : +m[1] / +m[2];
  if (/^-?\d*\.?\d+$/.test(s)) return parseFloat(s);
  return NaN;
}

let errors = 0, warnings = 0, problemCount = 0, lessonCount = 0;
const err = (where, msg) => { errors++; console.log("ERROR  " + where + ": " + msg); };
const warn = (where, msg) => { warnings++; console.log("warn   " + where + ": " + msg); };

function checkText(where, s) {
  if (s == null) return;
  if (typeof s !== "string") return err(where, "text is not a string");
  const open = (s.match(/\[\[/g) || []).length, close = (s.match(/\]\]/g) || []).length;
  if (open !== close) err(where, `unbalanced [[ ]] (${open} vs ${close})`);
  const maths = s.match(/\[\[([\s\S]+?)\]\]/g) || [];
  maths.forEach((m) => {
    const o = (m.match(/\{/g) || []).length, c = (m.match(/\}/g) || []).length;
    if (o !== c) err(where, "unbalanced { } inside math: " + m);
  });
  // math outside [[ ]] that RTL will scramble
  const outside = s.replace(/\[\[[\s\S]+?\]\]/g, "").replace(/<[^>]+>/g, "");
  if (/\{[^{}]*\/[^{}]*\}/.test(outside)) err(where, "fraction {a/b} outside [[ ]]");
  if (/\d\s*[+×÷=]\s*-?\d|-\d/.test(outside)) warn(where, "possible math outside [[ ]]: " + outside.match(/.{0,15}(\d\s*[+×÷=]\s*-?\d|-\d).{0,15}/)[0]);
  const tags = s.match(/<\/?(\w+)/g) || [];
  const allowed = /^<\/?(b|i|u|br|ul|ol|li|table|thead|tbody|tr|th|td|div|span|p|small|strong|em|svg|g|line|rect|circle|ellipse|path|polygon|polyline|text|tspan|defs|marker|sup|sub)$/;
  tags.forEach((t) => { if (!allowed.test(t)) warn(where, "unexpected tag " + t); });
}

function checkProblem(where, p, isGen) {
  problemCount += isGen ? 0 : 1;
  if (!p || typeof p !== "object") return err(where, "problem is not an object");
  if (!p.q) err(where, "missing q");
  checkText(where + ".q", p.q); checkText(where + ".hint", p.hint); checkText(where + ".solution", p.solution);
  if (!isGen && !p.solution) err(where, "missing solution");
  if (!isGen && !p.hint) warn(where, "missing hint");
  if (!isGen && ![1, 2, 3].includes(p.level)) err(where, "level must be 1, 2 or 3");
  const type = p.type || "num";
  if (!["num", "choice", "text"].includes(type)) return err(where, "bad type " + type);
  if (type === "choice") {
    if (!Array.isArray(p.options) || p.options.length < 2) return err(where, "choice needs options[]");
    p.options.forEach((o, i) => checkText(where + ".options[" + i + "]", o));
    if (!Number.isInteger(p.answer) || p.answer < 0 || p.answer >= p.options.length) err(where, "choice answer must be a valid option index");
    const uniq = new Set(p.options.map(String));
    if (uniq.size !== p.options.length) err(where, "duplicate options");
  } else if (type === "num") {
    if (p.type !== "num") err(where, 'type must be set explicitly ("num")');
    const answers = Array.isArray(p.answer) ? p.answer : [p.answer];
    if (!answers.length) err(where, "missing answer");
    answers.forEach((a) => { if (isNaN(parseNum(a))) err(where, "answer not parseable as a number: " + JSON.stringify(a)); });
  } else {
    const answers = Array.isArray(p.answer) ? p.answer : [p.answer];
    if (!answers.length || answers.some((a) => typeof a !== "string" || !a.trim())) err(where, "text answer must be non-empty strings");
  }
}

const sandbox = { window: {}, Math, console };
vm.createContext(sandbox);
const unitsSeen = new Set();
const lessonIds = new Set();
for (const f of files) {
  const before = (sandbox.window.UNITS || []).length;
  try { vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), sandbox, { filename: f }); }
  catch (e) { err(f, "file does not run: " + e.message); continue; }
  const added = (sandbox.window.UNITS || []).slice(before);
  if (added.length !== 1) { err(f, "file must push exactly one unit into window.UNITS"); continue; }
  const u = added[0];
  const W = "unit" + u.id;
  if (unitsSeen.has(u.id)) err(W, "duplicate unit id"); unitsSeen.add(u.id);
  ["title", "tagline", "intro", "glyph"].forEach((k) => { if (!u[k]) err(W, "missing " + k); });
  if (![1, 2].includes(u.semester)) err(W, "semester must be 1 or 2");
  checkText(W + ".intro", u.intro); checkText(W + ".tagline", u.tagline);
  if (!Array.isArray(u.lessons) || !u.lessons.length) { err(W, "no lessons"); continue; }
  u.lessons.forEach((l, li) => {
    lessonCount++;
    const L = W + ".lesson[" + (l.id || li) + "]";
    if (l.id !== u.id + "-" + (li + 1)) err(L, `lesson id must be "${u.id}-${li + 1}"`);
    if (lessonIds.has(l.id)) err(L, "duplicate lesson id"); lessonIds.add(l.id);
    ["title", "story", "tip", "joke"].forEach((k) => { if (!l[k]) err(L, "missing " + k); });
    checkText(L + ".story", l.story); checkText(L + ".tip", l.tip); checkText(L + ".joke", l.joke);
    (l.goals || []).forEach((g, i) => checkText(L + ".goals[" + i + "]", g));
    if (!l.sections || !l.sections.length) err(L, "needs sections");
    (l.sections || []).forEach((s, i) => { checkText(L + ".sections[" + i + "].heading", s.heading); checkText(L + ".sections[" + i + "].body", s.body); if (!s.heading || !s.body) err(L, "section " + i + " needs heading and body"); });
    if (!l.examples || l.examples.length < 2) warn(L, "fewer than 2 examples");
    (l.examples || []).forEach((ex, i) => { checkText(L + ".ex" + i + ".q", ex.q); (ex.steps || []).forEach((s, j) => checkText(L + ".ex" + i + ".step" + j, s)); checkText(L + ".ex" + i + ".answer", ex.answer); if (!ex.steps || !ex.steps.length) err(L, "example " + i + " needs steps"); });
    if (!l.problems || l.problems.length < 10) err(L, "needs at least 10 problems (has " + ((l.problems || []).length) + ")");
    (l.problems || []).forEach((p, i) => checkProblem(L + ".p" + (i + 1), p, false));
    (l.generators || []).forEach((g, gi) => {
      if (typeof g !== "function") return err(L, "generator " + gi + " is not a function");
      for (let k = 0; k < 200; k++) {
        let p;
        try { p = g(); } catch (e) { err(L, "generator " + gi + " threw: " + e.message); break; }
        const before = errors;
        checkProblem(L + ".gen" + gi, p, true);
        if (p && p.type === "num") {
          const answers = Array.isArray(p.answer) ? p.answer : [p.answer];
          if (answers.some((a) => !isFinite(parseNum(a)))) err(L, "generator " + gi + " gave non-finite answer " + JSON.stringify(p.answer));
        }
        if (errors > before) break;
      }
    });
  });
}
console.log(`\n${files.length} unit file(s), ${lessonCount} lessons, ${problemCount} fixed problems — ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
