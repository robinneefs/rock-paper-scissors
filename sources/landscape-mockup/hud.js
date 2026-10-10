// HUD overlay for the 1280x720 stage. Coordinates for popups are in 320x180 canvas pixels.
(function () {
  function iconCanvas(move) {
    const c = document.createElement('canvas');
    c.width = 25; c.height = 25;
    window.RPSArt.drawIcon(c.getContext('2d'), move, 12, 12);
    return c;
  }
  function buildStage(host) {
    host.classList.add('stage');
    host.innerHTML = `
      <canvas width="320" height="180"></canvas>
      <div class="hud-top">
        <div class="side left"><div class="name">YOU <small>Red Band</small></div><div class="bar"><div class="lost"></div><div class="hp"></div><span class="num"></span></div><div class="pips"><span class="pip"></span><span class="pip"></span></div></div>
        <div class="timer"><span class="t">5</span><span class="lbl">PICK!</span></div>
        <div class="side right"><div class="name"><small>Gold Band</small> CPU</div><div class="bar"><div class="lost"></div><div class="hp"></div><span class="num"></span></div><div class="pips"><span class="pip"></span><span class="pip"></span></div></div>
      </div>
      <div class="round-tag"></div>
      <div class="status"></div>
      <div class="pops"></div>
      <div class="overlay"></div>
      <div class="moves">
        <button class="move attack" data-move="attack"><span class="ic"></span>Attack<span class="key">1</span></button>
        <button class="move throw" data-move="throw"><span class="ic"></span>Throw<span class="key">2</span></button>
        <button class="move block" data-move="block"><span class="ic"></span>Block<span class="key">3</span></button>
      </div>`;
    host.querySelectorAll('.move').forEach((b) => b.querySelector('.ic').replaceWith(iconCanvas(b.dataset.move)));
    const q = (s) => host.querySelector(s);
    const canvas = q('canvas');
    const sides = host.querySelectorAll('.side');
    function setBar(side, hp, lost) {
      const bar = side.querySelector('.bar');
      bar.querySelector('.hp').style.width = hp + '%';
      bar.querySelector('.hp').classList.toggle('low', hp <= 25);
      bar.querySelector('.lost').style.width = (lost ?? hp) + '%';
      bar.querySelector('.num').textContent = hp;
    }
    function setHud(h) {
      if (h.hp1 != null) setBar(sides[0], h.hp1, h.lost1);
      if (h.hp2 != null) setBar(sides[1], h.hp2, h.lost2);
      if (h.won1 != null) sides[0].querySelectorAll('.pip').forEach((p, i) => p.classList.toggle('won', i < h.won1));
      if (h.won2 != null) sides[1].querySelectorAll('.pip').forEach((p, i) => p.classList.toggle('won', i < h.won2));
      if (h.timer !== undefined) {
        q('.timer .t').textContent = h.timer ?? 'VS';
        q('.timer').classList.toggle('vs', h.timer === null);
        q('.timer').classList.toggle('hurry', h.timer !== null && h.timer <= 2);
      }
      if (h.timerLabel !== undefined) q('.timer .lbl').textContent = h.timerLabel;
      if (h.round !== undefined) q('.round-tag').textContent = h.round;
      if (h.status !== undefined) q('.status').textContent = h.status;
      if (h.selected !== undefined || h.locked !== undefined) {
        host.querySelectorAll('.move').forEach((b) => {
          b.classList.toggle('sel', b.dataset.move === h.selected);
          b.classList.toggle('dim', !!h.locked && b.dataset.move !== h.selected);
        });
      }
      if (h.showMoves !== undefined) q('.moves').hidden = !h.showMoves;
      if (h.pops !== undefined) {
        q('.pops').innerHTML = h.pops.map((p) => `<div class="dmg ${p.cls || ''}" style="left:${p.x * 4}px;top:${p.y * 4}px">${p.text}</div>`).join('');
      }
      if (h.banner !== undefined) {
        q('.overlay').innerHTML = h.banner
          ? `${h.banner.dim ? '<div class="vignette"></div>' : ''}<div class="banner">${h.banner.title}${h.banner.sub ? `<small>${h.banner.sub}</small>` : ''}</div>${h.banner.cta ? `<div class="cta">${h.banner.cta}</div>` : ''}`
          : '';
      }
    }
    return { host, canvas, ctx: canvas.getContext('2d'), setHud };
  }
  window.RPSHud = { buildStage };
})();
