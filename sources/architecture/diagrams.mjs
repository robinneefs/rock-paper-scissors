// Draws the SVG diagrams for docs/architecture/ARCHITECTURE.md.
// Usage: node diagrams.mjs <outdir>   (default: ../../docs/architecture/diagrams)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] ?? resolve(here, '../../docs/architecture/diagrams'));
mkdirSync(out, { recursive: true });

// ---------- palette ----------
const C = {
  bg: '#fbfaff', ink: '#1d1533', sub: '#5b5378', line: '#8f86ad', faint: '#e7e3f3',
  core: ['#fff1c2', '#c99700'], session: ['#d7f2fd', '#1a93c4'], pres: ['#ffe0f0', '#d6337f'],
  plat: ['#ece7fd', '#7b61d9'], server: ['#dcf6e1', '#2e9d4f'], warn: ['#ffe3de', '#d0412b'],
  dark: '#1a1030', neon: '#3ff0ff', pink: '#ff4fa8',
};
const SANS = "font-family=\"system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif\"";
const MONO = "font-family=\"ui-monospace, 'SF Mono', Menlo, Consolas, monospace\"";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function svg(name, w, h, title, body) {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<title>${esc(title)}</title>
<defs>
${['ink', 'line', 'core', 'session', 'pres', 'server', 'warn', 'plat'].map((k) => {
    const col = k === 'ink' ? C.ink : k === 'line' ? C.line : C[k][1];
    return `<marker id="a-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${col}"/></marker>`;
  }).join('\n')}
<pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#241640"/><path d="M8 0H0V8" fill="none" stroke="#33205a" stroke-width="1"/></pattern>
</defs>
<rect width="${w}" height="${h}" rx="14" fill="${C.bg}"/>
${body}
</svg>`;
  writeFileSync(resolve(out, name), s);
  console.log('wrote', name);
}

function box(x, y, w, h, kind, opts = {}) {
  const [fill, stroke] = Array.isArray(kind) ? kind : C[kind] ?? [C.bg, C.line];
  const dash = opts.dash ? ' stroke-dasharray="6 5"' : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${opts.r ?? 10}" fill="${opts.fill ?? fill}" stroke="${stroke}" stroke-width="${opts.sw ?? 2}"${dash}/>`;
}
function text(x, y, str, o = {}) {
  const lines = Array.isArray(str) ? str : [str];
  const size = o.size ?? 14, lh = o.lh ?? size * 1.35;
  return lines.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" font-weight="${o.weight ?? 400}" text-anchor="${o.anchor ?? 'start'}" fill="${o.fill ?? C.ink}" ${o.mono ? MONO + ' xml:space="preserve"' : SANS}${o.italic ? ' font-style="italic"' : ''}>${esc(l)}</text>`).join('\n');
}
function arrow(d, kind = 'line', o = {}) {
  const col = kind === 'ink' ? C.ink : kind === 'line' ? C.line : C[kind][1];
  const dash = o.dash ? ' stroke-dasharray="6 5"' : '';
  const start = o.both ? ` marker-start="url(#a-${kind})"` : '';
  return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${o.sw ?? 2}"${dash}${start} marker-end="url(#a-${kind})"/>`;
}
// a titled box with a bold heading and smaller detail lines
function card(x, y, w, h, kind, title, lines = [], o = {}) {
  return box(x, y, w, h, kind, o) +
    text(x + (o.center ? w / 2 : 14), y + 24, title, { weight: 700, size: o.ts ?? 15, anchor: o.center ? 'middle' : 'start', mono: o.monoTitle }) +
    text(x + (o.center ? w / 2 : 14), y + 46, lines, { size: 12.5, fill: C.sub, anchor: o.center ? 'middle' : 'start', mono: o.monoLines });
}

// =====================================================================
// 1. Layers
// =====================================================================
{
  const W = 1000, H = 640;
  let b = text(32, 44, 'Layers and who may use whom', { size: 22, weight: 800 });
  b += text(32, 68, 'Arrows mean "uses". They only point down: lower layers never know about higher ones.', { fill: C.sub });

  // client frame
  b += box(24, 88, 640, 520, ['#ffffff', C.faint], { r: 14 });
  b += text(40, 114, 'apps/game  (the browser game, later wrapped for Android)', { weight: 700, fill: C.sub, size: 13 });

  // platform
  b += card(40, 126, 608, 64, 'plat', 'Platform', ['Browser page now, Capacitor later. Pixel scaler, storage and haptics behind small adapters.']);
  // presentation
  b += box(40, 210, 608, 150, 'pres');
  b += text(54, 234, 'Presentation (Phaser)', { weight: 700, size: 15 });
  b += text(54, 254, 'Draws, animates, plays sound, reads input. Never decides who wins.', { size: 12.5, fill: C.sub });
  const pres = ['Scenes', 'Fight director', 'Views', 'FX / juice', 'Audio', 'Input'];
  pres.forEach((p, i) => { b += box(54 + i * 98, 272, 88, 72, ['#fff7fb', C.pres[1]], { r: 8, sw: 1.5 }) + text(98 + i * 98, 313, p, { anchor: 'middle', size: 13, weight: 600 }); });
  // session
  b += box(40, 380, 608, 100, 'session');
  b += text(54, 404, 'Session (plain TypeScript, no Phaser)', { weight: 700, size: 15 });
  b += text(54, 424, 'One interface for "a match in progress". Scenes talk only to this.', { size: 12.5, fill: C.sub });
  b += box(54, 436, 180, 34, ['#f1fbff', C.session[1]], { r: 8, sw: 1.5 }) + text(144, 458, 'MatchSession', { anchor: 'middle', mono: true, size: 13, weight: 700 });
  b += box(244, 436, 180, 34, ['#f1fbff', C.session[1]], { r: 8, sw: 1.5 }) + text(334, 458, 'LocalSession + CPU', { anchor: 'middle', size: 13 });
  b += box(434, 436, 200, 34, ['#f1fbff', C.session[1]], { r: 8, sw: 1.5, dash: true }) + text(534, 458, 'OnlineSession (later)', { anchor: 'middle', size: 13 });
  // core
  b += box(40, 500, 608, 92, 'core');
  b += text(54, 524, 'Core  ·  packages/core  ·  zero dependencies', { weight: 700, size: 15 });
  b += box(54, 538, 184, 40, ['#fffaea', C.core[1]], { r: 8, sw: 1.5 }) + text(146, 563, 'Rules (pure)', { anchor: 'middle', size: 13, weight: 600 });
  b += box(248, 538, 184, 40, ['#fffaea', C.core[1]], { r: 8, sw: 1.5 }) + text(340, 563, 'Referee (phases)', { anchor: 'middle', size: 13, weight: 600 });
  b += box(442, 538, 192, 40, ['#fffaea', C.core[1]], { r: 8, sw: 1.5 }) + text(538, 563, 'Rules config', { anchor: 'middle', size: 13, weight: 600 });

  // down arrows inside client
  b += arrow('M 344 360 L 344 378', 'ink');
  b += arrow('M 344 480 L 344 498', 'ink');

  // server
  b += box(700, 88, 276, 520, ['#ffffff', C.faint], { r: 14, dash: true });
  b += text(716, 114, 'apps/server  (online, later)', { weight: 700, fill: C.sub, size: 13 });
  b += card(716, 380, 244, 100, 'server', 'Colyseus MatchRoom', ['Runs the timer and the referee', 'Keeps picks secret until reveal', 'Sends events to both players'], { dash: true });
  b += box(716, 500, 244, 92, 'core');
  b += text(730, 524, 'Same packages/core', { weight: 700, size: 15 });
  b += text(730, 546, ['Identical rules on client and', 'server: results always agree.'], { size: 12.5, fill: C.sub });
  b += arrow('M 838 480 L 838 498', 'ink');
  // websocket
  b += arrow('M 636 453 C 670 453, 680 430, 714 430', 'server', { dash: true, both: true });
  b += text(662, 418, 'WebSocket', { size: 12, fill: C.server[1], anchor: 'middle', weight: 600 });
  // shared package bracket
  b += arrow('M 648 546 L 714 546', 'core', { dash: true, both: true });
  b += text(681, 534, 'shared', { size: 12, fill: C.core[1], anchor: 'middle', weight: 700 });
  svg('1-layers.svg', W, H, 'Layers and dependencies', b);
}

// =====================================================================
// 2. Match phases
// =====================================================================
{
  const W = 1000, H = 520;
  let b = text(32, 44, 'Match phases (the referee\'s state machine)', { size: 22, weight: 800 });
  b += text(32, 68, 'Lives in packages/core. Durations come from the shared rules config, so client and server agree on every step.', { fill: C.sub });
  const n = (x, y, w, title, lines, kind = 'session') => card(x, y, w, 112, kind, title, lines, { center: true });
  b += n(32, 170, 190, 'RoundIntro', ['"Round 1 … Fight!"', 'timings.roundIntroMs']);
  b += n(282, 170, 190, 'Picking', ['countdown 5 s', 'pick or change freely', 'no pick at 0 = random', 'timings.pickMs'], 'pres');
  b += n(532, 170, 190, 'Reveal', ['picks shown together', 'rules resolve, damage', 'timings.revealMs']);
  b += n(782, 170, 190, 'RoundOver', ['KO, round to winner', 'timings.roundOverMs']);
  b += n(782, 380, 190, 'MatchOver', ['winner screen', 'waits for rematch'], 'core');

  b += arrow('M 222 218 L 280 218', 'ink');
  b += arrow('M 472 218 L 530 218', 'ink');
  b += text(501, 206, 'time up', { size: 12, anchor: 'middle', fill: C.sub });
  b += arrow('M 722 218 L 780 218', 'ink');
  b += text(751, 206, 'KO', { size: 12, anchor: 'middle', fill: C.sub, weight: 700 });
  // reveal -> picking loop
  b += arrow('M 627 170 C 627 110, 377 110, 377 168', 'ink');
  b += text(502, 112, 'both still standing: next exchange', { size: 12.5, anchor: 'middle', fill: C.sub });
  // roundover -> roundintro
  b += arrow('M 840 282 C 840 340, 127 340, 127 284', 'ink');
  b += text(480, 352, 'nobody has 2 rounds yet: health resets', { size: 12.5, anchor: 'middle', fill: C.sub });
  // roundover -> matchover
  b += arrow('M 900 282 L 900 378', 'ink');
  b += text(910, 322, ['2 rounds', 'won'], { size: 12, fill: C.sub, weight: 700 });
  // matchover -> rematch
  b += arrow('M 780 436 C 400 480, 90 470, 100 284', 'ink', { dash: true });
  b += text(430, 492, 'rematch: everything resets', { size: 12.5, anchor: 'middle', fill: C.sub });
  svg('2-match-phases.svg', W, H, 'Match phases', b);
}

// =====================================================================
// 3. Sessions: local now, online later
// =====================================================================
{
  const W = 1000, H = 600;
  let b = text(32, 44, 'Local now, online later: swap the session, keep the scenes', { size: 22, weight: 800 });
  b += text(32, 68, 'The fight scene only sees the MatchSession interface. Where the opponent\'s move comes from is not its business.', { fill: C.sub });

  b += card(300, 92, 400, 70, 'pres', 'FightScene + FightDirector', ['shows phases, plays the reveal, sends the player\'s pick'], { center: true });
  b += box(250, 196, 500, 120, 'session', { r: 12 });
  b += text(500, 222, 'MatchSession (interface)', { anchor: 'middle', weight: 700, size: 15, mono: true });
  b += text(270, 250, ['submitPick(move)', 'requestRematch()', 'snapshot(): MatchView'], { mono: true, size: 12.5 });
  b += text(520, 250, ['on(\'phase\', …)', 'on(\'locked\', …)', 'on(\'reveal\', …)'], { mono: true, size: 12.5 });
  b += arrow('M 500 162 L 500 194', 'ink', { both: true });

  // local
  b += box(32, 360, 440, 210, ['#ffffff', C.session[1]], { r: 12 });
  b += text(48, 388, 'LocalSession  (step 1 to 4)', { weight: 700, size: 15 });
  b += card(48, 404, 196, 66, 'core', 'Referee + Rules', ['packages/core'], {});
  b += card(260, 404, 196, 66, 'pres', 'Your input', ['buttons, keys 1/2/3'], {});
  b += card(48, 488, 196, 66, 'plat', 'RandomCpu', ['a MoveSource'], {});
  b += card(260, 488, 196, 66, ['#f7f5fd', C.line], 'More later', ['SmartCpu, hot-seat …'], { dash: true });
  b += text(252, 590, '', {});
  b += arrow('M 400 318 L 300 358', 'session');
  b += text(318, 346, 'implements', { size: 12, fill: C.session[1], weight: 600, anchor: 'end' });

  // online
  b += box(528, 360, 440, 210, ['#ffffff', C.server[1]], { r: 12, dash: true });
  b += text(544, 388, 'OnlineSession  (step 5)', { weight: 700, size: 15 });
  b += card(544, 404, 180, 66, 'session', 'Colyseus client', ['translates messages', 'into the same events'], {});
  b += card(776, 404, 176, 150, 'server', 'Server MatchRoom', ['Referee + Rules', '(same packages/core)', '', 'owns the timer', 'hides picks', 'random fallback pick'], {});
  b += arrow('M 726 437 L 774 437', 'server', { both: true });
  b += text(634, 500, ['Network latency is hidden', 'behind the phase timings:', 'the client animates while', 'the server waits.'], { size: 12, fill: C.sub, anchor: 'middle', italic: true });
  b += arrow('M 600 318 L 700 358', 'session', { dash: true });
  b += text(684, 346, 'implements', { size: 12, fill: C.session[1], weight: 600 });
  svg('3-sessions.svg', W, H, 'Local and online sessions', b);
}

// =====================================================================
// 4. Reveal timeline (choreography with tuning names)
// =====================================================================
{
  const W = 1000, H = 520;
  const x0 = 170, x1 = 960, T = 2000; // ms on the axis
  const X = (ms) => x0 + (ms / T) * (x1 - x0);
  let b = text(32, 44, 'One reveal, step by step (starting values, all tunable)', { size: 22, weight: 800 });
  b += text(32, 68, 'The FightDirector plays this as a timeline. Every number is a named value in tuning.ts, never hard-coded in a scene.', { fill: C.sub });
  const lanes = ['Move icons', 'Fighters', 'Impact', 'Camera', 'Health bar', 'Sound'];
  const ly = (i) => 110 + i * 56;
  lanes.forEach((l, i) => {
    b += `<rect x="24" y="${ly(i) - 4}" width="952" height="48" rx="6" fill="${i % 2 ? '#ffffff' : '#f4f1fc'}"/>`;
    b += text(36, ly(i) + 25, l, { weight: 700, size: 13.5 });
  });
  const bar = (lane, a, z, kind, label, mono = true) => {
    const [fill, stroke] = C[kind];
    return `<rect x="${X(a)}" y="${ly(lane) + 4}" width="${Math.max(6, X(z) - X(a))}" height="32" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>` +
      text(X(a) + 8, ly(lane) + 25, label, { size: 11.5, mono });
  };
  const tick = (lane, at, kind, label) => `<path d="M ${X(at)} ${ly(lane) + 2} l 8 18 l -8 18 l -8 -18 z" fill="${C[kind][1]}"/>` + text(X(at) + 14, ly(lane) + 25, label, { size: 11.5, mono: true });
  b += bar(0, 0, 320, 'pres', 'iconDropMs');
  b += bar(0, 320, 1700, 'pres', 'icons stay up (bounce settled)', false);
  b += bar(1, 300, 560, 'session', 'anticipation');
  b += bar(1, 560, 700, 'warn', 'strike', false);
  b += bar(1, 700, 1500, 'session', 'hurt / win pose → idle', false);
  b += `<path d="M ${X(600)} ${ly(2) + 2} l 8 18 l -8 18 l -8 -18 z" fill="${C.warn[1]}"/>`;
  b += bar(2, 620, 700, 'warn', '');
  b += text(X(712), ly(2) + 25, 'hitPause.byDamage (freeze 50–90 ms) · flash · sparks', { size: 11.5, mono: true });
  b += bar(3, 600, 880, 'core', 'shake.byDamage');
  b += text(X(895), ly(3) + 25, 'whole-pixel offsets, 2–4 px', { size: 11.5, fill: C.sub });
  b += bar(4, 720, 1320, 'plat', 'hud.drainMs (red trail follows)');
  b += tick(5, 0, 'plat', 'sfx.reveal');
  b += tick(5, 600, 'warn', 'sfx.hit[move]');
  b += tick(5, 1400, 'plat', 'sfx.crowd (optional)');

  // axis + phase budget
  const ay = ly(lanes.length) + 10;
  b += `<path d="M ${x0} ${ay} H ${x1}" stroke="${C.ink}" stroke-width="1.5"/>`;
  for (let ms = 0; ms <= T; ms += 250) b += `<path d="M ${X(ms)} ${ay} v 6" stroke="${C.ink}"/>` + text(X(ms), ay + 22, `${ms}`, { size: 11, anchor: 'middle', fill: C.sub, mono: true });
  b += text(x0 - 12, ay + 22, 'ms', { size: 11, anchor: 'end', fill: C.sub });
  b += `<path d="M ${X(2000)} 96 V ${ay}" stroke="${C.server[1]}" stroke-width="2" stroke-dasharray="5 4"/>`;
  b += text(X(2000) - 6, 92, 'timings.revealMs: the reveal phase ends here (shared with the server)', { size: 12, anchor: 'end', fill: C.server[1], weight: 700 });
  svg('4-reveal-timeline.svg', W, H, 'Reveal choreography timeline', b);
}

// =====================================================================
// 5. Screen layout and integer scaling
// =====================================================================
{
  const W = 1000, H = 660;
  let b = text(32, 44, 'Screen: one pixel grid, whole-number scaling', { size: 22, weight: 800 });
  b += text(32, 68, 'The canvas covers the whole window. The cabinet sits in the middle at the biggest whole scale that fits; the rest is arcade room.', { fill: C.sub });

  // (a) native cabinet, 1 unit = 1 native px
  const s = 1, cx = 40, cy = 110; // drawn at 1:1 native pixels
  const M = 32, BV = 12, BH = 27, MON_W = 216, MON_H = 288, P = 128, CW = 270;
  b += text(cx, cy - 12, 'A. Cabinet at native size (270 × 472)', { weight: 700, size: 14 });
  b += `<rect x="${cx}" y="${cy}" width="${CW}" height="${M + BV * 2 + MON_H + P}" fill="#3a2466" stroke="${C.ink}" stroke-width="1"/>`;
  b += `<rect x="${cx}" y="${cy}" width="${CW}" height="${M}" fill="${C.pink}"/>` + text(cx + CW / 2, cy + 21, 'marquee 32', { anchor: 'middle', size: 12, fill: '#fff', weight: 700 });
  b += `<rect x="${cx + BH}" y="${cy + M + BV}" width="${MON_W}" height="${MON_H}" fill="url(#grid)" stroke="${C.neon}" stroke-width="1"/>`;
  b += text(cx + CW / 2, cy + M + BV + 130, ['MONITOR', '216 × 288', '', 'Title / Fight / Result', 'scenes draw here', '(camera viewport)'], { anchor: 'middle', size: 12, fill: '#e8e0ff', weight: 600 });
  const py = cy + M + BV * 2 + MON_H;
  b += `<rect x="${cx}" y="${py}" width="${CW}" height="${P}" fill="#4b2f80"/>`;
  b += text(cx + CW / 2, py + 22, 'CONTROL PANEL 128', { anchor: 'middle', size: 12, fill: '#e8e0ff', weight: 700 });
  [0, 1, 2].forEach((i) => { b += `<circle cx="${cx + 125 + i * 48}" cy="${py + 66}" r="17" fill="${['#ff4f6d', '#ffcf3f', '#3fd0ff'][i]}" stroke="#120826" stroke-width="2"/>`; });
  b += `<circle cx="${cx + 52}" cy="${py + 66}" r="9" fill="#ff4f6d" stroke="#120826" stroke-width="2"/><path d="M ${cx + 52} ${py + 75} v 20" stroke="#120826" stroke-width="5"/>`;
  b += text(cx + CW / 2, py + 112, 'CabinetScene: always on', { anchor: 'middle', size: 11.5, fill: '#cbbcff' });
  b += text(cx, cy + 472 + 24, ['Cabinet target height 472 so that it', 'shows at 2× in a 1080p browser window.', '(mock-up today: 502, trim marquee/panel)'], { size: 12, fill: C.sub });

  // (b) desktop
  const dx = 360, dy = 110, dw = 360, dh = 180; // 1920x960 scaled by 0.1875
  b += text(dx, dy - 12, 'B. Desktop browser 1920 × 960 → 2×', { weight: 700, size: 14 });
  b += `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="url(#grid)" stroke="${C.ink}"/>`;
  const k = dw / 1920, cw2 = 270 * 2 * k, ch2 = 472 * 2 * k;
  b += `<rect x="${dx + (dw - cw2) / 2}" y="${dy + (dh - ch2) / 2}" width="${cw2}" height="${ch2}" fill="#4b2f80" stroke="${C.neon}"/>`;
  b += text(dx + dw / 2, dy + dh / 2 + 4, '540 × 944', { anchor: 'middle', size: 11, fill: '#fff', weight: 700 });
  b += text(dx + 10, dy + 22, 'arcade room', { size: 11, fill: '#cbbcff' });
  b += text(dx, dy + dh + 22, ['960 ÷ 472 = 2.03 → scale 2. The leftover is arcade', 'room drawn at the same 2× pixel size, never stretch.'], { size: 12, fill: C.sub });

  // (c) phone
  const qx = 760, qy = 110, qw = 200, qh = 433; // 1080x2340 device px, k=0.185
  b += text(qx, qy - 12, 'C. Phone 1080 × 2340 → 4×', { weight: 700, size: 14 });
  b += `<rect x="${qx}" y="${qy}" width="${qw}" height="${qh}" rx="18" fill="url(#grid)" stroke="${C.ink}" stroke-width="2"/>`;
  const k2 = qw / 1080, cw3 = 270 * 4 * k2, ch3 = 472 * 4 * k2;
  b += `<rect x="${qx + (qw - cw3) / 2}" y="${qy + (qh - ch3) / 2}" width="${cw3}" height="${ch3}" fill="#4b2f80" stroke="${C.neon}"/>`;
  b += text(qx + qw / 2, qy + qh / 2 + 4, '1080 × 1888', { anchor: 'middle', size: 11, fill: '#fff', weight: 700 });
  b += text(qx, qy + qh + 22, ['1080 ÷ 270 = 4. Extra height', 'shows floor and marquee light.'], { size: 12, fill: C.sub });

  // rules box
  b += box(360, 340, 380, 210, ['#ffffff', C.faint], { r: 12 });
  b += text(376, 366, 'How the scale is picked', { weight: 700, size: 14 });
  b += text(376, 392, [
    'deviceW = innerWidth  × devicePixelRatio',
    'deviceH = innerHeight × devicePixelRatio',
    'scale   = max(1, floor(min(',
    '            deviceW / 270, deviceH / 472)))',
    'canvas  = ceil(device / scale)  native px',
    'zoom    = scale   (nearest neighbour)',
  ], { mono: true, size: 12, lh: 19 });
  b += text(376, 520, 'Re-run on resize and rotation.', { size: 12, fill: C.sub });
  svg('5-screen-and-scaling.svg', W, H, 'Screen layout and integer scaling', b);
}

// =====================================================================
// 6. Online exchange sequence
// =====================================================================
{
  const W = 1000, H = 640;
  let b = text(32, 44, 'Online exchange: nobody sees the other pick early', { size: 22, weight: 800 });
  b += text(32, 68, 'The server owns the clock and both picks. Clients only learn the opponent\'s move in the reveal message.', { fill: C.sub });
  const cols = [[170, 'Player A (client)', 'pres'], [500, 'Server MatchRoom', 'server'], [830, 'Player B (client)', 'pres']];
  cols.forEach(([x, l, k]) => { b += box(x - 105, 90, 210, 40, k) + text(x, 116, l, { anchor: 'middle', weight: 700 }) + `<path d="M ${x} 130 V 610" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="4 4"/>`; });
  const A = 170, S = 500, B = 830;
  let y = 165;
  const msg = (from, to, label, kind = 'ink', o = {}) => {
    const s = arrow(`M ${from} ${y} L ${to + (to > from ? -4 : 4)} ${y}`, kind, o) + text((from + to) / 2, y - 8, label, { anchor: 'middle', size: 12.5, mono: o.mono ?? true, fill: o.fill ?? C.ink });
    y += o.gap ?? 46; return s;
  };
  b += msg(S, A, 'phase: Picking, endsAt', 'server', { gap: 0 });
  b += msg(S, B, 'phase: Picking, endsAt', 'server');
  b += msg(A, S, 'pick(Throw)', 'pres');
  b += msg(S, B, 'locked: A   (no move!)', 'server');
  b += msg(A, S, 'pick(Attack)   changed mind, allowed', 'pres');
  b += msg(B, S, 'pick(Block)', 'pres');
  b += msg(S, A, 'locked: B   (no move!)', 'server');
  // server self note
  b += box(S - 150, y - 20, 300, 64, 'core', { r: 8 });
  b += text(S, y + 2, ['timer hits 0 (server clock)', 'missing pick = random · rules: B wins, 10 dmg'], { anchor: 'middle', size: 12.5 });
  y += 74;
  b += msg(S, A, 'reveal(A: Attack, B: Block)', 'server', { gap: 0 });
  b += msg(S, B, 'reveal(A: Attack, B: Block)', 'server');
  b += box(40, y - 12, 260, 46, 'pres', { r: 8 }) + text(170, y + 16, 'play reveal within revealMs', { anchor: 'middle', size: 12.5 });
  b += box(700, y - 12, 260, 46, 'pres', { r: 8 }) + text(830, y + 16, 'play reveal within revealMs', { anchor: 'middle', size: 12.5 });
  svg('6-online-exchange.svg', W, H, 'Online exchange sequence', b);
}
