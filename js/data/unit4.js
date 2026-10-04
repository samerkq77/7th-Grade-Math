/* الوحدة الرابعة: الزوايا والمضلعات والتحويلات الهندسية */
(function () {
  "use strict";

  /* ---------- helpers (local to this file) ---------- */
  var D = Math.PI / 180;
  function r1(v) { return Math.round(v * 10) / 10; }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // point at distance r, direction deg (math convention, y up) from c (screen coords)
  function P(c, r, deg) { return [r1(c[0] + r * Math.cos(deg * D)), r1(c[1] - r * Math.sin(deg * D))]; }
  function svg(w, h) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" xmlns="http://www.w3.org/2000/svg" role="img">'; }
  function seg(a, b, w, col, dash) { return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" stroke="' + (col || "currentColor") + '" stroke-width="' + (w || 2) + '" stroke-linecap="round"' + (dash ? ' stroke-dasharray="5 4"' : "") + '/>'; }
  function T(p, s, size, weight) { size = size || 14; return '<text x="' + p[0] + '" y="' + r1(p[1] + size * 0.35) + '" font-size="' + size + '" text-anchor="middle" direction="ltr"' + (weight ? ' font-weight="' + weight + '"' : "") + '>' + s + '</text>'; }
  function dot(p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="currentColor"/>'; }
  function arc(c, r, a1, a2, col) {
    var p1 = P(c, r, a1), p2 = P(c, r, a2), large = (a2 - a1) > 180 ? 1 : 0;
    return '<path d="M' + p1[0] + ' ' + p1[1] + ' A' + r + ' ' + r + ' 0 ' + large + ' 0 ' + p2[0] + ' ' + p2[1] + '" fill="none" stroke="' + (col || "var(--u4)") + '" stroke-width="2"/>';
  }
  function rightMark(c, a, sz, col) {
    var p1 = P(c, sz, a), p3 = P(c, sz, a + 90), p2 = [r1(p1[0] + p3[0] - c[0]), r1(p1[1] + p3[1] - c[1])];
    return '<polyline points="' + p1.join(",") + " " + p2.join(",") + " " + p3.join(",") + '" fill="none" stroke="' + (col || "var(--u4)") + '" stroke-width="2"/>';
  }
  // angle mark from direction a1 to a2 (counter-clockwise), with optional label at the bisector
  function ang(c, a1, a2, label, o) {
    o = o || {};
    var size = a2 - a1, g = "";
    var r = o.r || (size < 35 ? 30 : 20);
    if (o.right) g += rightMark(c, a1, 13, o.col); else g += arc(c, r, a1, a2, o.col);
    if (label) {
      var len = String(label).replace(/<[^>]+>/g, "").length;
      var tr = o.tr || (r + 18 + Math.max(0, len - 2) * 4.2 + (size < 35 ? 10 : 0) + (size < 60 && len > 4 ? 14 : 0));
      g += T(P(c, tr, (a1 + a2) / 2), label, o.size || 14, 600);
    }
    return g;
  }

  /* rays from one point. o = {w,h,c,len,dirs:[deg], angles:[[a1,a2,label,opts]]} */
  function rays(o) {
    var g = svg(o.w || 300, o.h || 200), len = o.len || 110;
    (o.angles || []).forEach(function (a) { g += ang(o.c, a[0], a[1], a[2], a[3]); });
    o.dirs.forEach(function (d) { g += seg(o.c, P(o.c, len, d)); });
    g += dot(o.c);
    return g + "</svg>";
  }
  /* two crossing lines through c: line 1 at directions d1 / d1+180, line 2 at d2 / d2+180 (d1 < d2 < d1+180).
     labels: [between d1..d2, d2..d1+180, d1+180..d2+180, d2+180..d1+360] */
  function cross(d1, d2, labels, o) {
    o = o || {};
    var dirs = [d1, d2, d1 + 180, d2 + 180];
    var angles = [];
    for (var i = 0; i < 4; i++) if (labels[i] != null) angles.push([dirs[i], i === 3 ? d1 + 360 : dirs[i + 1], labels[i], { col: i % 2 ? "var(--u3)" : "var(--u4)", r: i % 2 ? 26 : 18 }]);
    return rays({ w: 320, h: 240, c: [160, 120], len: 115, dirs: dirs, angles: angles });
  }

  /* two parallel lines cut by a transversal. theta = acute angle (deg) between transversal and the lines.
     Positions: 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right at the upper crossing; 5..8 the same at the lower one. */
  function par(theta, labels, o) {
    o = o || {};
    var W = 340, H = 230, y1 = 75, y2 = 160, mid = 170;
    var dx = (y2 - y1) / 2 / Math.tan(theta * D);
    var I1 = [r1(mid + dx), y1], I2 = [r1(mid - dx), y2];
    var g = svg(W, H);
    var spans = { tl: [theta, 180], tr: [0, theta], bl: [180, 180 + theta], br: [180 + theta, 360] };
    var pos = { 1: [I1, "tl"], 2: [I1, "tr"], 3: [I1, "bl"], 4: [I1, "br"], 5: [I2, "tl"], 6: [I2, "tr"], 7: [I2, "bl"], 8: [I2, "br"] };
    Object.keys(labels).forEach(function (k) {
      var p = pos[k], sp = spans[p[1]], lab = labels[k];
      if (o.nums) g += T(P(p[0], 22, (sp[0] + sp[1]) / 2), lab, 14, 700);
      else {
        g += ang(p[0], sp[0], sp[1], null, { r: 17, col: (k === "1" || k === "4" || k === "5" || k === "8") ? "var(--u4)" : "var(--u3)" });
        var bis = (sp[0] + sp[1]) / 2, q = P(p[0], 30, bis), right = p[1] === "tr" || p[1] === "br";
        var shift = String(lab).length * 3.9 + 4;
        g += T([r1(q[0] + (right ? shift : -shift)), q[1]], lab, 14, 600);
      }
    });
    g += seg([15, y1], [325, y1]) + seg([15, y2], [325, y2]);
    // parallel arrows
    [y1, y2].forEach(function (y) { g += '<polyline points="40,' + (y - 5) + " 47," + y + " 40," + (y + 5) + '" fill="none" stroke="currentColor" stroke-width="2"/>'; });
    g += seg(P(I2, 60, 180 + theta), P(I1, 60, theta));
    g += dot(I1) + dot(I2);
    return g + "</svg>";
  }

  /* zig-zag between two parallel lines: angle a at the top line, b at the bottom line, x at the bend */
  function zig(a, b, la, lb, lx) {
    var p = [250, 120], yT = 45, yB = 195;
    var A = [r1(p[0] - (p[1] - yT) / Math.tan(a * D)), yT], B = [r1(p[0] - (yB - p[1]) / Math.tan(b * D)), yB];
    var g = svg(340, 240);
    g += ang(A, 360 - a, 360, la, { r: 26 }) + ang(B, 0, b, lb, { r: 26, col: "var(--u3)" }) + ang(p, 180 - a, 180 + b, lx, { r: 22, col: "var(--u5)", tr: 44 });
    g += seg([15, yT], [325, yT]) + seg([15, yB], [325, yB]) + seg(A, p) + seg(B, p);
    [yT, yB].forEach(function (y) { g += '<polyline points="40,' + (y - 5) + " 47," + y + " 40," + (y + 5) + '" fill="none" stroke="currentColor" stroke-width="2"/>'; });
    g += dot(p) + dot(A) + dot(B);
    return g + "</svg>";
  }

  /* triangle from its base angles B and C. o = {A,B,C: labels, ext: label of exterior angle at C, eq: true for AB = AC ticks, names:false} */
  function tri(bA, cA, o) {
    o = o || {};
    var aA = 180 - bA - cA;
    var BA = Math.sin(cA * D) / Math.sin(aA * D);
    var ax = BA * Math.cos(bA * D), ay = BA * Math.sin(bA * D);
    var xmin = Math.min(0, ax), xmax = Math.max(1, ax) + (o.ext ? 0.45 : 0);
    var s = Math.min(270 / (xmax - xmin), 150 / ay);
    var ox = 35 - xmin * s, H = r1(ay * s + 75), oy = H - 32;
    function M(x, y) { return [r1(ox + x * s), r1(oy - y * s)]; }
    var A = M(ax, ay), B = M(0, 0), C = M(1, 0);
    var W = r1((xmax - xmin) * s + 70);
    var g = svg(W, H);
    function tw(t) { return String(t).length * 7.8; }
    function cot(a) { return a >= 90 ? 0 : 1 / Math.tan(a * D); }
    if (o.B) { g += ang(B, 0, bA, null, { col: "var(--u3)" }); var xb = B[0] + Math.max(26, 21 * cot(bA)); g += T([r1(xb + tw(o.B) / 2), B[1] - 13], o.B, 14, 600); }
    if (o.C) { g += ang(C, 180 - cA, 180, null, { col: "var(--u5)" }); var xc = C[0] - Math.max(26, 21 * cot(cA)); g += T([r1(xc - tw(o.C) / 2), C[1] - 13], o.C, 14, 600); }
    if (o.A) { g += ang(A, 180 + bA, 360 - cA, null); var hA = Math.max(32, (tw(o.A) + 12) / (cot(bA) + cot(cA) || 1)); g += T([r1(A[0] + hA * (cot(cA) - cot(bA)) / 2), r1(A[1] + hA)], o.A, 14, 600); }
    if (o.ext) { var E = M(1 + 0.42, 0); g += seg(C, E, 2, "currentColor", true) + ang(C, 0, 180 - cA, o.ext, { r: 16, col: "var(--u6)" }); }
    g += '<polygon points="' + A.join(",") + " " + B.join(",") + " " + C.join(",") + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    if (o.eq) [[A, B], [A, C]].forEach(function (pq) {
      var m = [(pq[0][0] + pq[1][0]) / 2, (pq[0][1] + pq[1][1]) / 2], dx = pq[1][0] - pq[0][0], dy = pq[1][1] - pq[0][1], L = Math.sqrt(dx * dx + dy * dy);
      var nx = -dy / L * 7, ny = dx / L * 7;
      g += seg([r1(m[0] - nx), r1(m[1] - ny)], [r1(m[0] + nx), r1(m[1] + ny)], 2);
    });
    if (o.names !== false) {
      g += T(P(A, 14, (180 + bA + 360 - cA) / 2 - 180), "A", 14, 700);
      g += T(P(B, 14, bA / 2 + 180), "B", 14, 700);
      g += T(P(C, 14, 360 - cA / 2 - (o.ext ? 40 : 0)), "C", 14, 700);
    }
    return g + "</svg>";
  }

  /* polygon from its interior angles (in order, counter-clockwise). o = {labels:[], ext:[], diag:true, lens:[], w, h, names:[]} */
  function poly(angles, o) {
    o = o || {};
    var n = angles.length, d = [0], i, L = o.lens || [];
    for (i = 1; i < n; i++) d.push(d[i - 1] + 180 - angles[i]);
    var V = [[0, 0]];
    for (i = 0; i <= n - 3; i++) { var l = L[i] || 1; V.push([V[i][0] + l * Math.cos(d[i] * D), V[i][1] + l * Math.sin(d[i] * D)]); }
    var u1 = [Math.cos(d[n - 2] * D), Math.sin(d[n - 2] * D)], u2 = [Math.cos(d[n - 1] * D), Math.sin(d[n - 1] * D)], q = V[n - 2];
    var det = u1[0] * u2[1] - u1[1] * u2[0];
    var sl = (-q[0] * u2[1] + q[1] * u2[0]) / det;
    V.push([q[0] + sl * u1[0], q[1] + sl * u1[1]]);
    var xs = V.map(function (v) { return v[0]; }), ys = V.map(function (v) { return v[1]; });
    var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs), ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
    var bw = o.w || 230, bh = o.h || 160, pad = o.ext ? 48 : 34;
    var s = Math.min(bw / (xmax - xmin), bh / (ymax - ymin));
    var Sv = V.map(function (v) { return [r1(pad + (v[0] - xmin) * s), r1(pad + (ymax - v[1]) * s)]; });
    var W = r1((xmax - xmin) * s + 2 * pad), H = r1((ymax - ymin) * s + 2 * pad);
    var g = svg(W, H);
    if (o.fill) g += '<polygon points="' + Sv.map(function (p) { return p.join(","); }).join(" ") + '" fill="' + o.fill + '" fill-opacity="0.15" stroke="none"/>';
    if (o.diag) for (i = 2; i < n - 1; i++) g += seg(Sv[0], Sv[i], 1.6, "var(--u3)", true);
    for (i = 0; i < n; i++) {
      if (o.rightAt === i) g += rightMark(Sv[i], d[i], 12, "var(--u4)");
      if (o.labels && o.labels[i]) g += ang(Sv[i], d[i], d[i] + angles[i], o.labels[i], { r: 16, col: i % 2 ? "var(--u3)" : "var(--u4)", tr: o.tr || 34 });
      if (o.ext && o.ext[i]) {
        var dp = i === 0 ? d[n - 1] : d[i - 1];
        g += seg(Sv[i], P(Sv[i], 40, dp), 2, "currentColor", true) + ang(Sv[i], dp, dp + 180 - angles[i], o.ext[i], { r: 16, col: "var(--u6)", tr: 30 });
      }
      if (o.names) g += T(P(Sv[i], 14, d[i] + angles[i] / 2 + 180), o.names[i], 13, 700);
    }
    g += '<polygon points="' + Sv.map(function (p) { return p.join(","); }).join(" ") + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    return g + "</svg>";
  }

  /* coordinate plane with polygons / points (for transformations) */
  function plane(o) {
    var x0 = o.x0 == null ? -5 : o.x0, x1 = o.x1 == null ? 5 : o.x1, y0 = o.y0 == null ? -5 : o.y0, y1 = o.y1 == null ? 5 : o.y1;
    var s = o.s || 26, pad = 24, W = (x1 - x0) * s + 2 * pad, H = (y1 - y0) * s + 2 * pad;
    function X(x) { return pad + (x - x0) * s; }
    function Y(y) { return pad + (y1 - y) * s; }
    var g = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + Math.min(W, 340) + '" xmlns="http://www.w3.org/2000/svg" role="img">', v;
    for (v = x0; v <= x1; v++) g += '<line x1="' + X(v) + '" y1="' + Y(y0) + '" x2="' + X(v) + '" y2="' + Y(y1) + '" stroke="currentColor" stroke-opacity="0.15"/>';
    for (v = y0; v <= y1; v++) g += '<line x1="' + X(x0) + '" y1="' + Y(v) + '" x2="' + X(x1) + '" y2="' + Y(v) + '" stroke="currentColor" stroke-opacity="0.15"/>';
    g += '<line x1="' + (X(x0) - 4) + '" y1="' + Y(0) + '" x2="' + (X(x1) + 8) + '" y2="' + Y(0) + '" stroke="currentColor" stroke-width="1.6"/>';
    g += '<line x1="' + X(0) + '" y1="' + (Y(y0) + 4) + '" x2="' + X(0) + '" y2="' + (Y(y1) - 8) + '" stroke="currentColor" stroke-width="1.6"/>';
    g += '<text x="' + (X(x1) + 12) + '" y="' + (Y(0) + 4) + '" font-size="13" font-style="italic">x</text><text x="' + (X(0) + 6) + '" y="' + (Y(y1) - 10) + '" font-size="13" font-style="italic">y</text>';
    for (v = x0; v <= x1; v++) if (v) g += '<text x="' + X(v) + '" y="' + (Y(0) + 13) + '" font-size="10" text-anchor="middle" direction="ltr">' + v + '</text>';
    for (v = y0; v <= y1; v++) if (v) g += '<text x="' + (X(0) - 5) + '" y="' + (Y(v) + 4) + '" font-size="10" text-anchor="end" direction="ltr">' + v + '</text>';
    g += '<text x="' + (X(0) - 5) + '" y="' + (Y(0) + 13) + '" font-size="10" text-anchor="end">0</text>';
    (o.polys || []).forEach(function (p) {
      g += '<polygon points="' + p.pts.map(function (q) { return X(q[0]) + "," + Y(q[1]); }).join(" ") + '" fill="' + p.color + '" fill-opacity="0.2" stroke="' + p.color + '" stroke-width="2"' + (p.dash ? ' stroke-dasharray="5 4"' : "") + '/>';
      (p.names || []).forEach(function (nm, i) { if (nm) { var q = p.pts[i]; g += '<text x="' + (X(q[0]) + (p.off ? p.off[i][0] : 6)) + '" y="' + (Y(q[1]) + (p.off ? p.off[i][1] : -6)) + '" font-size="12" font-weight="700" direction="ltr">' + nm + '</text>'; } });
    });
    (o.pts || []).forEach(function (p) {
      g += '<circle cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5" fill="' + (p.color || "var(--u4)") + '"/>';
      if (p.t) g += '<text x="' + (X(p.x) + 7) + '" y="' + (Y(p.y) - 7) + '" font-size="12" font-weight="700" direction="ltr">' + p.t + '</text>';
    });
    return g + "</svg>";
  }

  /* small regular polygons side by side with captions (rotational symmetry) */
  function regShapes() {
    var g = svg(330, 130), cx = 55;
    [[3, "رتبة 3"], [4, "رتبة 4"], [6, "رتبة 6"]].forEach(function (it) {
      var n = it[0], c = [cx, 58], R = 40, pts = [];
      for (var i = 0; i < n; i++) pts.push(P(c, R, 90 + i * 360 / n + (n === 4 ? 45 : 0)));
      g += '<polygon points="' + pts.map(function (p) { return p.join(","); }).join(" ") + '" fill="var(--u4)" fill-opacity="0.15" stroke="currentColor" stroke-width="2"/>';
      g += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="3" fill="var(--u4)"/>';
      g += '<text x="' + cx + '" y="122" font-size="13" text-anchor="middle">' + it[1] + '</text>';
      cx += 110;
    });
    return g + "</svg>";
  }

  /* ================= 4-1 العلاقات بين الزوايا ================= */
  var L1 = {
    id: "4-1",
    title: "العلاقات بين الزوايا",
    story: "كان فهمان يقصّ كرتونة بمقص جدّته الكبير لعمل فانوس رمضان. لاحظ أنه كلما فتح المقص، انفتحت الزاوية العليا والزاوية السفلى بالمقدار نفسه تمامًا! صاح: «يا تيتا، المقص بيعرف رياضيات!» قالت جدّتي: «المقص بيعرف يقصّ… وأنت انتبه على أصابعك!»",
    goals: [
      "أميّز الزاويتين المتتامتين والمتكاملتين، وأجد المتمّمة والمكمّلة لزاوية.",
      "أستعمل أن مجموع الزوايا المتجاورة على مستقيم [[180°]] وحول نقطة [[360°]].",
      "أستعمل تساوي الزاويتين المتقابلتين بالرأس لإيجاد زوايا مجهولة."
    ],
    sections: [
      {
        heading: "متتامتان ومتكاملتان",
        body: "<p><b>الزاويتان المتتامتان</b> مجموع قياسيهما [[90°]]، مثل [[35°]] و [[55°]]. ونقول: [[55°]] هي <b>متمّمة</b> [[35°]].</p>" +
          "<p><b>الزاويتان المتكاملتان</b> مجموع قياسيهما [[180°]]، مثل [[50°]] و [[130°]]. ونقول: [[130°]] هي <b>مكمّلة</b> [[50°]].</p>" +
          "<div class=\"rule\">المتمّمة = [[90° -]] الزاوية، والمكمّلة = [[180° -]] الزاوية.</div>",
        figure: rays({ w: 200, h: 170, c: [40, 140], len: 125, dirs: [0, 35, 90], angles: [[0, 35, "35°", { r: 40, tr: 70 }], [35, 90, "55°", { r: 28, col: "var(--u3)", tr: 55 }]] })
      },
      {
        heading: "زوايا على مستقيم وحول نقطة",
        body: "<p>الزوايا المتجاورة التي تقع على مستقيم واحد تشكّل معًا زاوية مستقيمة، فمجموعها [[180°]].</p>" +
          "<p>والزوايا التي تلتفّ حول نقطة دورة كاملة مجموعها [[360°]]. في الشكل: [[120° + 95° + 65° + 80° = 360°]].</p>" +
          "<div class=\"rule\">مجموع الزوايا المتجاورة على مستقيم = [[180°]]، ومجموع الزوايا حول نقطة = [[360°]].</div>",
        figure: rays({ w: 300, h: 230, c: [150, 115], len: 95, dirs: [0, 120, 215, 280], angles: [[0, 120, "120°"], [120, 215, "95°", { col: "var(--u3)" }], [215, 280, "65°", { col: "var(--u5)" }], [280, 360, "80°", { col: "var(--u6)" }]] })
      },
      {
        heading: "المتقابلتان بالرأس",
        body: "<p>عندما يتقاطع مستقيمان تتكوّن أربع زوايا. كل زاويتين متقابلتين (مثل فكَّي المقص) تسمّيان <b>متقابلتين بالرأس</b>، وهما متساويتان دائمًا.</p>" +
          "<p>وكل زاويتين متجاورتين منها متكاملتان، فإذا كانت إحداها [[50°]] كانت جارتها [[130°]].</p>" +
          "<div class=\"rule\">الزاويتان المتقابلتان بالرأس متساويتان في القياس.</div>",
        figure: cross(20, 70, ["50°", "130°", "50°", "130°"])
      }
    ],
    examples: [
      {
        q: "جد متمّمة الزاوية [[35°]] ومكمّلتها.",
        steps: ["المتمّمة: [[90° - 35° = 55°]]", "المكمّلة: [[180° - 35° = 145°]]"],
        answer: "الجواب: المتمّمة [[55°]] والمكمّلة [[145°]]."
      },
      {
        q: "في الشكل زاويتان متجاورتان على مستقيم. جد قيمة x.",
        figure: rays({ w: 300, h: 150, c: [150, 120], len: 115, dirs: [0, 68, 180], angles: [[0, 68, "x", { r: 30 }], [68, 180, "112°", { r: 24, col: "var(--u3)" }]] }),
        steps: ["الزاويتان على مستقيم، فمجموعهما [[180°]].", "[[x + 112° = 180°]]", "[[x = 180° - 112° = 68°]]"],
        answer: "الجواب: [[x = 68°]]"
      },
      {
        q: "أربع زوايا حول نقطة قياساتها [[120°]] و [[95°]] و x و [[80°]]. جد x.",
        steps: ["مجموع الزوايا حول نقطة [[360°]].", "[[120 + 95 + x + 80 = 360]]", "[[295 + x = 360]]، إذن [[x = 65°]]"],
        answer: "الجواب: [[x = 65°]] (انظر الشكل في الشرح أعلاه)."
      },
      {
        q: "في الشكل مستقيمان متقاطعان. جد قيمة x.",
        figure: cross(-35, 35, ["(2x + 10)°", null, "70°", null]),
        steps: ["الزاويتان متقابلتان بالرأس، فهما متساويتان.", "[[2x + 10 = 70]]", "[[2x = 60]]، إذن [[x = 30]]"],
        answer: "الجواب: [[x = 30]]"
      }
    ],
    tip: "حيلة فهمان: «متتامّة» تبدأ بحرف التاء مثل «تسعين» [[90°]]، و«متكاملة» فيها «كامل» مثل الخط المستقيم الكامل [[180°]]. والمقص يذكّرك أن المتقابلتين بالرأس متساويتان!",
    joke: "قالت الزاوية [[89°]] لصديقتها: «أنا تقريبًا قائمة!» فردّت الزاوية [[90°]]: «تقريبًا ما بتنفع، أنا الوحيدة اللي واقفة مستقيمة الظهر!»",
    problems: [
      { type: "num", level: 1, q: "جد متمّمة الزاوية [[28°]].", answer: 62, unit: "°", hint: "المتمّمة = [[90° -]] الزاوية.", solution: "[[90° - 28° = 62°]]" },
      { type: "num", level: 1, q: "جد مكمّلة الزاوية [[75°]].", answer: 105, unit: "°", hint: "المكمّلة = [[180° -]] الزاوية.", solution: "[[180° - 75° = 105°]]" },
      { type: "num", level: 1, q: "في الشكل زاويتان متجاورتان على مستقيم. جد قيمة x.", figure: rays({ w: 300, h: 150, c: [150, 120], len: 115, dirs: [0, 50, 180], angles: [[0, 50, "x", { r: 30 }], [50, 180, "130°", { r: 24, col: "var(--u3)" }]] }), answer: 50, unit: "°", hint: "مجموع الزاويتين [[180°]].", solution: "[[x = 180° - 130° = 50°]]" },
      { type: "num", level: 1, q: "في الشكل مستقيمان متقاطعان. جد قيمة x.", figure: cross(15, 63, ["48°", null, "x", null]), answer: 48, unit: "°", hint: "الزاويتان متقابلتان بالرأس.", solution: "المتقابلتان بالرأس متساويتان، إذن [[x = 48°]]." },
      { type: "choice", level: 1, q: "زاويتان قياساهما [[40°]] و [[50°]]. ماذا نسمّيهما؟", options: ["متكاملتين", "متقابلتين بالرأس", "متتامّتين", "لا علاقة بينهما"], answer: 2, hint: "اجمع القياسين.", solution: "[[40° + 50° = 90°]]، فهما متتامّتان." },
      { type: "num", level: 2, q: "في الشكل ثلاث زوايا حول نقطة. جد قيمة x.", figure: rays({ w: 300, h: 230, c: [150, 115], len: 95, dirs: [0, 90, 230], angles: [[0, 90, null, { right: true }], [90, 230, "140°", { col: "var(--u3)" }], [230, 360, "x", { col: "var(--u5)" }]] }), answer: 130, unit: "°", hint: "مجموع الزوايا حول نقطة [[360°]]، والزاوية المعلّمة بمربع قائمة.", solution: "[[x = 360° - 90° - 140° = 130°]]" },
      { type: "num", level: 2, q: "في الشكل ثلاث زوايا متجاورة على مستقيم. جد قيمة x.", figure: rays({ w: 300, h: 160, c: [150, 130], len: 120, dirs: [0, 30, 80, 180], angles: [[0, 30, "30°", { r: 40 }], [30, 80, "x", { r: 26, col: "var(--u3)" }], [80, 180, "2x", { r: 22, col: "var(--u5)" }]] }), answer: 50, unit: "°", hint: "[[30 + x + 2x = 180]].", solution: "[[3x + 30 = 180]]، إذن [[3x = 150]] و [[x = 50°]]." },
      { type: "num", level: 2, q: "في الشكل مستقيمان متقاطعان. جد قيمة y.", figure: cross(25, 90, ["65°", "y", null, null]), answer: 115, unit: "°", hint: "الزاويتان متجاورتان على مستقيم.", solution: "[[y = 180° - 65° = 115°]]" },
      { type: "num", level: 2, q: "زاويتان متكاملتان، قياس إحداهما 4 أمثال قياس الأخرى. ما قياس الزاوية الكبرى؟", answer: 144, unit: "°", hint: "[[x + 4x = 180]].", solution: "[[5x = 180]]، إذن [[x = 36°]]، والكبرى [[4 × 36° = 144°]]." },
      { type: "num", level: 2, q: "ما مكمّلة الزاوية بين عقربَي الساعة عند الساعة 2:00 تمامًا؟ (الزاوية بين كل رقمين متجاورين على الساعة [[30°]])", answer: 120, unit: "°", hint: "عند الساعة الثانية تمامًا يفصل العقربين رقمان.", solution: "الزاوية بين العقربين [[2 × 30° = 60°]]، ومكمّلتها [[180° - 60° = 120°]]." },
      { type: "num", level: 3, q: "زاويتان متتامّتان، الفرق بين قياسيهما [[20°]]. ما قياس الزاوية الصغرى؟", answer: 35, unit: "°", hint: "[[x + (x + 20) = 90]].", solution: "[[2x + 20 = 90]]، إذن [[x = 35°]]، والزاويتان [[35°]] و [[55°]]." },
      { type: "num", level: 3, q: "في الشكل مستقيمان متقاطعان. جد قيمة x.", figure: cross(-32.5, 32.5, ["(3x - 10)°", null, "(2x + 15)°", null]), answer: 25, hint: "المتقابلتان بالرأس متساويتان: [[3x - 10 = 2x + 15]].", solution: "[[3x - 10 = 2x + 15]]، إذن [[x = 25]]، وقياس كل زاوية [[65°]]." },
      { type: "num", level: 3, q: "في الشكل أربع زوايا حول نقطة. جد قيمة x.", figure: rays({ w: 300, h: 230, c: [150, 115], len: 95, dirs: [0, 90, 135, 225], angles: [[0, 90, null, { right: true }], [90, 135, "x", { col: "var(--u3)", r: 34 }], [135, 225, "2x", { col: "var(--u5)" }], [225, 360, "3x", { col: "var(--u6)" }]] }), answer: 45, unit: "°", hint: "[[90 + x + 2x + 3x = 360]].", solution: "[[6x + 90 = 360]]، إذن [[6x = 270]] و [[x = 45°]]." }
    ],
    generators: [
      function () {
        var a = rnd(5, 85), sup = Math.random() < 0.5;
        if (sup) a = rnd(10, 170);
        return { type: "num", level: 1, q: "جد " + (sup ? "مكمّلة" : "متمّمة") + " الزاوية [[" + a + "°]].", answer: (sup ? 180 : 90) - a, unit: "°",
          hint: sup ? "المكمّلة = [[180° -]] الزاوية." : "المتمّمة = [[90° -]] الزاوية.",
          solution: "[[" + (sup ? 180 : 90) + "° - " + a + "° = " + ((sup ? 180 : 90) - a) + "°]]" };
      },
      function () {
        var line = Math.random() < 0.5, total = line ? 180 : 360, k = line ? 2 : 3, parts = [], sum = 0;
        for (var i = 0; i < k; i++) { var p = rnd(20, line ? 70 : 110); parts.push(p); sum += p; }
        var x = total - sum;
        return { type: "num", level: 2, q: (line ? "زوايا متجاورة على مستقيم" : "زوايا حول نقطة") + " قياساتها " + parts.map(function (p) { return "[[" + p + "°]]"; }).join(" و ") + " و x. جد x.", answer: x, unit: "°",
          hint: "المجموع [[" + total + "°]].",
          solution: "[[x = " + total + "° - " + sum + "° = " + x + "°]]" };
      }
    ]
  };

  /* ================= 4-2 المستقيمات المتوازية والقاطع ================= */
  var NUMS = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8" };
  var L2 = {
    id: "4-2",
    title: "المستقيمات المتوازية والقاطع",
    story: "زار فهمان محطة قطار الحجاز في عمّان، ورأى قضبان السكة المتوازية يقطعها شارع مائل. قال للحارس: «يا عمّي، هاي ثماني زوايا!» قال الحارس: «ثماني زوايا؟ أنا بشوف سكة وشارع بس!» ابتسم فهمان: «وأنا بشوف ثماني زوايا، وأربع منها متساوية… والباقي كمان متساوية!»",
    goals: [
      "أتعرّف القاطع لمستقيمين متوازيين والزوايا الثماني الناتجة.",
      "أستعمل تساوي الزاويتين المتناظرتين، وتساوي الزاويتين المتبادلتين داخليًّا.",
      "أستعمل أن الزاويتين المتحالفتين (الداخليتين في جهة واحدة) متكاملتان.",
      "أحلّ مسائل جبرية وحياتية على المستقيمات المتوازية."
    ],
    sections: [
      {
        heading: "القاطع والزوايا الثماني",
        body: "<p><b>القاطع</b> مستقيم يقطع مستقيمين أو أكثر. عندما يقطع مستقيمين متوازيين تتكوّن 8 زوايا: 4 عند كل نقطة تقاطع. الأسهم على المستقيمين تعني أنهما متوازيان.</p>" +
          "<p>الزوايا 3 و 4 و 5 و 6 <b>داخلية</b> (بين المتوازيين)، والزوايا 1 و 2 و 7 و 8 <b>خارجية</b>.</p>" +
          "<div class=\"rule\">عند كل نقطة تقاطع: المتقابلتان بالرأس متساويتان، والمتجاورتان على مستقيم متكاملتان.</div>",
        figure: par(60, NUMS, { nums: true })
      },
      {
        heading: "المتناظرتان والمتبادلتان",
        body: "<p><b>الزاويتان المتناظرتان</b> في الموقع نفسه عند نقطتي التقاطع، مثل 1 و 5، و 2 و 6، و 3 و 7، و 4 و 8. شكلهما يشبه الحرف F.</p>" +
          "<p><b>الزاويتان المتبادلتان داخليًّا</b> بين المتوازيين وفي جهتين مختلفتين من القاطع، مثل 3 و 6، و 4 و 5. شكلهما يشبه الحرف Z.</p>" +
          "<div class=\"rule\">إذا قطع قاطعٌ مستقيمين متوازيين، فإن الزاويتين المتناظرتين متساويتان، والزاويتين المتبادلتين داخليًّا متساويتان.</div>"
      },
      {
        heading: "المتحالفتان",
        body: "<p><b>الزاويتان المتحالفتان</b> (الداخليتان في جهة واحدة من القاطع) مثل 3 و 5، و 4 و 6. شكلهما يشبه الحرف C أو U.</p>" +
          "<p>في الشكل أعلاه: الزاوية 3 حادّة والزاوية 5 منفرجة، ومجموعهما [[180°]].</p>" +
          "<div class=\"rule\">الزاويتان المتحالفتان متكاملتان: مجموعهما [[180°]].</div>"
      }
    ],
    examples: [
      {
        q: "في الشكل مستقيمان متوازيان يقطعهما قاطع. جد قياسات الزوايا a و b و c.",
        figure: par(65, { 1: "115°", 5: "a", 4: "b", 6: "c" }),
        steps: ["a تناظر الزاوية [[115°]]، إذن [[a = 115°]].", "b تقابل الزاوية [[115°]] بالرأس، إذن [[b = 115°]].", "c و a متجاورتان على مستقيم، إذن [[c = 180° - 115° = 65°]]."],
        answer: "الجواب: [[a = 115°]] و [[b = 115°]] و [[c = 65°]]"
      },
      {
        q: "جد قيمة x في الشكل.",
        figure: par(72, { 3: "72°", 6: "x" }),
        steps: ["الزاويتان متبادلتان داخليًّا (شكل Z).", "المتبادلتان داخليًّا متساويتان، إذن [[x = 72°]]."],
        answer: "الجواب: [[x = 72°]]"
      },
      {
        q: "جد قيمة x في الشكل.",
        figure: par(72, { 4: "108°", 6: "x" }),
        steps: ["الزاويتان متحالفتان (داخليتان في جهة واحدة من القاطع).", "[[x + 108° = 180°]]", "[[x = 72°]]"],
        answer: "الجواب: [[x = 72°]]"
      },
      {
        q: "جد قيمة x في الشكل.",
        figure: par(80, { 2: "(3x + 5)°", 6: "(2x + 30)°" }),
        steps: ["الزاويتان متناظرتان، فهما متساويتان.", "[[3x + 5 = 2x + 30]]", "[[x = 25]]، وقياس كل منهما [[3 × 25 + 5 = 80°]]."],
        answer: "الجواب: [[x = 25]]"
      }
    ],
    tip: "حيلة فهمان: ابحث عن الحروف! F = متناظرتان (متساويتان)، Z = متبادلتان (متساويتان)، C = متحالفتان (مجموعهما [[180°]]). وفي أي شكل كهذا: كل الزوايا الحادة متساوية، وكل المنفرجة متساوية، وأي حادة + أي منفرجة = [[180°]].",
    joke: "سأل المستقيم صديقه الموازي: «ليش ما بنلتقي أبدًا؟» قال: «لأننا متوازيان… بس ولا يهمك، القاطع بيوصّل السلامات بيننا!»",
    problems: [
      { type: "num", level: 1, q: "المستقيمان متوازيان. جد قيمة x.", figure: par(70, { 2: "70°", 6: "x" }), answer: 70, unit: "°", hint: "الزاويتان متناظرتان.", solution: "المتناظرتان متساويتان، إذن [[x = 70°]]." },
      { type: "num", level: 1, q: "المستقيمان متوازيان. جد قيمة x.", figure: par(65, { 3: "65°", 6: "x" }), answer: 65, unit: "°", hint: "الزاويتان متبادلتان داخليًّا (شكل Z).", solution: "المتبادلتان داخليًّا متساويتان، إذن [[x = 65°]]." },
      { type: "num", level: 1, q: "المستقيمان متوازيان. جد قيمة x.", figure: par(70, { 3: "70°", 5: "x" }), answer: 110, unit: "°", hint: "الزاويتان متحالفتان.", solution: "المتحالفتان متكاملتان: [[x = 180° - 70° = 110°]]." },
      { type: "num", level: 1, q: "زاويتان متحالفتان بين مستقيمين متوازيين، قياس إحداهما [[75°]]. ما قياس الأخرى؟", answer: 105, unit: "°", hint: "المتحالفتان مجموعهما [[180°]].", solution: "[[180° - 75° = 105°]]" },
      { type: "choice", level: 1, q: "في الشكل، ماذا نسمّي الزاويتين 3 و 6؟", figure: par(60, NUMS, { nums: true }), options: ["متناظرتين", "متبادلتين داخليًّا", "متحالفتين", "متقابلتين بالرأس"], answer: 1, hint: "هل هما بين المتوازيين؟ وهل هما في جهتين مختلفتين من القاطع؟", solution: "الزاويتان 3 و 6 داخليتان وفي جهتين مختلفتين من القاطع (شكل Z)، فهما متبادلتان داخليًّا." },
      { type: "choice", level: 1, q: "في الشكل نفسه، ماذا نسمّي الزاويتين 2 و 6؟", figure: par(60, NUMS, { nums: true }), options: ["متقابلتين بالرأس", "متحالفتين", "متبادلتين داخليًّا", "متناظرتين"], answer: 3, hint: "انظر إلى موقع كل منهما عند نقطة التقاطع.", solution: "كلتاهما أعلى يمين نقطة التقاطع، فهما متناظرتان (شكل F)." },
      { type: "num", level: 2, q: "المستقيمان متوازيان. جد قيمة x.", figure: par(55, { 1: "125°", 8: "x" }), answer: 125, unit: "°", hint: "x تقابل بالرأس زاوية تناظر [[125°]].", solution: "الزاوية 4 تقابل الزاوية 1 بالرأس فهي [[125°]]، والزاوية 8 تناظر الزاوية 4، إذن [[x = 125°]] (وتسمّيان متبادلتين خارجيًّا)." },
      { type: "num", level: 2, q: "المستقيمان متوازيان. جد قيمة x.", figure: par(48, { 2: "48°", 5: "x" }), answer: 132, unit: "°", hint: "جد أولًا الزاوية 6 المناظرة للزاوية [[48°]].", solution: "الزاوية 6 تناظر [[48°]] فهي [[48°]]، و x تجاورها على مستقيم: [[x = 180° - 48° = 132°]]." },
      { type: "num", level: 2, q: "المستقيمان متوازيان. جد قيمة x.", figure: par(80, { 2: "(2x + 10)°", 6: "80°" }), answer: 35, hint: "الزاويتان متناظرتان، فهما متساويتان.", solution: "[[2x + 10 = 80]]، إذن [[2x = 70]] و [[x = 35]]." },
      { type: "num", level: 2, q: "المستقيمان متوازيان. جد قيمة x.", figure: par(72, { 4: "3x", 6: "2x" }), answer: 36, hint: "الزاويتان متحالفتان: [[3x + 2x = 180]].", solution: "[[5x = 180]]، إذن [[x = 36]]. الزاويتان [[108°]] و [[72°]]." },
      { type: "choice", level: 2, q: "قطع قاطعٌ مستقيمين متوازيين. أي العبارات الآتية صحيحة دائمًا؟", options: ["الزاويتان المتحالفتان متساويتان", "الزاويتان المتبادلتان داخليًّا مجموعهما [[90°]]", "الزاويتان المتناظرتان متساويتان", "كل الزوايا الثماني متساوية"], answer: 2, hint: "تذكّر: F و Z متساويتان، و C مجموعهما [[180°]].", solution: "الزاويتان المتناظرتان متساويتان دائمًا. أما المتحالفتان فمتكاملتان (ولا تتساويان إلا إذا كان القاطع عموديًّا)." },
      { type: "num", level: 3, q: "المستقيمان متوازيان. جد قيمة x.", figure: par(75, { 4: "(5x - 20)°", 5: "(3x + 30)°" }), answer: 25, hint: "الزاويتان متبادلتان داخليًّا، فهما متساويتان.", solution: "[[5x - 20 = 3x + 30]]، إذن [[2x = 50]] و [[x = 25]]، وقياس كل زاوية [[105°]]." },
      { type: "num", level: 3, q: "شارعان متوازيان في الزرقاء يقطعهما شارع مائل، فيصنع مع الشارع الأول زاوية [[62°]] كما في الشكل. ما قياس الزاوية x؟", figure: par(62, { 3: "62°", 5: "x" }), answer: 118, unit: "°", hint: "الزاويتان متحالفتان.", solution: "[[x = 180° - 62° = 118°]]" },
      { type: "num", level: 3, q: "المستقيمان متوازيان. جد قياس الزاوية x عند النقطة الواقعة بينهما.", figure: zig(40, 30, "40°", "30°", "x"), answer: 70, unit: "°", hint: "ارسم من نقطة الرأس مستقيمًا موازيًا للمستقيمين، ثم استعمل المتبادلتين داخليًّا مرتين.", solution: "المستقيم الموازي يقسم x إلى جزأين: الأول يبادل [[40°]] والثاني يبادل [[30°]]، إذن [[x = 40° + 30° = 70°]]." }
    ],
    generators: [
      function () {
        var t = rnd(35, 85), kinds = [["متناظرتان", 0], ["متبادلتان داخليًّا", 0], ["متحالفتان", 1]], k = kinds[rnd(0, 2)];
        var given = Math.random() < 0.5 ? t : 180 - t, ans = k[1] ? 180 - given : given;
        return { type: "num", level: 1, q: "زاويتان " + k[0] + " بين مستقيمين متوازيين، قياس إحداهما [[" + given + "°]]. ما قياس الأخرى؟", answer: ans, unit: "°",
          hint: k[1] ? "المتحالفتان مجموعهما [[180°]]." : "هاتان الزاويتان متساويتان.",
          solution: k[1] ? "[[180° - " + given + "° = " + ans + "°]]" : "الزاويتان متساويتان، إذن القياس [[" + ans + "°]]." };
      }
    ]
  };

  /* ================= 4-3 زوايا المثلث ================= */
  var L3 = {
    id: "4-3",
    title: "زوايا المثلث",
    story: "قصّ فهمان مثلثًا من ورق الكرتون، ثم مزّق زواياه الثلاث وألصقها بجانب بعضها على المسطرة… فشكّلت خطًّا مستقيمًا تمامًا! جرّب مع مثلث ثانٍ وثالث، وكل مرة خط مستقيم. صاح: «يا جماعة، المثلثات متّفقة على شي!» وأخته سلمى صاحت: «وأنت متّفق إنك رح تنظّف الورق؟»",
    goals: [
      "أستعمل أن مجموع قياسات زوايا المثلث [[180°]] لإيجاد زاوية مجهولة.",
      "أستعمل أن الزاوية الخارجية للمثلث تساوي مجموع الزاويتين الداخليتين البعيدتين عنها.",
      "أجد زوايا المثلث المتطابق الضلعين والمتطابق الأضلاع والقائم الزاوية."
    ],
    sections: [
      {
        heading: "مجموع زوايا المثلث",
        body: "<p>في أي مثلث، مهما كان شكله أو حجمه، مجموع قياسات زواياه الداخلية [[180°]]. في الشكل: [[50° + 60° + 70° = 180°]].</p>" +
          "<p>لذلك في المثلث القائم الزاوية تكون الزاويتان الحادّتان متتامّتين (مجموعهما [[90°]]).</p>" +
          "<div class=\"rule\">مجموع قياسات زوايا المثلث = [[180°]]</div>",
        figure: tri(60, 70, { A: "50°", B: "60°", C: "70°" })
      },
      {
        heading: "الزاوية الخارجية",
        body: "<p>إذا مددنا أحد أضلاع المثلث تتكوّن <b>زاوية خارجية</b>. وهي تجاور الزاوية الداخلية على مستقيم، لذلك مجموعهما [[180°]].</p>" +
          "<p>في الشكل: الزاوية الخارجية عند C تساوي [[70° + 45° = 115°]]، أي مجموع الزاويتين الداخليتين البعيدتين عنها A و B.</p>" +
          "<div class=\"rule\">الزاوية الخارجية للمثلث = مجموع قياسَي الزاويتين الداخليتين البعيدتين عنها.</div>",
        figure: tri(45, 65, { A: "70°", B: "45°", ext: "115°" })
      },
      {
        heading: "مثلثات خاصة",
        body: "<ul><li><b>المثلث المتطابق الضلعين:</b> زاويتا القاعدة (المقابلتان للضلعين المتطابقين) متساويتان. الشرطتان على الضلعين تعنيان أنهما متطابقان.</li>" +
          "<li><b>المثلث المتطابق الأضلاع:</b> زواياه الثلاث متساوية، قياس كل منها [[180° ÷ 3 = 60°]].</li></ul>" +
          "<div class=\"rule\">في المثلث المتطابق الضلعين: زاوية الرأس [[= 180° -]] مجموع زاويتي القاعدة المتساويتين.</div>",
        figure: tri(70, 70, { A: "40°", B: "70°", C: "70°", eq: true })
      }
    ],
    examples: [
      {
        q: "جد قيمة x في المثلث.",
        figure: tri(45, 75, { A: "x", B: "45°", C: "75°" }),
        steps: ["[[x + 45° + 75° = 180°]]", "[[x + 120° = 180°]]", "[[x = 60°]]"],
        answer: "الجواب: [[x = 60°]]"
      },
      {
        q: "جد قياس الزاوية الخارجية x.",
        figure: tri(50, 65, { A: "65°", B: "50°", ext: "x" }),
        steps: ["الزاوية الخارجية = مجموع الزاويتين الداخليتين البعيدتين.", "[[x = 65° + 50° = 115°]]"],
        answer: "الجواب: [[x = 115°]]"
      },
      {
        q: "مثلث متطابق الضلعين قياس زاوية رأسه [[40°]]. جد قياس كل من زاويتي القاعدة y.",
        figure: tri(70, 70, { A: "40°", B: "y", C: "y", eq: true }),
        steps: ["زاويتا القاعدة متساويتان: [[y + y + 40° = 180°]]", "[[2y = 140°]]", "[[y = 70°]]"],
        answer: "الجواب: [[y = 70°]]"
      },
      {
        q: "زوايا مثلث قياساتها x و [[2x]] و [[3x]]. جد قياس أكبر زاوية.",
        steps: ["[[x + 2x + 3x = 180]]", "[[6x = 180]]، إذن [[x = 30]]", "أكبر زاوية [[3x = 90°]]، فالمثلث قائم الزاوية!"],
        answer: "الجواب: [[90°]]"
      }
    ],
    tip: "حيلة فهمان: للزاوية الخارجية لا تحتاج أن تجد الزاوية الداخلية المجاورة أولًا؛ اجمع البعيدتين مباشرة! وتذكّر: «المثلث عنده 180 درجة… مثل نصف دورة دبكة».",
    joke: "ليش المثلث المتطابق الأضلاع دايمًا مرتاح؟ لأنه ما في ولا زاوية فيه بتغار من الثانية… كلهن [[60°]]!",
    problems: [
      { type: "num", level: 1, q: "جد قيمة x في المثلث.", figure: tri(55, 65, { A: "x", B: "55°", C: "65°" }), answer: 60, unit: "°", hint: "مجموع زوايا المثلث [[180°]].", solution: "[[x = 180° - 55° - 65° = 60°]]" },
      { type: "num", level: 1, q: "مثلث قائم الزاوية، قياس إحدى زاويتيه الحادّتين [[34°]]. ما قياس الزاوية الحادّة الأخرى؟", answer: 56, unit: "°", hint: "الزاويتان الحادّتان متتامّتان.", solution: "[[90° - 34° = 56°]]" },
      { type: "num", level: 1, q: "ما قياس كل زاوية في المثلث المتطابق الأضلاع؟", answer: 60, unit: "°", hint: "ثلاث زوايا متساوية مجموعها [[180°]].", solution: "[[180° ÷ 3 = 60°]]" },
      { type: "num", level: 1, q: "جد قياس الزاوية الخارجية x.", figure: tri(75, 65, { A: "40°", B: "75°", ext: "x" }), answer: 115, unit: "°", hint: "اجمع الزاويتين الداخليتين البعيدتين.", solution: "[[x = 40° + 75° = 115°]]" },
      { type: "choice", level: 1, q: "هل يمكن رسم مثلث قياسات زواياه [[90°]] و [[60°]] و [[40°]]؟", options: ["نعم، لأن فيه زاوية قائمة", "لا، لأن المجموع [[190°]] وليس [[180°]]", "نعم، كل ثلاث زوايا تصنع مثلثًا", "لا، لأن المثلث لا يحوي زاوية [[40°]]"], answer: 1, hint: "اجمع القياسات الثلاثة.", solution: "[[90° + 60° + 40° = 190° ≠ 180°]]، فلا يمكن رسمه." },
      { type: "num", level: 2, q: "مثلث متطابق الضلعين، قياس كل من زاويتي قاعدته [[72°]]. جد قياس زاوية الرأس x.", figure: tri(72, 72, { A: "x", B: "72°", C: "72°", eq: true }), answer: 36, unit: "°", hint: "[[x + 72° + 72° = 180°]].", solution: "[[x = 180° - 144° = 36°]]" },
      { type: "num", level: 2, q: "مثلث متطابق الضلعين، قياس زاوية رأسه [[100°]]. جد قياس زاوية القاعدة x.", figure: tri(40, 40, { A: "100°", B: "x", C: "x", eq: true }), answer: 40, unit: "°", hint: "زاويتا القاعدة متساويتان ومجموعهما [[180° - 100°]].", solution: "[[2x = 80°]]، إذن [[x = 40°]]." },
      { type: "num", level: 2, q: "جد قيمة x.", figure: tri(45, 55, { A: "x", B: "45°", ext: "125°" }), answer: 80, unit: "°", hint: "الزاوية الخارجية = مجموع الداخليتين البعيدتين: [[x + 45° = 125°]].", solution: "[[x = 125° - 45° = 80°]]" },
      { type: "num", level: 2, q: "زوايا مثلث قياساتها [[x°]] و [[(x + 10)°]] و [[(x + 20)°]]. جد قيمة x.", figure: tri(50, 60, { A: "(x + 20)°", B: "x°", C: "(x + 10)°" }), answer: 50, hint: "[[x + (x + 10) + (x + 20) = 180]].", solution: "[[3x + 30 = 180]]، إذن [[3x = 150]] و [[x = 50]]. الزوايا [[50°]] و [[60°]] و [[70°]]." },
      { type: "num", level: 2, q: "سلّم يستند إلى حائط عمودي على الأرض، ويصنع مع الأرض زاوية [[68°]]. ما قياس الزاوية بين السلّم والحائط؟", answer: 22, unit: "°", hint: "السلّم والحائط والأرض تكوّن مثلثًا قائم الزاوية.", solution: "[[180° - 90° - 68° = 22°]]" },
      { type: "num", level: 3, q: "زوايا مثلث قياساتها [[2x]] و [[3x]] و [[4x]]. ما قياس أكبر زاوية؟", figure: tri(40, 60, { A: "4x", B: "2x", C: "3x" }), answer: 80, unit: "°", hint: "[[9x = 180]].", solution: "[[2x + 3x + 4x = 180]]، إذن [[x = 20]]، وأكبر زاوية [[4x = 80°]]." },
      { type: "num", level: 3, q: "جد قيمة x.", figure: tri(55, 60, { A: "(3x - 10)°", B: "(2x + 5)°", ext: "120°" }), answer: 25, hint: "الزاوية الخارجية [[120°]] تساوي مجموع الزاويتين البعيدتين.", solution: "[[(3x - 10) + (2x + 5) = 120]]، إذن [[5x - 5 = 120]] و [[x = 25]]." },
      { type: "num", level: 3, q: "في المثلث المتطابق الضلعين ABC، الزاوية الخارجية عند C تساوي [[115°]]. جد قياس زاوية الرأس x.", figure: tri(65, 65, { A: "x", ext: "115°", eq: true }), answer: 50, unit: "°", hint: "جد الزاوية الداخلية C أولًا، وتذكّر أن [[B = C]].", solution: "[[C = 180° - 115° = 65°]]، و [[B = 65°]]، إذن [[x = 180° - 130° = 50°]]." },
      { type: "choice", level: 1, q: "أي مجموعة يمكن أن تكون قياسات زوايا مثلث قائم الزاوية؟", options: ["[[90°, 45°, 55°]]", "[[90°, 30°, 60°]]", "[[90°, 90°, 0°]]", "[[80°, 60°, 40°]]"], answer: 1, hint: "يجب أن تحوي [[90°]] وأن يكون المجموع [[180°]].", solution: "[[90° + 30° + 60° = 180°]] وفيها زاوية قائمة." }
    ],
    generators: [
      function () {
        var a = rnd(20, 100), b = rnd(20, 150 - a);
        return { type: "num", level: 1, q: "قياسا زاويتين في مثلث [[" + a + "°]] و [[" + b + "°]]. ما قياس الزاوية الثالثة؟", answer: 180 - a - b, unit: "°",
          hint: "مجموع زوايا المثلث [[180°]].", solution: "[[180° - " + a + "° - " + b + "° = " + (180 - a - b) + "°]]" };
      },
      function () {
        var a = rnd(25, 80), b = rnd(25, 80);
        return { type: "num", level: 2, q: "الزاويتان الداخليتان البعيدتان عن زاوية خارجية في مثلث قياساهما [[" + a + "°]] و [[" + b + "°]]. ما قياس الزاوية الخارجية؟", answer: a + b, unit: "°",
          hint: "الزاوية الخارجية = مجموع البعيدتين.", solution: "[[" + a + "° + " + b + "° = " + (a + b) + "°]]" };
      }
    ]
  };

  /* ================= 4-4 زوايا المضلع ================= */
  var L4 = {
    id: "4-4",
    title: "زوايا المضلع",
    story: "في بيت جدّتي في السلط، بلاط المطبخ على شكل سداسيات منتظمة مثل خلية النحل. سألت فهمان: «ليش النحل بيحب السداسي؟» فكّر فهمان وقال: «لأن ثلاث زوايا سداسية تلتقي عند نقطة وتعمل [[360°]] بالزبط، فما في ولا فراغ… والنحل ما بحب يضيّع عسل!»",
    goals: [
      "أجد مجموع قياسات الزوايا الداخلية لمضلع باستعمال [[(n - 2) × 180°]].",
      "أجد قياس الزاوية الداخلية للمضلع المنتظم.",
      "أستعمل أن مجموع قياسات الزوايا الخارجية لأي مضلع محدّب [[360°]].",
      "أجد عدد أضلاع مضلع منتظم من قياس زاويته."
    ],
    sections: [
      {
        heading: "مجموع الزوايا الداخلية",
        body: "<p>نقسم المضلع إلى مثلثات برسم أقطار من رأس واحد. الخماسي ينقسم إلى 3 مثلثات، فمجموع زواياه [[3 × 180° = 540°]].</p>" +
          "<table><tr><th>المضلع</th><th>عدد الأضلاع n</th><th>عدد المثلثات</th><th>مجموع الزوايا</th></tr>" +
          "<tr><td>رباعي</td><td>4</td><td>2</td><td>[[360°]]</td></tr><tr><td>خماسي</td><td>5</td><td>3</td><td>[[540°]]</td></tr>" +
          "<tr><td>سداسي</td><td>6</td><td>4</td><td>[[720°]]</td></tr><tr><td>ثماني</td><td>8</td><td>6</td><td>[[1080°]]</td></tr></table>" +
          "<div class=\"rule\">مجموع قياسات الزوايا الداخلية لمضلع عدد أضلاعه n يساوي [[(n - 2) × 180°]].</div>",
        figure: poly([108, 108, 108, 108, 108], { diag: true, fill: "var(--u4)" })
      },
      {
        heading: "المضلع المنتظم",
        body: "<p><b>المضلع المنتظم</b> أضلاعه متطابقة وزواياه متساوية. لإيجاد قياس زاويته الداخلية نقسم المجموع على عدد الزوايا.</p>" +
          "<p>السداسي المنتظم: [[(6 - 2) × 180° ÷ 6 = 720° ÷ 6 = 120°]].</p>" +
          "<div class=\"rule\">قياس الزاوية الداخلية للمضلع المنتظم = [[{(n - 2) × 180°/n}]]</div>",
        figure: poly([120, 120, 120, 120, 120, 120], { labels: ["120°", "120°", "120°", "120°", "120°", "120°"], fill: "var(--u6)", w: 200, h: 170, tr: 42 })
      },
      {
        heading: "الزوايا الخارجية",
        body: "<p>عند كل رأس، إذا مددنا ضلعًا تتكوّن زاوية خارجية، وهي تكمّل الزاوية الداخلية: الداخلية + الخارجية [[= 180°]].</p>" +
          "<p>تخيّل نملة تمشي حول المضلع: عند كل رأس تستدير بمقدار الزاوية الخارجية، وعندما تعود إلى البداية تكون قد استدارت دورة كاملة!</p>" +
          "<div class=\"rule\">مجموع قياسات الزوايا الخارجية لأي مضلع محدّب = [[360°]]. وفي المضلع المنتظم: الزاوية الخارجية [[= 360° ÷ n]].</div>",
        figure: poly([108, 108, 108, 108, 108], { ext: ["72°", "72°", "72°", "72°", "72°"], w: 170, h: 150 })
      }
    ],
    examples: [
      {
        q: "جد مجموع قياسات الزوايا الداخلية للمضلع الثماني.",
        steps: ["[[n = 8]]", "[[(8 - 2) × 180° = 6 × 180° = 1080°]]"],
        answer: "الجواب: [[1080°]]"
      },
      {
        q: "جد قياس الزاوية الداخلية للمضلع العشاري المنتظم.",
        steps: ["المجموع: [[(10 - 2) × 180° = 1440°]]", "الزاوية الواحدة: [[1440° ÷ 10 = 144°]]", "طريقة أخرى: الخارجية [[360° ÷ 10 = 36°]]، والداخلية [[180° - 36° = 144°]]."],
        answer: "الجواب: [[144°]]"
      },
      {
        q: "جد قيمة x في الشكل الرباعي.",
        figure: poly([85, 110, 95, 70], { labels: ["85°", "110°", "95°", "x"] }),
        steps: ["مجموع زوايا الرباعي [[360°]].", "[[85 + 110 + 95 + x = 360]]", "[[290 + x = 360]]، إذن [[x = 70°]]"],
        answer: "الجواب: [[x = 70°]]"
      },
      {
        q: "مضلع منتظم قياس زاويته الخارجية [[24°]]. كم عدد أضلاعه؟",
        steps: ["مجموع الزوايا الخارجية [[360°]] وكلها متساوية.", "[[n = 360 ÷ 24 = 15]]"],
        answer: "الجواب: 15 ضلعًا."
      }
    ],
    tip: "حيلة فهمان: الزاوية الخارجية هي «الطريق المختصر» دائمًا! في المضلع المنتظم احسب [[360° ÷ n]] أولًا، ثم اطرحها من [[180°]] لتحصل على الداخلية. ولإيجاد n: [[360° ÷]] الزاوية الخارجية.",
    joke: "سألت المعلّمة: «كم ضلعًا للمضلع الذي اسمه «مئوي»؟» قال فهمان: «100 ضلع يا آنسة… بس ما بنصح ترسميه، الحصة رح تخلص!»",
    problems: [
      { type: "num", level: 1, q: "جد مجموع قياسات الزوايا الداخلية للمضلع السداسي.", answer: 720, unit: "°", hint: "[[(6 - 2) × 180°]].", solution: "[[4 × 180° = 720°]]" },
      { type: "num", level: 1, q: "جد قياس الزاوية الداخلية للمضلع الخماسي المنتظم.", answer: 108, unit: "°", hint: "المجموع [[540°]] مقسومًا على 5.", solution: "[[540° ÷ 5 = 108°]]" },
      { type: "num", level: 1, q: "ما مجموع قياسات الزوايا الخارجية للمضلع السباعي؟", answer: 360, unit: "°", hint: "هذا المجموع لا يعتمد على عدد الأضلاع.", solution: "مجموع الزوايا الخارجية لأي مضلع محدّب [[360°]]." },
      { type: "num", level: 1, q: "جد قيمة x في الشكل الرباعي.", figure: poly([90, 80, 120, 70], { labels: [null, "80°", "120°", "x"], rightAt: 0 }), answer: 70, unit: "°", hint: "مجموع زوايا الرباعي [[360°]]، والزاوية المعلّمة بمربع قائمة.", solution: "[[x = 360° - 90° - 80° - 120° = 70°]]" },
      { type: "num", level: 1, q: "ما قياس الزاوية الخارجية للمضلع الثماني المنتظم؟", answer: 45, unit: "°", hint: "[[360° ÷ 8]].", solution: "[[360° ÷ 8 = 45°]]" },
      { type: "num", level: 2, q: "جد قيمة x في الشكل الخماسي.", figure: poly([100, 110, 120, 95, 115], { labels: ["100°", "110°", "120°", "95°", "x"] }), answer: 115, unit: "°", hint: "مجموع زوايا الخماسي [[540°]].", solution: "[[x = 540° - (100° + 110° + 120° + 95°) = 540° - 425° = 115°]]" },
      { type: "num", level: 2, q: "مضلع منتظم قياس زاويته الخارجية [[30°]]. كم عدد أضلاعه؟", answer: 12, unit: "ضلعًا", hint: "[[n = 360 ÷]] الزاوية الخارجية.", solution: "[[360 ÷ 30 = 12]] ضلعًا." },
      { type: "num", level: 2, q: "مضلع مجموع قياسات زواياه الداخلية [[1260°]]. كم عدد أضلاعه؟", answer: 9, unit: "أضلاع", hint: "حلّ المعادلة [[(n - 2) × 180 = 1260]].", solution: "[[n - 2 = 1260 ÷ 180 = 7]]، إذن [[n = 9]] (تساعي)." },
      { type: "choice", level: 2, q: "ما اسم المضلع الذي مجموع قياسات زواياه الداخلية [[900°]]؟", options: ["الخماسي", "السداسي", "السباعي", "الثماني"], answer: 2, hint: "[[900 ÷ 180 = 5]] مثلثات، فكم ضلعًا؟", solution: "[[n - 2 = 5]]، إذن [[n = 7]]: المضلع السباعي." },
      { type: "num", level: 2, q: "مضلع منتظم قياس زاويته الداخلية [[140°]]. كم عدد أضلاعه؟", answer: 9, unit: "أضلاع", hint: "جد الزاوية الخارجية أولًا: [[180° - 140°]].", solution: "الخارجية [[40°]]، إذن [[n = 360 ÷ 40 = 9]]." },
      { type: "num", level: 2, q: "بلاط مطبخ جدّة فهمان سداسيات منتظمة. كم سداسيًّا منتظمًا يلتقي عند نقطة واحدة دون فراغات؟", answer: 3, hint: "الزاوية الداخلية للسداسي المنتظم [[120°]]، والدورة حول نقطة [[360°]].", solution: "[[360° ÷ 120° = 3]] سداسيات." },
      { type: "num", level: 3, q: "زوايا شكل رباعي قياساتها x و [[2x]] و [[3x]] و [[4x]]. جد قيمة x.", figure: poly([36, 72, 108, 144], { labels: ["x", "2x", "3x", "4x"], lens: [2.6, 1] }), answer: 36, unit: "°", hint: "[[x + 2x + 3x + 4x = 360]].", solution: "[[10x = 360]]، إذن [[x = 36°]]. والزوايا [[36°]] و [[72°]] و [[108°]] و [[144°]]." },
      { type: "num", level: 3, q: "قياسات أربع زوايا خارجية لمضلع خماسي هي [[70°]] و [[80°]] و [[65°]] و [[75°]]. ما قياس الزاوية الخارجية الخامسة؟", answer: 70, unit: "°", hint: "مجموع الزوايا الخارجية [[360°]].", solution: "[[360° - (70° + 80° + 65° + 75°) = 360° - 290° = 70°]]" },
      { type: "choice", level: 3, q: "هل يوجد مضلع منتظم قياس زاويته الداخلية [[130°]]؟", options: ["نعم، له 7 أضلاع", "نعم، له 8 أضلاع", "لا، لأن [[360 ÷ 50]] ليس عددًا صحيحًا", "لا، لأن الزاوية الداخلية لا تزيد على [[120°]]"], answer: 2, hint: "الزاوية الخارجية [[180° - 130° = 50°]]. هل يقبل 360 القسمة على 50؟", solution: "[[360 ÷ 50 = 7.2]] ليس عددًا صحيحًا، فلا يوجد مضلع منتظم بهذه الزاوية." }
    ],
    generators: [
      function () {
        var n = rnd(5, 14);
        return { type: "num", level: 1, q: "جد مجموع قياسات الزوايا الداخلية لمضلع عدد أضلاعه " + n + ".", answer: (n - 2) * 180, unit: "°",
          hint: "[[(n - 2) × 180°]]", solution: "[[(" + n + " - 2) × 180° = " + (n - 2) + " × 180° = " + ((n - 2) * 180) + "°]]" };
      },
      function () {
        var ns = [5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36], n = ns[rnd(0, ns.length - 1)], e = 360 / n;
        if (Math.random() < 0.5) return { type: "num", level: 2, q: "جد قياس الزاوية الداخلية لمضلع منتظم عدد أضلاعه " + n + ".", answer: 180 - e, unit: "°",
          hint: "الخارجية [[360° ÷ " + n + "]]، ثم الداخلية [[180° -]] الخارجية.", solution: "الخارجية [[360° ÷ " + n + " = " + e + "°]]، والداخلية [[180° - " + e + "° = " + (180 - e) + "°]]." };
        return { type: "num", level: 2, q: "مضلع منتظم قياس زاويته الخارجية [[" + e + "°]]. كم عدد أضلاعه؟", answer: n,
          hint: "[[n = 360 ÷]] الزاوية الخارجية.", solution: "[[360 ÷ " + e + " = " + n + "]]" };
      }
    ]
  };

  /* ================= 4-5 الدوران ================= */
  var TRI = [[1, 1], [4, 1], [1, 3]];
  function rot90(p) { return [-p[1], p[0]]; }
  function rotCW(p) { return [p[1], -p[0]]; }
  function pstr(p) { return "(" + p[0] + ", " + p[1] + ")"; }
  var L5 = {
    id: "4-5",
    title: "الدوران",
    story: "ركب فهمان دولاب الهواء في مدينة الألعاب، وكان يجلس في المقعد الأحمر. بعد ربع دورة كان في الأعلى، وبعد نصف دورة صار في الجهة المقابلة تمامًا، وبعد دورة كاملة رجع إلى مكانه. نزل وهو يقول: «الدولاب ما غيّر شكلي ولا حجمي… بس غيّر مكاني ومعدتي!»",
    goals: [
      "أراجع الانعكاس والانسحاب وأجد صورة نقطة بكل منهما.",
      "أدوّر نقطة أو شكلًا حول نقطة الأصل بزاوية [[90°]] أو [[180°]] أو [[270°]] مع اتجاه عقارب الساعة أو عكسه.",
      "أحدّد التماثل الدوراني لشكل ورتبته."
    ],
    sections: [
      {
        heading: "تذكّر: الانعكاس والانسحاب",
        body: "<p>التحويل الهندسي ينقل الشكل إلى موقع جديد يسمّى <b>الصورة</b>، ونرمز لصورة A بالرمز [[A']].</p>" +
          "<ul><li><b>الانعكاس في المحور x:</b> [[(x, y) → (x, -y)]]. وفي المحور y: [[(x, y) → (-x, y)]].</li>" +
          "<li><b>الانسحاب:</b> إزاحة كل النقاط المسافة نفسها وفي الاتجاه نفسه. انسحاب 3 وحدات يمينًا ووحدتين إلى أسفل: [[(x, y) → (x + 3, y - 2)]].</li></ul>" +
          "<p>في الشكل: المثلث الأزرق صورة المثلث الوردي بالانعكاس في المحور x.</p>" +
          "<div class=\"rule\">الانعكاس والانسحاب والدوران تحافظ على شكل الشكل وقياساته؛ الصورة تطابق الشكل الأصلي.</div>",
        figure: plane({ polys: [{ pts: [[2, 1], [4, 1], [2, 3]], color: "var(--u4)" }, { pts: [[2, -1], [4, -1], [2, -3]], color: "var(--u3)", dash: true }] })
      },
      {
        heading: "الدوران حول نقطة الأصل",
        body: "<p>لتحديد الدوران نحتاج: <b>مركز الدوران</b> (هنا نقطة الأصل)، و<b>زاوية الدوران</b>، و<b>اتجاهه</b> (مع اتجاه حركة عقارب الساعة أو عكسه).</p>" +
          "<table><tr><th>الدوران حول نقطة الأصل</th><th>القاعدة</th></tr>" +
          "<tr><td>[[90°]] عكس عقارب الساعة</td><td>[[(x, y) → (-y, x)]]</td></tr>" +
          "<tr><td>[[180°]] (أي اتجاه)</td><td>[[(x, y) → (-x, -y)]]</td></tr>" +
          "<tr><td>[[90°]] مع عقارب الساعة (أو [[270°]] عكسها)</td><td>[[(x, y) → (y, -x)]]</td></tr></table>" +
          "<p>في الشكل: المثلث [[A(1, 1), B(4, 1), C(1, 3)]] دار [[90°]] عكس عقارب الساعة فصار [[A'(-1, 1), B'(-1, 4), C'(-3, 1)]].</p>" +
          "<div class=\"rule\">[[270°]] عكس عقارب الساعة = [[90°]] مع عقارب الساعة، والدوران [[360°]] يعيد الشكل إلى مكانه.</div>",
        figure: plane({ polys: [{ pts: TRI, color: "var(--u4)", names: ["A", "B", "C"], off: [[-4, 16], [4, 14], [4, -4]] }, { pts: TRI.map(rot90), color: "var(--u3)", dash: true, names: ["A'", "B'", "C'"], off: [[4, 16], [4, -4], [-16, 16]] }] })
      },
      {
        heading: "التماثل الدوراني",
        body: "<p>يكون للشكل <b>تماثل دوراني</b> إذا انطبق على نفسه عند تدويره حول مركزه بزاوية أقل من [[360°]].</p>" +
          "<p><b>رتبة التماثل الدوراني</b> هي عدد المرات التي ينطبق فيها الشكل على نفسه خلال دورة كاملة. المربع رتبته 4 (ينطبق كل [[90°]])، والمثلث المتطابق الأضلاع رتبته 3.</p>" +
          "<div class=\"rule\">المضلع المنتظم الذي عدد أضلاعه n رتبة تماثله الدوراني n، وأصغر زاوية دوران تطابقه هي [[360° ÷ n]].</div>",
        figure: regShapes()
      }
    ],
    examples: [
      {
        q: "جد صورة النقطة [[A(3, 1)]] بدوران [[90°]] عكس اتجاه عقارب الساعة حول نقطة الأصل.",
        steps: ["القاعدة: [[(x, y) → (-y, x)]]", "[[(3, 1) → (-1, 3)]]"],
        answer: "الجواب: [[A'(-1, 3)]]"
      },
      {
        q: "جد صورة النقطة [[B(-2, 5)]] بدوران [[180°]] حول نقطة الأصل.",
        steps: ["القاعدة: [[(x, y) → (-x, -y)]]", "[[(-2, 5) → (2, -5)]]"],
        answer: "الجواب: [[B'(2, -5)]]"
      },
      {
        q: "دُوّر المثلث [[A(1, 1), B(4, 1), C(1, 3)]] بزاوية [[90°]] مع اتجاه عقارب الساعة حول نقطة الأصل. جد رؤوس الصورة.",
        figure: plane({ polys: [{ pts: TRI, color: "var(--u4)", names: ["A", "B", "C"], off: [[-4, 16], [4, 14], [4, -4]] }, { pts: TRI.map(rotCW), color: "var(--u5)", dash: true, names: ["A'", "B'", "C'"], off: [[-18, 4], [6, 4], [4, -6]] }] }),
        steps: ["القاعدة: [[(x, y) → (y, -x)]]", "[[A(1, 1) → A'(1, -1)]]", "[[B(4, 1) → B'(1, -4)]]", "[[C(1, 3) → C'(3, -1)]]"],
        answer: "الجواب: [[A'(1, -1), B'(1, -4), C'(3, -1)]]"
      },
      {
        q: "ما رتبة التماثل الدوراني للسداسي المنتظم؟ وما أصغر زاوية دوران تطابقه على نفسه؟",
        steps: ["السداسي المنتظم له 6 أضلاع، فينطبق على نفسه 6 مرات في الدورة الكاملة.", "أصغر زاوية: [[360° ÷ 6 = 60°]]"],
        answer: "الجواب: الرتبة 6، وأصغر زاوية [[60°]]."
      }
    ],
    tip: "حيلة فهمان: في دوران [[90°]] «بدّل وغيّر إشارة»: بدّل مكاني x و y، ثم غيّر إشارة الإحداثي الأول إذا كان الدوران عكس عقارب الساعة، أو الثاني إذا كان معها. وفي [[180°]] غيّر الإشارتين فقط. وتحقّق: [[90°]] عكس عقارب الساعة ينقل النقطة من الربع الأول إلى الربع الثاني.",
    joke: "ليش المروحة دايمًا مبسوطة؟ لأنها مهما دارت… بترجع لنفس شكلها، وما حدا بيقلّها «تغيّرتِ»!",
    problems: [
      { type: "choice", level: 1, q: "ما صورة النقطة [[(2, 5)]] بدوران [[180°]] حول نقطة الأصل؟", options: ["[[(-2, 5)]]", "[[(2, -5)]]", "[[(-2, -5)]]", "[[(5, 2)]]"], answer: 2, hint: "في دوران [[180°]] تتغيّر إشارتا الإحداثيين.", solution: "[[(x, y) → (-x, -y)]]: [[(2, 5) → (-2, -5)]]" },
      { type: "choice", level: 1, q: "ما صورة النقطة [[(4, 1)]] بدوران [[90°]] عكس اتجاه عقارب الساعة حول نقطة الأصل؟", options: ["[[(-1, 4)]]", "[[(1, -4)]]", "[[(-4, -1)]]", "[[(1, 4)]]"], answer: 0, hint: "القاعدة [[(x, y) → (-y, x)]].", solution: "[[(4, 1) → (-1, 4)]]" },
      { type: "choice", level: 1, q: "ما صورة النقطة [[(3, -2)]] بدوران [[90°]] مع اتجاه عقارب الساعة حول نقطة الأصل؟", options: ["[[(2, 3)]]", "[[(-3, 2)]]", "[[(-2, 3)]]", "[[(-2, -3)]]"], answer: 3, hint: "القاعدة [[(x, y) → (y, -x)]].", solution: "[[(3, -2) → (-2, -3)]]" },
      { type: "num", level: 1, q: "ما رتبة التماثل الدوراني للمربع؟", answer: 4, hint: "كم مرة ينطبق المربع على نفسه خلال دورة كاملة؟", solution: "ينطبق كل [[90°]]، أي 4 مرات، فالرتبة 4." },
      { type: "choice", level: 1, q: "ما صورة النقطة [[(3, 4)]] بالانعكاس في المحور x؟", options: ["[[(-3, 4)]]", "[[(3, -4)]]", "[[(-3, -4)]]", "[[(4, 3)]]"], answer: 1, hint: "في الانعكاس في المحور x تتغيّر إشارة y فقط.", solution: "[[(x, y) → (x, -y)]]: [[(3, 4) → (3, -4)]]" },
      { type: "choice", level: 2, q: "انسحبت النقطة [[(-1, 2)]] 4 وحدات إلى اليمين و 3 وحدات إلى أسفل. ما صورتها؟", options: ["[[(3, -1)]]", "[[(3, 5)]]", "[[(-5, -1)]]", "[[(-4, 6)]]"], answer: 0, hint: "أضف 4 إلى x واطرح 3 من y.", solution: "[[(-1 + 4, 2 - 3) = (3, -1)]]" },
      { type: "choice", level: 2, q: "دُوّرت النقطة P في الشكل بزاوية [[270°]] عكس اتجاه عقارب الساعة حول نقطة الأصل. ما صورتها؟", figure: plane({ pts: [{ x: 2, y: 3, t: "P" }] }), options: ["[[(-3, 2)]]", "[[(-2, -3)]]", "[[(3, 2)]]", "[[(3, -2)]]"], answer: 3, hint: "[[270°]] عكس عقارب الساعة = [[90°]] مع عقارب الساعة: [[(x, y) → (y, -x)]].", solution: "[[P(2, 3)]]، وصورتها [[(3, -2)]]." },
      { type: "num", level: 2, q: "ما أصغر زاوية دوران تجعل المثلث المتطابق الأضلاع ينطبق على نفسه؟", answer: 120, unit: "°", hint: "رتبة تماثله الدوراني 3.", solution: "[[360° ÷ 3 = 120°]]" },
      { type: "choice", level: 2, q: "أي الحروف الآتية له تماثل دوراني من الرتبة 2؟", options: ["A", "T", "L", "N"], answer: 3, hint: "تخيّل تدوير الحرف نصف دورة [[180°]].", solution: "الحرف N يبقى N بعد تدويره [[180°]]، فرتبة تماثله الدوراني 2. أما A و T و L فلا تنطبق على نفسها إلا بعد دورة كاملة." },
      { type: "choice", level: 2, q: "دُوّر المثلث ABC في الشكل بزاوية [[180°]] حول نقطة الأصل. ما صورة الرأس C؟", figure: plane({ polys: [{ pts: [[1, 2], [4, 2], [4, 4]], color: "var(--u4)", names: ["A", "B", "C"], off: [[-14, 4], [4, 16], [4, -4]] }] }), options: ["[[(4, -4)]]", "[[(-4, -4)]]", "[[(-4, 4)]]", "[[(4, 4)]]"], answer: 1, hint: "اقرأ إحداثيي C من الشكل، ثم غيّر الإشارتين.", solution: "[[C(4, 4)]]، وصورتها بدوران [[180°]]: [[C'(-4, -4)]]." },
      { type: "num", level: 3, q: "مروحة سقف لها 5 شفرات متطابقة موزّعة بانتظام. ما أصغر زاوية تدور بها المروحة لتبدو كما كانت تمامًا؟", answer: 72, unit: "°", hint: "رتبة التماثل الدوراني 5.", solution: "[[360° ÷ 5 = 72°]]" },
      { type: "choice", level: 3, q: "دُوّرت نقطة بزاوية [[90°]] عكس اتجاه عقارب الساعة حول نقطة الأصل، فكانت صورتها [[(-3, 5)]]. ما النقطة الأصلية؟", options: ["[[(3, -5)]]", "[[(5, 3)]]", "[[(-5, -3)]]", "[[(3, 5)]]"], answer: 1, hint: "ادعس على الفرامل وارجع: دوّر الصورة [[90°]] مع عقارب الساعة.", solution: "[[(x, y) → (-y, x) = (-3, 5)]]، إذن [[y = 3]] و [[x = 5]]، فالنقطة [[(5, 3)]]. تحقّق: [[(5, 3) → (-3, 5)]] ✔" },
      { type: "choice", level: 3, q: "دُوّرت النقطة [[(2, -3)]] بزاوية [[90°]] عكس عقارب الساعة، ثم دُوّرت صورتها [[180°]] حول نقطة الأصل. ما الصورة النهائية؟", options: ["[[(3, 2)]]", "[[(-2, 3)]]", "[[(-3, -2)]]", "[[(3, -2)]]"], answer: 2, hint: "طبّق الدورانين بالترتيب، أو لاحظ أن المجموع [[270°]] عكس عقارب الساعة.", solution: "[[90°]]: [[(2, -3) → (3, 2)]]، ثم [[180°]]: [[(3, 2) → (-3, -2)]]." },
      { type: "choice", level: 1, q: "الدوران [[90°]] مع اتجاه عقارب الساعة يعطي النتيجة نفسها التي يعطيها دوران عكس اتجاه عقارب الساعة بزاوية:", options: ["[[90°]]", "[[180°]]", "[[270°]]", "[[360°]]"], answer: 2, hint: "[[90° + ? = 360°]]", solution: "[[360° - 90° = 270°]]" }
    ],
    generators: [
      function () {
        var x, y;
        do { x = rnd(-6, 6); y = rnd(-6, 6); } while (!x || !y || Math.abs(x) === Math.abs(y));
        var kinds = [
          ["[[90°]] عكس اتجاه عقارب الساعة", [-y, x], "[[(x, y) → (-y, x)]]"],
          ["[[180°]]", [-x, -y], "[[(x, y) → (-x, -y)]]"],
          ["[[90°]] مع اتجاه عقارب الساعة", [y, -x], "[[(x, y) → (y, -x)]]"],
          ["[[270°]] عكس اتجاه عقارب الساعة", [y, -x], "[[(x, y) → (y, -x)]]"]
        ];
        var k = kinds[rnd(0, 3)];
        var opts = shuffle([[-y, x], [-x, -y], [y, -x], [-x, y]]);
        var ans = 0;
        opts.forEach(function (o, i) { if (o[0] === k[1][0] && o[1] === k[1][1]) ans = i; });
        return { type: "choice", level: 2, q: "ما صورة النقطة [[" + pstr([x, y]) + "]] بدوران " + k[0] + " حول نقطة الأصل؟",
          options: opts.map(function (o) { return "[[" + pstr(o) + "]]"; }), answer: ans,
          hint: "القاعدة: " + k[2],
          solution: k[2] + "، إذن [[" + pstr([x, y]) + " → " + pstr(k[1]) + "]]." };
      }
    ]
  };

  window.UNITS = window.UNITS || [];
  window.UNITS.push({
    id: 4,
    semester: 1,
    title: "الزوايا والمضلعات والتحويلات الهندسية",
    glyph: "∠",
    tagline: "زوايا بتلفّ، ومضلعات بتدور، وفهمان بيحسب!",
    intro: "يا هلا بالمهندسين الصغار! في هذه الوحدة سنكتشف أسرار الزوايا: التي تتقابل، والتي تتوازى، والتي تختبئ داخل المثلثات والمضلعات. وفي النهاية سندوّر الأشكال مثل دولاب الهواء… لكن من غير دوخة!",
    lessons: [L1, L2, L3, L4, L5]
  });
})();
