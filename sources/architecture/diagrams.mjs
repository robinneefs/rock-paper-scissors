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
  b += text(32, 68, 'Arrows mean "uses". They only point down: lower layers never know about higher ones. Dashed = not built yet.', { fill: C.sub });

  // client frame
  b += box(24, 88, 640, 520, ['#ffffff', C.faint], { r: 14 });
  b += text(40, 114, 'apps/game  (the browser game, later wrapped for Android)', { weight: 700, fill: C.sub, size: 13 });

  // platform
  b += card(40, 126, 608, 64, 'plat', 'Platform  ·  platform/', ['PixelScaler (window → scale), SettingsStore (localStorage). Capacitor adapters later.']);
  // presentation
  b += box(40, 210, 608, 150, 'pres');
  b += text(54, 234, 'Presentation (Phaser)', { weight: 700, size: 15 });
  b += text(54, 254, 'Draws, animates, reads input. Never decides who wins.', { size: 12.5, fill: C.sub });
  const pres = [['Scenes', 'scenes/'], ['Director', 'fight/'], ['Views', 'views/'], ['Menus', 'menus/'], ['FX', 'fx/'], ['Input', 'input/'], ['Audio', 'later']];
  pres.forEach(([p, f], i) => {
    const later = f === 'later';
    b += box(54 + i * 83, 272, 76, 72, ['#fff7fb', later ? C.line : C.pres[1]], { r: 8, sw: 1.5, dash: later }) +
      text(92 + i * 83, 304, p, { anchor: 'middle', size: 13, weight: 600, fill: later ? C.sub : C.ink }) +
      text(92 + i * 83, 324, f, { anchor: 'middle', size: 11, mono: true, fill: C.sub });
  });
  // session
  b += box(40, 380, 608, 100, 'session');
  b += text(54, 404, 'Session  ·  session/  (plain TypeScript, no Phaser)', { weight: 700, size: 15 });
  b += text(54, 424, 'One interface for "a match in progress". Scenes talk only to this.', { size: 12.5, fill: C.sub });
  b += box(54, 436, 180, 34, ['#f1fbff', C.session[1]], { r: 8, sw: 1.5 }) + text(144, 458, 'MatchSession', { anchor: 'middle', mono: true, size: 13, weight: 700 });
  b += box(244, 436, 180, 34, ['#f1fbff', C.session[1]], { r: 8, sw: 1.5 }) + text(334, 458, 'LocalSession + RandomCpu', { anchor: 'middle', size: 13 });
  b += box(434, 436, 200, 34, ['#f1fbff', C.session[1]], { r: 8, sw: 1.5, dash: true }) + text(534, 458, 'OnlineSession (step 5)', { anchor: 'middle', size: 13, fill: C.sub });
  // core
  b += box(40, 500, 608, 92, 'core');
  b += text(54, 524, 'Core  ·  packages/core (@rps/core)  ·  zero dependencies', { weight: 700, size: 15 });
  b += box(54, 538, 184, 40, ['#fffaea', C.core[1]], { r: 8, sw: 1.5 }) + text(146, 563, 'rules/ (pure)', { anchor: 'middle', size: 13, weight: 600 });
  b += box(248, 538, 184, 40, ['#fffaea', C.core[1]], { r: 8, sw: 1.5 }) + text(340, 563, 'referee/ (phases)', { anchor: 'middle', size: 13, weight: 600 });
  b += box(442, 538, 192, 40, ['#fffaea', C.core[1]], { r: 8, sw: 1.5 }) + text(538, 563, 'config.ts (rules, timings)', { anchor: 'middle', size: 13, weight: 600 });

  b += arrow('M 344 360 L 344 378', 'ink');
  b += arrow('M 344 480 L 344 498', 'ink');

  // server
  b += box(700, 88, 276, 520, ['#ffffff', C.faint], { r: 14, dash: true });
  b += text(716, 114, 'Online match room (step 5)', { weight: 700, fill: C.sub, size: 13 });
  b += text(716, 134, ['Proposed: a Cloudflare Durable Object', '(free plan). See ONLINE-OPTIONS.md.'], { fill: C.sub, size: 12 });
  b += card(716, 380, 244, 100, 'server', 'Match room', ['Runs the referee and the timer', 'Keeps picks secret until reveal', 'Sends events to both players'], { dash: true });
  b += box(716, 500, 244, 92, 'core');
  b += text(730, 524, 'Same packages/core', { weight: 700, size: 15 });
  b += text(730, 546, ['Identical rules on client and', 'server: results always agree.'], { size: 12.5, fill: C.sub });
  b += arrow('M 838 480 L 838 498', 'ink');
  b += arrow('M 636 453 C 670 453, 680 430, 714 430', 'server', { dash: true, both: true });
  b += text(662, 418, 'WebSocket', { size: 12, fill: C.server[1], anchor: 'middle', weight: 600 });
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
  b += text(32, 68, 'packages/core/src/referee/referee.ts. Durations come from defaultTimings in config.ts, so client and server agree on every step.', { fill: C.sub });
  const n = (x, y, w, title, lines, kind = 'session') => card(x, y, w, 112, kind, title, lines, { center: true });
  b += box(32, 90, 190, 50, ['#f7f5fd', C.line], { r: 10 }) + text(127, 112, 'idle', { anchor: 'middle', weight: 700, mono: true }) + text(127, 130, 'until session.ready()', { anchor: 'middle', size: 12, fill: C.sub });
  b += arrow('M 127 140 L 127 168', 'ink');
  b += text(137, 158, 'start()', { size: 12, mono: true, fill: C.sub });
  b += n(32, 170, 190, 'roundIntro', ['"ROUND 1" banner', '"FIGHT!" as it ends', 'roundIntroMs 1600']);
  b += n(282, 170, 190, 'picking', ['countdown: pickMs 5000', 'pick or change freely', 'no pick at 0 = random'], 'pres');
  b += n(532, 170, 190, 'reveal', ['both picks + outcome', 'applyExchange: damage', 'revealMs 1800']);
  b += n(782, 170, 190, 'roundOver', ['K.O., winner pose', 'roundOverMs 2200']);
  b += n(782, 380, 190, 'matchOver', ['no timer: result screen', 'start() again = rematch'], 'core');

  b += arrow('M 222 218 L 280 218', 'ink');
  b += arrow('M 472 218 L 530 218', 'ink');
  b += text(501, 206, 'time up', { size: 12, anchor: 'middle', fill: C.sub });
  b += arrow('M 722 218 L 780 218', 'ink');
  b += text(751, 206, 'KO', { size: 12, anchor: 'middle', fill: C.sub, weight: 700 });
  b += arrow('M 627 170 C 627 110, 377 110, 377 168', 'ink');
  b += text(502, 112, 'both still standing: next exchange', { size: 12.5, anchor: 'middle', fill: C.sub });
  b += arrow('M 840 282 C 840 340, 127 340, 127 284', 'ink');
  b += text(480, 352, 'nobody has 2 rounds yet: startNextRound, health resets', { size: 12.5, anchor: 'middle', fill: C.sub });
  b += arrow('M 900 282 L 900 378', 'ink');
  b += text(910, 322, ['roundsToWin', 'reached'], { size: 12, fill: C.sub, weight: 700 });
  b += arrow('M 780 436 C 400 480, 90 470, 100 284', 'ink', { dash: true });
  b += text(430, 492, 'rematch (Retry): fresh match state, old timers cancelled', { size: 12.5, anchor: 'middle', fill: C.sub });
  svg('2-match-phases.svg', W, H, 'Match phases', b);
}

// =====================================================================
// 3. Sessions: local now, online later
// =====================================================================
{
  const W = 1000, H = 630;
  let b = text(32, 44, 'Local now, online later: swap the session, keep the scenes', { size: 22, weight: 800 });
  b += text(32, 68, 'Fight and result screens only see the MatchSession interface. Where the opponent\'s move comes from is not their business.', { fill: C.sub });

  b += card(300, 92, 400, 70, 'pres', 'FightScene + FightDirector + ResultScene', ['show phases, play the reveal, send the player\'s pick'], { center: true });
  b += box(250, 196, 500, 124, 'session', { r: 12 });
  b += text(500, 222, 'MatchSession (session/MatchSession.ts)', { anchor: 'middle', weight: 700, size: 15, mono: true });
  b += text(270, 248, ['me, rules', 'ready()', 'submitPick(move)', 'requestRematch()', 'snapshot(): MatchView'], { mono: true, size: 12.5, lh: 15 });
  b += text(500, 248, ['on(\'phase\' | \'locked\' |', '   \'reveal\' | \'matchOver\' |', '   \'rematchAccepted\', …)', 'dispose()'], { mono: true, size: 12.5, lh: 15 });
  b += arrow('M 500 162 L 500 194', 'ink', { both: true });

  // local
  b += box(32, 364, 440, 210, ['#ffffff', C.session[1]], { r: 12 });
  b += text(48, 392, 'LocalSession  (built)', { weight: 700, size: 15 });
  b += card(48, 408, 196, 66, 'core', 'Referee + rules', ['browserClock, Math.random'], {});
  b += card(260, 408, 196, 66, 'pres', 'Your pick', ['always side p1'], {});
  b += card(48, 492, 196, 66, 'plat', 'RandomCpu', ['MoveSource, thinks 0.4–1.6 s'], {});
  b += card(260, 492, 196, 66, ['#f7f5fd', C.line], 'More later', ['EquilibriumCpu, hot-seat …'], { dash: true });
  b += arrow('M 400 322 L 300 362', 'session');
  b += text(318, 350, 'implements', { size: 12, fill: C.session[1], weight: 600, anchor: 'end' });

  // online
  b += box(528, 364, 440, 210, ['#ffffff', C.server[1]], { r: 12, dash: true });
  b += text(544, 392, 'OnlineSession  (step 5)', { weight: 700, size: 15 });
  b += card(544, 408, 180, 66, 'session', 'WebSocket client', ['turns messages into', 'the same events'], {});
  b += card(776, 408, 176, 150, 'server', 'Match room', ['Referee + rules', '(same packages/core)', '', 'owns the timer', 'hides picks', 'random fallback pick'], {});
  b += arrow('M 726 441 L 774 441', 'server', { both: true });
  b += text(634, 504, ['Latency hides inside the', 'reveal window: the client', 'animates while the room', 'waits out revealMs.'], { size: 12, fill: C.sub, anchor: 'middle', italic: true });
  b += arrow('M 600 322 L 700 362', 'session', { dash: true });
  b += text(684, 350, 'implements', { size: 12, fill: C.session[1], weight: 600 });
  b += text(500, 604, 'createSession(setup) builds the right one for each match: { mode: \'cpu\' } now, { mode: \'online\', roomCode } later.', { anchor: 'middle', size: 12.5, fill: C.sub, mono: true });
  svg('3-sessions.svg', W, H, 'Local and online sessions', b);
}

// =====================================================================
// 4. Reveal timeline (choreography with tuning names)
// =====================================================================
{
  const W = 1000, H = 560;
  const x0 = 170, x1 = 960, T = 1800; // ms on the axis
  const X = (ms) => x0 + (ms / T) * (x1 - x0);
  let b = text(32, 44, 'One reveal, step by step (current values in tuning.ts)', { size: 22, weight: 800 });
  b += text(32, 68, 'FightDirector.onReveal plays this from the single reveal event. Every number is a named value in apps/game/src/config/tuning.ts.', { fill: C.sub });
  const lanes = ['Move icons', 'Fighters', 'Impact', 'Camera', 'Health bar', 'Sound'];
  const ly = (i) => 110 + i * 56;
  lanes.forEach((l, i) => {
    b += `<rect x="24" y="${ly(i) - 4}" width="952" height="48" rx="6" fill="${i % 2 ? '#ffffff' : '#f4f1fc'}"/>`;
    b += text(36, ly(i) + 25, l, { weight: 700, size: 13.5 });
  });
  const bar = (lane, a, z, kind, label, mono = true, o = {}) => {
    const [fill, stroke] = Array.isArray(kind) ? kind : C[kind];
    return `<rect x="${X(a)}" y="${ly(lane) + 4}" width="${Math.max(6, X(z) - X(a))}" height="32" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"${o.dash ? ' stroke-dasharray="6 5"' : ''}/>` +
      text(X(a) + 8, ly(lane) + 25, label, { size: 11.5, mono, fill: o.fill });
  };
  const tick = (lane, at, kind, label) => `<path d="M ${X(at)} ${ly(lane) + 2} l 8 18 l -8 18 l -8 -18 z" fill="${C[kind][1]}"/>` + text(X(at) + 12, ly(lane) + 25, label, { size: 11.5, mono: true });
  b += bar(0, 0, 320, 'pres', 'iconDropMs 320');
  b += bar(0, 320, 1800, 'pres', 'icons stay up (the next picking phase hides them)', false);
  b += bar(1, 0, 420, ['#f7f5fd', C.line], 'idle', false);
  b += bar(1, 420, 620, 'warn', 'strikeAtMs', true);
  b += bar(1, 620, 1400, 'session', 'loser: hurt pose, pushed back · winner holds the strike', false);
  b += tick(1, 1400, 'session', 'recoverAtMs → idle');
  b += tick(2, 620, 'warn', 'impactAtMs');
  b += text(X(860), ly(2) + 25, 'flash 2×33 ms · hitPause.byDamage 50/70/90 ms', { size: 11.5, mono: true });
  b += bar(3, 700, 980, 'core', 'shake.byDamage');
  b += text(X(995), ly(3) + 25, '2 / 3 / 4 px for 280 ms, whole pixels (K.O.: koPx 5)', { size: 11.5, fill: C.sub });
  b += bar(4, 700, 1300, 'plat', 'hud.drainMs 600 (trail follows)');
  b += bar(5, 0, 1800, ['#f7f5fd', C.line], 'no sound yet: hit and clash sounds join here in step 3', false, { dash: true, fill: C.sub });

  const ay = ly(lanes.length) + 10;
  b += `<path d="M ${x0} ${ay} H ${x1}" stroke="${C.ink}" stroke-width="1.5"/>`;
  for (let ms = 0; ms <= T; ms += 200) b += `<path d="M ${X(ms)} ${ay} v 6" stroke="${C.ink}"/>` + text(X(ms), ay + 22, `${ms}`, { size: 11, anchor: 'middle', fill: C.sub, mono: true });
  b += text(x0 - 12, ay + 22, 'ms', { size: 11, anchor: 'end', fill: C.sub });
  b += `<path d="M ${X(1800)} 96 V ${ay}" stroke="${C.server[1]}" stroke-width="2" stroke-dasharray="5 4"/>`;
  b += text(X(1800) - 6, 92, 'revealMs 1800: the reveal phase ends here (core config, shared with the server)', { size: 12, anchor: 'end', fill: C.server[1], weight: 700 });
  // slack bracket
  const sy = ay + 44;
  b += `<path d="M ${X(1400)} ${sy - 8} V ${sy} H ${X(1800)} V ${sy - 8}" fill="none" stroke="${C.server[1]}" stroke-width="2"/>`;
  b += text(X(1800), sy + 18, '400 ms of slack: room for network delay online', { size: 12, anchor: 'end', fill: C.server[1], weight: 600 });
  b += text(32, sy + 18, ['Shake and drain start once the hit-pause is over.', 'Tie: at impactAtMs a 1 px shake and the CLASH! banner, no damage.'], { size: 12, fill: C.sub });
  svg('4-reveal-timeline.svg', W, H, 'Reveal choreography timeline', b);
}

// =====================================================================
// 5. Screen layout and scaling
// =====================================================================
{
  const W = 1000, H = 660;
  let b = text(32, 44, 'Screen: one pixel grid, two scaling modes', { size: 22, weight: 800 });
  b += text(32, 68, 'The canvas covers the whole window at native resolution. The cabinet sits in the middle; the rest is arcade room.', { fill: C.sub });

  const cx = 40, cy = 110;
  const M = 32, BV = 12, BH = 27, MON_W = 216, MON_H = 288, P = 128, CW = 270;
  b += text(cx, cy - 12, 'A. Cabinet at native size (270 × 472)', { weight: 700, size: 14 });
  b += `<rect x="${cx}" y="${cy}" width="${CW}" height="${M + BV * 2 + MON_H + P}" fill="#3a2466" stroke="${C.ink}" stroke-width="1"/>`;
  b += `<rect x="${cx}" y="${cy}" width="${CW}" height="${M}" fill="${C.pink}"/>` + text(cx + CW / 2, cy + 21, 'marquee 32', { anchor: 'middle', size: 12, fill: '#fff', weight: 700 });
  b += `<rect x="${cx + BH}" y="${cy + M + BV}" width="${MON_W}" height="${MON_H}" fill="url(#grid)" stroke="${C.neon}" stroke-width="1"/>`;
  b += text(cx + CW / 2, cy + M + BV + 120, ['MONITOR', '216 × 288 at (27, 44)', '', 'Logo / Home / Options /', 'Fight / Result scenes', 'draw here', '(useMonitorCamera)'], { anchor: 'middle', size: 12, fill: '#e8e0ff', weight: 600 });
  const py = cy + M + BV * 2 + MON_H;
  b += `<rect x="${cx}" y="${py}" width="${CW}" height="${P}" fill="#4b2f80"/>`;
  b += text(cx + CW / 2, py + 22, 'CONTROL PANEL 128', { anchor: 'middle', size: 12, fill: '#e8e0ff', weight: 700 });
  [0, 1, 2].forEach((i) => { b += `<circle cx="${cx + 112 + i * 58}" cy="${py + 50}" r="17" fill="${['#ff4f6d', '#ffcf3f', '#3fd0ff'][i]}" stroke="#120826" stroke-width="2"/>`; });
  b += `<circle cx="${cx + 44}" cy="${py + 50}" r="9" fill="#ff4f6d" stroke="#120826" stroke-width="2"/><path d="M ${cx + 44} ${py + 59} v 20" stroke="#120826" stroke-width="5"/>`;
  b += text(cx + CW / 2, py + 108, 'CabinetScene: always on', { anchor: 'middle', size: 11.5, fill: '#cbbcff' });
  b += text(cx, cy + 472 + 24, ['Sizes live in apps/game/src/config/layout.ts', '(CABINET, MONITOR, PANEL, BUTTONS, STAGE).'], { size: 12, fill: C.sub });

  const dx = 360, dy = 110, dw = 360, dh = 180;
  b += text(dx, dy - 12, 'B. Desktop browser 1920 × 960', { weight: 700, size: 14 });
  b += `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="url(#grid)" stroke="${C.ink}"/>`;
  const k = dw / 1920, cw2 = 270 * 2 * k, ch2 = 472 * 2 * k;
  b += `<rect x="${dx + (dw - cw2) / 2}" y="${dy + (dh - ch2) / 2}" width="${cw2}" height="${ch2}" fill="#4b2f80" stroke="${C.neon}"/>`;
  b += text(dx + dw / 2, dy + dh / 2 + 4, '540 × 944', { anchor: 'middle', size: 11, fill: '#fff', weight: 700 });
  b += text(dx + 10, dy + 22, 'arcade room', { size: 11, fill: '#cbbcff' });
  b += text(dx, dy + dh + 22, ['960 ÷ 472 = 2.03. Pixel perfect: 2×, every pixel', 'even. Fill height: 2.03×, fills the window height.'], { size: 12, fill: C.sub });

  const qx = 760, qy = 110, qw = 200, qh = 433;
  b += text(qx, qy - 12, 'C. Phone 1080 × 2340', { weight: 700, size: 14 });
  b += `<rect x="${qx}" y="${qy}" width="${qw}" height="${qh}" rx="18" fill="url(#grid)" stroke="${C.ink}" stroke-width="2"/>`;
  const k2 = qw / 1080, cw3 = 270 * 4 * k2, ch3 = 472 * 4 * k2;
  b += `<rect x="${qx + (qw - cw3) / 2}" y="${qy + (qh - ch3) / 2}" width="${cw3}" height="${ch3}" fill="#4b2f80" stroke="${C.neon}"/>`;
  b += text(qx + qw / 2, qy + qh / 2 + 4, '1080 × 1888', { anchor: 'middle', size: 11, fill: '#fff', weight: 700 });
  b += text(qx, qy + qh + 22, ['1080 ÷ 270 = 4: both modes', 'give 4× (width is the limit).'], { size: 12, fill: C.sub });

  b += box(360, 340, 380, 250, ['#ffffff', C.faint], { r: 12 });
  b += text(376, 366, 'computeLayout() in platform/PixelScaler.ts', { weight: 700, size: 14 });
  b += text(376, 392, [
    'devW = innerWidth  × devicePixelRatio',
    'devH = innerHeight × devicePixelRatio',
    'fit  = min(devW / 270, devH / 472)',
    '',
    'pixelPerfect: scale = max(1, floor(fit))',
    'fillHeight:   scale = max(1, fit)',
    '',
    'canvas = ceil(dev / scale) native px',
    'zoom   = scale / devicePixelRatio',
  ], { mono: true, size: 12, lh: 18 });
  b += text(376, 566, ['Fill height is the default (since v0.3.0). Re-run on', 'resize, rotation and when Options changes the mode.'], { size: 12, fill: C.sub });
  svg('5-screen-and-scaling.svg', W, H, 'Screen layout and scaling', b);
}

// =====================================================================
// 6. Online exchange sequence
// =====================================================================
{
  const W = 1000, H = 660;
  let b = text(32, 44, 'Online exchange: nobody sees the other pick early', { size: 22, weight: 800 });
  b += text(32, 68, 'The match room owns the clock and both picks. Clients only learn the opponent\'s move in the reveal message. (Step 5, not built.)', { fill: C.sub });
  const cols = [[170, 'Player A (OnlineSession)', 'pres'], [500, 'Match room (server)', 'server'], [830, 'Player B (OnlineSession)', 'pres']];
  cols.forEach(([x, l, k]) => { b += box(x - 115, 90, 230, 40, k) + text(x, 116, l, { anchor: 'middle', weight: 700 }) + `<path d="M ${x} 130 V 630" stroke="${C.line}" stroke-width="1.5" stroke-dasharray="4 4"/>`; });
  const A = 170, S = 500, B = 830;
  let y = 165;
  const msg = (from, to, label, kind = 'ink', o = {}) => {
    const s = arrow(`M ${from} ${y} L ${to + (to > from ? -4 : 4)} ${y}`, kind, o) + text((from + to) / 2, y - 8, label, { anchor: 'middle', size: 12, mono: o.mono ?? true, fill: o.fill ?? C.ink });
    y += o.gap ?? 44; return s;
  };
  b += msg(S, A, 'phase {picking, msLeft 5000}', 'server', { gap: 0 });
  b += msg(S, B, 'phase {picking, msLeft 5000}', 'server');
  b += msg(A, S, 'pick(\'throw\')', 'pres');
  b += msg(S, B, 'locked {side: A}   (no move!)', 'server');
  b += msg(A, S, 'pick(\'attack\')  changed mind', 'pres');
  b += msg(B, S, 'pick(\'block\')', 'pres');
  b += msg(S, A, 'locked {side: B}   (no move!)', 'server');
  b += box(S - 160, y - 20, 320, 64, 'core', { r: 8 });
  b += text(S, y + 2, ['timer hits 0 on the room\'s clock', 'missing pick = random · rules: B wins, 10 dmg'], { anchor: 'middle', size: 12.5 });
  y += 74;
  b += msg(S, A, 'reveal {picks, outcome, state}', 'server', { gap: 0 });
  b += msg(S, B, 'reveal {picks, outcome, state}', 'server');
  b += box(40, y - 12, 260, 46, 'pres', { r: 8 }) + text(170, y + 16, 'FightDirector plays it in revealMs', { anchor: 'middle', size: 12.5 });
  b += box(700, y - 12, 260, 46, 'pres', { r: 8 }) + text(830, y + 16, 'FightDirector plays it in revealMs', { anchor: 'middle', size: 12.5 });
  y += 64;
  b += text(500, y, 'The room sends time left (msLeft), not its clock time: each client adds it to its own clock, so clocks never need to match.', { anchor: 'middle', size: 12.5, fill: C.sub, italic: true });
  svg('6-online-exchange.svg', W, H, 'Online exchange sequence', b);
}

// =====================================================================
// 7. Screen flow (menus)
// =====================================================================
{
  const W = 1000, H = 590;
  let b = text(32, 44, 'Screen flow: from power-on to rematch', { size: 22, weight: 800 });
  b += text(32, 68, 'Every screen is a monitor scene; SceneFlow (scenes/flow.ts) changes them behind a pixel wipe. Dashed = later screens.', { fill: C.sub });
  const n = (x, y, w, h, kind, title, lines, o = {}) => card(x, y, w, h, kind, title, lines, { center: true, ...o });
  b += n(32, 110, 150, 112, 'plat', 'Boot', ['placeholder art,', 'pixel font, logo']);
  b += n(222, 110, 170, 112, 'pres', 'Logo intro', ['Chain Shift logo', 'fades in, holds, out', 'any button skips']);
  b += n(432, 110, 190, 186, 'pres', 'Home', ['title, idle fighters']);
  const item = (y, label, o = {}) => box(450, y, 154, 28, ['#ffffff', o.dash ? C.line : C.pres[1]], { r: 6, sw: 1.5, dash: o.dash }) + text(527, y + 19, label, { anchor: 'middle', size: 12.5, weight: o.dash ? 400 : 700, fill: o.dash ? C.sub : C.ink });
  b += item(180, '▶ START GAME  vs CPU') + item(214, 'ONLINE  (SOON)', { dash: true }) + item(248, 'OPTIONS');
  b += n(222, 250, 170, 92, 'plat', 'Options', ['SCALING: fill height', 'or pixel perfect']);
  b += arrow('M 450 262 C 420 262, 420 290, 394 292', 'pres', { both: true });
  b += text(428, 334, 'BACK / Esc', { anchor: 'middle', size: 11, fill: C.sub });
  b += n(662, 110, 140, 112, 'session', 'Fight', ['best of three', 'vs the CPU']);
  b += n(842, 110, 140, 172, 'core', 'Result', ['over the last', 'fight frame', '', '']);
  b += box(861, 196, 102, 28, ['#ffffff', C.core[1]], { r: 6, sw: 1.5 }) + text(912, 215, '▶ RETRY', { anchor: 'middle', size: 12.5, weight: 700 });
  b += box(861, 232, 102, 28, ['#ffffff', C.core[1]], { r: 6, sw: 1.5 }) + text(912, 251, 'MAIN MENU', { anchor: 'middle', size: 12.5, weight: 700 });

  b += arrow('M 182 166 L 220 166', 'ink');
  b += arrow('M 392 166 L 430 166', 'ink');
  b += arrow('M 604 195 C 630 195, 640 166, 660 166', 'pres');
  b += text(642, 100, 'MatchSetup', { anchor: 'middle', size: 11.5, mono: true, fill: C.pres[1] });
  b += arrow('M 802 166 L 840 166', 'ink');
  b += text(821, 154, 'over', { anchor: 'middle', size: 11.5, weight: 700, fill: C.sub });
  b += arrow('M 861 210 L 804 210', 'core');
  b += text(831, 200, 'retry', { anchor: 'middle', size: 11.5, weight: 700, fill: C.sub });
  b += arrow('M 861 246 C 780 340, 680 340, 610 298', 'core');
  b += text(742, 340, 'main menu / Esc', { anchor: 'middle', size: 12, weight: 700, fill: C.sub });
  b += text(32, 384, 'Retry: session.requestRematch() → rematchAccepted (locally at once; online once both agree) → toFight(setup, same session).', { size: 12.5, fill: C.sub, mono: true });

  b += text(32, 418, 'Later screens hang off the menus the same way (a menu item + a scene):', { weight: 700, size: 14 });
  const later = [
    ['Online lobby', ['create a room or join', 'with a room code']],
    ['More options', ['music and effects volume,', 'mute, controls']],
    ['Pause', ['in a fight: resume', 'or quit to menu']],
    ['How to play', ['the rules triangle', 'and the damage']],
  ];
  later.forEach(([t, l], i) => { b += n(32 + i * 240, 436, 216, 92, 'plat', t, l, { dash: true }); });
  b += text(32, 560, 'Menu input: joystick or arrow keys move the cursor, any cabinet button (or Enter / Space / a tap) confirms, Esc goes back.', { size: 12.5, fill: C.sub });
  svg('7-screen-flow.svg', W, H, 'Screen flow', b);
}

// =====================================================================
// 8. Code map: what is where, and which imports the linter blocks
// =====================================================================
{
  const W = 1000, H = 710;
  let b = text(32, 44, 'Code map: every folder and what it holds', { size: 22, weight: 800 });
  b += text(32, 68, 'Colours match the layers. The red list on the right is checked by ESLint (eslint.config.js): a forbidden import fails CI.', { fill: C.sub });
  const folder = (x, y, w, h, kind, title, lines, o = {}) => box(x, y, w, h, kind, { r: 10, dash: o.dash }) +
    text(x + 12, y + 22, title, { weight: 700, size: 13.5, mono: true }) +
    text(x + 12, y + 42, lines, { size: 11.5, fill: C.sub, lh: 15 });

  b += text(32, 100, 'apps/game/src', { weight: 700, size: 13, mono: true, fill: C.sub });
  b += folder(32, 108, 640, 50, ['#ffffff', C.ink], 'main.ts', ['builds the Phaser game and GameContext; loads dev/ only in dev builds; exposes window.__rps for tests']);
  // presentation row
  const py = 172;
  b += folder(32, py, 204, 150, 'pres', 'scenes/', ['Boot, Cabinet, Logo, Home,', 'Options, Fight, Result,', 'Transition (pixel wipe)', 'flow.ts: SceneFlow', 'context.ts: GameContext,', 'CabinetLights', 'monitor.ts, keys.ts']);
  b += folder(250, py, 204, 70, 'pres', 'fight/', ['FightDirector: session events', '→ choreography']);
  b += folder(250, py + 80, 204, 70, 'pres', 'menus/', ['MenuItem; home, options and', 'result menus as data']);
  b += folder(468, py, 204, 150, 'pres', 'views/', ['FighterView, HudView,', 'MoveIconView, BannerView,', 'ButtonsView, JoystickView,', 'MenuView, PixelText', '', 'dumb: show what', 'they are told']);
  b += folder(32, py + 164, 204, 60, 'pres', 'fx/', ['shake (whole px), flash']);
  b += folder(250, py + 164, 204, 60, 'pres', 'input/', ['InputRouter: keys, taps, stick']);
  b += folder(468, py + 164, 204, 60, 'pres', 'assets/', ['keys.ts, pixel font, placeholders/']);
  // session
  const sy = py + 238;
  b += folder(32, sy, 640, 66, 'session', 'session/', ['MatchSession (interface), LocalSession, MoveSource, cpu/RandomCpu, createSession(setup), browserClock']);
  // platform + config
  const fy = sy + 80;
  b += folder(32, fy, 204, 74, 'plat', 'platform/', ['PixelScaler + computeLayout', 'SettingsStore (localStorage)']);
  b += folder(250, fy, 204, 74, ['#f7f5fd', C.line], 'config/', ['tuning.ts (feel), layout.ts', 'palette.ts']);
  b += folder(468, fy, 98, 74, ['#f7f5fd', C.line], 'util/', ['snap, gfx']);
  b += folder(574, fy, 98, 74, ['#fff4e0', '#c27a00'], 'dev/', ['tuning panel', '(dev only)']);
  // core
  const cy = fy + 92;
  b += text(32, cy - 6, 'packages/core/src  (@rps/core)', { weight: 700, size: 13, mono: true, fill: C.sub });
  b += folder(32, cy, 204, 74, 'core', 'rules/', ['types, exchange.ts', '(resolve, apply, rounds)']);
  b += folder(250, cy, 204, 74, 'core', 'referee/', ['Referee, Clock + Rng', '(seededRng), Emitter']);
  b += folder(468, cy, 204, 74, 'core', 'config.ts · index.ts', ['defaultRules, defaultTimings', 'index = the public API']);

  // lint panel
  b += box(700, 100, 276, 538, C.warn, { r: 12 });
  b += text(716, 126, 'Blocked imports (lint)', { weight: 700, size: 15 });
  const bans = [
    ['packages/core', '✕ anything in apps/, ✕ phaser'],
    ['session/', '✕ scenes, views, fight, fx,', '   input, platform, ✕ phaser'],
    ['views/, fx/', '✕ session, scenes, fight'],
    ['fight/', '✕ scenes'],
    ['fight/, scenes/, views/', '✕ the Referee: talk to a', '   MatchSession instead'],
    ['platform/', '✕ session, scenes, views, fight'],
    ['everything but main.ts', '✕ dev/ (the panel stays out', '   of release builds)'],
  ];
  let ly = 156;
  bans.forEach(([who, ...what]) => {
    b += text(716, ly, who, { weight: 700, size: 12.5, mono: true });
    b += text(716, ly + 17, what, { size: 12, fill: C.warn[1], lh: 15 });
    ly += 30 + what.length * 15;
  });
  b += text(716, ly + 6, ['Also: TypeScript strict, no any,', 'type-only imports marked as such,', 'Prettier formatting (CI checks it).'], { size: 12, fill: C.sub, lh: 16 });
  b += text(32, 692, 'Not built yet, with a place reserved: audio/ (AudioService), session/OnlineSession.ts, scenes/LobbyScene.ts, the server room.', { size: 12.5, fill: C.sub, italic: true });
  svg('8-code-map.svg', W, H, 'Code map', b);
}

// =====================================================================
// 9. Online hosting options (the game itself stays on GitHub Pages)
// =====================================================================
{
  const W = 1000, H = 540;
  let b = text(32, 44, 'Where online matches could run (the game files stay on GitHub Pages)', { size: 22, weight: 800 });
  b += text(32, 68, 'GitHub Pages only serves files, so the two players need something live in between. Three free ways to do it:', { fill: C.sub });
  const colW = 300, gap = 18;
  const col = (i, title, rec) => {
    const x = 32 + i * (colW + gap);
    return [x, box(x, 88, colW, 420, ['#ffffff', rec ? C.server[1] : C.faint], { r: 14, sw: rec ? 3 : 2 }) + text(x + 16, 116, title, { weight: 800, size: 15 }) + (rec ? text(x + 16, 136, 'RECOMMENDED', { size: 11.5, weight: 800, fill: C.server[1] }) : '')];
  };
  const player = (x, y, label) => box(x, y, 110, 44, 'pres', { r: 8 }) + text(x + 55, y + 27, label, { anchor: 'middle', size: 12.5, weight: 600 });
  const pros = (x, y, good, bad) => text(x, y, good.map((g) => (g.startsWith(' ') ? '\u00a0\u00a0\u00a0' + g.trim() : '+ ' + g)), { size: 12, fill: C.server[1], lh: 17 }) + text(x, y + good.length * 17 + 6, bad.map((g) => (g.startsWith(' ') ? '\u00a0\u00a0\u00a0' + g.trim() : '− ' + g)), { size: 12, fill: C.warn[1], lh: 17 });

  // A
  let [x, s] = col(0, 'A. Cloudflare Durable Object', true); b += s;
  b += card(x + 40, 156, 220, 92, 'server', 'Match room', ['one Durable Object per room', 'runs the same Referee', '(@rps/core) + the timer'], {});
  b += player(x + 20, 300, 'Player A') + player(x + 170, 300, 'Player B');
  b += arrow(`M ${x + 75} 298 L ${x + 110} 250`, 'server', { both: true }) + arrow(`M ${x + 225} 298 L ${x + 190} 250`, 'server', { both: true });
  b += text(x + 150, 284, 'WebSocket', { anchor: 'middle', size: 11.5, fill: C.server[1], weight: 600 });
  b += pros(x + 16, 378, ['server decides: picks stay secret', 'free plan: 100k requests a day', 'wakes in milliseconds, no sleep', 'TypeScript, shares packages/core'], ['needs a free Cloudflare account', 'room code written by us (~200', '  lines), not Colyseus']);

  // B
  [x, s] = col(1, 'B. Peer-to-peer (PeerJS)', false); b += s;
  b += player(x + 20, 190, 'Player A (host)') + player(x + 170, 190, 'Player B');
  b += arrow(`M ${x + 132} 212 L ${x + 168} 212`, 'pres', { both: true });
  b += text(x + 150, 182, 'WebRTC', { anchor: 'middle', size: 11.5, fill: C.pres[1], weight: 600 });
  b += box(x + 20, 266, 120, 44, ['#f7f5fd', C.line], { r: 8, dash: true }) + text(x + 80, 286, ['signalling', '(PeerJS cloud)'], { anchor: 'middle', size: 11.5, lh: 13 });
  b += box(x + 160, 266, 120, 44, ['#f7f5fd', C.line], { r: 8, dash: true }) + text(x + 220, 286, ['TURN relay for', 'strict networks'], { anchor: 'middle', size: 11.5, lh: 13 });
  b += arrow(`M ${x + 80} 264 L ${x + 75} 236`, 'line', { dash: true }) + arrow(`M ${x + 220} 264 L ${x + 225} 236`, 'line', { dash: true });
  b += text(x + 150, 340, 'the host\'s browser runs the Referee', { anchor: 'middle', size: 12, fill: C.sub, italic: true });
  b += pros(x + 16, 378, ['no server code to deploy', 'free signalling and STUN', 'lowest delay when it connects'], ['host could peek at picks unless', '  we add commit-reveal hashing', 'some networks fail without TURN', 'free PeerJS cloud: no guarantees']);

  // C
  [x, s] = col(2, 'C. Colyseus on Render (free)', false); b += s;
  b += card(x + 40, 156, 220, 92, ['#f7f5fd', C.server[1]], 'Node + Colyseus', ['the original plan', 'MatchRoom runs the Referee', 'on a free web service'], {});
  b += player(x + 20, 300, 'Player A') + player(x + 170, 300, 'Player B');
  b += arrow(`M ${x + 75} 298 L ${x + 110} 250`, 'server', { both: true }) + arrow(`M ${x + 225} 298 L ${x + 190} 250`, 'server', { both: true });
  b += text(x + 150, 284, 'WebSocket', { anchor: 'middle', size: 11.5, fill: C.server[1], weight: 600 });
  b += pros(x + 16, 378, ['server decides: picks stay secret', 'Colyseus does rooms + reconnects', 'plain Node, easy to move later'], ['free service sleeps after 15 min', '  idle; ~1 min to wake up', '750 free hours a month', 'Colyseus Cloud is paid ($15/mo)']);
  svg('9-online-options.svg', W, H, 'Online hosting options', b);
}
