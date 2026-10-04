# Content guide for unit files (`js/data/unitN.js`)

Each unit file is plain JavaScript (no modules, no imports) and pushes ONE object:

```js
window.UNITS = window.UNITS || [];
window.UNITS.push({
  id: 1,                       // unit number 1..8
  semester: 1,                 // 1 = units 1-4, 2 = units 5-8
  title: "الأعداد النسبية",
  glyph: "½",                  // 1-3 characters shown big on the unit card (Latin/math chars)
  tagline: "one short funny line for the unit card",
  intro: "2-3 funny sentences that the mascot says on the unit page",
  lessons: [ /* lesson objects, see below */ ]
});
```

## Lesson object

```js
{
  id: "1-1",                   // "<unit>-<lessonNumber>", numbered 1,2,3... in order
  title: "العدد النسبي",
  story: "A short funny story / situation (3-5 sentences) that opens the lesson. Jordanian flavour.",
  goals: ["ماذا سأتعلّم 1", "..."],             // 2-4 items
  sections: [                                   // 2-4 explanation sections
    { heading: "...", body: "HTML text. Short paragraphs <p>..</p>, lists <ul><li>..</li></ul>, tables,
                             and a key rule inside <div class=\"rule\">...</div>", figure: "<svg ...>...</svg>" /* optional */ }
  ],
  examples: [                                   // 2-4 worked examples
    { q: "question", steps: ["step 1", "step 2", "..."], answer: "الجواب: ...", figure: "optional svg" }
  ],
  tip: "حيلة فهمان: a memory trick / shortcut",
  joke: "A clean, kid-friendly math joke related to the lesson (Arabic).",
  problems: [ /* at least 12 problems, see below */ ],
  generators: [ /* optional: functions that return a fresh random problem each call */ ]
}
```

## Problem object

Three types. **Every fixed problem needs `level`, `hint` and `solution`.**

```js
// 1) numeric answer, typed by the student (preferred for calculations)
{ type: "num", level: 1, q: "احسب [[{3/4} + {1/8}]]", answer: "7/8", hint: "...", solution: "...", unit: "سم" /* optional label shown after the box */, tol: 0.01 /* optional absolute tolerance, use with π or rounding */ }
//   answer: a number, or a string like "7/8", "-2.5", "3 1/2" (mixed number), or an ARRAY of acceptable answers.
//   The checker compares numerically, so "7/8" also accepts 0.875 and 14/16. Fractions, decimals, negatives all OK.
//   A numeric answer must be ONE number. For answers like "x = 5" ask for the value of x.

// 2) multiple choice (use for expressions, ordering, true/false, naming, anything not a single number)
{ type: "choice", level: 2, q: "...", options: ["[[3x + 2]]", "[[5x]]", "..."], answer: 0 /* index of the correct option */, hint, solution }
//   3-4 options, no duplicates, plausible distractors (typical student mistakes). VARY the position of the correct answer.

// 3) short text (rare; only when the answer is one obvious word)
{ type: "text", level: 1, q: "...", answer: ["متكاملتان", "متكاملتين"], hint, solution }
```

Levels: 1 = سهل, 2 = متوسط, 3 = تحدٍّ. Mix them: roughly 5 easy, 5 medium, 2-3 challenge per lesson. Include word problems (مسائل حياتية) with Jordanian contexts.

## Generators (optional but great for calculation lessons)

A generator is a function with NO arguments returning a problem object (`type: "num"` or `"choice"`, with `q`, `answer`, `solution`; `level`/`hint` optional). Use `Math.random()`. Make sure answers are exact (prefer integer or simple-fraction answers; give fractional answers as a string "a/b"). Avoid division by zero and ugly numbers. Example:

```js
generators: [
  function () {
    var a = Math.floor(Math.random() * 19) - 9, b = Math.floor(Math.random() * 19) - 9;
    return { type: "num", q: "احسب: [[" + a + " + (" + b + ")]]", answer: a + b,
             solution: "[[" + a + " + (" + b + ") = " + (a + b) + "]]" };
  }
]
```

## Math markup — IMPORTANT (the site is right-to-left)

Any math (numbers with operators, equations, fractions, negative numbers, variables, expressions) MUST be wrapped in `[[ ... ]]` so it is shown left-to-right. Plain lone positive numbers in a sentence ("اشترى 5 تفاحات") don't need it.

Inside `[[ ]]`:
- Fraction (stacked): `{3/4}`, `{-2/5}`, `{x+1/3}` — braces required. Example: `[[{1/2} + {1/3} = {5/6}]]`
- Power: `2^3`, `x^2`, `10^{-3}`, `(-2)^{4}`
- Repeating decimal bar: `0.ovl{3}` shows 0.3̅ ; `0.1ovl{36}`
- Use the real symbols × ÷ − is optional (a normal hyphen "-" is fine), ≤ ≥ ≠ ° π √
- Use Latin variables x, y, a, b, n (as in the Jordanian books). Degrees: `[[45°]]`.
- Keep each `[[ ]]` short (one expression / equation). Do not put Arabic words inside `[[ ]]`.

Arabic text: simple Modern Standard Arabic suitable for a 12-year-old, with occasional light Jordanian colloquial in jokes/stories (يلّا، زلمة، هسّا، كتير). Use Western digits (0-9) inside math. Contexts: دينار/قرش/فلس, عمّان, إربد, الزرقاء, العقبة, البتراء, وادي رم, جرش, البحر الميت, منسف, كنافة, فلافل, شاورما, مقلوبة, تمر, الدوري الأردني, الصف, المدرسة. The mascot is "فهمان", a clever camel who loves math. Keep humour kind (no mocking of any group, no violence).

## SVG figures (geometry, graphs)

Inline `<svg viewBox="0 0 W H" width="W">`. Use `stroke="currentColor"` and `fill="none"` for lines so it works in dark mode;
text gets the theme colour automatically (`<text x y font-size="14">`). For coloured highlights use `stroke="var(--u4)"` / `fill="var(--u3)"` etc. Max width ~ 360. Write the SVG as a JS string (use single quotes inside or concatenate). Keep labels short; Latin letters (A, B, C) for points, numbers with ° for angles. Put `direction="ltr"` on `<text>` if it contains math.

## Accuracy

Every answer must be mathematically correct. Double-check each one (compute it with node if needed). Choice `answer` index must point to the correct option. Run `node tools/validate.js <unitNumber>` until it reports 0 errors (fix warnings about math outside [[ ]] too).
