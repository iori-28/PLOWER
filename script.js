(() => {
  'use strict';
  const CONFIG = { gravity: 500, maxBouquets: 100, sparkleAt: 6, chaosAt: 14, surpriseEvery: 9 };
  const button = document.querySelector('#throw');
  const layer = document.querySelector('#flowers');
  const countNode = document.querySelector('#count');
  const surprise = document.querySelector('#surprise');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const bouquets = [];
  let presses = 0, frame = 0, lastTime = 0, announcementTimer, surpriseTimer;
  let width = innerWidth, height = innerHeight;
  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function paint(b) {
    const scale = b.reduced ? .75 + .25 * Math.min(b.age / .3, 1) : .25 + .75 * Math.min(b.age / .22, 1);
    const squash = b.impact > 0 ? Math.sin(b.impact / .16 * Math.PI) * .13 : 0;
    b.node.style.transform = `translate3d(${b.x - b.size / 2}px,${b.y - b.size / 2}px,0) rotate(${b.angle}deg) scale(${scale * (1 + squash)},${scale * (1 - squash)})`;
  }

  function createBouquet(origin, index) {
    const size = random(88, Math.min(145, width * .32));
    const margin = size * .68;
    const x = origin.left + origin.width / 2;
    const y = origin.top + origin.height / 2;
    const targetX = random(margin, width - margin);
    // Bound the apex to the viewport, then derive the sideways speed from flight time.
    const rise = Math.max(35, Math.min(y - margin - 12, height * random(.28, .52)));
    const vy = -Math.sqrt(2 * CONFIG.gravity * rise);
    const pile = Math.min(bouquets.filter(b => b.landed).length * 1.1, height * .13);
    const floor = Math.max(y + 8, height - margin - random(0, 35) - pile);
    const flightTime = (-vy + Math.sqrt(vy * vy + 2 * CONFIG.gravity * (floor - y))) / CONFIG.gravity;
    const node = document.createElement('img');
    node.src = 'assets/bouquet.svg'; node.alt = ''; node.className = 'bouquet';
    node.style.setProperty('--size', `${size}px`); node.draggable = false;
    const b = {
      node, size, x, y, startX: x, startY: y, targetX, floor,
      vx: (targetX - x) / flightTime, vy, angle: index * 12, spin: random(-210, 210),
      age: 0, impact: 0, bounces: 0, landed: false, reduced: motion.matches
    };
    bouquets.push(b); layer.append(node); paint(b);
    enforceBudget();
  }

  function enforceBudget() {
    // A strict cap also covers rapid bursts while every existing bouquet is airborne.
    while (bouquets.length > CONFIG.maxBouquets) {
      const landedIndex = bouquets.findIndex(b => b.landed);
      const [old] = bouquets.splice(landedIndex < 0 ? 0 : landedIndex, 1);
      if (old.landed && !motion.matches) {
        old.node.classList.add('retiring');
        old.node.addEventListener('transitionend', () => old.node.remove(), { once: true });
      } else old.node.remove();
    }
    // Keep fading nodes bounded even if transition events are delayed by a hidden tab.
    while (layer.children.length > CONFIG.maxBouquets + 6) layer.firstElementChild.remove();
  }

  function settle(b) {
    b.landed = true; b.impact = 0; b.y = b.floor;
    b.node.classList.add('landed');
  }

  function advance(b, dt) {
    b.age += dt;
    if (b.reduced) {
      const t = Math.min(b.age / .3, 1), eased = 1 - (1 - t) ** 3;
      b.x = b.startX + (b.targetX - b.startX) * eased;
      b.y = b.startY + (b.floor - b.startY) * eased - 12 * Math.sin(t * Math.PI);
      if (t === 1) settle(b);
    } else {
      // Exact constant-acceleration integration makes arcs independent of refresh rate.
      b.x += b.vx * dt; b.y += b.vy * dt + .5 * CONFIG.gravity * dt * dt;
      b.vy += CONFIG.gravity * dt; b.angle += b.spin * dt;
      b.impact = Math.max(0, b.impact - dt);
      const margin = b.size * .68;
      if (b.x < margin || b.x > width - margin) {
        b.x = clamp(b.x, margin, width - margin); b.vx *= -.65;
      }
      if (b.y >= b.floor && b.vy > 0) {
        b.y = b.floor;
        if (b.bounces < 2 && b.vy > 70) {
          b.vy *= -.24; b.vx *= .55; b.spin *= .45; b.bounces++; b.impact = .16;
        } else settle(b);
      }
    }
    paint(b);
  }

  function tick(time) {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .04) : 1 / 60;
    lastTime = time;
    for (const b of bouquets) if (!b.landed) advance(b, dt);
    if (bouquets.some(b => !b.landed)) frame = requestAnimationFrame(tick);
    else { frame = 0; lastTime = 0; }
  }

  function addSparkles(origin) {
    if (motion.matches) return;
    const container = document.querySelector('#sparkles');
    for (let i = 0; i < 5; i++) {
      const s = document.createElement('span'); s.className = 'sparkle'; s.textContent = i % 2 ? '✦' : '·';
      s.style.cssText = `left:${origin.left + origin.width / 2}px;top:${origin.top}px;--dx:${random(-130, 130)}px;--dy:${random(-180, -40)}px;--color:${['#bd5771', '#68795a', '#bc852c'][i % 3]}`;
      container.append(s); s.addEventListener('animationend', () => s.remove(), { once: true });
    }
    while (container.children.length > 35) container.firstElementChild.remove();
  }

  function showSurprise() {
    surprise.textContent = 'FAAAHHH!!';
    surprise.classList.remove('show');
    // Restart only this rare sticker animation, never the projectile loop.
    void surprise.offsetWidth;
    surprise.classList.add('show');
    clearTimeout(surpriseTimer);
    surpriseTimer = setTimeout(() => surprise.classList.remove('show'), 1400);
  }

  function throwFlowers() {
    presses++; countNode.textContent = presses;
    document.querySelector('#count-label').textContent = presses === 1 ? 'little burst of love' : 'little bursts of love';
    const origin = button.getBoundingClientRect();
    const total = presses >= CONFIG.chaosAt && presses % 3 === 0 ? (presses % 6 === 0 ? 3 : 2) : 1;
    for (let i = 0; i < total; i++) createBouquet(origin, i);
    if (presses >= CONFIG.sparkleAt) addSparkles(origin);
    if (presses % CONFIG.surpriseEvery === 0) showSurprise();
    document.querySelector('#hint').textContent = presses >= CONFIG.chaosAt ? 'Okay, now it’s a flower party.' : presses >= CONFIG.sparkleAt ? 'There’s no such thing as too many flowers.' : 'Birthdays deserve flowers. Lots of them.';
    clearTimeout(announcementTimer);
    announcementTimer = setTimeout(() => {
      document.querySelector('#announcement').textContent = `${presses} ${presses === 1 ? 'burst' : 'bursts'} of birthday love thrown.`;
    }, 500);
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function resize() {
    const previousWidth = width, previousHeight = height;
    width = innerWidth; height = innerHeight;
    for (const b of bouquets) {
      const margin = b.size * .68;
      b.x = clamp(b.x / previousWidth * width, margin, width - margin);
      b.floor = clamp(b.floor / previousHeight * height, margin, height - margin);
      b.y = b.landed ? b.floor : clamp(b.y / previousHeight * height, margin, b.floor);
      b.targetX = clamp(b.targetX / previousWidth * width, margin, width - margin);
      b.startX = b.x; b.startY = b.y; paint(b);
    }
  }
  button.addEventListener('click', throwFlowers);
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { lastTime = 0; });
  motion.addEventListener('change', () => {
    if (motion.matches) for (const b of bouquets) if (!b.landed) {
      b.reduced = true; b.age = 0; b.startX = b.x; b.startY = b.y;
    }
  });
})();
