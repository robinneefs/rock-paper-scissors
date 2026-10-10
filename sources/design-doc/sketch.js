// Playable arcade cabinet for the interactive design document.
// Native 270x472 frame, monitor 216x288, everything drawn in whole pixels and scaled by whole device pixels.
// Screen flow: logo intro -> home menu -> fight vs random CPU (best of three) -> result (retry / main menu).
// Needs art.js, pixfont.js and screens.js loaded first.
(function () {
  const host = document.getElementById('cab');
  if (!host) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CW = 270, CH = 472, MX = 27, MY = 44, MW = 216, MH = 288, PY = 344;
  const BTN = [{ m: 'attack', x: 112 }, { m: 'throw', x: 170 }, { m: 'block', x: 228 }], BY = PY + 50, JX = 44, JY = PY + 58;
  const DMG = { attack: 15, throw: 20, block: 10 }, BEATS = { attack: 'throw', throw: 'block', block: 'attack' };
  const MOVES_ = ['attack', 'throw', 'block'], LABEL = { attack: 'ATTACK', throw: 'THROW', block: 'BLOCK' };
  const S = SCREENS, F = PIXFONT;

  // ---------- canvas + whole-device-pixel scaling ----------
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cv.className = 'cab-canvas';
  cv.tabIndex = 0; cv.setAttribute('role', 'application');
  cv.setAttribute('aria-label', 'Playable arcade cabinet. Keys 1, 2, 3 press Attack, Throw, Block. Arrow keys move the joystick. Enter confirms, Escape goes back.');
  host.appendChild(cv);
  const ctx = cv.getContext('2d');
  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const wrap = host.closest('.wrap') || document.body, twoCol = window.innerWidth > 860;
    const availW = wrap.clientWidth * (twoCol ? 0.5 : 1), availH = Math.max(480, window.innerHeight - 40);
    const k = Math.max(1, Math.floor(Math.min(availW * dpr / CW, availH * dpr / CH)));
    cv.style.width = (CW * k / dpr) + 'px'; cv.style.height = (CH * k / dpr) + 'px';
  }
  fit(); addEventListener('resize', fit);
  if (window.ResizeObserver) new ResizeObserver(fit).observe(host.parentElement);

  // ---------- pixel helpers (same as the cabinet mock-up) ----------
  const rgb = (c) => Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : c;
  const R = (c2, x, y, w, h, c) => { c2.fillStyle = rgb(c); c2.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function ell(c2, cx, cy, rx, ry, c) { c2.fillStyle = rgb(c); for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / (ry + 0.5)) ** 2))); c2.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); } }
  function sdfDraw(c2, cx, cy, k, f, base, shade) {
    for (let py = Math.floor(cy - 10 * k); py < cy + 10 * k; py++) for (let px = Math.floor(cx - 10 * k); px < cx + 10 * k; px++) {
      const X = (px + 0.5 - cx) / k, Y = (py + 0.5 - cy) / k, d = f(X, Y) * k;
      if (d < 0) R(c2, px, py, 1, 1, shade && f(X + 0.9 / k, Y + 1.2 / k) >= 0 ? shade : base); else if (d < 1) R(c2, px, py, 1, 1, INK);
    }
  }
  const shadeOf = (c, f) => c.map((v) => Math.round(v * f));

  // ---------- the cabinet body, redrawn only when a button or the stick changes ----------
  const cab = document.createElement('canvas'); cab.width = CW; cab.height = CH; const cc = cab.getContext('2d');
  let cabKey = '';
  function drawCabinet(pressed, dimOthers, tilt) {
    const key = pressed + '|' + dimOthers + '|' + tilt;
    if (key === cabKey) return; cabKey = key;
    const W = CW, body = [44, 22, 88], bodyD = [28, 12, 60], edge = [255, 47, 191];
    cc.clearRect(0, 0, W, CH);
    R(cc, 0, 0, W, CH, body); R(cc, 0, 0, 6, CH, bodyD); R(cc, W - 6, 0, 6, CH, bodyD); R(cc, 2, 0, 1, CH, edge); R(cc, W - 3, 0, 1, CH, edge);
    const mq = [[120, 20, 120], [170, 30, 140], [220, 50, 160]];
    for (let i = 0; i < 26; i++) R(cc, 8, 3 + i, W - 16, 1, mq[Math.min(2, Math.floor(i / 26 * 3))]);
    R(cc, 8, 3, W - 16, 1, [255, 170, 230]); R(cc, 8, 28, W - 16, 1, [60, 10, 70]);
    F.draw(cc, 'RPS FIGHTER', W / 2, 7, '#ffffff', { align: 'center', scale: 2, shadow: '#5a0b4a' });
    R(cc, 15, 32, MW + 2 * 12, MH + 24, [11, 7, 22]); R(cc, MX - 3, MY - 3, MW + 6, MH + 6, [24, 16, 40]);
    R(cc, 0, PY, W, 128, [58, 32, 112]); R(cc, 0, PY, W, 2, [90, 56, 160]);
    for (let i = 0; i < 3; i++) R(cc, 8, PY + 98 + i * 5, W - 16, 2, [[255, 47, 191], [255, 179, 33], [63, 240, 255]][i]);
    R(cc, 0, PY + 116, W, 12, bodyD); R(cc, 0, PY + 116, W, 1, [90, 56, 160]);
    // joystick
    ell(cc, JX, JY + 4, 20, 12, [20, 10, 40]); ell(cc, JX, JY + 2, 17, 10, [36, 22, 66]); ell(cc, JX, JY + 2, 6, 3, [12, 6, 24]);
    const [tx, ty] = tilt.split(',').map(Number), bx = JX + tx * 9, by = JY - 26 + ty * 6;
    for (let t = 0; t <= 1; t += 0.02) R(cc, JX + (bx - JX) * t - 1.5, JY + (by + 6 - JY) * t, 4, 1, t < 0.2 ? [60, 60, 80] : [150, 150, 175]);
    ell(cc, bx, by, 11, 10, [150, 20, 60]); ell(cc, bx - 1, by - 1, 10, 9, [230, 40, 90]); ell(cc, bx - 3, by - 4, 4, 3, [255, 150, 180]); R(cc, bx - 5, by - 6, 2, 1, [255, 255, 255]);
    // buttons
    for (const b of BTN) {
      const col = MOVES[b.m].c, press = pressed === b.m, dim = dimOthers && !press;
      const top = press ? BY + 4 : BY, side = press ? 2 : 7;
      ell(cc, b.x, BY + 9, 25, 16, [18, 8, 34]);
      if (press) { cc.globalAlpha = 0.35; ell(cc, b.x, BY + 6, 32, 22, col); cc.globalAlpha = 1; ell(cc, b.x, BY + 9, 25, 16, [18, 8, 34]); }
      for (let s = side; s >= 0; s--) ell(cc, b.x, top + s, 22, 15, shadeOf(col, dim ? 0.25 : 0.55));
      ell(cc, b.x, top, 22, 15, shadeOf(col, dim ? 0.35 : press ? 1 : 0.88));
      ell(cc, b.x - 5, top - 5, 10, 5, shadeOf(col.map((v) => Math.min(255, v + 60)), dim ? 0.4 : 1));
      sdfDraw(cc, b.x, top + 1, 1.15, iconSdf(b.m), dim ? [60, 40, 90] : [255, 255, 255], dim ? [40, 30, 70] : [200, 190, 230]);
      F.draw(cc, LABEL[b.m], b.x, BY + 26, MOVES[b.m].css, { align: 'center', shadow: '#1a0f2e' });
    }
    F.draw(cc, '1', BTN[0].x + 20, BY - 16, '#c9b8ff'); F.draw(cc, '2', BTN[1].x + 20, BY - 16, '#c9b8ff'); F.draw(cc, '3', BTN[2].x + 20, BY - 16, '#c9b8ff');
  }

  // ---------- game state ----------
  const mon = document.createElement('canvas'); mon.width = MW; mon.height = MH; const mc = mon.getContext('2d');
  const G = {
    scene: 'logo', t0: performance.now(), sel: 0, toast: null, trans: null,
    pressed: '', pressT: 0, tilt: [0, 0], keyTilt: [0, 0], dragTilt: null,
    match: null,
  };
  const listeners = new Set();
  const onScene = (fn) => listeners.add(fn);
  function setScene(name) { G.scene = name; G.t0 = performance.now(); G.sel = 0; listeners.forEach((fn) => fn(name)); }
  // one place for screen changes: a short blinds wipe, then the next scene
  function go(name, before) {
    if (G.trans) return;
    G.trans = { t0: performance.now(), name, before, switched: false };
  }

  // ---------- fight ----------
  const HOME = { p1: 84, p2: 132 };
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? Math.min(ms, 200) : ms));
  function tween(ms, fn) {
    return new Promise((res) => {
      if (reduce) { fn(1); return res(); }
      const t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / ms); fn(k); k < 1 ? requestAnimationFrame(step) : res(); };
      requestAnimationFrame(step);
    });
  }
  const bounce = (k) => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };

  function newMatch() {
    const M = {
      id: Math.random(), hp: [100, 100], shown: [100, 100], won: [0, 0], round: 1, timer: null, pick: null, picking: false,
      p1: { x: HOME.p1, pose: 'idle' }, p2: { x: HOME.p2, pose: 'idle' }, icons: null, iconY: 0, spark: null,
      status: '', pops: [], banner: null, shake: 0, blink: null,
    };
    G.match = M; run(M);
  }
  const alive = (M) => G.match === M && G.scene === 'fight';
  async function run(M) {
    await sleep(350);
    while (alive(M)) {
      M.hp = [100, 100]; M.shown = [100, 100];
      M.banner = { text: M.round === 3 ? 'FINAL ROUND' : 'ROUND ' + M.round, col: '#3ff0ff' }; await sleep(900);
      M.banner = { text: 'FIGHT!', col: '#ffb321' }; await sleep(600); M.banner = null;
      while (alive(M) && M.hp[0] > 0 && M.hp[1] > 0) await exchange(M);
      if (!alive(M)) return;
      const w = M.hp[0] > 0 ? 0 : 1; M.won[w]++;
      M.banner = { text: 'K.O.', col: '#ff2fbf' }; await sleep(1100); if (!alive(M)) return;
      if (M.won[w] === 2) {
        G.result = { win: w === 0, score: [M.won[0], M.won[1]] };
        M.banner = null; go('result'); return;
      }
      M.round++; M.banner = null;
      M.p1 = { x: HOME.p1, pose: 'idle' }; M.p2 = { x: HOME.p2, pose: 'idle' };
    }
  }
  async function exchange(M) {
    M.p1 = { x: HOME.p1, pose: 'idle' }; M.p2 = { x: HOME.p2, pose: 'idle' };
    M.icons = null; M.spark = null; M.pops = []; M.pick = null; M.picking = true; M.blink = null;
    const cpu = MOVES_[Math.floor(Math.random() * 3)];
    M.status = 'PICK YOUR MOVE';
    for (let t = 5; t > 0; t--) { M.timer = t; await sleep(1000); if (!alive(M)) return; }
    M.picking = false; M.timer = null;
    let mine = M.pick, auto = false;
    if (!mine) { mine = MOVES_[Math.floor(Math.random() * 3)]; auto = true; }
    M.lockedPick = mine;
    M.status = auto ? 'TIME UP! RANDOM: ' + LABEL[mine] : 'LOCKED IN';
    M.icons = [mine, cpu];
    await tween(480, (k) => { M.iconY = Math.round(-24 + 24 * bounce(k)); });
    await sleep(220); if (!alive(M)) return;
    const res = mine === cpu ? 0 : BEATS[mine] === cpu ? 1 : -1;
    const pose = (m) => m === 'block' ? 'block' : 'attack';
    M.p1.pose = pose(mine); M.p2.pose = pose(cpu);
    if (res === 0) {
      await tween(140, (k) => { M.p1.x = HOME.p1 + Math.round(6 * k); M.p2.x = HOME.p2 - Math.round(6 * k); });
      M.spark = [108, 190]; M.shake = 2; M.status = 'TIE! NO DAMAGE';
      M.pops = [{ x: 108, y: 96, text: 'CLASH!', col: '#c9b8ff' }];
      await sleep(900); return;
    }
    const winMove = res > 0 ? mine : cpu, loser = res > 0 ? 1 : 0, dmg = DMG[winMove];
    const wSide = res > 0 ? 'p1' : 'p2', lSide = res > 0 ? 'p2' : 'p1', dir = res > 0 ? 1 : -1;
    await tween(130, (k) => { M[wSide].x = HOME[wSide] + dir * Math.round(8 * k); });
    M.spark = [108 + dir * 6, 190]; M.shake = dmg / 5; M.blink = lSide;
    M.hp[loser] = Math.max(0, M.hp[loser] - dmg);
    M.pops = [{ x: loser ? 172 : 44, y: 96, text: '-' + dmg, col: '#fff1a8' }];
    M.status = winMove === 'throw' ? 'THROW BEATS BLOCK' : winMove === 'attack' ? 'ATTACK BEATS THROW' : 'BLOCK COUNTERS ATTACK';
    await tween(220, (k) => { M[lSide].x = HOME[lSide] + dir * Math.round(10 * k); });
    const from = M.shown[loser];
    await tween(420, (k) => { M.shown[loser] = Math.round(from + (M.hp[loser] - from) * k); });
    M.blink = null;
    await sleep(700);
  }

  // ---------- drawing the monitor ----------
  function hud(M) {
    const bar = (x, hpS, hp, right) => {
      R(mc, x - 1, 15, 86, 9, '#1a0f2e'); R(mc, x, 16, 84, 7, '#120826');
      const w = Math.round(84 * hpS / 100), w2 = Math.round(84 * hp / 100);
      const lost = right ? [x, w] : [x + 84 - w, w];
      R(mc, lost[0], 16, lost[1], 7, '#fff1a8');
      const xx = right ? x : x + 84 - w2;
      R(mc, xx, 16, w2, 7, hp <= 30 ? '#ff3b6b' : '#3ff0c8'); R(mc, xx, 16, w2, 2, hp <= 30 ? '#ff8fae' : '#b4ffe9');
      R(mc, x - 2, 14, 88, 1, right ? '#ff2fbf' : '#3ff0ff'); R(mc, x - 2, 24, 88, 1, right ? '#ff2fbf' : '#3ff0ff');
    };
    F.draw(mc, 'YOU', 6, 5, '#f6f0ff', { shadow: '#1a0f2e' }); F.draw(mc, 'CPU', 210, 5, '#f6f0ff', { align: 'right', shadow: '#1a0f2e' });
    bar(6, M.shown[0], Math.min(M.shown[0], M.hp[0]), false); bar(126, M.shown[1], Math.min(M.shown[1], M.hp[1]), true);
    for (let i = 0; i < 2; i++) {
      for (const [x, w] of [[6 + i * 8, M.won[0] > i], [204 - i * 8, M.won[1] > i]]) { R(mc, x, 28, 6, 6, '#c9b8ff'); R(mc, x + 1, 29, 4, 4, w ? '#ffb321' : '#120826'); }
    }
    R(mc, 94, 4, 28, 24, '#120826'); S.frame(mc, 94, 4, 28, 24, '#ff2fbf');
    if (M.timer != null) F.draw(mc, String(M.timer), 108, 9, M.timer <= 2 ? '#ff8fc7' : '#f6f0ff', { align: 'center', scale: 2, shadow: '#3d1f66' });
    else F.draw(mc, 'VS', 108, 12, '#ffb321', { align: 'center' });
    F.draw(mc, M.round === 3 ? 'FINAL' : 'ROUND ' + M.round, 108, 32, '#3ff0ff', { align: 'center', shadow: '#1a0f2e' });
    if (M.status) { const w = F.width(M.status) + 10; R(mc, 108 - w / 2, 252, w, 13, '#120826'); S.frame(mc, 108 - w / 2, 252, w, 13, '#3ff0ff'); F.draw(mc, M.status, 108, 255, '#f6f0ff', { align: 'center' }); }
  }
  function drawFight(t) {
    const M = G.match; if (!M) return;
    S.stage(mc);
    const bob = reduce ? 0 : Math.floor(t / 420) % 2;
    const blinkOff = M.blink && Math.floor(t / 60) % 3 === 0;
    if (!(blinkOff && M.blink === 'p1')) S.putFighter(mc, 'p1', M.p1.pose, M.p1.x, S.GY + (M.p1.pose === 'idle' ? bob : 0));
    if (!(blinkOff && M.blink === 'p2')) S.putFighter(mc, 'p2', M.p2.pose, M.p2.x, S.GY + (M.p2.pose === 'idle' ? 1 - bob : 0));
    if (M.icons || M.spark) {
      const img = mc.getImageData(0, 0, MW, MH);
      if (M.icons) { badge(img, MW, MH, M.p1.x + 2, 128 + M.iconY, M.icons[0], 11); badge(img, MW, MH, M.p2.x - 2, 128 + M.iconY, M.icons[1], 11); }
      if (M.spark) spark(img, MW, M.spark[0], M.spark[1], 12);
      mc.putImageData(img, 0, 0);
    } else if (M.picking) {
      const img = mc.getImageData(0, 0, MW, MH);
      badge(img, MW, MH, M.p2.x - 2, 128, '?', 11);
      if (M.pick) badge(img, MW, MH, M.p1.x + 2, 128, M.pick, 11);
      mc.putImageData(img, 0, 0);
      if (M.pick) F.draw(mc, 'ONLY YOU SEE THIS', M.p1.x + 2, 108, '#c9b8ff', { align: 'center', shadow: '#1a0f2e' });
    }
    for (const p of M.pops) F.draw(mc, p.text, p.x, p.y, p.col, { align: 'center', scale: 2, outline: '#1a0f2e', shadow: '#b3165f' });
    hud(M);
    if (M.banner) {
      R(mc, 0, 110, MW, 30, 'rgba(10,4,24,0.7)');
      F.draw(mc, M.banner.text, 108, 115, M.banner.col, { align: 'center', scale: 3, outline: '#1a0f2e', shadow: '#5a0b4a' });
    }
  }

  let homeRects = [], resultRects = [];
  function frame(t) {
    // transition bookkeeping
    let cover = 0;
    if (G.trans) {
      const k = (t - G.trans.t0) / (reduce ? 1 : 260);
      if (k >= 0.5 && !G.trans.switched) { G.trans.switched = true; if (G.trans.before) G.trans.before(); setScene(G.trans.name); if (G.trans.name === 'fight') newMatch(); }
      cover = k < 0.5 ? k * 2 : Math.max(0, 2 - k * 2);
      if (k >= 1) G.trans = null;
    }
    const lt = t - G.t0;
    if (G.scene === 'logo') {
      const level = lt < 500 ? Math.floor(lt / 125) : lt < 2000 ? 4 : lt < 2500 ? 4 - Math.floor((lt - 2000) / 125) : 0;
      S.logo(mc, reduce ? 4 : Math.max(0, Math.min(4, level)));
      if (lt > 2700 && !G.trans) go('home');
    } else if (G.scene === 'home') {
      homeRects = S.home(mc, G.sel, reduce ? 0 : lt).rects;
    } else if (G.scene === 'fight') {
      drawFight(t);
    } else if (G.scene === 'result') {
      resultRects = S.result(mc, { win: G.result.win, score: G.result.score, sel: G.sel }, reduce ? 0 : lt).rects;
    }
    if (G.toast && t < G.toast.until) {
      const w = F.width(G.toast.text) + 10; R(mc, 108 - w / 2, 195, w, 13, '#120826'); S.frame(mc, 108 - w / 2, 195, w, 13, '#ffb321'); F.draw(mc, G.toast.text, 108, 198, '#ffb321', { align: 'center' });
    }
    if (cover > 0) { const h = Math.ceil(cover * 18); for (let y = 0; y < MH; y += 18) R(mc, 0, y, MW, h, '#07040f'); }
    S.crt(mc);
    // cabinet + monitor (with whole-pixel screen shake)
    const M = G.match;
    let sx = 0, sy = 0;
    if (G.scene === 'fight' && M && M.shake > 0 && !reduce) { const a = Math.round(M.shake); sx = Math.round((Math.random() * 2 - 1) * a); sy = Math.round((Math.random() * 2 - 1) * a); M.shake = M.shake > 0.5 ? M.shake * 0.82 : 0; }
    const tilt = G.dragTilt || (G.keyTilt[0] || G.keyTilt[1] ? G.keyTilt : [0, 0]);
    const pressed = G.pressed && t < G.pressT ? G.pressed : (G.scene === 'fight' && M ? (M.picking ? M.pick : M.lockedPick && !M.picking && M.icons ? M.lockedPick : '') || '' : '');
    const dim = G.scene === 'fight' && M && !M.picking && !!M.icons;
    drawCabinet(pressed, dim, tilt.join(','));
    ctx.drawImage(cab, 0, 0);
    R(ctx, MX, MY, MW, MH, '#07040f');
    ctx.save(); ctx.beginPath(); ctx.rect(MX, MY, MW, MH); ctx.clip(); ctx.drawImage(mon, MX + sx, MY + sy); ctx.restore();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- input: one router for buttons, keys, stick and taps ----------
  function toast(text) { G.toast = { text, until: performance.now() + 1400 }; }
  function confirmMenu(i) {
    if (G.trans) return;
    if (G.scene === 'home') {
      const it = S.HOME_ITEMS[i];
      if (!it.enabled) return toast('ONLINE COMES LATER');
      go('fight');
    } else if (G.scene === 'result') {
      go(i === 0 ? 'fight' : 'home');
    }
  }
  function action(a) {
    if (G.scene === 'logo') { if (!G.trans) go('home'); return; }
    if (a.startsWith('pick:')) {
      const m = a.slice(5);
      G.pressed = m; G.pressT = performance.now() + 160;
      if (G.scene === 'fight') { const M = G.match; if (M && M.picking) { M.pick = m; M.status = 'YOU PICKED ' + LABEL[m]; } }
      else confirmMenu(G.sel);
    } else if (a === 'confirm') confirmMenu(G.sel);
    else if (a === 'nav:up' || a === 'nav:down') {
      const items = G.scene === 'home' ? S.HOME_ITEMS : G.scene === 'result' ? S.RESULT_ITEMS : null;
      if (!items) return;
      let i = G.sel;
      for (let n = 0; n < items.length; n++) { i = (i + (a === 'nav:up' ? -1 : 1) + items.length) % items.length; if (items[i].enabled !== false) break; }
      if (i === G.sel && items.length > 1 && G.scene === 'home') toast('ONLINE COMES LATER');
      G.sel = i;
    } else if (a === 'back') { if (G.scene === 'result') go('home'); }
  }
  const held = new Set();
  function syncKeyTilt() {
    G.keyTilt = [(held.has('ArrowRight') ? 1 : 0) - (held.has('ArrowLeft') ? 1 : 0), (held.has('ArrowDown') ? 1 : 0) - (held.has('ArrowUp') ? 1 : 0)];
  }
  let focused = false;
  cv.addEventListener('focus', () => { focused = true; }); cv.addEventListener('blur', () => { focused = false; held.clear(); syncKeyTilt(); });
  addEventListener('keydown', (e) => {
    if (e.target && /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target.tagName)) return;
    const pickKey = { '1': 'attack', '2': 'throw', '3': 'block' }[e.key];
    const arrows = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (arrows.includes(e.key) && !focused) return; // let the page scroll unless the cabinet has focus
    if (pickKey) { e.preventDefault(); action('pick:' + pickKey); }
    else if (arrows.includes(e.key)) { e.preventDefault(); if (!held.has(e.key)) { held.add(e.key); syncKeyTilt(); if (e.key === 'ArrowUp') action('nav:up'); if (e.key === 'ArrowDown') action('nav:down'); } }
    else if ((e.key === 'Enter' || e.key === ' ') && focused) { e.preventDefault(); action('confirm'); }
    else if (e.key === 'Escape' && focused) action('back');
  });
  addEventListener('keyup', (e) => { if (held.delete(e.key)) syncKeyTilt(); });

  const toNative = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * CW / r.width, (e.clientY - r.top) * CH / r.height]; };
  let drag = null;
  cv.addEventListener('pointerdown', (e) => {
    cv.focus({ preventScroll: true });
    const [x, y] = toNative(e);
    for (const b of BTN) if (((x - b.x) / 26) ** 2 + ((y - BY - 2) / 19) ** 2 <= 1) { action('pick:' + b.m); return; }
    if (Math.hypot(x - JX, y - (JY - 22)) < 22) { drag = { x, y, last: [0, 0] }; cv.setPointerCapture(e.pointerId); e.preventDefault(); return; }
    if (x >= MX && x < MX + MW && y >= MY && y < MY + MH) {
      const mx = x - MX, my = y - MY;
      const rects = G.scene === 'home' ? homeRects : G.scene === 'result' ? resultRects : [];
      for (const r of rects) if (mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h) { G.sel = r.i; confirmMenu(r.i); return; }
      if (G.scene === 'logo') action('confirm');
    }
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [x, y] = toNative(e), dx = x - drag.x, dy = y - drag.y;
    const q = (v) => (v > 6 ? 1 : v < -6 ? -1 : 0), tilt = [q(dx), q(dy)];
    if (tilt[1] !== drag.last[1]) { if (tilt[1] === -1) action('nav:up'); if (tilt[1] === 1) action('nav:down'); }
    drag.last = tilt; G.dragTilt = tilt;
  });
  const endDrag = () => { drag = null; G.dragTilt = null; };
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

  // ---------- page controls ----------
  const chips = document.querySelectorAll('[data-screen]');
  onScene((name) => chips.forEach((c) => c.classList.toggle('on', c.dataset.screen === name)));
  const replay = document.getElementById('replay-intro');
  if (replay) replay.addEventListener('click', () => { G.match = null; G.trans = null; setScene('logo'); cv.focus({ preventScroll: true }); });
  setScene('logo');
})();
