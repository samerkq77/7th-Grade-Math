/* رياضيات فهمان — single-page app that renders the lesson data in js/data/*.js */
(function () {
  "use strict";

  var UNITS = (window.UNITS || []).slice().sort(function (a, b) { return a.id - b.id; });
  var app = document.getElementById("app");
  var STORE_KEY = "fahman-progress-v1";
  var THEME_KEY = "fahman-theme";

  /* ---------------- storage (always optional) ---------------- */
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: progress stays in memory */ }
  }
  var progress = load(STORE_KEY, null) || { solved: {}, gen: 0, quiz: {} };
  progress.solved = progress.solved || {};
  progress.quiz = progress.quiz || {};
  progress.gen = progress.gen || 0;

  function points() { return Object.keys(progress.solved).length * 10 + progress.gen * 5 + sumQuiz(); }
  function sumQuiz() { var s = 0; for (var k in progress.quiz) s += progress.quiz[k] * 2; return s; }
  function updatePoints(bump) {
    var el = document.getElementById("points");
    el.textContent = "نقاطك: " + toArabicDigits(points());
    if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  }
  function markSolved(id) {
    if (progress.solved[id]) return false;
    progress.solved[id] = 1; save(STORE_KEY, progress); updatePoints(true); return true;
  }

  /* ---------------- theme ---------------- */
  var savedTheme = load(THEME_KEY, null);
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("themeBtn").addEventListener("click", function () {
    var cur = document.documentElement.getAttribute("data-theme");
    if (!cur) cur = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    var next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    save(THEME_KEY, next);
  });

  /* ---------------- helpers ---------------- */
  var AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
  function toArabicDigits(n) { return String(n).replace(/\d/g, function (d) { return AR_DIGITS[d]; }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function h(html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  var unitColor = function (u) { return "var(--u" + u.id + ")"; };

  /* Math markup inside text:  [[ ... ]] is a left-to-right math span.
     Inside it:  {a/b} -> stacked fraction,  x^2 / x^{-3} -> superscript,  ovl{3} -> repeating bar. */
  function mathInner(s) {
    var prev;
    do { prev = s; s = s.replace(/\{([^{}]+?)\/([^{}]+?)\}/g, '<span class="frac"><span>$1</span><span>$2</span></span>'); } while (s !== prev);
    s = s.replace(/ovl\{([^{}]*)\}/g, '<span class="ovl">$1</span>');
    s = s.replace(/\^\{([^{}]*)\}/g, "<sup>$1</sup>");
    s = s.replace(/\^(-?[\w.]+)/g, "<sup>$1</sup>");
    return s;
  }
  function fmt(text) {
    if (text == null) return "";
    return String(text).replace(/\[\[([\s\S]+?)\]\]/g, function (_, inner) { return '<span class="math">' + mathInner(inner) + "</span>"; });
  }

  /* ---------------- answer checking ---------------- */
  function normalize(s) {
    return String(s)
      .replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
      .replace(/[۰-۹]/g, function (d) { return String(d.charCodeAt(0) - 0x6f0); })
      .replace(/[٫,]/g, ".").replace(/[−–—]/g, "-").replace(/÷/g, "/").replace(/\s+/g, " ").trim();
  }
  var SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-" };
  // A power typed as 2^5, 2^-3, (-2)^3, (2/3)^2 or 2⁵ -> its value.
  function parsePower(str) {
    var s = str.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, function (t) { return "^" + t.replace(/./g, function (c) { return SUP[c]; }); });
    s = s.replace(/\s+/g, "").replace(/\*\*/g, "^");
    if (s.indexOf("^") < 0) return null;
    var m = s.match(/^(-?)(\(([^()]+)\)|\d*\.?\d+)\^\{?\(?(-?\d+)\)?\}?$/);
    if (!m) return NaN;
    var base = m[3] != null ? parseNum(m[3]) : parseFloat(m[2]);
    var v = Math.pow(base, +m[4]);
    return m[1] ? -v : v;
  }
  function parseNum(raw) {
    if (typeof raw === "number") return raw;
    var pw = parsePower(normalize(raw));
    if (pw !== null) return pw;
    var s = normalize(raw).replace(/[^0-9.\-\/ ]/g, " ").replace(/\s+/g, " ").trim();
    s = s.replace(/\s*\/\s*/g, "/").replace(/-\s+/g, "-");
    var m;
    if ((m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/))) {
      var v = +m[2] + (+m[3] / +m[4]); return m[1] ? -v : v;
    }
    if ((m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/))) { return +m[2] === 0 ? NaN : +m[1] / +m[2]; }
    if (/^-?\d*\.?\d+$/.test(s)) return parseFloat(s);
    return NaN;
  }
  function normText(s) { return normalize(s).toLowerCase().replace(/\s+/g, "").replace(/[×*]/g, "x").replace(/[ًٌٍَُِّْ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي"); }
  function checkAnswer(p, input) {
    var answers = Array.isArray(p.answer) ? p.answer : [p.answer];
    if (p.type === "text") {
      var n = normText(input);
      return answers.some(function (a) { return normText(a) === n; });
    }
    var x = parseNum(input);
    if (isNaN(x)) return null;
    var tol = p.tol != null ? p.tol : 1e-6;
    return answers.some(function (a) { var y = parseNum(a); return Math.abs(x - y) <= tol + 1e-9; });
  }

  var CHEERS = [
    "برافو! عقلك شغّال مثل محرّك سيارة سباق!",
    "يا سلام! فهمان فخور فيك.",
    "صح! لو كانت الرياضيات منسفًا، أنت أكلته كله.",
    "إجابة ولا أروع! صفّق لنفسك.",
    "صحيح تمامًا! حتى الخوارزمي رفع لك القبعة.",
    "ممتاز! أنت رسميًّا عبقري الحارة.",
    "ضربة معلّم!",
    "صح صح صح! الكنافة على حسابي."
  ];
  var OOPS = [
    "قرّبت! جرّب مرة ثانية.",
    "ولا يهمك، الغلط أول خطوة للصح.",
    "مش هيك بالزبط. اقرأ السؤال مرة ثانية على مهل.",
    "أوبس! الرقم هرب منك. جرّب كمان مرة.",
    "حتى الجمل بيتعثر أحيانًا. حاول مرة ثانية!"
  ];
  var EMPTY = "اكتب رقمًا أولًا (مثل 12 أو 3/4 أو 0.5 أو -7).";

  /* ---------------- confetti ---------------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function confetti() {
    if (reduceMotion) return;
    var c = document.getElementById("confetti"), ctx = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    var styles = getComputedStyle(document.documentElement);
    var colors = ["--u1", "--u2", "--u3", "--u4", "--u5", "--sun"].map(function (k) { return styles.getPropertyValue(k).trim() || "#f80"; });
    var parts = [];
    for (var i = 0; i < 90; i++) parts.push({ x: innerWidth / 2, y: innerHeight * 0.45, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 3, c: pick(colors), a: Math.random() * 6 });
    var t = 0;
    (function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      parts.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.a += 0.2; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (++t < 80) requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }

  /* ---------------- problem widget ---------------- */
  var LEVELS = { 1: "سهل", 2: "متوسط", 3: "تحدٍّ" };
  // opts: { id, label, onResult(correct, firstTry), compact }
  function problemCard(p, opts) {
    opts = opts || {};
    var solved = opts.id && progress.solved[opts.id];
    var uid = "p" + Math.random().toString(36).slice(2, 9);
    var card = h(
      '<article class="problem' + (solved ? " solved" : "") + '">' +
        '<div class="p-head"><span class="p-num">' + esc(opts.label || "؟") + '</span>' +
        '<div class="p-q">' + fmt(p.q) + "</div>" +
        (p.level ? '<span class="level">' + LEVELS[p.level] + "</span>" : "") + "</div>" +
        (p.figure ? '<div class="figure">' + p.figure + "</div>" : "") +
        '<div class="p-body"></div>' +
        '<div class="feedback" hidden aria-live="polite"></div>' +
        '<div class="row p-tools">' +
          (p.hint ? '<button class="btn small ghost" type="button" data-act="hint">تلميح</button>' : "") +
          (p.solution ? '<button class="btn small ghost" type="button" data-act="sol">أرني الحل</button>' : "") +
        "</div>" +
        (p.hint ? '<div class="hint" hidden>' + fmt(p.hint) + "</div>" : "") +
        (p.solution ? '<div class="solution" hidden>' + fmt(p.solution) + "</div>" : "") +
      "</article>"
    );
    var body = card.querySelector(".p-body");
    var fb = card.querySelector(".feedback");
    var attempts = 0, done = false;

    function result(ok) {
      attempts++;
      fb.hidden = false;
      fb.className = "feedback " + (ok ? "ok" : "no");
      fb.textContent = ok ? pick(CHEERS) : pick(OOPS);
      if (ok) {
        done = true;
        card.classList.add("solved");
        if (opts.id && markSolved(opts.id)) confetti();
        else if (!opts.id) confetti();
      } else if (attempts >= 2 && p.hint) {
        card.querySelector(".hint").hidden = false;
      }
      if (opts.onResult) opts.onResult(ok, attempts === 1);
    }

    if (p.type === "choice") {
      var grid = h('<div class="choices"></div>');
      p.options.forEach(function (o, i) {
        var b = h('<button type="button" class="choice">' + fmt(o) + "</button>");
        b.addEventListener("click", function () {
          if (done && opts.quiz) return;
          var ok = i === p.answer;
          b.classList.add(ok ? "right" : "wrong");
          result(ok);
        });
        grid.appendChild(b);
      });
      body.appendChild(grid);
    } else {
      var row = h(
        '<form class="answer-row" autocomplete="off">' +
          '<input id="' + uid + '" type="text" inputmode="' + (p.type === "text" ? "text" : "decimal") + '" aria-label="إجابتك" placeholder="إجابتك">' +
          (p.unit ? '<span class="muted">' + esc(p.unit) + "</span>" : "") +
          '<button class="btn small primary" type="submit">تحقّق</button>' +
        "</form>"
      );
      row.addEventListener("submit", function (e) {
        e.preventDefault();
        if (done && opts.quiz) return;
        var val = row.querySelector("input").value;
        if (!val.trim()) { fb.hidden = false; fb.className = "feedback no"; fb.textContent = EMPTY; return; }
        var ok = checkAnswer(p, val);
        if (ok === null) { fb.hidden = false; fb.className = "feedback no"; fb.textContent = "لم أفهم هذه الإجابة. " + EMPTY; return; }
        result(ok);
      });
      body.appendChild(row);
      if (p.type !== "text") body.appendChild(h('<p class="input-help">طريقة الكتابة: الكسر <span class="math">3/4</span>، العدد الكسري <span class="math">2 1/3</span>، القوة <span class="math">2^5</span> أو <span class="math">2^-3</span> (الرمز ^ موجود في لوحة المفاتيح مع الرقم 6)، أو اكتب الناتج مباشرة</p>'));
    }

    card.addEventListener("click", function (e) {
      var act = e.target.getAttribute && e.target.getAttribute("data-act");
      if (act === "hint") card.querySelector(".hint").hidden = false;
      if (act === "sol") card.querySelector(".solution").hidden = false;
    });
    if (opts.quiz) { var tools = card.querySelector(".p-tools"); if (tools) tools.hidden = true; }
    return card;
  }

  /* ---------------- lookups ---------------- */
  function findLesson(id) {
    for (var i = 0; i < UNITS.length; i++) for (var j = 0; j < UNITS[i].lessons.length; j++)
      if (UNITS[i].lessons[j].id === id) return { unit: UNITS[i], lesson: UNITS[i].lessons[j], index: j };
    return null;
  }
  function flatLessons() { var a = []; UNITS.forEach(function (u) { u.lessons.forEach(function (l) { a.push({ unit: u, lesson: l }); }); }); return a; }
  function lessonSolved(l) { var n = 0; (l.problems || []).forEach(function (_, i) { if (progress.solved[l.id + "-" + i]) n++; }); return n; }
  function unitStats(u) { var tot = 0, got = 0; u.lessons.forEach(function (l) { tot += (l.problems || []).length; got += lessonSolved(l); }); return { tot: tot, got: got }; }
  function starsFor(l) {
    var tot = (l.problems || []).length || 1, got = lessonSolved(l), r = got / tot;
    var n = r >= 1 ? 3 : r >= 0.6 ? 2 : r > 0 ? 1 : 0;
    var s = ""; for (var i = 0; i < 3; i++) s += i < n ? "★" : '<span class="off">★</span>';
    return '<span class="stars" aria-label="' + n + ' من 3 نجوم">' + s + "</span>";
  }
  var ORD = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة"];

  function mascot(text, who) {
    return '<div class="say"><div class="face" aria-hidden="true">🐪</div><div class="bubble"><span class="who">' + (who || "فهمان يقول:") + "</span>" + fmt(text) + "</div></div>";
  }

  /* ---------------- views ---------------- */
  function viewHome() {
    var totalProblems = 0, totalLessons = 0;
    UNITS.forEach(function (u) { totalLessons += u.lessons.length; u.lessons.forEach(function (l) { totalProblems += (l.problems || []).length; }); });
    var solved = Object.keys(progress.solved).length;
    var html =
      '<section class="hero">' +
        "<h1>الرياضيات <span>مش بعبع</span>!</h1>" +
        '<p class="lead">كل دروس رياضيات الصف السابع حسب المنهاج الأردني، مشروحة خطوة بخطوة بطريقة بسيطة ومضحكة، ومعها مئات المسائل لتتدرّب وتجمع النقاط.</p>' +
        mascot("مرحبا! أنا <b>فهمان</b>، الجمل الذي يحب الرياضيات أكثر من حبّه للتمر. اختر وحدة، اقرأ الدرس، وحلّ المسائل. كل إجابة صحيحة = ١٠ نقاط. يلّا نبلّش!") +
        '<div class="stats">' +
          '<span class="stat"><b>' + toArabicDigits(UNITS.length) + "</b> وحدات</span>" +
          '<span class="stat"><b>' + toArabicDigits(totalLessons) + "</b> درسًا</span>" +
          '<span class="stat"><b>' + toArabicDigits(totalProblems) + "</b> مسألة + مسائل عشوائية لا تنتهي</span>" +
          '<span class="stat">حللت <b>' + toArabicDigits(solved) + "</b> مسألة</span>" +
        "</div>" +
      "</section>";
    [1, 2].forEach(function (sem) {
      var us = UNITS.filter(function (u) { return u.semester === sem; });
      if (!us.length) return;
      html += '<section class="semester"><div class="semester-title"><h2>الفصل الدراسي ' + (sem === 1 ? "الأول" : "الثاني") + "</h2><small>" + toArabicDigits(us.length) + " وحدات</small></div><div class=\"units\">";
      us.forEach(function (u) {
        var st = unitStats(u), pct = st.tot ? Math.round(100 * st.got / st.tot) : 0;
        html += '<a class="unit-card" href="#unit-' + u.id + '" style="--c:' + unitColor(u) + '">' +
          '<span class="glyph" aria-hidden="true">' + esc(u.glyph || "") + "</span>" +
          '<span class="num">الوحدة ' + ORD[u.id - 1] + "</span>" +
          "<h3>" + esc(u.title) + "</h3>" +
          "<p>" + fmt(u.tagline || "") + "</p>" +
          '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
          '<span class="bar-label">' + toArabicDigits(u.lessons.length) + " دروس · حللت " + toArabicDigits(st.got) + " من " + toArabicDigits(st.tot) + "</span>" +
        "</a>";
      });
      html += "</div></section>";
    });
    app.innerHTML = html;
  }

  function viewUnit(id) {
    var u = UNITS.filter(function (x) { return x.id === id; })[0];
    if (!u) return viewHome();
    var st = unitStats(u), pct = st.tot ? Math.round(100 * st.got / st.tot) : 0;
    var html =
      '<nav class="crumbs"><a href="#home">الرئيسية</a><span>›</span><span>الوحدة ' + ORD[u.id - 1] + "</span></nav>" +
      '<section class="unit-head" style="--c:' + unitColor(u) + '">' +
        '<span class="num">الوحدة ' + ORD[u.id - 1] + " · الفصل " + (u.semester === 1 ? "الأول" : "الثاني") + "</span>" +
        "<h1>" + esc(u.title) + "</h1>" +
        mascot(u.intro || "") +
        '<div class="bar" style="--c:' + unitColor(u) + '"><i style="width:' + pct + '%"></i></div>' +
        '<span class="bar-label">حللت ' + toArabicDigits(st.got) + " من " + toArabicDigits(st.tot) + " مسألة" +
          (progress.quiz[u.id] != null ? " · أفضل نتيجة في الاختبار: " + toArabicDigits(progress.quiz[u.id]) + "/١٠" : "") + "</span>" +
      "</section>" +
      '<ol class="lesson-list">';
    u.lessons.forEach(function (l, i) {
      html += '<li><a class="lesson-link" href="#lesson-' + l.id + '" style="--c:' + unitColor(u) + '">' +
        '<span class="n">' + toArabicDigits(i + 1) + "</span>" +
        '<span class="t"><b>' + esc(l.title) + "</b><small>" + toArabicDigits((l.problems || []).length) + " مسألة" + (l.generators && l.generators.length ? " + مسائل عشوائية" : "") + "</small></span>" +
        starsFor(l) + "</a></li>";
    });
    html += "</ol>" +
      '<div class="row"><a class="btn primary" href="#quiz-' + u.id + '">اختبر نفسك في الوحدة (١٠ أسئلة)</a></div>';
    app.innerHTML = html;
  }

  function viewLesson(id) {
    var f = findLesson(id);
    if (!f) return viewHome();
    var u = f.unit, l = f.lesson;
    var all = flatLessons(), pos = all.findIndex(function (x) { return x.lesson.id === id; });
    var prev = all[pos - 1], next = all[pos + 1];
    var html =
      '<nav class="crumbs"><a href="#home">الرئيسية</a><span>›</span><a href="#unit-' + u.id + '">' + esc(u.title) + "</a><span>›</span><span>الدرس " + toArabicDigits(f.index + 1) + "</span></nav>" +
      '<header class="lesson-title" style="--c:' + unitColor(u) + '"><span class="num">الوحدة ' + ORD[u.id - 1] + " · الدرس " + toArabicDigits(f.index + 1) + "</span><h1>" + esc(l.title) + "</h1></header>" +
      mascot(l.story, "حكاية الدرس") +
      (l.goals && l.goals.length ? '<ul class="goals" aria-label="ماذا سأتعلّم">' + l.goals.map(function (g) { return "<li>" + fmt(g) + "</li>"; }).join("") + "</ul>" : "");
    (l.sections || []).forEach(function (s) {
      html += '<section class="section"><h3>' + fmt(s.heading) + '</h3><div class="prose">' + fmt(s.body) + "</div>" +
        (s.figure ? '<div class="figure">' + s.figure + "</div>" : "") + "</section>";
    });
    (l.examples || []).forEach(function (ex, i) {
      html += '<section class="example"><span class="tag">مثال ' + toArabicDigits(i + 1) + "</span><div>" + fmt(ex.q) + "</div>" +
        (ex.figure ? '<div class="figure">' + ex.figure + "</div>" : "") +
        '<button class="btn small ghost" type="button" data-reveal>اعرض الحل خطوة بخطوة</button>' +
        '<div hidden><ol class="steps">' + (ex.steps || []).map(function (s) { return "<li>" + fmt(s) + "</li>"; }).join("") + "</ol>" +
        (ex.answer ? '<p class="answer-line">' + fmt(ex.answer) + "</p>" : "") + "</div></section>";
    });
    if (l.tip) html += '<aside class="note tip"><span class="tag">حيلة فهمان</span><div>' + fmt(l.tip) + "</div></aside>";
    if (l.joke) html += '<aside class="note joke"><span class="tag">استراحة ضحك</span><div>' + fmt(l.joke) + "</div></aside>";
    html += '<section class="section"><div class="practice-head"><h2>تدرّب يا بطل</h2><span class="muted" id="lessonCount"></span></div><div class="problems" id="problems"></div></section>';
    if (l.generators && l.generators.length) {
      html += '<section class="generator"><h3>آلة المسائل العجيبة</h3><p class="muted">مسائل جديدة في كل ضغطة، لا تنتهي أبدًا! كل إجابة صحيحة = ٥ نقاط.</p><div id="genSlot"></div><div class="row"><button class="btn primary" type="button" id="genBtn">أعطني مسألة جديدة</button></div></section>';
    }
    html += '<nav class="pager">' +
      (prev ? '<a class="btn ghost" href="#lesson-' + prev.lesson.id + '">→ ' + esc(prev.lesson.title) + "</a>" : "<span></span>") +
      (next ? '<a class="btn" href="#lesson-' + next.lesson.id + '">' + esc(next.lesson.title) + " ←</a>" : '<a class="btn" href="#home">العودة للرئيسية</a>') +
      "</nav>";
    app.innerHTML = html;

    app.querySelectorAll("[data-reveal]").forEach(function (b) {
      b.addEventListener("click", function () { b.nextElementSibling.hidden = false; b.hidden = true; });
    });
    var box = document.getElementById("problems");
    var countEl = document.getElementById("lessonCount");
    function refreshCount() { countEl.textContent = "حللت " + toArabicDigits(lessonSolved(l)) + " من " + toArabicDigits((l.problems || []).length); }
    (l.problems || []).forEach(function (p, i) {
      box.appendChild(problemCard(p, { id: l.id + "-" + i, label: toArabicDigits(i + 1), onResult: refreshCount }));
    });
    refreshCount();

    var genBtn = document.getElementById("genBtn");
    if (genBtn) {
      var slot = document.getElementById("genSlot");
      var makeOne = function () {
        var p;
        try { p = pick(l.generators)(); } catch (e) { p = null; }
        slot.innerHTML = "";
        if (!p) return;
        slot.appendChild(problemCard(p, {
          label: "؟",
          onResult: function (ok, first) { if (ok && first) { progress.gen++; save(STORE_KEY, progress); updatePoints(true); } }
        }));
      };
      genBtn.addEventListener("click", makeOne);
      makeOne();
    }
  }

  function viewQuiz(id) {
    var u = UNITS.filter(function (x) { return x.id === id; })[0];
    if (!u) return viewHome();
    var pool = [];
    u.lessons.forEach(function (l) { (l.problems || []).forEach(function (p) { pool.push(p); }); });
    var qs = shuffle(pool).slice(0, 10);
    var i = 0, score = 0, results = [];
    app.innerHTML =
      '<nav class="crumbs"><a href="#home">الرئيسية</a><span>›</span><a href="#unit-' + u.id + '">' + esc(u.title) + "</a><span>›</span><span>اختبار الوحدة</span></nav>" +
      "<h1>اختبار: " + esc(u.title) + "</h1>" +
      '<div class="quiz-progress" id="qp"></div><div id="qslot"></div><div class="row" id="qnav"></div>';
    var qp = document.getElementById("qp"), slot = document.getElementById("qslot"), nav = document.getElementById("qnav");
    function bar() { qp.innerHTML = qs.map(function (_, k) { return "<i class=\"" + (results[k] === true ? "ok" : results[k] === false ? "no" : k === i ? "now" : "") + "\"></i>"; }).join(""); }
    function show() {
      bar(); nav.innerHTML = "";
      if (i >= qs.length) return finish();
      slot.innerHTML = "";
      slot.appendChild(problemCard(qs[i], {
        label: toArabicDigits(i + 1), quiz: true,
        onResult: function (ok) {
          if (results[i] !== undefined) return;
          results[i] = ok; if (ok) score++;
          bar();
          var card = slot.firstElementChild;
          var sol = card.querySelector(".solution"); if (sol && !ok) sol.hidden = false;
          var nb = h('<button class="btn primary" type="button">' + (i + 1 < qs.length ? "السؤال التالي ←" : "اعرض النتيجة") + "</button>");
          nb.addEventListener("click", function () { i++; show(); window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
          nav.appendChild(nb);
        }
      }));
    }
    function finish() {
      var best = progress.quiz[u.id] || 0;
      if (score > best) { progress.quiz[u.id] = score; save(STORE_KEY, progress); updatePoints(true); }
      if (score >= 8) confetti();
      var msg = score === 10 ? "علامة كاملة! أنت أسطورة الصف السابع." :
        score >= 8 ? "رائع جدًا! بقي لك القليل لتصير بطل الوحدة." :
        score >= 5 ? "جيد! راجع الدروس التي أخطأت فيها وجرّب مرة ثانية." :
        "لا بأس، فهمان نفسه احتاج سبع محاولات ليتعلّم جدول الضرب. ارجع للدروس وحاول مجددًا!";
      slot.innerHTML = '<section class="unit-head" style="--c:' + unitColor(u) + '"><span class="num">نتيجتك</span><div class="score-big">' + toArabicDigits(score) + " / " + toArabicDigits(qs.length) + "</div>" + mascot(msg) + "</section>";
      nav.innerHTML = '<a class="btn primary" href="#quiz-' + u.id + '" id="again">اختبار جديد</a><a class="btn ghost" href="#unit-' + u.id + '">العودة للوحدة</a>';
      document.getElementById("again").addEventListener("click", function (e) { e.preventDefault(); viewQuiz(id); });
    }
    show();
  }

  /* ---------------- router ---------------- */
  function route() {
    var hash = (location.hash || "").replace(/^#/, "");
    var m;
    if ((m = hash.match(/^unit-(\d+)$/))) viewUnit(+m[1]);
    else if ((m = hash.match(/^lesson-([\d-]+)$/))) viewLesson(m[1]);
    else if ((m = hash.match(/^quiz-(\d+)$/))) viewQuiz(+m[1]);
    else viewHome();
    app.classList.remove("view-enter"); void app.offsetWidth; app.classList.add("view-enter");
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  updatePoints(false);
  route();

  // exposed for the content checker (tools/validate.js)
  window.__fahman = { parseNum: parseNum, checkAnswer: checkAnswer, fmt: fmt };
})();
