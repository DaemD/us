// Us — two stick figures walking one line through everything we did.
// No words anywhere: every memory is a small scene along the line, and the
// whole page is drawn from one scroll progress value p (0 → 1).

gsap.registerPlugin(ScrollTrigger);

/* ================================================================== */
/* helpers                                                             */
/* ================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const group = (parent, html = '', attrs = {}) => {
  const g = el('g', attrs, parent);
  if (html) g.innerHTML = html;
  return g;
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const pulse = (a, b, v) => Math.sin(Math.PI * clamp((v - a) / (b - a)));
const window01 = (a, b, v, f = 0.03) => smooth(a, a + f, v) * (1 - smooth(b - f, b, v));
const rad = (d) => (d * Math.PI) / 180;
const f1 = (n) => (+n).toFixed(1);
const o3 = (n) => clamp(+n).toFixed(3);
const put = (n, x, y, r = 0, s = 1) =>
  n.setAttribute('transform', `translate(${f1(x)} ${f1(y)})${r ? ` rotate(${f1(r)})` : ''}${s !== 1 ? ` scale(${(+s).toFixed(3)})` : ''}`);
const op = (n, v) => n.setAttribute('opacity', o3(v));
const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/* ================================================================== */
/* poses                                                               */
/* ================================================================== */

const LEN = { thigh: 12, shin: 12, upper: 10, fore: 10, torso: 20, head: 5.6, seat: 13 };

// angles in degrees from straight down; positive = towards the way they face
const pose = (lean, l1t, l1k, l2t, l2k, a1u, a1f, a2u, a2f, sit = 0) => ({
  lean,
  sit,
  legs: [{ t: l1t, k: l1k }, { t: l2t, k: l2k }],
  arms: [{ u: a1u, f: a1f }, { u: a2u, f: a2f }],
});
const mix = (a, b, t) => ({
  lean: lerp(a.lean, b.lean, t),
  sit: lerp(a.sit, b.sit, t),
  legs: a.legs.map((l, i) => ({ t: lerp(l.t, b.legs[i].t, t), k: lerp(l.k, b.legs[i].k, t) })),
  arms: a.arms.map((m, i) => ({ u: lerp(m.u, b.arms[i].u, t), f: lerp(m.f, b.arms[i].f, t) })),
});
const withArm = (p, i, u, f) => {
  const q = mix(p, p, 0);
  q.arms[i] = { u, f };
  return q;
};
const withLean = (p, lean) => ({ ...mix(p, p, 0), lean });

const STAND = pose(0, 4, 3, -4, 3, -6, 10, 8, 10);
const SIT = pose(2, 90, 90, 82, 84, 45, 40, 55, 40, 1);
const CHEER = pose(-4, 6, 4, -6, 4, 160, 15, 170, 10);
const POINT = withArm(STAND, 1, 112, 4);
const GIVE = withArm(STAND, 1, 78, 0);
const SAD = pose(12, 3, 2, -3, 2, -2, 4, 2, 4);
const PHONE_ARM = [118, 112];
const PHONE = withArm(STAND, 1, ...PHONE_ARM);
const SIT_PHONE = withArm(SIT, 1, ...PHONE_ARM);
const LIE = pose(0, 2, 0, -2, 0, 10, 10, 20, 10);
const LIE_PHONE = withArm(LIE, 1, ...PHONE_ARM);
const LIE_LAPTOP = withArm(withArm(LIE, 1, 50, 50), 0, 40, 60);
const STEER = pose(4, 90, 90, 82, 84, 68, -20, 72, -24, 1);
const HUG = pose(0, 4, 3, -4, 3, 55, 70, 62, 64);
const SLIP = pose(-26, 42, 0, 24, 12, -60, 0, 70, 30);

const walk = (ph) => {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  return pose(3, 24 * s, 8 + 24 * Math.max(0, c), -24 * s, 8 + 24 * Math.max(0, -c), -24 * s, 16, 24 * s, 16);
};
const eat = (k, base = SIT) => withArm(base, 1, lerp(55, 22, k), lerp(40, 150, k));
const type = (k) => withArm(withArm(SIT, 1, lerp(52, 60, k), 48), 0, lerp(60, 52, k), 44);
const paint = (k, base = SIT) => withArm(base, 1, lerp(68, 98, k), lerp(20, -4, k));
const wave = (k, base = STAND) => withArm(base, 1, 150, lerp(-25, 35, k));
const argue = (k) => pose(10, 8, 6, -8, 4, lerp(30, 95, k), 40, lerp(115, 55, k), 30);
const clap = (k) => pose(2, 90, 90, 82, 84, 62, lerp(55, 85, k), 62, lerp(85, 55, k), 1);
const bowlPose = (k) => {
  const HOLD = pose(14, 12, 20, -10, 18, -6, 12, 25, 60);
  const BACK = pose(26, 30, 34, -28, 10, -6, 12, -75, 0);
  const THROW = pose(32, 46, 58, -52, 6, -30, 10, 85, 0);
  return k < 0.55 ? mix(HOLD, BACK, ease(k / 0.55)) : mix(BACK, THROW, ease((k - 0.55) / 0.45));
};
const cyc = (t, n, off = 0) => (1 - Math.cos(t * Math.PI * 2 * n + off)) / 2;

const STR = 1 / 13;

/* ================================================================== */
/* the line                                                            */
/* ================================================================== */

const bump = (x, a, b, h) =>
  x <= a || x >= b ? 0 : (-h * (1 - Math.cos((2 * Math.PI * (x - a)) / (b - a)))) / 2;

const LAND = { hike: -1e6, drive: -1e6, driveLen: 0 };
const ground = (x) => {
  let y = bump(x, LAND.hike - 640, LAND.hike + 640, 340);
  const d0 = LAND.drive - LAND.driveLen / 2;
  if (LAND.driveLen && x > d0 && x < d0 + LAND.driveLen) {
    y += (-24 * (1 - Math.cos((2 * Math.PI * (x - d0)) / 350))) / 2;
  }
  return y;
};

/* ================================================================== */
/* stage + figures                                                     */
/* ================================================================== */

const svg = document.querySelector('.stage');
const world = el('g', {}, svg);
const L = { sky: el('g', {}, world) };
L.ground = el('path', { class: 'ground' }, world);
L.ghost = el('path', { class: 'thread-ghost' }, world);
L.thread = el('path', { class: 'thread' }, world);
L.back = el('g', {}, world);
L.figs = el('g', {}, world);
L.front = el('g', {}, world);

const makeFigure = (who) => {
  const g = el('g', { class: `fig fig--${who}` }, L.figs);
  const armFar = el('polyline', { class: 'far' }, g);
  const legFar = el('polyline', { class: 'far' }, g);
  const torso = el('line', {}, g);
  const legNear = el('polyline', {}, g);
  const armNear = el('polyline', {}, g);
  const head = el('circle', { r: LEN.head }, g);
  const hair = el('polyline', { class: 'hair' }, g);
  return { g, legs: [legFar, legNear], arms: [armFar, armNear], torso, head, hair, who };
};

const drawFigure = (fig, st) => {
  if (!st || (st.show ?? 1) <= 0.001) {
    fig.g.style.opacity = 0;
    return null;
  }
  const dir = st.dir || 1;
  const p = st.pose;
  const P = (o, a, len) => ({ x: o.x + Math.sin(rad(a)) * len * dir, y: o.y + Math.cos(rad(a)) * len });
  const hip = { x: 0, y: 0 };
  const neck = { x: Math.sin(rad(p.lean)) * LEN.torso * dir, y: -Math.cos(rad(p.lean)) * LEN.torso };
  const tilt = p.lean + (st.nod || 0);
  const headC = {
    x: neck.x + Math.sin(rad(tilt)) * (LEN.head + 2.6) * dir,
    y: neck.y - Math.cos(rad(tilt)) * (LEN.head + 2.6),
  };
  const shoulder = { x: neck.x * 0.86, y: neck.y * 0.86 };
  const legs = p.legs.map((l) => {
    const knee = P(hip, l.t, LEN.thigh);
    return [hip, knee, P(knee, l.t - l.k, LEN.shin)];
  });
  const arms = p.arms.map((a) => {
    const elbow = P(shoulder, a.u, LEN.upper);
    return [shoulder, elbow, P(elbow, a.u + a.f, LEN.fore)];
  });
  const b = -dir;
  const sway = st.sway || 0;
  const hair = [
    { x: headC.x + b * 4, y: headC.y - 3 },
    { x: headC.x + b * 9, y: headC.y + 1 },
    { x: headC.x + b * (10 + sway), y: headC.y + 8 },
  ];

  const lowest = Math.max(legs[0][2].y, legs[1][2].y);
  let ox;
  let oy;
  if (st.hip) {
    ox = st.hip.x;
    oy = st.hip.y;
  } else {
    const fl = st.floor ?? ground(st.x);
    ox = st.x;
    oy = fl + lerp(-lowest, -LEN.seat, p.sit) - (st.lift || 0);
  }
  const r = rad(st.rot || 0);
  const cr = Math.cos(r);
  const sr = Math.sin(r);
  const A = (q) => ({ x: q.x * cr - q.y * sr + ox, y: q.x * sr + q.y * cr + oy });
  const pts = (arr) => arr.map((q) => { const a = A(q); return `${f1(a.x)},${f1(a.y)}`; }).join(' ');

  fig.legs.forEach((n, i) => n.setAttribute('points', pts(legs[i])));
  fig.arms.forEach((n, i) => n.setAttribute('points', pts(arms[i])));
  const h0 = A(hip);
  const n0 = A(neck);
  fig.torso.setAttribute('x1', f1(h0.x));
  fig.torso.setAttribute('y1', f1(h0.y));
  fig.torso.setAttribute('x2', f1(n0.x));
  fig.torso.setAttribute('y2', f1(n0.y));
  const hc = A(headC);
  fig.head.setAttribute('cx', f1(hc.x));
  fig.head.setAttribute('cy', f1(hc.y));
  const withHair = fig.who === 'her' || st.hair;
  fig.hair.setAttribute('points', withHair ? pts(hair) : '');
  // inline style, so it wins over the stylesheet; everyone else stays faint
  fig.g.style.opacity = o3((st.show ?? 1) * (fig.who === 'other' ? 0.28 : 1));
  return { hand: A(arms[1][2]), handFar: A(arms[0][2]), head: hc, neck: n0, hip: h0, dir, x: h0.x };
};

const tether = [el('path', { class: 'tether' }, L.figs), el('path', { class: 'tether' }, L.figs)];

const ME = makeFigure('me');
const HER = makeFigure('her');
const EXTRAS = Array.from({ length: 10 }, () => makeFigure('other'));
// others are drawn behind the two of us
EXTRAS.forEach((f) => L.figs.insertBefore(f.g, L.figs.firstChild));

/* ================================================================== */
/* little drawings                                                     */
/* ================================================================== */

const D = {
  table: (x, w = 44, h = 26) =>
    `<path class="prop" d="M${x - w / 2} ${-h} H${x + w / 2} M${x} ${-h} V0 M${x - 8} 0 H${x + 8}"/>`,
  longTable: (x0, x1, h = 26) =>
    `<path class="prop" d="M${x0} ${-h} H${x1} M${x0 + 10} ${-h} V0 M${x1 - 10} ${-h} V0"/>`,
  chair: (x, dir) =>
    `<path class="prop faint" d="M${x - 7} -13 H${x + 7} M${x - 7 * dir} -13 V-34 M${x - 5} -13 V0 M${x + 5} -13 V0"/>`,
  lamp: (x, top, y) =>
    `<path class="prop prop-soft" d="M${x} ${top} V${y - 10}"/>` +
    `<path class="prop" d="M${x - 11} ${y} Q${x} ${y - 16} ${x + 11} ${y} Z"/>` +
    `<path class="halo" d="M${x - 9} ${y + 2} L${x - 32} ${y + 58} M${x + 9} ${y + 2} L${x + 32} ${y + 58} M${x - 3} ${y + 4} L${x - 10} ${y + 56} M${x + 3} ${y + 4} L${x + 10} ${y + 56}"/>`,
  laptop: (x, y, dir) => `<path class="prop" d="M${x} ${y} h${16 * dir} l${4 * dir} -12"/>`,
  bed: (x, headDir) => {
    const h = x + 38 * headDir;
    return `<path class="prop" d="M${x - 38} -12 H${x + 38} V-18 H${x - 38} Z M${x - 36} -12 V0 M${x + 36} -12 V0 M${h} -12 V-36"/>` +
      `<ellipse class="prop" cx="${x + 27 * headDir}" cy="-21" rx="7" ry="3"/>`;
  },
  room: (x0, x1, h = 130) => `<path class="prop faint" d="M${x0} 0 V${-h} H${x1} V0"/>`,
  window: (x, y, w, h) =>
    `<path class="prop prop-soft" d="M${x - w / 2} ${y - h / 2} h${w} v${h} h${-w} Z M${x} ${y - h / 2} v${h} M${x - w / 2} ${y} h${w}"/>`,
  moon: (x, y, r) =>
    `<path class="prop paper" d="M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${r * 0.78} ${r * 0.78} 0 1 1 ${x} ${y - r} Z"/>`,
  sun: (r = 18) => {
    let s = `<circle class="prop paper" cx="0" cy="0" r="${r}"/>`;
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      s += `<line class="prop" x1="${f1(Math.cos(a) * (r + 6))}" y1="${f1(Math.sin(a) * (r + 6))}" x2="${f1(Math.cos(a) * (r + 12))}" y2="${f1(Math.sin(a) * (r + 12))}"/>`;
    }
    return s;
  },
  tree: (x, y, h) =>
    `<path class="prop prop-soft" d="M${f1(x)} ${f1(y)} V${f1(y - h * 0.28)}"/>` +
    `<path class="prop" d="M${f1(x - h * 0.28)} ${f1(y - h * 0.28)} L${f1(x)} ${f1(y - h)} L${f1(x + h * 0.28)} ${f1(y - h * 0.28)} Z"/>`,
  palm: (x, h = 90) =>
    `<path class="prop" d="M${x} 0 C${x + 4} ${-h * 0.4} ${x - 6} ${-h * 0.7} ${x + 2} ${-h}"/>` +
    `<path class="prop" d="M${x + 2} ${-h} q-20 -6 -34 10 M${x + 2} ${-h} q20 -8 34 8 M${x + 2} ${-h} q-8 -16 -26 -14 M${x + 2} ${-h} q10 -16 28 -12 M${x + 2} ${-h} q2 -12 -2 -22"/>`,
  building: (x0, x1, top, cols = 3, rows = 5, skip = []) => {
    let s = `<path class="prop" d="M${x0} 0 V${top} H${x1} V0"/>`;
    const w = (x1 - x0) / cols;
    const h = -top / (rows + 0.6);
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        if (skip.includes(`${c},${r}`)) continue;
        const wx = x0 + c * w + w * 0.28;
        const wy = top + h * 0.5 + r * h;
        s += `<rect class="prop prop-soft" x="${f1(wx)}" y="${f1(wy)}" width="${f1(w * 0.44)}" height="${f1(h * 0.5)}"/>`;
      }
    }
    return s;
  },
  gift: (w, h) =>
    `<rect class="prop paper" x="${-w / 2}" y="${-h}" width="${w}" height="${h}"/>` +
    `<path class="prop" d="M0 0 V${-h} M${-w / 2} ${-h * 0.55} H${w / 2} M0 ${-h} q-6 -7 -8 -1 q4 3 8 1 q6 -7 8 -1 q-4 3 -8 1"/>`,
  balloon: (r = 7, string = 34) =>
    `<ellipse class="prop paper" cx="0" cy="${-string - r}" rx="${r * 0.85}" ry="${r}"/>` +
    `<path class="prop prop-soft" d="M0 ${-string} q-4 ${string * 0.35} 2 ${string * 0.6} q4 ${string * 0.25} -2 ${string * 0.4}"/>`,
  bouquet: (s = 1) => {
    const flowers = [[-6, -22], [0, -27], [6, -22], [-3, -17], [4, -16], [-9, -15], [9, -14]];
    let out = `<path class="prop" d="M0 0 L${-7 * s} ${-12 * s} M0 0 L${7 * s} ${-12 * s} M0 0 V${-14 * s}"/>`;
    out += `<path class="prop paper" d="M${-3 * s} ${-2 * s} L${-10 * s} ${-14 * s} L${10 * s} ${-14 * s} L${3 * s} ${-2 * s} Z"/>`;
    flowers.forEach(([fx, fy]) => {
      out += `<circle class="prop paper" cx="${f1(fx * s)}" cy="${f1(fy * s)}" r="${f1(3.4 * s)}"/><circle class="fill" cx="${f1(fx * s)}" cy="${f1(fy * s)}" r="${f1(1 * s)}"/>`;
    });
    return out;
  },
  cloud: (x, y, w) =>
    `<path class="prop paper" d="M${x - w / 2} ${y} q${-w * 0.08} ${-w * 0.22} ${w * 0.16} ${-w * 0.2} q${w * 0.08} ${-w * 0.3} ${w * 0.34} ${-w * 0.16} q${w * 0.2} ${-w * 0.2} ${w * 0.36} ${w * 0.08} q${w * 0.18} ${w * 0.04} ${w * 0.12} ${w * 0.28} Z"/>`,
  sign: (x, y, text, w) =>
    `<rect class="prop paper" x="${x - w / 2}" y="${y - 10}" width="${w}" height="20" rx="2"/>` +
    `<text class="sign" x="${x}" y="${y + 3.6}" text-anchor="middle">${text}</text>`,
  note: () =>
    `<ellipse class="fill" cx="0" cy="0" rx="3" ry="2.2" transform="rotate(-20)"/><path class="prop" d="M2.6 -0.6 V-12 q4 2 5 6"/>`,
  phone: () => `<rect class="fill" x="-1.6" y="-4" width="3.2" height="8" rx="1"/>`,
  ring: () => `<path class="prop" d="M-6 -6 a8 8 0 0 0 0 12 M6 -6 a8 8 0 0 1 0 12 M-10 -9 a13 13 0 0 0 0 18 M10 -9 a13 13 0 0 1 0 18"/>`,
  bag: () => `<path class="prop paper" d="M-4 0 L-5 -10 L-3 -11 L-1 -10 L1 -11 L3 -10 L5 -11 L4 0 Z"/>`,
  glass: () => `<path class="prop paper" d="M-3 0 L-4 -10 L4 -10 L3 0 Z"/><path class="prop prop-soft" d="M-3.6 -6 H3.6 M1 -10 L4 -15"/>`,
  burst: (r1, r2, n = 8) => {
    let s = '';
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      s += `<line class="prop" x1="${f1(Math.cos(a) * r1)}" y1="${f1(Math.sin(a) * r1)}" x2="${f1(Math.cos(a) * r2)}" y2="${f1(Math.sin(a) * r2)}"/>`;
    }
    return s;
  },
  rain: (x0, x1, y0, n, seed) => {
    const rnd = seeded(seed);
    let s = '';
    for (let i = 0; i < n; i += 1) {
      const x = lerp(x0, x1, rnd());
      const y = y0 + rnd() * 60;
      s += `<line class="rain" style="--delay:${f1(-rnd() * 0.7)}s" x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - 2)}" y2="${f1(y + 9)}"/>`;
    }
    return s;
  },
};

// a small speech bubble: a rounded box with a tail pointing down at whoever is speaking
const makeBubble = (parent) => {
  const g = el('g', { opacity: 0 }, parent);
  const box = el('path', { class: 'bubble' }, g);
  const text = el('text', { class: 'bubble-text', 'text-anchor': 'middle' }, g);
  return { g, box, text, last: '' };
};
const setBubble = (b, x, y, str, show) => {
  if (!show || show < 0.02 || !str) return op(b.g, 0);
  if (b.last !== str) {
    b.text.textContent = str;
    b.last = str;
  }
  const w = str.length * 4.6 + 14;
  const h = 15;
  const l = -w / 2;
  const top = -h - 5;
  b.box.setAttribute('d', `M${l + 4} ${top} H${-l - 4} Q${-l} ${top} ${-l} ${top + 4} V${top + h - 4} Q${-l} ${top + h} ${-l - 4} ${top + h} H4 L0 0 L-4 ${top + h} H${l + 4} Q${l} ${top + h} ${l} ${top + h - 4} V${top + 4} Q${l} ${top} ${l + 4} ${top} Z`);
  b.text.setAttribute('x', 0);
  b.text.setAttribute('y', f1(top + h / 2 + 3));
  put(b.g, x, y);
  op(b.g, show);
};
// who is talking, and what they say, as a call goes on: alternates between us
const callTalk = (t, a, b, lines) => {
  if (t < a || t > b) return null;
  const k = (t - a) / (b - a);
  const n = lines.length;
  const i = Math.min(n - 1, Math.floor(k * n));
  const local = k * n - i;
  return { line: lines[i], who: i % 2, show: smooth(0.05, 0.2, local) * (1 - smooth(0.8, 0.95, local)) };
};
const showCallBubble = (b, c, talk, lift = 26) => {
  if (!talk || !c.active || !c.me || !c.her) return op(b.g, 0);
  const f = talk.who === 0 ? c.me : c.her;
  setBubble(b, f.head.x, f.head.y - lift, talk.line, talk.show);
};

// a path that draws itself (it needs pathLength="1")
const draw = (n, k) => n.setAttribute('stroke-dashoffset', o3(1 - k));

// two phones and the line between them while we talk
function phoneLink(r, c, on, t) {
  if (!on || !c.me || !c.her) {
    op(r.link, 0);
    r.phones.forEach((p) => op(p, 0));
    return;
  }
  const a = c.me.hand;
  const b = c.her.hand;
  put(r.phones[0], a.x, a.y);
  put(r.phones[1], b.x, b.y);
  r.phones.forEach((p) => op(p, 1));
  const n = 40;
  let d = '';
  for (let i = 0; i <= n; i += 1) {
    const k = i / n;
    const x = lerp(a.x, b.x, k);
    const y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 40 + Math.sin(k * 30 - t * 260) * 3 * Math.sin(k * Math.PI);
    d += `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`;
  }
  r.link.setAttribute('d', d);
  op(r.link, 1);
}

const nightSky = (A, g, seed) => {
  const rnd = seeded(seed);
  let s = '';
  for (let i = 0; i < 16; i += 1) s += `<circle class="fill" cx="${f1(A - 260 + rnd() * 520)}" cy="${f1(-90 - rnd() * 200)}" r="${f1(0.8 + rnd())}"/>`;
  return group(g.sky, s);
};

/* ================================================================== */
/* the scenes, in order                                                */
/* ================================================================== */

const SCENES = [];
const scene = (s) => SCENES.push(s);
// sit down at the start of a scene, stand up again near its end
const seated = (t, P, a = 0.12, b = 0.88, d = 0.12) => mix(STAND, P, smooth(0, a, t) * (1 - smooth(b, b + d, t)));
const at = (x, dir, p, extra = {}) => ({ x, dir, pose: p, ...extra });
const lying = (t) => smooth(0.04, 0.12, t) * (1 - smooth(0.88, 0.96, t)) > 0.5;
const blink = (t) => 1 - pulse(0.03, 0.13, t) * 0.8 - pulse(0.87, 0.97, t) * 0.8;

// 0. before: two strangers on the same line, far apart
scene({
  len: 360,
  w: 0.8,
  view: { w: 560, h: 240 },
  act: (t, A) => ({ me: at(A - 130, 1, STAND), her: at(A + 130, 1, STAND) }),
});

// 1. internship: a group around one long table
scene({
  slow: [[0.56, 0.84, 1.8]],
  len: 640,
  w: 1.5,
  view: { w: 640, h: 300, dy: -70 },
  build(A, g) {
    let s = D.longTable(A - 175, A + 175);
    s += `<path class="prop prop-soft" d="M${A - 95} -95 H${A + 95} V-175 H${A - 95} Z"/>`;
    [[-82, -165], [-66, -160], [-82, -146], [52, -168], [68, -162], [60, -146]].forEach(([x, y]) => {
      s += `<rect class="prop prop-soft" x="${A + x}" y="${y}" width="11" height="11"/>`;
    });
    [[-155, 1], [-100, -1], [-35, 1], [35, -1], [100, 1], [155, -1]].forEach(([x, d]) => {
      s += D.chair(A + x, d) + D.laptop(A + x + 14 * d, -26, d);
    });
    group(g.back, s);
    const chart = el('path', {
      class: 'draw', pathLength: 1,
      d: `M${A - 40} -110 L${A - 22} -126 L${A - 6} -118 L${A + 12} -142 L${A + 34} -150`,
    }, g.back);
    return { chart };
  },
  act(t, A) {
    const typing = (o) => seated(t, type(cyc(t, 9, o)));
    const stand = smooth(0.34, 0.4, t) * (1 - smooth(0.62, 0.68, t));
    return {
      me: at(A - 155, 1, t > 0.58 && t < 0.74 ? seated(t, wave(cyc(t, 5), SIT)) : typing(0)),
      her: at(A + 155, -1, t > 0.66 && t < 0.82 ? seated(t, wave(cyc(t, 5, 1), SIT)) : typing(2)),
      extras: [
        at(A - 100, -1, typing(1)),
        at(A - 35, 1, mix(typing(3), POINT, stand)),
        at(A + 35, -1, typing(4), { hair: true }),
        at(A + 100, 1, typing(5)),
      ],
    };
  },
  update(t, r) {
    draw(r.chart, smooth(0.38, 0.62, t));
  },
});

// 2. university: she's with a friend, I give her the chips I was eating
scene({
  slow: [[0.5, 0.74, 2.6]],
  len: 560,
  w: 1.4,
  view: { w: 560, h: 280, dy: -70 },
  build(A, g) {
    let s = `<path class="prop prop-soft" d="M${A - 100} -170 L${A + 60} -205 L${A + 220} -170 Z M${A - 100} -170 H${A + 220}"/>`;
    for (let i = 0; i < 6; i += 1) s += `<path class="prop prop-soft" d="M${A - 80 + i * 56} -170 V-12"/>`;
    s += `<path class="prop prop-soft" d="M${A - 110} -12 H${A + 230} M${A - 120} -6 H${A + 240}"/>`;
    s += D.tree(A - 200, 0, 60) + D.tree(A + 290, 0, 52);
    group(g.back, s);
    const bag = group(g.front, D.bag());
    return { bag };
  },
  act(t, A) {
    let me;
    if (t < 0.3) me = at(A - 170, 1, eat(cyc(t, 6), STAND));
    else if (t < 0.5) {
      const x = lerp(A - 170, A + 16, smooth(0.3, 0.5, t));
      me = at(x, 1, mix(walk(x * STR), STAND, smooth(0.46, 0.5, t)));
    } else if (t < 0.86) me = at(A + 16, 1, mix(STAND, GIVE, window01(0.5, 0.7, t, 0.04)));
    else {
      const x = lerp(A + 16, A - 50, smooth(0.86, 0.98, t));
      me = at(x, t > 0.98 ? 1 : -1, mix(walk(x * STR), STAND, smooth(0.96, 1, t)));
    }
    const take = window01(0.6, 0.72, t, 0.04);
    const herPose = t < 0.72 ? mix(STAND, GIVE, take) : mix(STAND, eat(cyc(t, 4), STAND), window01(0.72, 0.9, t));
    return {
      me,
      her: at(A + 62, t > 0.97 ? 1 : -1, herPose),
      extras: [at(A + 98, -1, mix(STAND, wave(cyc(t, 6)), window01(0.52, 0.66, t)), { hair: true })],
    };
  },
  update(t, r, c) {
    if (!c.active || !c.me || !c.her) return op(r.bag, 0);
    const k = smooth(0.62, 0.68, t);
    put(r.bag, lerp(c.me.hand.x, c.her.hand.x, k), lerp(c.me.hand.y, c.her.hand.y, k) + 6);
    op(r.bag, 1 - smooth(0.9, 0.96, t));
  },
});

// 3. online meetings: four of us on a call
scene({
  slow: [[0.08, 0.92, 2.6]], // slow enough to read what we're saying
  len: 800,
  w: 1.3,
  view: { w: 820, h: 340, dy: -110 },
  build(A, g) {
    let s = D.room(A - 350, A - 190) + D.room(A + 190, A + 350);
    s += D.table(A - 250, 40) + D.chair(A - 288, 1) + D.laptop(A - 262, -26, 1);
    s += D.table(A + 250, 40) + D.chair(A + 288, -1) + D.laptop(A + 262, -26, -1);
    s += `<rect class="prop" x="${A - 82}" y="-240" width="164" height="104" rx="6"/>`;
    s += `<path class="halo" d="M${A - 242} -38 L${A - 82} -140 M${A + 242} -38 L${A + 82} -140"/>`;
    group(g.back, s);
    const tiles = [
      [-76, -232, true, false], [4, -232, false, false], [-76, -184, false, false], [4, -184, true, true],
    ].map(([x, y, us, hair]) => {
      const tg = group(g.back, `
        <rect class="prop ${us ? 'tile-us' : 'prop-soft'}" x="${A + x}" y="${y}" width="72" height="42" rx="3"/>
        <circle class="${us ? 'fill' : 'fill faint'}" cx="${A + x + 36}" cy="${y + 17}" r="6"/>
        <path class="prop ${us ? '' : 'faint'}" d="M${A + x + 24} ${y + 38} q12 -14 24 0"/>
        ${hair ? `<path class="prop" d="M${A + x + 41} ${y + 13} q6 3 4 12"/>` : ''}`);
      return tg.querySelector('rect');
    });
    const tileAt = [[-40, -232], [40, -232], [-40, -184], [40, -184]];
    const bubble = makeBubble(g.front);
    return { tiles, tileAt, bubble, A };
  },
  act(t, A) {
    const talk = (o) => seated(t, withArm(SIT, 1, lerp(50, 80, cyc(t, 5, o)), 50));
    return { me: at(A - 288, 1, talk(0)), her: at(A + 288, -1, talk(2)) };
  },
  update(t, r, c) {
    const who = Math.floor(t * 9) % 4;
    r.tiles.forEach((tile, i) => tile.classList.toggle('speaking', i === who && t > 0.08 && t < 0.92));
    // whoever is speaking says something
    const LINES = [
      ["I'll push the code tonight", 'can you send me the link?', 'okay, I can do that part'],
      ['we need to build this by Friday', 'who is doing the slides?', 'same time tomorrow?'],
      ["let's divide the work", 'did anyone test it?', 'I have to go in ten'],
      ["let's prepare for the hackathon", 'I can do the design', "that's actually a good idea"],
    ];
    const round = Math.floor(Math.floor(t * 9) / 4);
    const local = (t * 9) % 1;
    const line = LINES[who][round % LINES[who].length];
    const [tx, ty] = r.tileAt[who];
    setBubble(r.bubble, r.A + tx, ty - 6, line, t > 0.08 && t < 0.92 ? smooth(0.05, 0.2, local) * (1 - smooth(0.82, 0.97, local)) : 0);
  },
});

// 4. Happify: painting at one long table — the two of us side by side, the other two together
const FRONT = pose(0, 0, 0, 0, 0, -22, 18, 22, 18);
const brush = (k) => withArm(FRONT, 1, lerp(38, 70, k), lerp(50, 15, k));
scene({
  len: 600,
  w: 1.4,
  view: { w: 500, h: 290, dy: -80 },
  build(A, g) {
    let s = D.lamp(A - 58, -240, -132) + D.lamp(A + 58, -240, -132);
    s += D.sign(A, -186, 'HAPPIFY', 90);
    s += `<path class="prop prop-soft" d="M${A + 220} 0 l-6 -18 h20 l-6 18 Z M${A + 224} -18 q-10 -16 -2 -30 M${A + 224} -18 q10 -14 6 -26"/>`;
    group(g.back, s);
    group(g.front, `<rect class="prop paper" x="${A - 130}" y="-26" width="260" height="26"/><path class="prop prop-soft" d="M${A - 130} -20 H${A + 130}"/>`);
    const canvases = [[A - 62, false], [A - 24, false], [A + 54, true], [A + 92, true]].map(([x, faint]) => {
      const cg = group(g.front, `<path class="prop ${faint ? 'faint' : ''}" d="M${x - 6} -26 L${x - 3} -34 M${x + 6} -26 L${x + 3} -34"/><rect class="prop paper ${faint ? 'faint' : ''}" x="${x - 8}" y="-46" width="16" height="13"/>`);
      const d = faint ? `M${x - 5} -38 q3 -5 5 -1 q3 3 5 -3` : `M${x - 5} -37 q2 -6 5 -4 q3 2 5 -4 M${x - 4} -42 h3`;
      return el('path', { class: `draw ${faint ? 'faint' : ''}`, pathLength: 1, d }, cg);
    });
    return { canvases };
  },
  act(t, A) {
    const k = smooth(0, 0.12, t) * (1 - smooth(0.88, 1, t));
    const sitAt = (x, o, extra = {}) => at(x, 1, mix(STAND, brush(cyc(t, 7, o)), k), extra);
    return {
      me: sitAt(A - 76, 0),
      her: sitAt(A - 38, 1.5),
      extras: [sitAt(A + 40, 3), sitAt(A + 78, 4.5, { hair: true })],
    };
  },
  update(t, r) {
    r.canvases.forEach((c, i) => draw(c, smooth(0.15 + i * 0.03, 0.8, t)));
  },
});

// 5. late calls, just the two of us — me lying on my bed with the laptop
scene({
  slow: [[0.08, 0.92, 2.6]], // slow enough to read what we're saying
  len: 740,
  w: 1.4,
  view: { w: 760, h: 340, dy: -110 },
  build(A, g) {
    let s = D.room(A - 330, A - 140, 140) + D.room(A + 140, A + 330, 140);
    s += D.bed(A - 240, 1);
    s += D.table(A + 210, 40) + D.chair(A + 250, -1) + D.laptop(A + 224, -26, -1);
    s += `<path class="prop" d="M${A - 222} -28 h-15 l-4 -12"/>`;
    s += D.window(A - 240, -95, 40, 32) + D.moon(A - 246, -97, 8);
    s += `<rect class="prop" x="${A - 46}" y="-190" width="92" height="40" rx="5"/>`;
    s += `<circle class="fill" cx="${A - 22}" cy="-174" r="5"/><path class="prop" d="M${A - 32} -153 q10 -12 20 0"/>`;
    s += `<circle class="fill" cx="${A + 22}" cy="-174" r="5"/><path class="prop" d="M${A + 12} -153 q10 -12 20 0"/><path class="prop" d="M${A + 26} -178 q5 3 3 10"/>`;
    s += `<path class="halo" d="M${A - 214} -30 Q${A - 120} -120 ${A - 46} -160 M${A + 222} -40 Q${A + 120} -120 ${A + 46} -160"/>`;
    s += `<circle class="prop" cx="${A}" cy="-245" r="15"/>`;
    group(g.back, s);
    const hour = el('line', { class: 'prop', x1: A, y1: -245, x2: A, y2: -253 }, g.back);
    const min = el('line', { class: 'prop', x1: A, y1: -245, x2: A, y2: -257 }, g.back);
    const bubble = makeBubble(g.front);
    return { hour, min, A, bubble };
  },
  act(t, A) {
    const me = lying(t)
      ? at(A - 238, -1, LIE_LAPTOP, { hip: { x: A - 238, y: -23 }, rot: 90 })
      : at(A - 238, 1, STAND);
    return {
      me: { ...me, show: blink(t) },
      her: at(A + 250, -1, seated(t, withArm(type(cyc(t, 6)), 1, lerp(60, 110, cyc(t, 3)), 60))),
    };
  },
  update(t, r, c) {
    showCallBubble(r.bubble, c, callTalk(t, 0.16, 0.86, [
      'how was your day?', 'long. how was yours?',
      'what did you do today?', 'nothing much, tell me yours',
      'are you sleepy?', 'no, keep talking',
    ]), 24);
    r.min.setAttribute('transform', `rotate(${f1(t * 360 * 5)} ${r.A} -245)`);
    r.hour.setAttribute('transform', `rotate(${f1(t * 200)} ${r.A} -245)`);
  },
});

// 6. our first time out: a café, and I spilled orange juice on myself
scene({
  slow: [[0.4, 0.8, 3.6]],
  len: 480,
  w: 1.5,
  view: { w: 460, h: 260, dy: -70 },
  build(A, g) {
    let s = `<path class="prop" d="M${A - 100} -160 H${A + 100}"/>`;
    for (let i = 0; i < 10; i += 1) {
      const x = A - 100 + i * 20;
      s += `<path class="prop ${i % 2 ? 'prop-soft' : ''}" d="M${x} -160 V-140 q10 10 20 0 V-160"/>`;
    }
    s += `<path class="prop prop-soft" d="M${A - 100} -160 V0 M${A + 100} -160 V0"/>`;
    s += D.sign(A, -178, 'BENEDICTION', 110);
    s += D.window(A, -100, 90, 44);
    s += D.table(A, 40) + D.chair(A - 40, 1) + D.chair(A + 40, -1);
    s += `<ellipse class="prop" cx="${A - 13}" cy="-27" rx="5" ry="1.6"/><ellipse class="prop" cx="${A + 13}" cy="-27" rx="5" ry="1.6"/>`;
    group(g.back, s);
    const herGlass = group(g.back, D.glass());
    put(herGlass, A + 6, -26);
    const glass = group(g.front, D.glass());
    const drops = [0, 1, 2, 3, 4, 5, 6, 7].map(() => el('circle', { class: 'fill', r: 1.5 }, g.front));
    const stains = [0, 1, 2].map(() => el('circle', { class: 'fill', r: 1.6 }, g.front));
    return { glass, drops, stains, A };
  },
  act(t, A) {
    const bites = (o) => eat(cyc(t, 3, o));
    let mePose = seated(t, t < 0.38 ? bites(0) : SIT);
    if (t > 0.4 && t < 0.56) mePose = seated(t, mix(SIT, eat(1), smooth(0.42, 0.5, t)));
    if (t >= 0.56 && t < 0.74) mePose = seated(t, mix(eat(1), pose(-16, 90, 90, 82, 84, 120, 30, 140, 20, 1), pulse(0.56, 0.74, t)));
    if (t >= 0.74 && t < 0.86) mePose = seated(t, withArm(withLean(SIT, 12), 1, 20, lerp(60, 90, cyc(t, 8))));
    const laugh = window01(0.6, 0.9, t);
    const herPose = seated(t, t < 0.38 ? bites(2) : mix(SIT, withArm(eat(1), 0, 30, 70), laugh));
    return {
      me: at(A - 40, 1, mePose),
      her: at(A + 40, -1, herPose, { lift: laugh * Math.abs(Math.sin(t * 90)) * 1.5 }),
    };
  },
  update(t, r, c) {
    const A = r.A;
    if (!c.active || !c.me) {
      put(r.glass, A - 6, -26);
      r.drops.concat(r.stains).forEach((d) => op(d, 0));
      return;
    }
    const inHand = smooth(0.42, 0.47, t) * (1 - smooth(0.76, 0.82, t));
    const hx = lerp(A - 6, c.me.hand.x + 2, inHand);
    const hy = lerp(-26, c.me.hand.y + 6, inHand);
    const tilt = -lerp(0, 40, smooth(0.48, 0.54, t)) * (1 - smooth(0.6, 0.66, t)) - 70 * pulse(0.54, 0.62, t);
    put(r.glass, hx, hy, tilt);
    const torso = (k, off) => ({
      x: lerp(c.me.hip.x, c.me.neck.x, k) + 2.5 + off,
      y: lerp(c.me.hip.y, c.me.neck.y, k),
    });
    r.drops.forEach((d, i) => {
      const k = smooth(0.55 + i * 0.008, 0.63 + i * 0.008, t);
      const to = torso(0.25 + (i % 5) * 0.12, (i % 3) * 1.5);
      d.setAttribute('cx', f1(lerp(hx, to.x, k)));
      d.setAttribute('cy', f1(lerp(hy - 10, to.y, k) - Math.sin(k * Math.PI) * 8));
      op(d, k > 0 && k < 1 ? 1 : 0);
    });
    r.stains.forEach((s, i) => {
      const p = torso(0.3 + i * 0.22, (i - 1) * 1.5);
      s.setAttribute('cx', f1(p.x));
      s.setAttribute('cy', f1(p.y));
      op(s, smooth(0.62, 0.66, t) * (1 - smooth(0.9, 0.97, t)));
    });
  },
});

// 7. calls on the phone at night, until the morning
scene({
  slow: [[0.08, 0.92, 2.6]], // slow enough to read what we're saying
  len: 680,
  w: 1.4,
  view: { w: 700, h: 330, dy: -100 },
  build(A, g) {
    group(g.back, D.bed(A - 180, 1) + D.bed(A + 180, -1));
    const stars = nightSky(A, g, 7);
    const moon = group(g.sky, D.moon(0, 0, 16));
    const sun = group(g.sky, D.sun(18));
    const link = el('path', { class: 'wave' }, g.back);
    const phones = [group(g.front, D.phone()), group(g.front, D.phone())];
    const bubble = makeBubble(g.front);
    return { stars, moon, sun, link, phones, A, bubble };
  },
  act(t, A) {
    const f = blink(t);
    return lying(t)
      ? {
        me: at(A - 178, -1, LIE_PHONE, { hip: { x: A - 178, y: -23 }, rot: 90, show: f }),
        her: at(A + 178, 1, LIE_PHONE, { hip: { x: A + 178, y: -23 }, rot: -90, show: f }),
      }
      : { me: at(A - 178, 1, STAND, { show: f }), her: at(A + 178, 1, STAND, { show: f }) };
  },
  update(t, r, c) {
    const A = r.A;
    put(r.moon, A, lerp(-240, -40, smooth(0.1, 0.62, t)));
    op(r.moon, 1 - smooth(0.5, 0.62, t));
    op(r.stars, 1 - smooth(0.3, 0.6, t));
    put(r.sun, A, lerp(-20, -220, smooth(0.6, 0.95, t)));
    op(r.sun, smooth(0.58, 0.66, t));
    phoneLink(r, c, c.active && t > 0.12 && t < 0.88, t);
    showCallBubble(r.bubble, c, callTalk(t, 0.14, 0.86, [
      'are you still awake?', 'yeah, I can\'t sleep',
      'what did you eat today?', 'guess',
      'it\'s 4am already', 'five more minutes',
      'the sun is coming up', 'okay, goodnight. or morning',
    ]), 22);
  },
});

// 8. Coco Cubano: so much food
scene({
  len: 520,
  w: 1.2,
  view: { w: 520, h: 280, dy: -70 },
  build(A, g) {
    let s = D.palm(A - 170, 110) + D.palm(A + 175, 96);
    s += `<path class="prop prop-soft" d="M${A - 168} -110 Q${A} -60 ${A + 177} -96"/>`;
    for (let i = 1; i < 9; i += 1) {
      const k = i / 9;
      const x = lerp(A - 168, A + 177, k);
      const y = (1 - k) * (1 - k) * -110 + 2 * (1 - k) * k * -60 + k * k * -96;
      s += `<circle class="prop paper" cx="${f1(x)}" cy="${f1(y + 4)}" r="2.6"/>`;
    }
    s += `<path class="prop" d="M${A - 112} 0 V-62"/>` + D.sign(A - 112, -72, 'COCO CUBANO', 104);
    s += D.longTable(A - 34, A + 34) + D.chair(A - 46, 1) + D.chair(A + 46, -1);
    s += `<path class="prop" d="M${A - 26} -27 a8 6 0 0 1 16 0 Z M${A - 18} -33 v-2"/>`;
    s += `<path class="prop" d="M${A - 6} -27 h12 M${A - 5} -29.5 h10 M${A - 4} -32 h8"/>`;
    s += `<path class="prop" d="M${A + 9} -27 q6 6 12 0 Z M${A + 24} -27 v-9 h5 v9 Z"/>`;
    group(g.back, s);
    return {};
  },
  act(t, A) {
    const full = smooth(0.74, 0.8, t);
    const p = (o) => mix(eat(cyc(t, 5, o)), withArm(withLean(SIT, -10), 1, 15, 75), full);
    return { me: at(A - 46, 1, seated(t, p(0))), her: at(A + 46, -1, seated(t, p(2))) };
  },
});

// 9. bowling: I bowl, then she bowls, and I cheer for her
scene({
  slow: [[0.05, 0.46, 2], [0.54, 0.96, 2]],
  len: 820,
  w: 1.7,
  view: { w: 680, h: 260, dx: 60, dy: -60 },
  build(A, g) {
    const L0 = A - 140;
    const P0 = A + 300;
    let s = `<path class="prop prop-soft" d="M${L0} 7 H${P0 + 60} M${P0 + 60} 7 V-44"/>`;
    s += `<path class="prop" d="M${L0} -6 V8"/>`;
    s += `<path class="prop prop-soft" d="M${A - 10} 4 l5 -4 l5 4 M${A + 20} 4 l5 -4 l5 4 M${A + 50} 4 l5 -4 l5 4"/>`;
    s += `<path class="prop" d="M${A - 300} -24 H${A - 262} M${A - 298} -24 V0 M${A - 264} -24 V0"/><circle class="fill" cx="${A - 291}" cy="-30" r="5"/><circle class="fill" cx="${A - 280}" cy="-30" r="5"/>`;
    group(g.back, s);
    const PIN_D = 'M-2.6 0 C-4 -6 -1 -8.5 -1.5 -11.5 C-2 -15 2 -15 1.5 -11.5 C1 -8.5 4 -6 2.6 0 Z';
    const pins = [
      { x: P0 + 10, s: 0.82, o: 0.55, mine: false },
      { x: P0 + 24, s: 0.82, o: 0.55, mine: true },
      { x: P0 - 4, s: 1, o: 1, mine: false },
      { x: P0 + 16, s: 1.02, o: 0.95, mine: true },
      { x: P0 + 32, s: 1.06, o: 1, mine: false },
    ].map((pin) => ({ ...pin, n: el('path', { class: 'pin', d: PIN_D, opacity: pin.o }, g.back) }));
    const burst = group(g.back, D.burst(16, 26, 10));
    const ball = el('circle', { class: 'ball', r: 5.5 }, g.front);
    return { pins, burst, ball, L0, P0 };
  },
  act(t, A) {
    const L0 = A - 140;
    if (t < 0.4) {
      return {
        me: at(lerp(L0 - 22, L0 - 8, smooth(0.04, 0.2, t)), 1, mix(STAND, bowlPose(smooth(0.06, 0.22, t)), smooth(0, 0.05, t) * (1 - smooth(0.32, 0.4, t)))),
        her: at(L0 - 75, 1, mix(STAND, wave(cyc(t, 3)), window01(0.24, 0.38, t))),
      };
    }
    if (t < 0.52) {
      const k = smooth(0.4, 0.52, t);
      const mx = lerp(L0 - 8, L0 - 82, k);
      const hx = lerp(L0 - 75, L0 - 22, k);
      return {
        me: at(mx, k < 0.98 ? -1 : 1, mix(walk(mx * STR), STAND, smooth(0.5, 0.52, t))),
        her: at(hx, 1, mix(walk(hx * STR + 1.4), STAND, smooth(0.5, 0.52, t))),
      };
    }
    const cheer = smooth(0.86, 0.9, t);
    return {
      her: at(lerp(L0 - 22, L0 - 8, smooth(0.54, 0.7, t)), 1, mix(mix(STAND, bowlPose(smooth(0.56, 0.72, t)), smooth(0.52, 0.56, t)), CHEER, cheer), {
        lift: Math.abs(Math.sin((t - 0.86) * Math.PI * 7)) * 5 * cheer,
      }),
      me: at(lerp(L0 - 82, L0 - 46, smooth(0.86, 0.94, t)), 1, mix(STAND, CHEER, cheer), {
        lift: Math.abs(Math.sin((t - 0.86) * Math.PI * 8)) * 9 * cheer,
      }),
    };
  },
  update(t, r, c) {
    const { pins, burst, ball, L0, P0 } = r;
    pins.forEach((pin, i) => {
      const k = pin.mine ? smooth(0.37 + i * 0.01, 0.44 + i * 0.01, t) : smooth(0.83 + i * 0.008, 0.9 + i * 0.008, t);
      const gone = pin.mine ? 1 - smooth(0.5, 0.54, t) : 1;
      put(pin.n, pin.x + k * (8 + i * 5), 0, k * (64 + i * 9), pin.s);
      pin.n.setAttribute('opacity', o3(pin.o * (pin.mine && k > 0 ? gone : 1)));
    });
    op(burst, pulse(0.85, 0.98, t));
    put(burst, P0 + 14, -12);
    if (!c.active || !c.me || !c.her) return op(ball, 0);
    let x;
    let y;
    let show = 1;
    if (t < 0.22) { x = c.me.hand.x + 2; y = c.me.hand.y + 3; show = smooth(0, 0.04, t); }
    else if (t < 0.42) { x = lerp(L0 + 4, P0 - 8, smooth(0.22, 0.4, t)); y = -5.5; show = 1 - smooth(0.4, 0.44, t); }
    else if (t < 0.72) { x = c.her.hand.x + 2; y = c.her.hand.y + 3; show = smooth(0.52, 0.56, t); }
    else { x = lerp(L0 + 4, P0 - 8, smooth(0.72, 0.86, t)); y = -5.5; show = 1 - smooth(0.92, 0.98, t); }
    ball.setAttribute('cx', f1(x));
    ball.setAttribute('cy', f1(y));
    op(ball, show);
  },
});

// 10. a snowy mountain: up with sticks, down holding hands
scene({
  slow: [[0.42, 0.56, 1.6], [0.62, 0.9, 2.2]],
  len: 1360,
  w: 2.6,
  hike: true,
  build(A, g) {
    const rnd = seeded(11);
    let flakes = '';
    for (let i = 0; i < 90; i += 1) {
      const x = A - 760 + rnd() * 1520;
      const y = -540 + rnd() * 520;
      flakes += `<circle class="snow" style="--d:${f1(3 + rnd() * 3)}s;--delay:${f1(-rnd() * 6)}s" cx="${f1(x)}" cy="${f1(y)}" r="${f1(1 + rnd() * 1.4)}"/>`;
    }
    group(g.sky, flakes);
    const sun = group(g.sky, D.sun(20));
    let s = '';
    for (let i = 0; i < 70; i += 1) {
      const x = A - 600 + rnd() * 1200;
      s += `<circle class="fill faint" cx="${f1(x)}" cy="${f1(ground(x) - 1.5)}" r="${f1(0.8 + rnd() * 1.2)}"/>`;
    }
    [-560, -500, -420, 380, 460, 540].forEach((dx, i) => { s += D.tree(A + dx, ground(A + dx), 30 + (i % 3) * 8); });
    s += `<path class="prop" d="M${A} ${f1(ground(A))} V${f1(ground(A) - 38)}"/><path class="flag" d="M${A} ${f1(ground(A) - 38)} l15 5 l-15 5 Z"/>`;
    group(g.back, s);
    const sticks = [el('line', { class: 'prop' }, g.front), el('line', { class: 'prop' }, g.front)];
    const hands = el('circle', { class: 'fill', r: 2.2 }, g.front);
    return { sun, sticks, hands, A };
  },
  act(t, A) {
    const slope = (x) => (ground(x + 6) - ground(x - 6)) / 12;
    if (t < 0.42) {
      const hx = lerp(A - 600, A + 14, ease(t / 0.42));
      const mx = hx - 52;
      const go = smooth(0, 0.03, t) * (1 - smooth(0.39, 0.42, t));
      const climb = (x, off) => withLean(withArm(mix(STAND, walk(x * STR * 1.3 + off), go), 1, 30 + 10 * Math.sin(x * STR * 1.3 + off) * go, 6), 6 - slope(x) * 18 * go);
      return { me: at(mx, 1, climb(mx, 0)), her: at(hx, 1, climb(hx, 1.4)) };
    }
    if (t < 0.56) {
      return {
        me: at(A - 38, 1, withArm(STAND, 1, 30, 6)),
        her: at(A + 14, 1, mix(withArm(STAND, 1, 30, 6), POINT, window01(0.46, 0.54, t))),
      };
    }
    const k = ease(smooth(0.56, 1, t));
    const mx = lerp(A - 38, A + 600, k);
    const hx = mx - 30;
    const go = smooth(0.56, 0.6, t) * (1 - smooth(0.96, 1, t));
    const slipH = pulse(0.66, 0.72, t) + pulse(0.82, 0.88, t);
    const slipM = pulse(0.75, 0.8, t) * 0.7;
    const down = (x, off) => withLean(mix(STAND, walk(x * STR + off), go), -6 * go);
    const meP = withArm(mix(down(mx, 0), SLIP, slipM), 0, -50 * go, 0);
    const herP = withArm(mix(down(hx, 1.4), SLIP, slipH), 1, 52 * go, 0);
    return {
      me: at(mx, 1, mix(meP, STAND, smooth(0.96, 1, t))),
      her: at(hx, 1, mix(herP, STAND, smooth(0.96, 1, t)), { lift: -2 * slipH }),
      holding: go,
    };
  },
  cam(t, A, s) {
    const mid = (s.me.x + s.her.x) / 2;
    const top = window01(0.36, 0.62, t, 0.08);
    return { x: mid + top * 120, y: ground(mid) - 50 - top * 70, w: lerp(620, 900, top), h: lerp(300, 460, top) };
  },
  update(t, r, c) {
    put(r.sun, r.A + 300, lerp(-260, -470, smooth(0.42, 0.6, t)));
    op(r.sun, smooth(0.42, 0.5, t));
    const showSticks = c.active && t < 0.56;
    [c.me, c.her].forEach((f, i) => {
      const st = r.sticks[i];
      if (!showSticks || !f) return op(st, 0);
      const gx = f.hand.x + 7;
      st.setAttribute('x1', f1(f.hand.x));
      st.setAttribute('y1', f1(f.hand.y - 4));
      st.setAttribute('x2', f1(gx));
      st.setAttribute('y2', f1(ground(gx)));
      op(st, 1);
    });
    if (c.active && c.me && c.her && c.state.holding > 0.5) {
      r.hands.setAttribute('cx', f1((c.me.handFar.x + c.her.hand.x) / 2));
      r.hands.setAttribute('cy', f1((c.me.handFar.y + c.her.hand.y) / 2));
      op(r.hands, 1);
    } else op(r.hands, 0);
  },
});

// 11. every night on the phone again: night, morning, night, morning…
scene({
  slow: [[0.08, 0.92, 2.6]], // slow enough to read what we're saying
  len: 660,
  w: 1.3,
  view: { w: 640, h: 360, dy: -120 },
  build(A, g) {
    group(g.back, D.bed(A - 150, 1) + D.bed(A + 150, -1));
    group(g.sky, `<circle class="halo" cx="${A}" cy="-120" r="120"/>`);
    const sun = group(g.sky, D.sun(14));
    const moon = group(g.sky, D.moon(0, 0, 13));
    const link = el('path', { class: 'wave' }, g.back);
    const phones = [group(g.front, D.phone()), group(g.front, D.phone())];
    const bubble = makeBubble(g.front);
    return { sun, moon, link, phones, A, bubble };
  },
  act(t, A) {
    const f = blink(t);
    return lying(t)
      ? {
        me: at(A - 148, -1, LIE_PHONE, { hip: { x: A - 148, y: -23 }, rot: 90, show: f }),
        her: at(A + 148, 1, LIE_PHONE, { hip: { x: A + 148, y: -23 }, rot: -90, show: f }),
      }
      : { me: at(A - 148, 1, STAND, { show: f }), her: at(A + 148, 1, STAND, { show: f }) };
  },
  update(t, r, c) {
    const a = Math.PI / 2 + t * Math.PI * 2 * 3;
    put(r.moon, r.A + Math.cos(a) * 120, -120 - Math.sin(a) * 120);
    put(r.sun, r.A - Math.cos(a) * 120, -120 + Math.sin(a) * 120);
    phoneLink(r, c, c.active && t > 0.12 && t < 0.88, t);
    showCallBubble(r.bubble, c, callTalk(t, 0.14, 0.86, [
      'how was your day?', 'tiring. yours?',
      'what are you doing tomorrow?', 'nothing yet, why?',
      'did you eat?', 'yes, did you?',
    ]), 22);
  },
});

// 12. the hackathon: a bus there together, then presenting
scene({
  len: 1340,
  w: 2.3,
  build(A, g) {
    let s = '';
    [70, 112, 154, 196].forEach((dx) => { s += D.chair(A + dx, 1); });
    s += `<rect class="prop" x="${A + 330}" y="-118" width="96" height="70"/><path class="prop prop-soft" d="M${A + 360} -48 L${A + 350} 0 M${A + 396} -48 L${A + 406} 0"/>`;
    group(g.back, s);
    const bars = [0, 1, 2].map((i) => el('rect', { class: 'fill faint', x: A + 346 + i * 22, width: 14, y: -56, height: 0 }, g.back));
    const line = el('path', { class: 'draw', pathLength: 1, d: `M${A + 342} -78 L${A + 362} -92 L${A + 384} -86 L${A + 410} -108` }, g.back);
    const bus = group(g.front, `
      <rect class="prop paper" x="-64" y="-34" width="128" height="26" rx="4"/>
      <path class="prop" d="M-64 -34 V-64 Q-64 -70 -58 -70 H54 Q64 -70 64 -60 V-34"/>
      <path class="prop prop-soft" d="M-40 -66 V-36 M-14 -66 V-36 M12 -66 V-36 M38 -66 V-36"/>`);
    const wheels = [-38, 40].map(() => group(bus, `<circle class="prop paper" cx="0" cy="0" r="8"/><path class="prop" d="M-8 0 H8 M0 -8 V8"/>`));
    return { bars, line, bus, wheels, A };
  },
  act(t, A) {
    const bx = lerp(A - 560, A - 150, ease(smooth(0.08, 0.38, t)));
    if (t <= 0.06) {
      const f = 1 - smooth(0.02, 0.06, t);
      return { me: at(A - 590, 1, STAND, { show: f }), her: at(A - 554, 1, STAND, { show: f }), bx };
    }
    if (t < 0.42) {
      const f = smooth(0.06, 0.09, t) * (1 - smooth(0.38, 0.42, t));
      return {
        me: at(bx + 2, 1, SIT, { floor: -11, show: f }),
        her: at(bx + 24, 1, SIT, { floor: -11, show: f }),
        extras: [at(bx - 26, 1, SIT, { floor: -11, show: f }), at(bx + 48, 1, SIT, { floor: -11, show: f, hair: true })],
        bx,
      };
    }
    const aShow = smooth(0.42, 0.5, t);
    const audience = [70, 112, 154, 196].map((dx, i) => at(A + dx, 1, mix(SIT, clap(cyc(t, 12, i)), window01(0.86, 0.99, t)), { hair: i % 2 === 1, show: aShow }));
    const out = smooth(0.42, 0.46, t);
    const walkK = smooth(0.48, 0.58, t);
    const mx = lerp(A - 140, A + 266, walkK);
    const hx = lerp(A - 106, A + 300, walkK);
    const moving = walkK > 0 && walkK < 1;
    const present = window01(0.6, 0.96, t);
    const herTurn = t > 0.62 && t < 0.74;
    const herP = herTurn ? POINT : withArm(STAND, 1, lerp(40, 90, cyc(t, 6, 1)), 30);
    const meP = withArm(STAND, 1, lerp(40, 95, cyc(t, 6)), 30);
    const bow = pulse(0.9, 0.97, t);
    return {
      me: at(mx, moving || t > 0.98 ? 1 : -1, moving ? walk(mx * STR) : withLean(mix(STAND, meP, present), bow * 30), { show: out }),
      her: at(hx, moving || herTurn || t > 0.98 ? 1 : -1, moving ? walk(hx * STR + 1.4) : withLean(mix(STAND, herP, present), bow * 30), { show: out }),
      extras: audience,
      bx,
    };
  },
  cam(t, A, s) {
    const k = smooth(0.44, 0.58, t);
    return { x: lerp(s.bx, A + 230, k), y: -60, w: lerp(560, 660, k), h: 280 };
  },
  update(t, r) {
    const bx = lerp(r.A - 560, r.A - 150, ease(smooth(0.08, 0.38, t)));
    put(r.bus, bx, 0);
    op(r.bus, smooth(0, 0.05, t) * (1 - smooth(0.42, 0.5, t)));
    r.wheels.forEach((w, i) => put(w, i ? 40 : -38, -8, bx * 4));
    r.bars.forEach((b, i) => {
      const h = smooth(0.62 + i * 0.05, 0.75 + i * 0.05, t) * (16 + i * 12);
      b.setAttribute('y', f1(-56 - h));
      b.setAttribute('height', f1(h));
    });
    draw(r.line, smooth(0.66, 0.86, t));
  },
});

// 13. Dot: painting one canvas together, just the two of us
scene({
  len: 480,
  w: 1.4,
  view: { w: 460, h: 280, dy: -70 },
  build(A, g) {
    let s = D.lamp(A + 10, -240, -130);
    s += D.sign(A - 90, -150, 'DOT', 56);
    s += `<rect class="prop paper" x="${A + 36}" y="-96" width="70" height="56"/>`;
    s += `<path class="prop" d="M${A + 50} -40 L${A + 42} 0 M${A + 92} -40 L${A + 100} 0 M${A + 71} -40 V0 M${A + 36} -40 H${A + 106}"/>`;
    s += `<path class="prop prop-soft" d="M${A - 160} 0 l-6 -18 h20 l-6 18 Z M${A - 156} -18 q-10 -16 -2 -30 M${A - 156} -18 q10 -14 6 -26"/>`;
    group(g.back, s);
    const parts = [
      `M${A + 40} -50 Q${A + 58} -58 ${A + 74} -50 T${A + 102} -52`,
      `M${A + 90} -86 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0`,
      `M${A + 71.0} -83.0 L${A + 75.4} -72.1 L${A + 87.2} -71.3 L${A + 78.1} -63.7 L${A + 81.0} -52.2 L${A + 71.0} -58.5 L${A + 61.0} -52.2 L${A + 63.9} -63.7 L${A + 54.8} -71.3 L${A + 66.6} -72.1 Z`,
      `M${A + 67} -69 v1 M${A + 75} -69 v1`,
      `M${A + 66} -63 q5 4 10 0`,
    ].map((d) => el('path', { class: 'draw', pathLength: 1, d }, g.back));
    const palette = group(g.front, `<path class="prop paper" d="M-7 0 q0 -6 7 -6 q8 0 8 5 q0 4 -5 3 q-3 0 -3 3 q-2 2 -7 -5 Z"/><circle class="fill" cx="-2" cy="-3" r="1"/><circle class="fill" cx="2" cy="-4" r="1"/>`);
    return { parts, palette };
  },
  act(t, A) {
    const on = window01(0.06, 0.94, t);
    const mePaint = window01(0.5, 0.7, t);
    const meP = withArm(mix(withArm(STAND, 1, 20, 20), paint(cyc(t, 4), STAND), mePaint), 0, 50, 40);
    return {
      me: at(A - 24, 1, mix(STAND, meP, on)),
      her: at(A + 12, 1, mix(STAND, paint(cyc(t, 8), STAND), on)),
    };
  },
  update(t, r, c) {
    r.parts.forEach((p, i) => draw(p, smooth(0.1 + i * 0.14, 0.3 + i * 0.14, t)));
    if (!c.active || !c.me) return op(r.palette, 0);
    put(r.palette, c.me.handFar.x, c.me.handFar.y);
    op(r.palette, smooth(0.04, 0.08, t) * (1 - smooth(0.92, 0.96, t)));
  },
});

// 13b. a rickshaw ride through the city, taking selfies
const rickX = (t, A) => lerp(A - 520, A + 520, ease(smooth(0.06, 0.94, t)));
const SELFIES = [[0.22, 0.36], [0.44, 0.58], [0.66, 0.8]];
scene({
  len: 1240,
  w: 2.1,
  slow: [[0.2, 0.82, 1.5]],
  build(A, g) {
    const rnd = seeded(83);
    let s = '';
    for (let x = A - 600; x < A + 620; x += 230) s += `<path class="prop prop-soft" d="M${x} 0 V-74 h12"/>`;
    for (let i = 0; i < 6; i += 1) {
      const x = A - 560 + i * 210 + rnd() * 40;
      const w = 50 + rnd() * 30;
      const h = 60 + rnd() * 40;
      s += `<path class="prop faint" d="M${f1(x)} 0 V${f1(-h)} H${f1(x + w)} V0 M${f1(x - 4)} ${f1(-h + 22)} H${f1(x + w + 4)} l-6 8 H${f1(x + 2)} Z"/>`;
      s += `<rect class="prop faint" x="${f1(x + w * 0.3)}" y="-30" width="${f1(w * 0.4)}" height="30"/>`;
    }
    group(g.back, s);
    const rick = group(g.front, `
      <path class="prop paper" d="M-50 -10 V-31 H10 L26 -17 V-10 Z"/>
      <path class="prop" d="M-54 -31 Q-55 -70 -34 -72 H18 Q26 -70 26 -42 L26 -17"/>
      <path class="prop prop-soft" d="M-50 -66 H22 M-2 -72 V-31"/>`);
    const wheels = [-34, 16].map((x) => ({ w: group(rick, `<circle class="prop paper" cx="0" cy="0" r="7"/><path class="prop" d="M-7 0 H7 M0 -7 V7"/>`), x }));
    const phone = group(g.front, D.phone());
    const flash = group(g.front, D.burst(5, 11, 8));
    return { rick, wheels, phone, flash, A };
  },
  act(t, A) {
    const rx = rickX(t, A);
    if (t <= 0.05 || t >= 0.95) {
      const edge = t <= 0.05 ? A - 520 : A + 520;
      const f = t <= 0.05 ? 1 - smooth(0.02, 0.05, t) : smooth(0.95, 0.98, t);
      return { me: at(edge - 30, 1, STAND, { show: f }), her: at(edge - 4, 1, STAND, { show: f }), rx };
    }
    const f = smooth(0.05, 0.08, t) * (1 - smooth(0.92, 0.95, t));
    const bounce = Math.abs(Math.sin(t * 140)) * 1.2;
    const selfie = Math.max(...SELFIES.map(([a, b]) => window01(a, b, t, 0.03)));
    const floor = -11 - bounce;
    // she holds the phone up and out; we lean in together
    const herP = withLean(withArm(SIT, 1, lerp(55, 150, selfie), lerp(40, -25, selfie)), lerp(2, -10, selfie));
    const meP = withLean(withArm(SIT, 0, lerp(45, 70, selfie), lerp(40, 60, selfie)), lerp(2, 12, selfie));
    return {
      me: at(rx - 36, 1, meP, { floor, show: f }),
      her: at(rx - 15, 1, herP, { floor, show: f }),
      extras: [at(rx + 8, 1, STEER, { floor: -11 - bounce, show: f })],
      rx,
      selfie,
    };
  },
  cam(t, A, s) {
    return { x: s.rx + 20, y: -60, w: 560, h: 280 };
  },
  update(t, r, c) {
    const rx = rickX(t, r.A);
    put(r.rick, rx, -Math.abs(Math.sin(t * 140)) * 1.2);
    r.wheels.forEach(({ w, x }) => put(w, x, -7, rx * 4));
    if (!c.active || !c.her) {
      op(r.phone, 0);
      op(r.flash, 0);
      return;
    }
    const sel = c.state.selfie || 0;
    put(r.phone, c.her.hand.x, c.her.hand.y, 90);
    op(r.phone, smooth(0.2, 0.5, sel));
    // a little flash in the middle of each selfie
    const snap = Math.max(...SELFIES.map(([a, b]) => pulse((a + b) / 2 - 0.015, (a + b) / 2 + 0.015, t)));
    put(r.flash, c.her.hand.x, c.her.hand.y);
    op(r.flash, snap);
  },
});

// 14. Costa: she's working, I walk in out of nowhere, she jumps, we sit and eat. Then her interview.
const carY14 = (t) => lerp(0, -280, ease(smooth(0.8, 0.92, t))) * (1 - smooth(0.94, 0.985, t));
scene({
  len: 1000,
  w: 2.4,
  slow: [[0.22, 0.42, 3], [0.74, 0.82, 1.8]],
  build(A, g) {
    let s = `<path class="prop" d="M${A - 430} -40 H${A - 330} M${A - 430} -40 V0 M${A - 330} -40 V0"/>`;
    s += `<rect class="prop" x="${A - 420}" y="-66" width="22" height="26"/><path class="prop" d="M${A - 409} -48 v4 M${A - 390} -46 h8 v6 h-8 Z"/>`;
    s += D.sign(A - 380, -110, 'COSTA', 76);
    s += `<rect class="prop prop-soft" x="${A - 500}" y="-64" width="26" height="64"/>`;
    s += D.lamp(A - 200, -240, -130);
    s += D.table(A - 200, 40) + D.chair(A - 236, 1) + D.chair(A - 164, -1) + D.laptop(A - 222, -26, 1);
    s += D.building(A + 190, A + 340, -360, 3, 7, ['0,6', '0,5', '0,4', '0,3', '0,2', '0,1', '0,0']);
    s += `<path class="prop prop-soft" d="M${A + 197} 0 V-340 M${A + 235} 0 V-340"/>`;
    group(g.back, s);
    const food = group(g.back, `<path class="prop" d="M${A - 211} -26 h-6 v-6 h6 Z M${A - 211} -31 q3 1 0 4"/><path class="prop" d="M${A - 186} -26 h7 v-7 h-7 Z"/><ellipse class="prop" cx="${A - 198}" cy="-27" rx="6" ry="1.6"/><path class="prop" d="M${A - 202} -29 q4 -5 8 0"/>`);
    const startle = group(g.front, D.burst(9, 15, 9));
    const car = group(g.front, `<rect class="prop" x="-17" y="-52" width="34" height="52"/><path class="prop" d="M0 -52 V-58"/>`);
    const doors = [el('line', { class: 'prop', y1: 0, y2: -50 }, g.front), el('line', { class: 'prop', y1: 0, y2: -50 }, g.front)];
    return { food, startle, car, doors, A };
  },
  act(t, A) {
    if (t < 0.62) {
      // her: sitting and working, then the jump when I'm suddenly right there
      const herSit = smooth(0, 0.06, t) * (1 - smooth(0.58, 0.62, t));
      const jump = pulse(0.29, 0.37, t);
      const chat = (o) => withArm(SIT, 1, lerp(45, 95, cyc(t, 6, o)), 40);
      const herWork = t < 0.3
        ? type(cyc(t, 12))
        : t < 0.44 ? mix(SIT, pose(-18, 90, 90, 82, 84, 125, 40, 140, 30, 1), jump) : mix(eat(cyc(t, 3, 2)), chat(2), 0.3);
      const her = at(A - 236, t > 0.3 && t < 0.4 ? -1 : 1, mix(STAND, herWork, herSit), { lift: jump * 7 });
      // me: in through the door, right up behind her, then round to my seat
      let me;
      if (t < 0.08) me = at(A - 490, 1, STAND, { show: 0 });
      else if (t < 0.26) {
        const x = lerp(A - 490, A - 266, smooth(0.08, 0.26, t));
        me = at(x, 1, mix(walk(x * STR), STAND, smooth(0.24, 0.26, t)), { show: smooth(0.08, 0.11, t) });
      } else if (t < 0.36) me = at(A - 266, 1, mix(STAND, GIVE, window01(0.26, 0.34, t, 0.02)));
      else if (t < 0.44) {
        const x = lerp(A - 266, A - 164, smooth(0.36, 0.44, t));
        me = at(x, t > 0.43 ? -1 : 1, mix(walk(x * STR), STAND, smooth(0.42, 0.44, t)));
      } else {
        me = at(A - 164, -1, mix(STAND, t < 0.52 ? eat(cyc(t, 4)) : chat(0), smooth(0.44, 0.48, t) * (1 - smooth(0.58, 0.62, t))));
      }
      return { her, me };
    }
    const k = smooth(0.62, 0.74, t);
    const hx = lerp(A - 236, A + 216, k);
    const mk = smooth(0.62, 0.72, t);
    const mx = lerp(A - 164, A + 170, mk);
    const waving = window01(0.8, 0.94, t);
    const herP = k > 0 && k < 1 ? walk(hx * STR + 1.4) : mix(STAND, wave(cyc(t, 10, 1)), waving);
    return {
      her: at(hx, t > 0.75 && t < 0.985 ? -1 : 1, herP, { floor: carY14(t) }),
      me: at(mx, 1, mk > 0 && mk < 1 ? walk(mx * STR) : mix(STAND, wave(cyc(t, 10)), waving)),
    };
  },
  cam(t, A) {
    const k = smooth(0.6, 0.74, t);
    const up = smooth(0.8, 0.9, t) * (1 - smooth(0.94, 0.985, t));
    return { x: lerp(A - 300, A + 160, k), y: lerp(-70, -170, up), w: lerp(520, 560, k), h: lerp(280, 470, up) };
  },
  update(t, r, c) {
    op(r.food, smooth(0.44, 0.48, t) * (1 - smooth(0.6, 0.64, t)));
    if (c.active && c.her) {
      put(r.startle, c.her.head.x, c.her.head.y);
      op(r.startle, pulse(0.29, 0.37, t));
    } else op(r.startle, 0);
    const cy = carY14(t);
    put(r.car, r.A + 216, cy);
    const shut = smooth(0.76, 0.79, t) * (1 - smooth(0.98, 1, t));
    r.doors.forEach((d, i) => {
      const x = r.A + 216 + (i ? 1 : -1) * lerp(16, 1, shut);
      d.setAttribute('x1', f1(x));
      d.setAttribute('x2', f1(x));
      d.setAttribute('transform', `translate(0 ${f1(cy)})`);
    });
  },
});

// 15. both at work: I'd go up to the terrace to call her
scene({
  len: 780,
  w: 1.4,
  view: { w: 680, h: 360, dy: -120 },
  build(A, g) {
    let city = '';
    const rnd = seeded(31);
    for (let i = 0; i < 9; i += 1) {
      const x = A - 380 + i * 90 + rnd() * 30;
      const h = 60 + rnd() * 90;
      city += `<rect class="prop faint" x="${f1(x)}" y="${f1(-h)}" width="${f1(36 + rnd() * 30)}" height="${f1(h)}"/>`;
    }
    group(g.back, city);
    let s = `<rect class="paper" x="${A - 250}" y="-170" width="140" height="170"/>` + D.building(A - 250, A - 110, -170, 3, 5);
    s += `<path class="prop" d="M${A - 250} -182 H${A - 110} M${A - 250} -170 V-182 M${A - 215} -170 V-182 M${A - 180} -170 V-182 M${A - 145} -170 V-182 M${A - 110} -170 V-182"/>`;
    s += `<rect class="prop paper" x="${A - 190}" y="-24" width="18" height="24"/>`;
    s += `<rect class="paper" x="${A + 110}" y="-220" width="160" height="220"/>` + D.building(A + 110, A + 270, -220, 3, 6, ['1,2', '1,3']);
    s += `<rect class="prop paper" x="${A + 150}" y="-128" width="64" height="46"/>`;
    s += `<path class="prop prop-soft" d="M${A + 156} -95 h20 M${A + 160} -95 v13"/>`;
    s += `<rect class="prop paper" x="${A + 176}" y="-24" width="18" height="24"/>`;
    s += D.cloud(A - 40, -250, 70) + D.cloud(A + 220, -280, 50);
    group(g.back, s);
    const link = el('path', { class: 'wave' }, g.back);
    const phones = [group(g.front, D.phone()), group(g.front, D.phone())];
    return { link, phones };
  },
  act(t, A) {
    const inside = smooth(0.06, 0.1, t) * (1 - smooth(0.9, 0.94, t)) > 0.5;
    const f = 1 - pulse(0.03, 0.13, t) * 0.95 - pulse(0.87, 0.97, t) * 0.95;
    if (!inside) return { me: at(A - 181, 1, STAND, { show: f }), her: at(A + 185, 1, STAND, { show: f }) };
    const px = A - 180 + Math.sin(t * Math.PI * 4) * 34;
    const dx = Math.cos(t * Math.PI * 4);
    return {
      me: at(px, dx >= 0 ? 1 : -1, withArm(mix(STAND, walk(px * STR), 0.6), 1, ...PHONE_ARM), { floor: -170, show: f }),
      her: at(A + 196, -1, SIT_PHONE, { floor: -82, show: f }),
    };
  },
  update(t, r, c) {
    phoneLink(r, c, c.active && t > 0.12 && t < 0.88, t);
  },
});

// 16. my birthday: she brought flowers and so many gifts
scene({
  slow: [[0.36, 0.7, 2.2]],
  len: 520,
  w: 1.6,
  view: { w: 480, h: 280, dy: -70 },
  build(A, g) {
    let s = D.table(A, 44) + D.chair(A - 40, 1) + D.chair(A + 40, -1);
    s += `<rect class="prop paper" x="${A - 9}" y="-36" width="18" height="10"/><path class="prop" d="M${A} -36 v-5"/>`;
    group(g.back, s);
    group(g.back, `<ellipse class="flame" cx="${A}" cy="-43.5" rx="1.4" ry="2.6"/>`);
    [[-58, 0, 38], [-50, 0.6, 46], [-66, 1.1, 32]].forEach(([dx, d, len]) => {
      const holder = el('g', {}, g.back);
      put(holder, A + dx, -30);
      group(holder, D.balloon(7, len), { class: 'bob', style: `--delay:${d}s` });
    });
    const gifts = [[-84, 0, 18, 14], [-104, 0, 16, 18], [-94, -14, 14, 11], [-122, 0, 14, 12]].map(([dx, dy, w, h]) => ({ gg: group(g.back, D.gift(w, h)), x: A + dx, y: dy }));
    const flowers = group(g.front, D.bouquet(1));
    return { gifts, flowers };
  },
  act(t, A) {
    const hx = lerp(A + 40, A - 2, smooth(0.36, 0.5, t));
    const giving = window01(0.5, 0.62, t);
    const meCheer = smooth(0.84, 0.88, t);
    let herP;
    if (t < 0.36) herP = seated(t, t < 0.3 ? eat(cyc(t, 3, 2)) : SIT, 0.12, 0.3, 0.06);
    else if (t < 0.5) herP = mix(walk(hx * STR + 1.4), HUG, smooth(0.47, 0.5, t));
    else herP = mix(mix(HUG, GIVE, giving), STAND, smooth(0.62, 0.7, t));
    let meP = seated(t, t < 0.32 ? eat(cyc(t, 3)) : withArm(SIT, 1, lerp(45, 78, giving), 0), 0.12, 0.8, 0.06);
    meP = mix(meP, CHEER, meCheer);
    return {
      me: at(A - 40, 1, meP, { lift: meCheer * Math.abs(Math.sin(t * 60)) * 6 }),
      her: at(t < 0.36 ? A + 40 : hx, -1, herP),
    };
  },
  update(t, r, c) {
    r.gifts.forEach(({ gg, x, y }, i) => {
      const k = smooth(0.62 + i * 0.05, 0.68 + i * 0.05, t);
      put(gg, x, y - (1 - k) * 10, 0, 0.4 + k * 0.6);
      op(gg, k);
    });
    if (!c.active || !c.me || !c.her) return op(r.flowers, 0);
    const k = smooth(0.54, 0.6, t);
    put(r.flowers, lerp(c.her.hand.x, c.me.hand.x, k), lerp(c.her.hand.y, c.me.hand.y, k) + 4, lerp(-20, 15, k), 0.9);
    op(r.flowers, smooth(0.36, 0.4, t));
  },
});

// 17. a long drive
scene({
  len: 1750,
  w: 2.4,
  drive: true,
  build(A, g) {
    const rnd = seeded(41);
    let s = '';
    for (let x = A - 840; x < A + 860; x += 250) s += `<path class="prop prop-soft" d="M${x} ${f1(ground(x))} V${f1(ground(x) - 70)} h10"/>`;
    for (let i = 0; i < 12; i += 1) {
      const x = A - 860 + rnd() * 1720;
      s += D.tree(x, ground(x), 26 + rnd() * 20);
    }
    let sky = '';
    for (let i = 0; i < 6; i += 1) sky += D.cloud(A - 820 + i * 300 + rnd() * 80, -200 - rnd() * 90, 50 + rnd() * 30);
    group(g.back, s);
    group(g.sky, sky);
    const sun = group(g.sky, D.sun(18));
    const car = group(g.front, `
      <path class="prop paper" d="M-50 -8 V-26 Q-48 -32 -38 -33 L48 -31 Q54 -29 54 -18 V-8 Z"/>
      <path class="prop" d="M-34 -33 L-24 -62 H16 L32 -32 M-4 -62 V-33"/>`);
    const wheels = [-30, 34].map((x) => ({ w: group(car, `<circle class="prop paper" cx="0" cy="0" r="8"/><path class="prop" d="M-8 0 H8 M0 -8 V8"/>`), x }));
    const notes = [0, 1, 2].map(() => group(g.front, D.note()));
    return { sun, car, wheels, notes, A };
  },
  act(t, A) {
    const cx = lerp(A - 780, A + 780, ease(smooth(0.06, 0.94, t)));
    const a = Math.atan((ground(cx + 30) - ground(cx - 30)) / 60);
    const seat = (ox, oy) => ({ x: cx + ox * Math.cos(a) - oy * Math.sin(a), y: ground(cx) + ox * Math.sin(a) + oy * Math.cos(a) });
    if (t <= 0.05 || t >= 0.95) {
      const edge = t <= 0.05 ? A - 780 : A + 780;
      const f = t <= 0.05 ? 1 - smooth(0.02, 0.05, t) : smooth(0.95, 0.98, t);
      return { me: at(edge + 14, 1, STAND, { show: f }), her: at(edge - 20, 1, STAND, { show: f }), cx };
    }
    const f = smooth(0.05, 0.08, t) * (1 - smooth(0.92, 0.95, t));
    const deg = (a * 180) / Math.PI;
    return {
      me: at(cx, 1, STEER, { hip: seat(10, -24), rot: deg, show: f }),
      her: at(cx - 26, 1, withArm(SIT, 1, lerp(60, 140, cyc(t, 6)), 20), { hip: seat(-16, -24), rot: deg, show: f, sway: Math.sin(t * 80) * 2 }),
      cx,
    };
  },
  cam(t, A, s) {
    return { x: s.cx + 40, y: ground(s.cx) - 60, w: 620, h: 300 };
  },
  update(t, r, c) {
    const cx = lerp(r.A - 780, r.A + 780, ease(smooth(0.06, 0.94, t)));
    const a = Math.atan((ground(cx + 30) - ground(cx - 30)) / 60);
    put(r.car, cx, ground(cx), (a * 180) / Math.PI);
    r.wheels.forEach(({ w, x }) => put(w, x, -8, cx * 3));
    const camX = c.active && c.cam ? c.cam.x : cx + 40;
    put(r.sun, camX + lerp(-180, 220, t), lerp(-270, -150, t));
    r.notes.forEach((n, i) => {
      const k = (t * 14 + i / 3) % 1;
      put(n, cx - 10 + k * 26, ground(cx) - 64 - k * 34, 0, 0.9);
      op(n, c.active && t > 0.1 && t < 0.9 ? Math.sin(k * Math.PI) : 0);
    });
  },
});

// 18. her birthday: one huge bouquet, one small, and a pile of gifts
scene({
  slow: [[0.08, 0.5, 2]],
  len: 560,
  w: 1.7,
  view: { w: 480, h: 300, dy: -80 },
  build(A, g) {
    let s = `<path class="prop prop-soft" d="M${A - 150} -170 Q${A} -130 ${A + 150} -170"/>`;
    for (let i = 1; i < 12; i += 1) {
      const k = i / 12;
      const x = lerp(A - 150, A + 150, k);
      const y = (1 - k) * (1 - k) * -170 + 2 * (1 - k) * k * -130 + k * k * -170;
      s += `<path class="prop" d="M${f1(x - 5)} ${f1(y)} L${f1(x)} ${f1(y + 10)} L${f1(x + 5)} ${f1(y)}"/>`;
    }
    group(g.back, s);
    [[118, 0, 40], [128, 0.5, 50], [138, 1, 36]].forEach(([dx, d, len]) => {
      const holder = el('g', {}, g.back);
      put(holder, A + dx, 0);
      group(holder, D.balloon(8, len), { class: 'bob', style: `--delay:${d}s` });
    });
    const gifts = [[64, 0, 18, 15], [84, 0, 22, 20], [104, 0, 16, 12], [72, -15, 14, 11], [93, -20, 12, 10]].map(([dx, dy, w, h]) => ({ gg: group(g.back, D.gift(w, h)), x: A + dx, y: dy }));
    const big = group(g.front, D.bouquet(1.9));
    const small = group(g.front, D.bouquet(0.85));
    const rnd = seeded(51);
    const confetti = Array.from({ length: 34 }, () => ({
      n: el('rect', { class: 'fill', width: 2.4, height: 4 }, g.front),
      x: A - 140 + rnd() * 280,
      y: -240 - rnd() * 60,
      s: 0.6 + rnd() * 0.8,
      r: rnd() * 360,
    }));
    return { gifts, big, small, confetti, A };
  },
  act(t, A) {
    const mx = lerp(A - 70, A + 10, smooth(0.08, 0.22, t));
    const walking = t > 0.08 && t < 0.22;
    const giveBig = window01(0.22, 0.32, t, 0.03);
    const giveSmall = window01(0.38, 0.48, t, 0.03);
    const cheer = smooth(0.72, 0.76, t);
    let meP = walking ? withArm(walk(mx * STR), 1, 50, 60) : t < 0.22 ? HUG : mix(STAND, GIVE, Math.max(giveBig, giveSmall));
    meP = mix(meP, withArm(STAND, 1, 40, 40), smooth(0.5, 0.6, t));
    const herP = mix(mix(STAND, HUG, smooth(0.26, 0.32, t)), CHEER, cheer * (1 - smooth(0.94, 1, t)));
    return {
      me: at(mx, 1, mix(meP, STAND, smooth(0.94, 1, t))),
      her: at(A + 42, t > 0.97 ? 1 : -1, herP, { lift: Math.abs(Math.sin((t - 0.72) * Math.PI * 9)) * 7 * cheer * (1 - smooth(0.92, 1, t)) }),
    };
  },
  update(t, r, c) {
    r.gifts.forEach(({ gg, x, y }, i) => {
      const k = smooth(0.5 + i * 0.04, 0.56 + i * 0.04, t);
      put(gg, x, y - (1 - k) * 12, 0, 0.4 + k * 0.6);
      op(gg, k);
    });
    r.confetti.forEach((cf, i) => {
      const k = smooth(0.72, 1, t);
      const y = Math.min(cf.y + k * (220 * cf.s + 40), -1.5);
      put(cf.n, cf.x + Math.sin(k * 8 + i) * 8 * (y < -2 ? 1 : 0), y, y < -2 ? cf.r + k * 400 : 90);
      op(cf.n, smooth(0.72, 0.76, t) * 0.8);
    });
    if (!c.active || !c.me || !c.her) {
      op(r.big, 0);
      op(r.small, 0);
      return;
    }
    const kb = smooth(0.26, 0.31, t);
    put(r.big, lerp(c.me.hand.x, c.her.hand.x, kb), lerp(c.me.hand.y, c.her.hand.y, kb) + 6, lerp(10, -8, kb));
    op(r.big, smooth(0.02, 0.08, t));
    const ks = smooth(0.42, 0.47, t);
    put(r.small, lerp(c.me.hand.x, c.her.handFar.x, ks), lerp(c.me.hand.y, c.her.handFar.y, ks) + 4, lerp(10, 12, ks));
    op(r.small, smooth(0.35, 0.39, t));
  },
});

// 19. then we started fighting
scene({
  slow: [[0.74, 0.9, 2]],
  len: 560,
  w: 1.5,
  view: { w: 460, h: 300, dy: -90 },
  build(A, g) {
    group(g.back, D.cloud(A - 30, -190, 120) + D.cloud(A + 50, -205, 90) + D.rain(A - 110, A + 110, -180, 38, 61));
    const bubbles = [0, 1].map(() => el('path', { class: 'prop paper' }, g.front));
    const bolt = el('path', { class: 'prop', d: `M${A + 6} -180 L${A - 8} -140 L${A + 4} -140 L${A - 6} -100` }, g.front);
    const crack = el('path', { class: 'draw', pathLength: 1, d: `M${A} 0 L${A - 4} 8 L${A + 3} 14 L${A - 2} 22 L${A + 5} 30` }, g.back);
    return { bubbles, bolt, crack };
  },
  act(t, A) {
    const apart = smooth(0.1, 0.95, t);
    const mx = A - lerp(17, 48, apart);
    const hx = A + lerp(17, 48, apart);
    const meTalk = clamp(window01(0.1, 0.3, t) + window01(0.5, 0.6, t) + window01(0.74, 0.88, t));
    const herTalk = clamp(window01(0.3, 0.5, t) + window01(0.6, 0.74, t) + window01(0.74, 0.88, t));
    return {
      me: at(mx, 1, mix(STAND, argue(cyc(t, 16)), meTalk), { speak: meTalk }),
      her: at(hx, t > 0.96 ? 1 : -1, mix(STAND, argue(cyc(t, 16, 1)), herTalk), { speak: herTalk }),
      bond: lerp(1, 0.5, smooth(0.1, 0.95, t)),
    };
  },
  update(t, r, c) {
    const s = c.state;
    [[c.me, s.me.speak], [c.her, s.her.speak]].forEach(([f, k], i) => {
      const b = r.bubbles[i];
      if (!c.active || !f || k < 0.05) return op(b, 0);
      const x = f.head.x + f.dir * 6;
      const y = f.head.y - 18;
      const j = Math.floor(t * 120) % 2 ? 1 : -1;
      b.setAttribute('d', `M${f1(x - 10)} ${f1(y)} l4 -6 l3 5 l4 -7 l3 6 l4 -5 l2 6 l-3 5 l-5 -2 l-4 4 l-4 -3 l-5 2 Z`);
      b.setAttribute('transform', `rotate(${j * 4} ${f1(x)} ${f1(y)})`);
      op(b, k);
    });
    op(r.bolt, pulse(0.77, 0.83, t));
    draw(r.crack, smooth(0.3, 0.9, t));
  },
});

// 20. distant: I'd call and she wouldn't pick up; she'd call and I wouldn't
scene({
  slow: [[0.03, 0.3, 1.6], [0.66, 1, 2]],
  len: 1000,
  w: 2.7,
  view: { w: 820, h: 300, dy: -80 },
  build(A, g) {
    const weather = group(g.back, D.cloud(A - 300, -170, 90) + D.rain(A - 350, A - 250, -160, 18, 71) + D.cloud(A + 300, -170, 90) + D.rain(A + 250, A + 350, -160, 18, 73));
    const phones = [group(g.front, D.phone()), group(g.front, D.phone())];
    const rings = [group(g.front, D.ring()), group(g.front, D.ring())];
    const dots = Array.from({ length: 14 }, () => el('circle', { class: 'fill', r: 1.6 }, g.back));
    return { phones, rings, dots, weather };
  },
  act(t, A) {
    const meCalls = window01(0.08, 0.36, t, 0.04);
    const herCalls = window01(0.4, 0.66, t, 0.04);
    const down = withArm(SAD, 1, 20, 20);
    // then I try first: phone away, a look across, out from under my cloud, and I walk to her
    const go = smooth(0.72, 0.96, t);
    const mx = lerp(A - 300, A + 190, go);
    let meP = mix(down, PHONE, meCalls);
    if (t > 0.66) meP = withLean(SAD, lerp(12, 0, smooth(0.68, 0.74, t)));
    if (go > 0 && go < 1) meP = walk(mx * STR * 0.85);
    if (t >= 0.96) meP = mix(STAND, withArm(STAND, 1, 80, 0), smooth(0.96, 1, t));
    return {
      me: at(mx, t > 0.68 ? 1 : herCalls > 0.5 ? -1 : 1, meP, { nod: t > 0.66 && t < 0.72 ? 18 : 0 }),
      her: at(A + 300, t > 0.7 ? -1 : meCalls > 0.5 ? 1 : -1, mix(down, PHONE, herCalls), { nod: t > 0.7 ? 12 : 0 }),
      meCalls,
      herCalls,
      bond: lerp(0.45, 0.3, t),
      strands: t > 0.96 ? { intact: 2, tied: 1 } : undefined,
    };
  },
  update(t, r, c) {
    const s = c.state;
    if (!c.active || !c.me || !c.her) {
      [...r.phones, ...r.rings, ...r.dots].forEach((n) => op(n, 0));
      return;
    }
    put(r.phones[0], c.me.hand.x, c.me.hand.y);
    put(r.phones[1], c.her.hand.x, c.her.hand.y);
    r.phones.forEach((p) => op(p, 1 - smooth(0.66, 0.7, t)));
    const ringAt = [c.her.hand, c.me.hand];
    [s.meCalls, s.herCalls].forEach((k, i) => {
      put(r.rings[i], ringAt[i].x, ringAt[i].y, 0, 0.7 + 0.15 * Math.sin(t * 300));
      op(r.rings[i], k * (0.5 + 0.5 * Math.sin(t * 300)));
    });
    // the call travels most of the way across, then fades before it arrives
    const mine = s.meCalls > s.herCalls;
    const from = mine ? c.me.hand : c.her.hand;
    const to = mine ? c.her.hand : c.me.hand;
    const k = Math.max(s.meCalls, s.herCalls);
    r.dots.forEach((d, i) => {
      const u = ((t * 6 + i / r.dots.length) % 1) * 0.82;
      d.setAttribute('cx', f1(lerp(from.x, to.x, u)));
      d.setAttribute('cy', f1(lerp(from.y, to.y, u) - Math.sin(u * Math.PI) * 50));
      op(d, k * (1 - u / 0.82) * 0.8);
    });
  },
});

/* ================================================================== */
/* lay the scenes out along the line                                   */
/* ================================================================== */

const GAP = 300;
{
  let cursor = 0;
  SCENES.forEach((s) => {
    s.A = cursor + s.len / 2;
    cursor += s.len + GAP;
    if (s.hike) LAND.hike = s.A;
    if (s.drive) {
      LAND.drive = s.A;
      LAND.driveLen = s.len;
    }
  });
}
const LAST = SCENES[SCENES.length - 1];
const X0 = SCENES[0].A - 900;
const X1 = LAST.A + LAST.len / 2 + 900;

const STEP = 6;
const cum = [];
let lineD = '';
{
  let len = 0;
  let px = null;
  let py = null;
  for (let x = X0; x <= X1; x += STEP) {
    const y = ground(x);
    if (px !== null) len += Math.hypot(x - px, y - py);
    lineD += `${px === null ? 'M' : 'L'}${x} ${f1(y)}`;
    cum.push(len);
    px = x;
    py = y;
  }
}
const TOTAL = cum[cum.length - 1];
const lengthAt = (x) => cum[clamp(Math.round((x - X0) / STEP), 0, cum.length - 1)];
L.ground.setAttribute('d', `${lineD} L${X1} 6000 L${X0} 6000 Z`);
L.ghost.setAttribute('d', lineD);
L.thread.setAttribute('d', lineD);
L.thread.setAttribute('stroke-dasharray', `${TOTAL} ${TOTAL}`);

SCENES.forEach((s) => {
  s.g = { sky: el('g', {}, L.sky), back: el('g', {}, L.back), front: el('g', {}, L.front) };
  s.refs = s.build ? s.build(s.A, s.g) || {} : {};
});

/* ================================================================== */
/* the timeline: scene, walk, scene, walk, … then the long look back   */
/* ================================================================== */

// slow motion: parts of a scene listed in `slow` take more scrolling
const makeWarp = (slow = []) => {
  const N = 400;
  const acc = [0];
  for (let i = 1; i <= N; i += 1) {
    const tt = (i - 0.5) / N;
    const d = slow.reduce((m, [a, b, f]) => (tt >= a && tt <= b ? m * f : m), 1);
    acc.push(acc[i - 1] + d / N);
  }
  const total = acc[N];
  const map = (u) => {
    const target = clamp(u) * total;
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (acc[mid] < target) lo = mid;
      else hi = mid;
    }
    const k = (target - acc[lo]) / Math.max(1e-9, acc[hi] - acc[lo]);
    return (lo + k) / N;
  };
  return { map, total };
};
SCENES.forEach((s) => { s.warp = makeWarp(s.slow); });

const SEG = [];
SCENES.forEach((s, i) => {
  SEG.push({ type: 'scene', i, w: s.w * s.warp.total });
  if (i < SCENES.length - 1) {
    const d = Math.abs(SCENES[i + 1].A - s.A);
    SEG.push({ type: 'walk', i, w: clamp(d / 1600, 0.45, 0.9) });
  }
});
SEG.push({ type: 'choice', w: 2.6 });
{
  const total = SEG.reduce((n, s) => n + s.w, 0);
  let acc = 0;
  SEG.forEach((s) => {
    s.a = acc / total;
    acc += s.w;
    s.b = acc / total;
  });
  document.querySelector('.scroll-space').style.height = `${Math.round(total * 70)}vh`;
}

const defaultCam = (s) => {
  const v = s.view || { w: 560, h: 280 };
  return { x: s.A + (v.dx || 0), y: ground(s.A) + (v.dy ?? -60), w: v.w, h: v.h };
};
const camOf = (s, t, st) => (s.cam ? s.cam(t, s.A, st) : defaultCam(s));
const camMix = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });

// how close we are, scene by scene: strangers far apart, slowly closer,
// never touching — then apart again once the fighting starts
const GAPS = [260, 230, 205, 185, 165, 148, 132, 118, 105, 94, 84, 75, 68, 62, 59, 56, 51, 46, 42, 38, 70, 200];
// how strong the thread between us is (0 = gone)
const BOND = [0.1, 0.16, 0.22, 0.28, 0.34, 0.4, 0.47, 0.53, 0.59, 0.65, 0.72, 0.77, 0.81, 0.85, 0.865, 0.88, 0.91, 0.94, 0.97, 1, 0.6, 0.3];
const curve = (arr, x) => {
  const i = clamp(Math.floor(x), 0, arr.length - 1);
  const j = Math.min(i + 1, arr.length - 1);
  return lerp(arr[i], arr[j], clamp(x - i));
};

const walkFig = (fa, fb, t, off) => {
  const x = lerp(fa.x, fb.x, ease(t));
  const dx = fb.x - fa.x;
  let p;
  let dir;
  if (Math.abs(dx) > 6) {
    p = mix(fa.pose, walk(x * STR + off), smooth(0, 0.1, t));
    p = mix(p, fb.pose, smooth(0.9, 1, t));
    dir = t < 0.03 ? fa.dir : t > 0.97 ? fb.dir : Math.sign(dx);
  } else {
    p = mix(fa.pose, fb.pose, t);
    dir = t < 0.5 ? fa.dir : fb.dir;
  }
  return { x, dir, pose: p, show: lerp(fa.show ?? 1, fb.show ?? 1, t) };
};

const stateAt = (p) => {
  const seg = SEG.find((s) => p <= s.b) || SEG[SEG.length - 1];
  let t = clamp((p - seg.a) / (seg.b - seg.a));
  if (seg.type === 'scene') {
    const s = SCENES[seg.i];
    t = s.warp.map(t);
    const st = s.act(t, s.A);
    if (st.bond === undefined) st.bond = BOND[seg.i];
    return { seg, t, sceneIndex: seg.i, st, cam: camOf(s, t, st) };
  }
  if (seg.type === 'walk') {
    const a = SCENES[seg.i];
    const b = SCENES[seg.i + 1];
    const sa = a.act(1, a.A);
    const sb = b.act(0, b.A);
    const me = walkFig(sa.me, sb.me, t, 0);
    const her = walkFig(sa.her, sb.her, t, 1.4);
    // while walking, settle into the distance for this point in the story
    const hold = smooth(0, 0.3, t) * (1 - smooth(0.7, 1, t));
    const gap = curve(GAPS, seg.i + 0.5 + (t - 0.5) * 0.9);
    const mid = (me.x + her.x) / 2;
    const herAhead = her.x >= me.x ? 1 : -1;
    me.x = lerp(me.x, mid - (gap / 2) * herAhead, hold);
    her.x = lerp(her.x, mid + (gap / 2) * herAhead, hold);
    const st = {
      me,
      her,
      bond: lerp(sa.bond ?? BOND[seg.i], sb.bond ?? BOND[seg.i + 1], t),
      extras: [
        ...(sa.extras || []).map((e) => ({ ...e, show: (e.show ?? 1) * (1 - smooth(0, 0.35, t)) })),
        ...(sb.extras || []).map((e) => ({ ...e, show: (e.show ?? 1) * smooth(0.65, 1, t) })),
      ],
    };
    return { seg, t, sceneIndex: seg.i + 0.5, st, cam: camMix(camOf(a, 1, sa), camOf(b, 0, sb), ease(t)) };
  }
  const st = LAST.act(1, LAST.A);
  return { seg, t, sceneIndex: SCENES.length - 0.5, st, cam: camOf(LAST, 1, st) };
};

/* ================================================================== */
/* render                                                              */
/* ================================================================== */

let W = window.innerWidth;
let H = window.innerHeight;
const resize = () => {
  W = window.innerWidth;
  H = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
};
resize();
const scrollHint = document.querySelector('.scroll-hint');
const startHint = document.querySelector('.start-hint');

// the thread between us: faint and dotted at first, solid when we're close,
// thin when we fight — and in the end it snaps and the two ends fall away
const drawTether = (me, her, st) => {
  if (!me || !her) return tether.forEach((n) => op(n, 0));
  const bond = clamp(st.bond ?? 0);
  const snap = st.snap || 0;
  const at = (f) => ({ x: lerp(f.hip.x, f.neck.x, 0.55), y: lerp(f.hip.y, f.neck.y, 0.55) });
  const a = at(me);
  const b = at(her);
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const sag = 8 + dist * 0.12;
  const c = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + sag };
  const q = (u) => ({
    x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
    y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
  });
  const piece = (u0, u1, drop) => {
    let d = '';
    for (let i = 0; i <= 24; i += 1) {
      const u = lerp(u0, u1, i / 24);
      const p = q(u);
      const fall = drop * Math.pow(Math.abs(u - (u0 < 0.5 && u1 <= 0.5 ? u0 : u1)), 1.4) * 0;
      d += `${i ? 'L' : 'M'}${f1(p.x)} ${f1(p.y + fall)}`;
    }
    return d;
  };
  const width = 0.7 + 1.1 * bond;
  const dash = bond > 0.96 ? 'none' : `${f1(1 + bond * 14)} ${f1((1 - bond) * 7 + 1.5)}`;
  tether.forEach((n) => {
    n.style.strokeWidth = width.toFixed(2);
    n.style.strokeDasharray = dash;
  });
  if (snap <= 0) {
    tether[0].setAttribute('d', piece(0, 1, 0));
    op(tether[0], 0.12 + 0.5 * bond);
    op(tether[1], 0);
    return;
  }
  // snapped: each loose end shrinks back towards its person and fades
  const reach = 0.5 * (1 - snap * 0.8);
  tether[0].setAttribute('d', piece(0, reach, 0));
  tether[1].setAttribute('d', piece(1 - reach, 1, 0));
  const o = (0.12 + 0.5 * bond) * (1 - smooth(0.6, 1, snap) * 0.7);
  op(tether[0], o);
  op(tether[1], o);
};

const hideTether = () => tether.forEach((n) => op(n, 0));

const drawScene = (S, p) => {
  const { st, cam } = S;

  const me = drawFigure(ME, st.me);
  const her = drawFigure(HER, st.her);
  EXTRAS.forEach((f, i) => drawFigure(f, (st.extras || [])[i]));
  drawTether(me, her, st);

  // on tall phone screens, crop the scene's spare margins so we're not tiny
  const crop = W < H ? lerp(0.78, 1, S.fin ? ease(S.fin) : 0) : 1;
  const sc = clamp(Math.min((W * 0.94) / (cam.w * crop), (H * 0.78) / cam.h), 0.02, 1.9);
  world.setAttribute('transform', `translate(${f1(W / 2)} ${f1(H * 0.6)}) scale(${sc.toFixed(4)}) translate(${f1(-cam.x)} ${f1(-cam.y)})`);
  L.thread.style.strokeWidth = (1.8 / sc).toFixed(2);
  L.ghost.style.strokeWidth = (1 / sc).toFixed(2);
  L.ghost.style.strokeDasharray = `${(2 / sc).toFixed(1)} ${(6 / sc).toFixed(1)}`;

  // the line is drawn just ahead of whoever is in front
  const lead = Math.max(st.me.x ?? -1e9, st.her.x ?? -1e9, me ? me.x : -1e9, her ? her.x : -1e9) + 80;
  L.thread.setAttribute('stroke-dashoffset', f1(TOTAL - lengthAt(lead)));

  // scenes fade in as the camera reaches them, and update their moving parts
  const fin = S.fin ? ease(S.fin) : 0;
  SCENES.forEach((s, i) => {
    const r = s.len / 2 + 420;
    const vis = Math.max(1 - smooth(r * 0.6, r, Math.abs(cam.x - s.A)), i < S.sceneIndex - 0.6 ? 0.14 : 0, fin * 0.3);
    const o = o3(vis);
    s.g.sky.setAttribute('opacity', o);
    s.g.back.setAttribute('opacity', o);
    s.g.front.setAttribute('opacity', o);
    if (!s.update) return;
    const active = S.seg.type === 'scene' && S.seg.i === i;
    if (vis <= 0 && !active) return;
    const t = active ? S.t : i < S.sceneIndex ? 1 : 0;
    s.update(t, s.refs, { active, me, her, state: st, cam });
  });

  scrollHint.style.opacity = o3(1 - smooth(0.001, 0.008, p));
  startHint.style.opacity = o3(0.62 * (1 - smooth(0.001, 0.008, p)));
  return { me, her };
};

const render = (p) => {
  if (CH.decided) return;
  const S = stateAt(p);
  const choosing = S.seg.type === 'choice';
  if (choosing) choiceState(S);
  const { me, her } = drawScene(S, p);
  if (S.st.strands && me && her) {
    hideTether();
    drawStrands(me.hand, her.hand, S.st.strands.intact, S.st.strands);
  } else hideStrands();
  // a soft pulse at her end of the thread: it can be touched
  document.body.classList.toggle('can-tap', choosing);
  hint.classList.toggle('show', choosing);
  if (choosing && her) {
    put(beckon, her.hand.x, her.hand.y);
    op(beckon, 1);
  } else op(beckon, 0);
};

/* ================================================================== */
/* the ending: I make the first move, then it's up to her             */
/*   I walk most of the way and hold out my hand, with the thread      */
/*   tap / click  → she takes a step closer each time; the thread knits */
/*   scroll on    → my hand slowly drops and the thread frays           */
/* ================================================================== */

const STRANDS = Array.from({ length: 5 }, () => ({
  full: el('path', { class: 'strand' }, L.figs),
  a: el('path', { class: 'strand' }, L.figs),
  b: el('path', { class: 'strand' }, L.figs),
  knot: el('circle', { class: 'fill', r: 1.7 }, L.figs),
}));
STRANDS.forEach((s) => [s.full, s.a, s.b, s.knot].forEach((n) => L.figs.insertBefore(n, ME.g)));
// wrapped in a group: the pulse animation sets its own opacity, so the group does the hiding
const beckon = el('g', { opacity: 0 }, L.front);
el('circle', { class: 'beckon', r: 9 }, beckon);
const hint = document.querySelector('.choice-hint');

const hideStrands = () => STRANDS.forEach((s) => [s.full, s.a, s.b, s.knot].forEach((n) => op(n, 0)));

const drawStrands = (a, b, intact, { droop = 0, ends = 1, tied = 0 } = {}) => {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  STRANDS.forEach((s, i) => {
    const off = (i - 2) * 1.6 * Math.min(1, dist / 120);
    const c = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 4 + dist * 0.06 + off };
    const q = (u) => ({
      x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
      y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
    });
    const path = (u0, u1, hang, fromEnd) => {
      let d = '';
      for (let k = 0; k <= 16; k += 1) {
        const u = lerp(u0, u1, k / 16);
        const p = q(u);
        const along = fromEnd ? (1 - u) / (1 - u0 || 1) : u / (u1 || 1);
        d += `${k ? 'L' : 'M'}${f1(p.x)} ${f1(p.y + hang * along * along * 16)}`;
      }
      return d;
    };
    const whole = clamp(intact - i);
    s.full.setAttribute('d', path(0, 1, 0, false));
    op(s.full, whole * 0.85);
    const broken = 1 - whole;
    s.a.setAttribute('d', path(0, 0.13, 0.5 + droop, false));
    s.b.setAttribute('d', path(0.87, 1, 0.5 + droop, true));
    op(s.a, broken * 0.75 * ends);
    op(s.b, broken * 0.75 * ends);
    const m = q(0.5);
    s.knot.setAttribute('cx', f1(m.x));
    s.knot.setAttribute('cy', f1(m.y));
    op(s.knot, i >= 2 ? whole * Math.max(tied, 0.85) : 0);
  });
};

/* ---------- tracking: each step shows up as a page in Vercel Analytics ---------- */
const sent = {};
const track = (path, once = true) => {
  if (once && sent[path]) return;
  sent[path] = true;
  if (typeof window.va === 'function') window.va('pageview', { path });
};

/* ---------- remembering her choice on her device ---------- */
const store = {
  get: () => { try { return localStorage.getItem('us_choice'); } catch (e) { return null; } },
  set: (v) => { try { localStorage.setItem('us_choice', v); } catch (e) { /* private mode */ } },
};

const CH = { taps: 0, step: 0, breaks: 0, decided: null, inChoice: false, pending: false };
const START_STRANDS = 2;
const STEPS = 5;

/* ---------- where everyone stands ---------- */
const EA = LAST.A;
const MY_SPOT = EA + 190; // I walk almost all the way to her, then hold out my hand
const HER_START = EA + 300;
const HER_MEET = EA + 222; // her last few steps, until our hands meet
const BENCH = EA + 206; // where we end up, together

/* ---------- props for the two endings ---------- */
const OUT = {
  sky: el('g', { opacity: 0 }, L.sky),
  back: el('g', { opacity: 0 }, L.back),
  front: el('g', { opacity: 0 }, L.front),
};
const sunrise = group(OUT.sky, D.sun(22));
// (the sun rises behind the two of us)
const bench = group(OUT.back, `<path class="prop" d="M${BENCH - 78} -13 H${BENCH + 78} M${BENCH - 70} -13 V0 M${BENCH + 70} -13 V0 M${BENCH - 78} -16 H${BENCH + 78}"/>`);
const erase = el('rect', { class: 'paper', x: EA, y: -6, width: 0, height: 12 }, OUT.back);
const lonelyBench = group(OUT.back, `<path class="prop" d="M${EA - 326} -13 H${EA - 280} M${EA - 322} -13 V0 M${EA - 284} -13 V0"/>`);
const lonelyDesk = group(OUT.back, D.table(EA + 330, 36) + D.chair(EA + 296, 1) + D.laptop(EA + 316, -26, 1));
const myPhone = group(OUT.front, D.phone());
// a little blush on my cheek
const blush = group(OUT.front, `<path class="blush" d="M-1.6 -1.4 l-2 2.4 M0.6 -1.4 l-2 2.4 M2.8 -1.4 l-2 2.4"/>`);
// little laugh lines by each head
const laughLines = [0, 1].map(() => group(OUT.front, `<path class="prop" d="M7 -5 l5 -3 M8 0 h6 M7 5 l5 3"/>`));

const weather = () => LAST.refs.weather;

/* ---------- the letters ---------- */
const overlay = document.querySelector('.letter-overlay');
const showLetter = (kind, instant = false) => {
  const letter = overlay.querySelector(`[data-letter="${kind}"]`);
  overlay.classList.add('on');
  overlay.classList.toggle('over-scene', kind === 'together');
  letter.classList.add('on');
  overlay.scrollTop = 0;
  [...letter.children].forEach((p, i) => {
    p.style.transitionDelay = instant ? `${0.2 + i * 0.15}s` : `${1.2 + i * 0.9}s`;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => letter.classList.add('reveal')));
};

/* ---------- poses for the ending ---------- */
const reach = (k) => withArm(STAND, 1, lerp(80, 12, k), lerp(0, 10, k)); // k: how far my hand has dropped
const fidget = (t) => withArm(withArm(SIT, 0, 26 + 8 * cyc(t, 6), 70), 1, 34 - 8 * cyc(t, 6, 1), 64);

// her, partway across to me after `step` taps
const herApproach = (step) => {
  const k = clamp(step / STEPS);
  const x = lerp(HER_START, HER_MEET, k);
  const moving = Math.abs(step - Math.round(step)) > 0.04;
  const p = moving ? walk(x * STR + 1.4) : withArm(STAND, 1, lerp(25, 76, k), lerp(20, 0, k));
  return at(x, -1, p, { nod: lerp(12, 0, k) });
};

/* ---------- the two endings, as time-driven animations ---------- */
const outcomeState = (kind, o) => {
  const A = EA;
  const st = { extras: [], bond: 1 };
  let cam = camOf(LAST, 1, LAST.act(1, A));

  if (kind === 'letgo') {
    // my hand drops, the last strand slips away, and we each go back under our own rain, heads down
    const turn = o > 0.1;
    const mw = smooth(0.12, 0.48, o);
    const mx = lerp(MY_SPOT, EA - 300, mw);
    let meP = mix(reach(1), withLean(SAD, 6), smooth(0, 0.1, o));
    if (mw > 0 && mw < 1) meP = withLean(walk(mx * STR * 0.8), 8);
    if (o >= 0.48) meP = mix(STAND, withArm(SIT, 1, lerp(30, 70, window01(0.58, 0.8, o)), lerp(60, 95, window01(0.58, 0.8, o))), smooth(0.48, 0.53, o));
    st.me = at(mx, turn ? -1 : 1, meP, { nod: lerp(28, 36, smooth(0.08, 0.3, o)) });

    const herStart = herApproach(CH.step || 0);
    const hw = smooth(0.18, 0.5, o);
    const hx = lerp(herStart.x, EA + 296, hw);
    let herP = withLean(SAD, 4);
    if (hw > 0 && hw < 1) herP = withLean(walk(hx * STR * 0.8 + 1.4), 8);
    if (o >= 0.5) herP = mix(STAND, type(cyc(o, 10) * (1 - smooth(0.8, 0.88, o))), smooth(0.5, 0.55, o));
    st.her = at(hx, o < 0.12 ? -1 : 1, herP, { nod: lerp(10, 30, smooth(0.1, 0.3, o)) });

    st.strands = { intact: 0, droop: smooth(0, 0.2, o) * 2, ends: 1 - smooth(0.06, 0.25, o) };
    st.lineGap = smooth(0.25, 0.6, o);
    st.myPhone = window01(0.58, 0.8, o);
    cam = { ...cam, w: lerp(cam.w, 1000, ease(smooth(0.2, 1, o))), h: lerp(cam.h, 360, ease(smooth(0.2, 1, o))) };
    st.props = { bench: smooth(0.36, 0.48, o), desk: smooth(0.36, 0.5, o) };
    return { st, cam };
  }

  // held on: our hands meet and the thread knots. We let go and stand a little apart
  // while the rain clears; I look at my shoes, blushing, and shuffle closer in small
  // nervous steps; then I look up, she closes the last bit, and we laugh
  const apart = smooth(0.1, 0.2, o);
  const steps = [[0.3, 0.37], [0.4, 0.47], [0.5, 0.57]];
  const stepK = steps.reduce((n, [a, b]) => n + smooth(a, b, o), 0) / steps.length;
  const stepping = steps.some(([a, b]) => o > a && o < b);
  const herIn = smooth(0.62, 0.7, o);
  const mx = lerp(lerp(MY_SPOT, BENCH - 34, apart), BENCH - 13, stepK);
  const hx = lerp(lerp(HER_MEET, BENCH + 30, apart), BENCH + 13, herIn);
  const shy = smooth(0.22, 0.3, o) * (1 - smooth(0.6, 0.66, o));
  const laugh = smooth(0.68, 0.74, o) * (1 - smooth(0.93, 0.99, o));
  const bob = (off) => Math.abs(Math.sin(o * 95 + off)) * 2.2 * laugh;

  let meP = mix(withArm(STAND, 1, 80, 0), STAND, smooth(0.1, 0.18, o));
  // shy: hands together in front, small shuffling steps
  meP = mix(meP, withArm(withArm(STAND, 0, 25, 60), 1, 30, 55), shy);
  if (stepping) meP = mix(meP, walk(mx * STR * 2.2), 0.45);
  meP = mix(meP, withArm(withArm(withLean(STAND, -8), 1, 35, 95), 0, 20, 70), laugh);
  let herP = mix(withArm(STAND, 1, 76, 0), STAND, smooth(0.1, 0.18, o));
  if (herIn > 0 && herIn < 1) herP = mix(herP, walk(hx * STR * 2.2 + 1.4), 0.45);
  herP = mix(herP, withArm(withLean(STAND, 6), 1, 22, 150), laugh);

  st.laugh = laugh * (0.6 + 0.4 * Math.abs(Math.sin(o * 60)));
  st.blush = smooth(0.24, 0.3, o) * (1 - smooth(0.78, 0.88, o));
  st.me = at(mx, 1, meP, { nod: 34 * shy - 10 * laugh, lift: bob(0) });
  st.her = at(hx, -1, herP, { nod: 6 * (1 - laugh) + 8 * laugh, lift: bob(1.3) });
  st.strands = o < 0.2 ? { intact: 5, tied: 1 + Math.sin(o * 80) * 0.2 } : null;
  st.noThread = smooth(0.18, 0.28, o);
  st.sun = smooth(0.08, 0.4, o);
  st.clear = smooth(0.04, 0.3, o);
  st.leadTo = lerp(Math.max(mx, hx) + 80, X1, ease(smooth(0.82, 1, o)));
  st.props = { bench: 0 };
  const inK = ease(smooth(0.15, 0.42, o));
  cam = { x: lerp(cam.x, BENCH, inK), y: lerp(cam.y, -70, inK), w: lerp(cam.w, 420, inK), h: lerp(cam.h, 280, inK) };
  return { st, cam };
};

const renderOutcome = (kind, o) => {
  const { st, cam } = outcomeState(kind, o);
  const S = { seg: { type: 'outcome' }, t: 1, sceneIndex: SCENES.length - 0.5, st, cam };
  drawScene(S, 1);
  op(OUT.sky, 1);
  op(OUT.back, 1);
  op(OUT.front, 1);
  op(beckon, 0);
  hint.classList.remove('show');
  const meOut = drawFigure(ME, st.me);
  const herOut = drawFigure(HER, st.her);

  if (st.strands && meOut && herOut) {
    hideTether();
    drawStrands(meOut.hand, herOut.hand, st.strands.intact, st.strands);
  } else hideStrands();
  if (st.noThread) tether.forEach((n) => n.setAttribute('opacity', o3((1 - st.noThread) * (+n.getAttribute('opacity') || 0))));

  if (kind === 'letgo') {
    laughLines.forEach((n) => op(n, 0));
    op(blush, 0);
    op(sunrise, 0);
    op(bench, 0);
    op(lonelyBench, st.props.bench);
    op(lonelyDesk, st.props.desk);
    hideTether();
    const w = st.lineGap * 420;
    erase.setAttribute('x', f1(EA - w / 2));
    erase.setAttribute('width', f1(w));
    if (meOut && st.myPhone > 0.05) {
      put(myPhone, meOut.hand.x, meOut.hand.y);
      op(myPhone, st.myPhone);
    } else op(myPhone, 0);
  } else {
    op(lonelyBench, 0);
    op(lonelyDesk, 0);
    op(myPhone, 0);
    if (meOut && st.blush > 0.01) {
      put(blush, meOut.head.x + meOut.dir * 2.6, meOut.head.y + 2.4);
      op(blush, st.blush);
    } else op(blush, 0);
    [meOut, herOut].forEach((f, i) => {
      if (!f) return op(laughLines[i], 0);
      // on the outside of each of us, away from the other
      put(laughLines[i], f.head.x - f.dir * 4, f.head.y, 0, 1);
      laughLines[i].setAttribute('transform', `translate(${f1(f.head.x)} ${f1(f.head.y)}) scale(${-f.dir} 1)`);
      op(laughLines[i], st.laugh || 0);
    });
    erase.setAttribute('width', 0);
    op(bench, st.props.bench);
    put(sunrise, BENCH + 110, lerp(-10, -170, st.sun));
    op(sunrise, smooth(0.05, 0.3, st.sun));
    const w = weather();
    if (w) {
      op(w, 1 - st.clear);
      w.setAttribute('transform', `translate(0 ${f1(-st.clear * 40)})`);
    }
    L.thread.setAttribute('stroke-dashoffset', f1(TOTAL - lengthAt(st.leadTo)));
  }
};

const lockScroll = () => {
  lenis.stop();
  document.documentElement.classList.add('locked');
};

const decide = (kind) => {
  if (CH.decided) return;
  CH.decided = kind;
  store.set(kind);
  track(kind === 'held' ? '/held' : '/let-go');
  lockScroll();
  document.body.classList.remove('can-tap');
  hint.classList.remove('show');
  const anim = { o: 0 };
  gsap.to(anim, {
    o: 1,
    duration: kind === 'held' ? 17 : 12,
    ease: 'none',
    onUpdate: () => renderOutcome(kind, anim.o),
    onComplete: () => setTimeout(() => showLetter(kind === 'held' ? 'together' : 'goodbye'), kind === 'held' ? 1800 : 600),
  });
  if (kind === 'letgo') gsap.to('.fade-white', { opacity: 1, duration: 2.2, delay: 10.2, ease: 'sine.inOut' });
};

// the choice: called from render while she's at the very end
const choiceState = (S) => {
  const st = S.st;
  if (!CH.inChoice) {
    CH.inChoice = true;
    track('/end');
  }
  // a little room at the start, so simply arriving here doesn't count as letting go;
  // the strands fray across the whole zone and the last one only goes at the very bottom
  const fray = clamp((S.t - 0.1) / 0.86);
  // each step she takes knits the thread a little more; it's whole when her hand reaches mine
  const total = START_STRANDS + (5 - START_STRANDS) * clamp(CH.step / STEPS);
  const intact = fray >= 0.999 ? 0 : clamp(total * (1 - fray), 0.5, 5);
  CH.breaks = total - intact;
  if (CH.breaks > 0) track('/fraying');
  st.me = at(MY_SPOT, 1, reach(fray), { nod: lerp(0, 32, fray) });
  st.her = herApproach(CH.step);
  st.strands = { intact, tied: 1 };
  if (intact <= 0 && !CH.pending) setTimeout(() => decide('letgo'), 0);
  return intact;
};

window.addEventListener('click', () => {
  if (CH.decided || CH.pending || !CH.inChoice) return;
  CH.taps += 1;
  track(`/tapped-${CH.taps}`);
  const done = CH.taps >= STEPS;
  if (done) CH.pending = true;
  gsap.to(CH, {
    step: Math.min(CH.taps, STEPS),
    duration: 0.9,
    ease: 'sine.inOut',
    overwrite: true,
    onUpdate: () => render(progress.p),
    onComplete: () => { if (done) decide('held'); },
  });
});

/* ================================================================== */
/* scroll                                                              */
/* ================================================================== */

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const lenis = new Lenis({ lerp: 0.12 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const progress = { p: 0 };
gsap.to(progress, {
  p: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '.scroll-space',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.8,
  },
  onUpdate: () => { if (!CH.decided) render(progress.p); },
});

window.addEventListener('resize', () => {
  resize();
  ScrollTrigger.refresh();
  render(progress.p);
});

render(0);

// if she has been here before and chose, respect it: show her ending
{
  const prior = store.get();
  if (prior === 'held' || prior === 'letgo') {
    CH.decided = prior;
    lockScroll();
    document.querySelector('.scroll-hint').style.opacity = 0;
    document.querySelector('.start-hint').style.opacity = 0;
    hint.classList.remove('show');
    renderOutcome(prior, 1);
    if (prior === 'letgo') document.querySelector('.fade-white').style.opacity = 1;
    showLetter(prior === 'held' ? 'together' : 'goodbye', true);
    track(prior === 'held' ? '/returned-held' : '/returned-let-go');
  }
}



