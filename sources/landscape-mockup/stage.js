// Pixel-art stage renderer for RPS Rivals mock-ups.
// Draws on a 320x180 canvas, scaled up 4x with crisp pixels.
(function () {
  const W = 320, H = 180, GROUND = 140;

  const INK = '#1a1326';
  const SKIN = '#eab68c', SKIN_D = '#c58a63', HAIR = '#2a1b14';
  const PAL = {
    p1: { gi: '#e9e2d2', giD: '#b7ad99', belt: '#1c1c1c', band: '#d83a3f' },
    p2: { gi: '#2f4675', giD: '#1f2f52', belt: '#e2a93b', band: '#e2a93b' },
  };
  const MOVE = {
    attack: { color: '#e5483f', dark: '#8f1f22', label: 'Attack' },
    throw: { color: '#f0a92e', dark: '#8a5410', label: 'Throw' },
    block: { color: '#2bb3a3', dark: '#11645b', label: 'Block' },
  };

  // Angles in degrees: 0 = toward opponent, 90 = down, -90 = up.
  const POSES = {
    idle:    { torso: -82, legF: [60, 96], legB: [116, 100], armF: [58, -62], armB: [78, -78] },
    attack:  { torso: -70, legF: [36, 88], legB: [136, 140], armF: [-6, -4], armB: [112, -118], lean: 4 },
    throw:   { torso: -52, legF: [48, 92], legB: [128, 118], armF: [14, 26], armB: [28, 8], lean: 5 },
    block:   { torso: -96, legF: [74, 96], legB: [112, 94], armF: [34, -100], armB: [46, -96] },
    counter: { torso: -76, legF: [50, 92], legB: [126, 120], armF: [-2, -12], armB: [62, -92], lean: 3 },
    hurt:    { torso: -116, legF: [80, 104], legB: [104, 82], armF: [-150, -120], armB: [-170, 160], lean: -4 },
    air:     { torso: -150, legF: [-40, -20], legB: [-20, 0], armF: [-110, -150], armB: [-90, -130], air: 36, lean: -6 },
    ko:      { torso: 178, legF: [2, 0], legB: [-6, 4], armF: [166, 178], armB: [190, 182], air: 6 },
    win:     { torso: -88, legF: [66, 94], legB: [114, 92], armF: [-78, -94], armB: [70, -76] },
  };

  const L = { thigh: 15, shin: 15, torso: 18, upper: 11, fore: 11 };
  const rad = (d) => (d * Math.PI) / 180;
  const pt = (x, y, ang, len) => [x + Math.cos(rad(ang)) * len, y + Math.sin(rad(ang)) * len];

  function seg(ctx, s, ox, x0, y0, x1, y1, w, color) {
    ctx.fillStyle = color;
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = ox + s * (x0 + (x1 - x0) * t), y = y0 + (y1 - y0) * t;
      ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
    }
  }
  function box(ctx, s, ox, cx, cy, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(ox + s * cx - w / 2), Math.round(cy - h / 2), w, h);
  }

  // Draw one fighter. who: 'p1' | 'p2'. facing: 1 right, -1 left.
  function drawFighter(ctx, who, x, pose, opts = {}) {
    const p = Object.assign({}, POSES[pose] || POSES.idle);
    const pal = PAL[who];
    const s = opts.facing || 1;
    const bob = opts.bob || 0;
    // Leg geometry relative to hip at (0,0)
    const kneeF = pt(0, 0, p.legF[0], L.thigh), footF = pt(kneeF[0], kneeF[1], p.legF[1], L.shin);
    const kneeB = pt(0, 0, p.legB[0], L.thigh), footB = pt(kneeB[0], kneeB[1], p.legB[1], L.shin);
    let hipY = p.air != null ? GROUND - p.air : GROUND - Math.max(footF[1], footB[1]);
    hipY += bob + (opts.dy || 0);
    const ox = x + (p.lean || 0) * s;
    const T = (pts) => pts.map(([a, b]) => [a, b + hipY]);
    const [kF, fF, kB, fB] = T([kneeF, footF, kneeB, footB]);
    const neck = pt(0, hipY, p.torso, L.torso);
    const shF = pt(0, hipY, p.torso, L.torso - 3), shB = pt(0, hipY, p.torso, L.torso - 4);
    const elF = pt(shF[0], shF[1], p.armF[0], L.upper), haF = pt(elF[0], elF[1], p.armF[1], L.fore);
    const elB = pt(shB[0], shB[1], p.armB[0], L.upper), haB = pt(elB[0], elB[1], p.armB[1], L.fore);
    const head = pt(0, hipY, p.torso, L.torso + 7);

    const limb = (a, b, c, w, col, foot) => {
      seg(ctx, s, ox, a[0], a[1], b[0], b[1], w, col);
      seg(ctx, s, ox, b[0], b[1], c[0], c[1], w, col);
      if (foot) box(ctx, s, ox, c[0] + 2, c[1], w + 2, 4, foot);
    };
    // Shadow
    ctx.fillStyle = 'rgba(10,6,20,0.35)';
    ctx.fillRect(Math.round(ox - 16), GROUND + 1, 32, 4);

    // Back limbs (outline + fill)
    limb([0, hipY], kB, fB, 8, INK); limb([0, hipY], kB, fB, 6, pal.giD, SKIN_D);
    limb(shB, elB, haB, 7, INK); limb(shB, elB, haB, 5, pal.giD);
    box(ctx, s, ox, haB[0], haB[1], 8, 8, INK); box(ctx, s, ox, haB[0], haB[1], 6, 6, SKIN_D);

    // Front silhouette outline
    seg(ctx, s, ox, 0, hipY, neck[0], neck[1], 13, INK);
    limb([0, hipY], kF, fF, 8, INK);
    box(ctx, s, ox, head[0], head[1], 12, 13, INK);
    limb(shF, elF, haF, 7, INK);
    box(ctx, s, ox, haF[0], haF[1], 8, 8, INK);
    // Fills
    seg(ctx, s, ox, 0, hipY, neck[0], neck[1], 11, pal.gi);
    // gi lapel
    seg(ctx, s, ox, neck[0], neck[1], (neck[0] * 0.5), hipY - 7, 2, pal.giD);
    limb([0, hipY], kF, fF, 6, pal.gi, SKIN);
    // belt
    const bx = pt(0, hipY, p.torso, 2);
    box(ctx, s, ox, bx[0], bx[1], 12, 3, pal.belt);
    box(ctx, s, ox, bx[0] - 4, bx[1] + 3, 2, 5, pal.belt);
    // head
    box(ctx, s, ox, head[0], head[1], 10, 11, SKIN);
    box(ctx, s, ox, head[0] - 1, head[1] - 4, 10, 4, HAIR);
    box(ctx, s, ox, head[0], head[1] - 1, 10, 2, pal.band);
    box(ctx, s, ox, head[0] - 7, head[1] - 1, 4, 2, pal.band);
    box(ctx, s, ox, head[0] - 10, head[1] + 1, 3, 2, pal.band);
    if (pose === 'ko') {
      box(ctx, s, ox, head[0] + 2, head[1] + 2, 4, 1, INK);
    } else {
      box(ctx, s, ox, head[0] + 3, head[1] + 1, 2, 3, INK); box(ctx, s, ox, head[0] + 5, head[1] + 4, 1, 1, SKIN_D);
    }
    // front arm
    limb(shF, elF, haF, 5, pal.gi);
    box(ctx, s, ox, haF[0], haF[1], 6, 6, SKIN);
    return { hand: [ox + s * haF[0], haF[1]], head: [ox + s * head[0], head[1]] };
  }

  // 11x11 glyphs
  const GLYPH = {
    attack: [
      '..XXXXXXX..', '.XX.X.X.XX.', '.XXXXXXXXX.', 'XXXXXXXXXX.', 'XXXXXXXXXX.',
      'XXXXXXXXX..', '.XXXXXXXX..', '..XXXXXX...', '..XXXXXX...', '..XXXXXX...', '...........'],
    throw: [
      '...XXXXX...', '..X.....X..', '.X.......X.', 'X.........X', 'X.........X',
      'X......XXXXX', 'X.......XXX.', '.X.......X..', '..X........', '...XXXX....', '...........'],
    block: [
      'XXXXXXXXXXX', 'X.........X', 'X...XXX...X', 'X..XXXXX..X', 'X...XXX...X',
      'X....X....X', '.X.......X.', '.X.......X.', '..X.....X..', '...X...X...', '....XXX....'],
  };
  function drawIcon(ctx, move, cx, cy) {
    const m = MOVE[move];
    const r = 10;
    for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
      const d = Math.hypot(x, y);
      if (d <= r + 1.2) { ctx.fillStyle = d > r ? INK : (y > 3 ? m.dark : m.color); ctx.fillRect(cx + x, cy + y, 1, 1); }
    }
    const g = GLYPH[move];
    for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) {
      if (g[y][x] === 'X') { ctx.fillStyle = '#fff8ec'; ctx.fillRect(cx - 5 + x, cy - 5 + y, 1, 1); }
    }
  }
  function drawQuestion(ctx, cx, cy) {
    const r = 10;
    for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
      const d = Math.hypot(x, y);
      if (d <= r + 1.2) { ctx.fillStyle = d > r ? INK : '#4a3f63'; ctx.fillRect(cx + x, cy + y, 1, 1); }
    }
    const q = ['.XXXX.', 'XX..XX', '....XX', '...XX.', '..XX..', '..XX..', '......', '..XX..'];
    q.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') { ctx.fillStyle = '#d9d0ef'; ctx.fillRect(cx - 3 + x, cy - 4 + y, 1, 1); } }));
  }

  function drawBackdrop(ctx) {
    const bands = ['#171433', '#1f1a44', '#2b2052', '#3d2659', '#552c5d', '#743460', '#9a3f5d', '#c2555a', '#e07a58', '#f0a066'];
    const top = 0, bot = 100, step = (bot - top) / bands.length;
    bands.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, Math.floor(top + i * step), W, Math.ceil(step) + 1); });
    // dither between bands
    for (let i = 1; i < bands.length; i++) {
      const y = Math.floor(top + i * step);
      ctx.fillStyle = bands[i - 1];
      for (let x = (i % 2); x < W; x += 2) ctx.fillRect(x, y, 1, 1);
    }
    // stars
    ctx.fillStyle = '#cfc6f0';
    [[22, 9], [61, 18], [96, 6], [140, 14], [201, 8], [244, 19], [281, 7], [305, 23], [176, 26], [40, 30]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
    // sun
    const sx = 160, sy = 96, sr = 30;
    for (let y = -sr; y <= 0; y++) for (let x = -sr; x <= sr; x++) {
      if (x * x + y * y <= sr * sr) {
        const yy = sy + y;
        if (yy > 78 && (yy % 5 === 0 || (yy > 88 && yy % 3 === 0))) continue;
        ctx.fillStyle = y < -18 ? '#ffd9a0' : '#ffc27a'; ctx.fillRect(sx + x, yy, 1, 1);
      }
    }
    // mountains
    const ridge = (base, amp, f, ph, col) => {
      ctx.fillStyle = col;
      for (let x = 0; x < W; x++) {
        const h = Math.round(base - amp * (0.55 * Math.sin(x * f + ph) + 0.3 * Math.sin(x * f * 2.3 + ph * 2) + 0.15 * Math.sin(x * f * 5.1)));
        ctx.fillRect(x, h, 1, 110 - h);
      }
    };
    ridge(86, 16, 0.021, 1.2, '#5a2d55');
    ridge(96, 10, 0.034, 3.1, '#3c2245');
    // rooftop floor
    ctx.fillStyle = '#2a1830'; ctx.fillRect(0, 100, W, 4);
    ctx.fillStyle = '#6b3f2e'; ctx.fillRect(0, 104, W, H - 104);
    for (let y = 104; y < H; y += 6) { ctx.fillStyle = '#5a3426'; ctx.fillRect(0, y, W, 1); }
    for (let y = 104, r = 0; y < H; y += 6, r++) {
      ctx.fillStyle = '#4b2a20';
      for (let x = (r * 37) % 53; x < W; x += 53) ctx.fillRect(x, y, 1, 6);
    }
    ctx.fillStyle = '#8a5640'; ctx.fillRect(0, 104, W, 1);
    // fighting ring mat
    ctx.fillStyle = '#7d4a36'; ctx.fillRect(76, 124, 168, 20);
    ctx.fillStyle = '#9b5e43'; ctx.fillRect(76, 124, 168, 1);
    ctx.fillStyle = '#5a3426'; ctx.fillRect(76, 143, 168, 1);
    // lanterns
    const lantern = (x) => {
      ctx.fillStyle = '#2a1830'; ctx.fillRect(x, 58, 2, 64);
      ctx.fillRect(x - 6, 58, 14, 2);
      ctx.fillStyle = '#d8432f'; ctx.fillRect(x - 4, 62, 10, 12);
      ctx.fillStyle = '#ff9a4a'; ctx.fillRect(x - 2, 64, 6, 8);
      ctx.fillStyle = '#2a1830'; ctx.fillRect(x - 4, 62, 10, 1); ctx.fillRect(x - 4, 73, 10, 1);
    };
    lantern(30); lantern(288);
  }

  function drawSpark(ctx, x, y, big) {
    const c = ['#fff6d6', '#ffd36b', '#ff8a3d'];
    const arms = big ? 9 : 6;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4, len = i % 2 ? arms * 0.55 : arms;
      for (let t = 0; t <= len; t++) {
        ctx.fillStyle = c[Math.min(2, Math.floor(t / (len / 3)))];
        ctx.fillRect(Math.round(x + Math.cos(a) * t), Math.round(y + Math.sin(a) * t), 1, 1);
      }
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, 5, 5);
  }

  // state: { p1:{x,pose,dy,icon,iconY}, p2:{...}, spark:{x,y,big}, flash }
  function render(ctx, st) {
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (st.shake) ctx.translate(st.shake[0], st.shake[1]);
    drawBackdrop(ctx);
    const order = st.p1.front ? ['p2', 'p1'] : ['p1', 'p2'];
    const out = {};
    order.forEach((k) => {
      const f = st[k];
      out[k] = drawFighter(ctx, k, f.x, f.pose, { facing: k === 'p1' ? 1 : -1, bob: f.bob || 0, dy: f.dy || 0 });
    });
    ['p1', 'p2'].forEach((k) => {
      const f = st[k];
      const ix = Math.round(f.iconX ?? (k === 'p1' ? 124 : 196)), iy = Math.round(f.iconY ?? 40);
      if (f.icon === '?') drawQuestion(ctx, ix, iy);
      else if (f.icon) drawIcon(ctx, f.icon, ix, iy);
    });
    if (st.spark) drawSpark(ctx, st.spark.x, st.spark.y, st.spark.big);
    ctx.restore();
    if (st.flash) { ctx.fillStyle = `rgba(255,248,230,${st.flash})`; ctx.fillRect(0, 0, W, H); }
    return out;
  }

  window.RPSArt = { W, H, GROUND, POSES, MOVE, PAL, render, drawFighter, drawIcon, drawBackdrop };
})();
