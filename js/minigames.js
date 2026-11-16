// =============================================================
//  MINIJUEGOS: Patadas a los palos, Corrida al try, Scrum / Press, Trivia
// =============================================================
import { S, grant, look, statLvl, save, emit } from './state.js';
import { playerSprite } from './pixel.js';
import { sfx, playMusic } from './audio.js';
import { TRIVIA } from './data.js';
import { rand, clamp, shuffle, fmt, esc } from './util.js';

let G = null;
const el = (id) => document.getElementById(id);

function open(title, onEnd) {
  const ov = el('mini');
  ov.innerHTML = `
    <div class="mg-top"><span id="mgtitle">${title}</span><span id="mghud"></span><button class="x" id="mgclose">✕</button></div>
    <div class="mg-stage"><canvas id="mgc"></canvas><div id="mgtext" class="mg-text"></div></div>
    <div class="mg-bottom" id="mgbtns"></div>`;
  ov.hidden = false;
  const c = el('mgc');
  const r = c.parentElement.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.floor(r.width * dpr); c.height = Math.floor(r.height * dpr);
  G = { c, ctx: c.getContext('2d'), w: c.width, h: c.height, d: dpr, t: 0, last: 0, onEnd, alive: true, keys: {} };
  G.ctx.imageSmoothingEnabled = false;
  el('mgclose').onclick = () => close(null);
  playMusic('mini');
  return G;
}
function close(result) {
  if (!G) return;
  G.alive = false;
  window.removeEventListener('keydown', G.kd);
  window.removeEventListener('keyup', G.ku);
  const ov = el('mini');
  ov.hidden = true; ov.innerHTML = '';
  const cb = G.onEnd; G = null;
  cb?.(result);
}
function hud(t) { const h = el('mghud'); if (h) h.textContent = t; }
function text(t) { const x = el('mgtext'); if (x) { x.innerHTML = t; x.style.display = t ? 'flex' : 'none'; } }
function buttons(html, bind) { const b = el('mgbtns'); if (!b) return; b.innerHTML = html; bind?.(b); }
function frame(fn) {
  const mine = G;
  const step = (ts) => {
    if (!G || !G.alive || G !== mine) return;
    const dt = Math.min(0.05, (ts - (G.last || ts)) / 1000);
    G.last = ts; G.t += dt;
    fn(dt);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function finish(summary, reward, label) {
  if (!G || !G.alive) return;
  if (reward) grant(reward, null, 'g', label);
  text(`<div class="mg-result">${summary}${reward ? `<div class="mg-rew">+${fmt(reward.xp || 0)} XP · +${fmt(reward.gold || 0)} oro · +${fmt(reward.aura || 0)} aura</div>` : ''}</div>`);
  buttons(`<button class="btn big" id="mgok">Listo</button>`, () => (el('mgok').onclick = () => close(true)));
}
function onKeys() {
  G.kd = (e) => { G.keys[e.key.toLowerCase()] = true; if (e.key === ' ') e.preventDefault(); G.onKey?.(e.key.toLowerCase()); };
  G.ku = (e) => { G.keys[e.key.toLowerCase()] = false; };
  window.addEventListener('keydown', G.kd);
  window.addEventListener('keyup', G.ku);
}
function pxText(ctx, t, x, y, size, col = '#fff', align = 'center') {
  ctx.font = `${size * G.d}px "Press Start 2P", monospace`;
  ctx.textAlign = align;
  ctx.fillStyle = '#000'; ctx.fillText(t, x + 2 * G.d, y + 2 * G.d);
  ctx.fillStyle = col; ctx.fillText(t, x, y);
}

// -------------------------------------------------------------
// 1) PATADAS A LOS PALOS: 5 patadas. Tocá para fijar dirección y potencia.
// -------------------------------------------------------------
export function kicks(onEnd) {
  open('🦶 Patadas a los palos', onEnd);
  onKeys();
  const K = { n: 0, goals: 0, phase: 'aim', aim: 0, pow: 0, wind: 0, spot: 0, ball: null, res: '', resT: 0 };
  const newKick = () => {
    K.phase = 'aim'; K.wind = +(rand(-1, 1)).toFixed(1); K.spot = rand(-0.6, 0.6); K.ball = null;
    K.dist = 22 + Math.round(rand(0, 18));
    text('');
  };
  newKick();
  const tap = () => {
    if (K.phase === 'aim') { K.lockAim = K.aim; K.phase = 'power'; sfx('click'); }
    else if (K.phase === 'power') {
      K.lockPow = K.pow; K.phase = 'fly'; sfx('kick');
      // resultado
      const fue = statLvl('fue'), dis = statLvl('dis');
      const need = 0.45 + K.dist / 100; // potencia mínima
      const lateral = K.lockAim + K.wind * 0.12 + K.spot * 0.15 * (1 - Math.abs(K.lockAim));
      const strong = K.lockPow + Math.min(0.15, fue * 0.01);
      const width = 0.16 + Math.min(0.06, dis * 0.004);
      K.ok = Math.abs(lateral) < width && strong >= need;
      K.short = strong < need;
      K.ball = { t: 0, lat: lateral, pow: strong, need };
    }
  };
  G.onKey = (k) => { if (k === ' ' || k === 'enter') tap(); };
  buttons(`<button class="btn big" id="kt">PATEAR</button>`, () => (el('kt').onpointerdown = (e) => { e.preventDefault(); tap(); }));
  G.c.onpointerdown = tap;
  frame((dt) => {
    const { ctx, w, h, d } = G;
    // campo en perspectiva
    ctx.fillStyle = '#8ecae6'; ctx.fillRect(0, 0, w, h * 0.35);
    ctx.fillStyle = '#43a047'; ctx.fillRect(0, h * 0.35, w, h * 0.65);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#4caf50' : '#43a047';
      const y0 = h * 0.35 + (h * 0.65) * Math.pow(i / 8, 1.6);
      const y1 = h * 0.35 + (h * 0.65) * Math.pow((i + 1) / 8, 1.6);
      ctx.fillRect(0, y0, w, y1 - y0);
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(0, h * 0.37, w, 2 * d);
    // palos
    const cx = w / 2, pw = w * 0.16, base = h * 0.37, top = h * 0.08;
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx - pw / 2 - 3 * d, top, 6 * d, base - top);
    ctx.fillRect(cx + pw / 2 - 3 * d, top, 6 * d, base - top);
    ctx.fillRect(cx - pw / 2, base - (base - top) * 0.35, pw, 5 * d);
    ctx.fillStyle = '#d62828';
    ctx.fillRect(cx - pw / 2 - 5 * d, base - 14 * d, 10 * d, 14 * d);
    ctx.fillRect(cx + pw / 2 - 5 * d, base - 14 * d, 10 * d, 14 * d);
    // viento
    pxText(ctx, `Viento ${K.wind > 0 ? '→' : K.wind < 0 ? '←' : '·'} ${Math.abs(K.wind)}`, 12 * d, 20 * d, 8, '#1d3557', 'left');
    pxText(ctx, `${K.dist} m`, w - 12 * d, 20 * d, 8, '#1d3557', 'right');
    // pelota y pateador
    const bx = w / 2 + K.spot * w * 0.25, by = h * 0.82;
    if (K.phase === 'aim') K.aim = Math.sin(G.t * 2.6) * 0.6;
    if (K.phase === 'power') K.pow = (Math.sin(G.t * 3.4 - Math.PI / 2) + 1) / 2;
    const ps = playerSprite(look(), 'up', 0);
    const sc = Math.max(3, Math.round(h / 22 / 6));
    ctx.drawImage(ps, bx - 22 * sc, by - 14 * sc, 16 * sc, 22 * sc);
    let ballX = bx, ballY = by, ballS = 1;
    if (K.ball) {
      K.ball.t += dt * 1.1;
      const t = Math.min(1, K.ball.t);
      const reach = K.short ? 0.75 : 1;
      const tt = Math.min(t, reach) / 1;
      const targetX = w / 2 + K.ball.lat * w * 0.5;
      ballX = bx + (targetX - bx) * tt;
      ballY = by + (h * 0.2 - by) * tt - Math.sin(tt * Math.PI) * h * 0.15;
      if (K.short && t > reach) ballY += (t - reach) * h * 1.5;
      ballS = 1 - tt * 0.7;
      if (t >= 1 && !K.resT) {
        K.resT = 1.4;
        K.n++;
        if (K.ok) { K.goals++; sfx('done'); K.res = '¡ADENTRO!'; } else { sfx('miss'); K.res = K.short ? 'Le faltó fuerza' : '¡Afuera!'; }
      }
    }
    ctx.fillStyle = '#f1e3c8';
    ctx.beginPath(); ctx.ellipse(ballX, ballY, 7 * d * ballS, 10 * d * ballS, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 1.5 * d; ctx.stroke();
    // UI de mira / potencia
    if (K.phase === 'aim' || K.phase === 'power') {
      const a = K.phase === 'aim' ? K.aim : K.lockAim;
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4 * d;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + (w / 2 + a * w * 0.5 - bx) * 0.5, by - h * 0.3); ctx.stroke();
      pxText(ctx, K.phase === 'aim' ? 'Tocá para APUNTAR' : 'Tocá para la POTENCIA', w / 2, h * 0.5, 9, '#fff');
    }
    if (K.phase === 'power') {
      const bw = w * 0.6, bh = 14 * d, x = (w - bw) / 2, y = h * 0.92;
      ctx.fillStyle = '#222'; ctx.fillRect(x, y, bw, bh);
      const g = ctx.createLinearGradient(x, 0, x + bw, 0);
      g.addColorStop(0, '#ef476f'); g.addColorStop(0.6, '#ffd166'); g.addColorStop(1, '#06d6a0');
      ctx.fillStyle = g; ctx.fillRect(x, y, bw * K.pow, bh);
      const need = 0.45 + K.dist / 100 - Math.min(0.15, statLvl('fue') * 0.01);
      ctx.fillStyle = '#fff'; ctx.fillRect(x + bw * need, y - 4 * d, 2 * d, bh + 8 * d);
    }
    if (K.resT > 0) {
      K.resT -= dt;
      pxText(ctx, K.res, w / 2, h * 0.5, 16, K.ok ? '#06d6a0' : '#ef476f');
      if (K.resT <= 0) {
        K.resT = 0;
        if (K.n >= 5) {
          K.phase = 'end';
          S.best.kicks = Math.max(S.best.kicks, K.goals);
          const reward = { xp: K.goals * 12, gold: K.goals * 8, aura: K.goals * 100 + (K.goals === 5 ? 1000 : 0), stats: { int: K.goals, fue: K.goals } };
          finish(`<b>${K.goals} de 5</b> adentro${K.goals === 5 ? '<br>🦶 ¡PIE DE ORO!' : ''}`, K.goals ? reward : null, 'kicks');
        } else newKick();
      }
    }
    hud(`Goles ${K.goals}/${K.n}`);
  });
}

// -------------------------------------------------------------
// 2) CORRIDA AL TRY: esquivá defensores hasta el ingoal. 3 intentos.
// -------------------------------------------------------------
export function tryRun(onEnd) {
  open('🏃 Corrida al try', onEnd);
  onKeys();
  const R = { attempt: 0, tries: 0, state: 'ready', x: 0.5, dist: 0, len: 100, defs: [], speed: 0, target: null, msgT: 0 };
  const startRun = () => {
    R.state = 'run'; R.x = 0.5; R.dist = 0; R.speed = 0.16 + statLvl('res') * 0.004; R.defs = [];
    R.next = 6; text(''); sfx('whistle');
  };
  text('<div class="mg-result">Arrastrá el dedo o usá ← → para esquivar.<br>¡Llegá al ingoal!</div>');
  buttons(`<button class="btn big" id="rgo">¡A CORRER!</button>`, () => (el('rgo').onclick = () => { buttons('<div class="hint">Arrastrá para moverte</div>'); startRun(); }));
  const toX = (e) => { const r = G.c.getBoundingClientRect(); R.target = clamp((e.clientX - r.left) / r.width, 0.08, 0.92); };
  G.c.onpointerdown = (e) => { toX(e); G.c.setPointerCapture?.(e.pointerId); };
  G.c.onpointermove = (e) => { if (e.buttons || e.pointerType === 'touch') toX(e); };
  G.c.onpointerup = () => { R.target = null; };
  frame((dt) => {
    const { ctx, w, h, d } = G;
    if (R.state === 'run') {
      const k = G.keys;
      const sideSpeed = 0.9 + statLvl('dis') * 0.01;
      if (k['arrowleft'] || k['a']) R.x -= sideSpeed * dt;
      if (k['arrowright'] || k['d']) R.x += sideSpeed * dt;
      if (R.target !== null) R.x += clamp(R.target - R.x, -sideSpeed * dt, sideSpeed * dt);
      R.x = clamp(R.x, 0.08, 0.92);
      R.dist += R.speed * dt * 100;
      R.speed += dt * 0.004;
      if (R.dist >= R.next && R.dist < R.len - 8) {
        const n = R.dist > 50 ? 2 : 1;
        for (let i = 0; i < n; i++) R.defs.push({ x: rand(0.12, 0.88), y: R.dist + 28 + i * 6, vx: 0 });
        R.next += Math.max(4, 9 - R.dist / 20);
      }
      for (const df of R.defs) {
        // persiguen un poco
        const dy = df.y - R.dist;
        if (dy < 22) df.x += clamp(R.x - df.x, -0.25 * dt, 0.25 * dt);
        if (Math.abs(dy - 3) < 1.6 && Math.abs(df.x - R.x) < 0.075) {
          R.state = 'tackled'; R.msgT = 1.5; sfx('hit');
        }
      }
      if (R.dist >= R.len) { R.state = 'try'; R.msgT = 1.6; R.tries++; sfx('aura'); }
    } else if (R.state === 'tackled' || R.state === 'try') {
      R.msgT -= dt;
      if (R.msgT <= 0) {
        R.attempt++;
        if (R.attempt >= 3) {
          R.state = 'end';
          S.best.tries = Math.max(S.best.tries, R.tries);
          const reward = { xp: R.tries * 30, gold: R.tries * 15, aura: R.tries * 300, stats: { res: R.tries * 2, car: R.tries } };
          finish(`<b>${R.tries} de 3</b> tries${R.tries === 3 ? '<br>💨 ¡INATRAPABLE!' : ''}`, R.tries ? reward : null, 'tryrun');
        } else { R.state = 'ready'; buttons(`<button class="btn big" id="rgo">Siguiente intento</button>`, () => (el('rgo').onclick = () => { buttons('<div class="hint">Arrastrá para moverte</div>'); startRun(); })); }
      }
    }
    // dibujo: cancha vertical que se mueve
    const ppm = h / 30; // pixeles por metro
    const camY = R.dist;
    for (let m = Math.floor(camY) - 5; m < camY + 32; m++) {
      const y = h - (m - camY) * ppm - h * 0.2;
      ctx.fillStyle = Math.floor(m / 5) % 2 ? '#4caf50' : '#43a047';
      ctx.fillRect(0, y - ppm, w, ppm + 1);
      if (m % 10 === 0 && m > 0 && m < R.len) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, y, w, 2 * d); pxText(ctx, `${R.len - m}`, 16 * d, y - 4 * d, 7, '#fff', 'left'); }
      if (m === R.len) { ctx.fillStyle = '#fff'; ctx.fillRect(0, y, w, 4 * d); }
      if (m > R.len) { ctx.fillStyle = '#d62828aa'; ctx.fillRect(0, y - ppm, w, ppm + 1); }
    }
    if (camY + 30 > R.len) pxText(ctx, 'INGOAL', w / 2, h - (R.len + 4 - camY) * ppm - h * 0.2, 12, '#fff');
    const sc = Math.max(2, Math.round(ppm / 7));
    const run = Math.floor(G.t * 10) % 3;
    for (const df of R.defs) {
      const y = h - (df.y - camY) * ppm - h * 0.2;
      if (y < -50 || y > h + 50) continue;
      const spr = playerSprite({ jersey: {}, hair: {}, boots: {} }, 'down', run, 'rival');
      ctx.drawImage(spr, df.x * w - 8 * sc, y - 20 * sc, 16 * sc, 22 * sc);
    }
    const py = h - 3 * ppm - h * 0.2;
    const me = playerSprite(look(), 'up', R.state === 'run' ? run : 0);
    ctx.drawImage(me, R.x * w - 8 * sc, py - 20 * sc, 16 * sc, 22 * sc);
    ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(R.x * w + 6 * sc, py - 10 * sc, 3 * sc, 4 * sc, 0.3, 0, Math.PI * 2); ctx.fill();
    if (R.state === 'tackled') pxText(ctx, '¡TACKLEADO!', w / 2, h * 0.4, 14, '#ef476f');
    if (R.state === 'try') { pxText(ctx, '¡TRY!', w / 2, h * 0.38, 22, '#ffd166'); pxText(ctx, '+300 AURA', w / 2, h * 0.46, 11, '#c77dff'); }
    hud(`Tries ${R.tries} · Intento ${Math.min(3, R.attempt + 1)}/3 · ${Math.max(0, Math.round(R.len - R.dist))} m`);
  });
}

// -------------------------------------------------------------
// 3) SCRUM (club) / PRESS (gym): tocá rápido para empujar
// -------------------------------------------------------------
export function mash(kind, onEnd) {
  const isGym = kind === 'gym';
  open(isGym ? '🏋️ Press de banca' : '🐃 Scrum', onEnd);
  onKeys();
  const M = { state: 'ready', pos: 0.5, time: 10, push: 0, taps: 0 };
  text(`<div class="mg-result">${isGym ? 'Tocá lo más rápido que puedas para levantar la barra.' : 'Tocá lo más rápido que puedas para empujar el scrum rival.'}<br>Llegá al final antes de que se acabe el tiempo.</div>`);
  const go = () => { M.state = 'play'; text(''); sfx('whistle'); buttons(`<button class="btn big mash" id="mt">${isGym ? '¡ARRIBA!' : '¡EMPUJÁ!'}</button>`, () => (el('mt').onpointerdown = (e) => { e.preventDefault(); tapM(); })); };
  buttons(`<button class="btn big" id="mgo">¡Dale!</button>`, () => (el('mgo').onclick = go));
  const tapM = () => { if (M.state !== 'play') return; M.taps++; M.pos += 0.022 + statLvl('fue') * 0.0012; sfx('step'); };
  G.onKey = (k) => { if (k === ' ' || k === 'enter') tapM(); };
  frame((dt) => {
    const { ctx, w, h, d } = G;
    if (M.state === 'play') {
      M.time -= dt;
      M.pos -= dt * (0.11 + (10 - M.time) * 0.012);
      M.pos = clamp(M.pos, 0, 1);
      if (M.pos >= 1 || M.time <= 0 || M.pos <= 0) {
        const won = M.pos >= 1;
        M.state = 'end';
        if (won) { sfx('win'); if (!isGym) S.best.scrum = Math.max(S.best.scrum || 0, 1); } else sfx('lose');
        const reward = won ? { xp: 40, gold: 20, aura: 300, stats: { fue: 6 } } : { xp: 10, gold: 3, aura: 0, stats: { fue: 2 } };
        finish(won ? `<b>¡${isGym ? 'Levantaste la barra' : 'Ganaste el scrum'}!</b><br>${M.taps} toques` : `<b>Casi...</b><br>${M.taps} toques`, reward, kind);
      }
    }
    ctx.fillStyle = isGym ? '#495057' : '#43a047'; ctx.fillRect(0, 0, w, h);
    if (isGym) {
      // barra que sube
      const y = h * 0.8 - M.pos * h * 0.55;
      ctx.fillStyle = '#adb5bd'; ctx.fillRect(w * 0.15, y, w * 0.7, 6 * d);
      ctx.fillStyle = '#212529'; ctx.fillRect(w * 0.12, y - 22 * d, 18 * d, 50 * d); ctx.fillRect(w * 0.88 - 18 * d, y - 22 * d, 18 * d, 50 * d);
      const me = playerSprite(look(), 'down', 0);
      const sc = Math.max(3, Math.round(h / 22 / 3.5));
      ctx.drawImage(me, w / 2 - 8 * sc, h * 0.86 - 22 * sc + 4 * sc, 16 * sc, 22 * sc);
      ctx.fillStyle = '#ffd166'; ctx.fillRect(w * 0.1, h * 0.25, w * 0.8, 3 * d);
      pxText(ctx, 'META', w / 2, h * 0.25 - 8 * d, 8, '#ffd166');
    } else {
      const cx = w * (0.25 + M.pos * 0.5);
      const sc = Math.max(3, Math.round(h / 22 / 4));
      const me = playerSprite(look(), 'right', Math.floor(G.t * 8) % 3);
      const riv = playerSprite({ jersey: {}, hair: {}, boots: {} }, 'left', Math.floor(G.t * 7) % 3, 'rival');
      for (let i = 0; i < 3; i++) {
        ctx.drawImage(me, cx - 16 * sc - i * 10 * sc, h * 0.45 - 11 * sc + (i - 1) * 9 * sc, 16 * sc, 22 * sc);
        ctx.drawImage(riv, cx + i * 10 * sc, h * 0.45 - 11 * sc + (i - 1) * 9 * sc, 16 * sc, 22 * sc);
      }
      ctx.fillStyle = '#fff'; ctx.fillRect(w * 0.75, 0, 3 * d, h); ctx.fillRect(w * 0.25, 0, 3 * d, h);
    }
    // barra de progreso
    const bw = w * 0.8, x = w * 0.1, y = 16 * d;
    ctx.fillStyle = '#222'; ctx.fillRect(x, y, bw, 12 * d);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x, y, bw * M.pos, 12 * d);
    hud(`⏱ ${Math.max(0, M.time).toFixed(1)} s`);
  });
}

// -------------------------------------------------------------
// 4) TRIVIA DE LA FACULTAD: 5 preguntas
// -------------------------------------------------------------
export function trivia(onEnd) {
  open('🧠 Trivia de la Facu', onEnd);
  const qs = shuffle(TRIVIA).slice(0, 5);
  let i = 0, ok = 0;
  G.c.style.display = 'none';
  const show = () => {
    if (i >= qs.length) {
      S.best.trivia = Math.max(S.best.trivia, ok);
      const reward = { xp: ok * 12, gold: ok * 6, aura: ok * 80, stats: { int: ok * 3 } };
      G.c.style.display = 'none';
      finish(`<b>${ok} de 5</b> correctas${ok === 5 ? '<br>🧠 ¡SABELOTODO!' : ''}`, ok ? reward : null, 'trivia');
      return;
    }
    const q = qs[i];
    const opts = shuffle(q.a.map((t, k) => ({ t, ok: k === 0 })));
    text(`<div class="mg-q"><div class="qn">Pregunta ${i + 1}/5</div>${esc(q.q)}</div>`);
    buttons(`<div class="qopts">${opts.map((o, k) => `<button class="btn qopt" data-k="${k}">${esc(o.t)}</button>`).join('')}</div>`, (b) => {
      b.querySelectorAll('.qopt').forEach((btn) => (btn.onclick = () => {
        const o = opts[+btn.dataset.k];
        b.querySelectorAll('.qopt').forEach((x, k) => { x.disabled = true; if (opts[k].ok) x.classList.add('good'); });
        if (o.ok) { ok++; sfx('done'); } else { btn.classList.add('bad'); sfx('miss'); }
        hud(`Correctas ${ok}`);
        const mine = G;
        setTimeout(() => { if (G !== mine || !G.alive) return; i++; show(); }, 900);
      }));
    });
  };
  hud('Correctas 0');
  show();
}

// =============================================================
//  GYM: ejercicios con mecánicas distintas
// =============================================================
const lk = () => look();
function drawGuy(ctx, x, y, sc, dir = 'down', frame = 0) {
  const s = playerSprite(lk(), dir, frame);
  ctx.drawImage(s, x - 8 * sc, y - 22 * sc, 16 * sc, 22 * sc);
}
function gymBg(ctx, w, h, d) {
  ctx.fillStyle = '#2b2e37'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#a9d6e5'; ctx.fillRect(0, 0, w, h * 0.35);
  ctx.fillStyle = '#e0f3fa'; for (let x = 20 * d; x < w; x += 80 * d) ctx.fillRect(x, 10 * d, 6 * d, h * 0.3);
  ctx.fillStyle = '#6c757d'; ctx.fillRect(0, h * 0.35, w, 6 * d);
  ctx.fillStyle = '#3a3d46'; ctx.fillRect(0, h * 0.35 + 6 * d, w, h);
}
function gymReward(score, max, stat = 'fue') {
  const k = score / max;
  return { xp: Math.round(15 + 35 * k), gold: Math.round(5 + 15 * k), aura: Math.round(50 + 350 * k), stats: { [stat]: Math.round(2 + 5 * k) } };
}

// SENTADILLA / CAJÓN: tocá cuando la marca esté en la zona verde
export function timingGame(kind, onEnd) {
  const isBox = kind === 'cajon';
  open(isBox ? '📦 Saltos al cajón' : '🏋️ Sentadilla', onEnd);
  onKeys();
  const reps = isBox ? 6 : 8;
  const Z = { n: 0, good: 0, t: 0, pos: 0, speed: 1.6, state: 'play', anim: 0, last: '' };
  text(`<div class="mg-result">${isBox ? 'Tocá cuando la marca esté en verde para saltar al cajón.' : 'Bajá y subí: tocá cuando la marca esté en la zona verde (profundidad justa).'}</div>`);
  setTimeout(() => text(''), 1600);
  const tap = () => {
    if (Z.state !== 'play') return;
    const inZone = Z.pos > 0.42 && Z.pos < 0.58;
    const perfect = Z.pos > 0.47 && Z.pos < 0.53;
    Z.n++;
    if (inZone) { Z.good += perfect ? 1.2 : 1; Z.last = perfect ? '¡PERFECTA!' : '¡BIEN!'; sfx('done'); Z.anim = 1; }
    else { Z.last = 'Mala técnica'; sfx('miss'); }
    Z.lastT = 0.7;
    Z.speed += 0.18;
    if (Z.n >= reps) {
      Z.state = 'end';
      const score = Math.min(reps, Math.round(Z.good));
      setTimeout(() => finish(`<b>${score} de ${reps}</b> repeticiones buenas`, gymReward(score, reps, isBox ? 'res' : 'fue'), kind), 600);
    }
  };
  G.onKey = (k) => { if (k === ' ' || k === 'enter') tap(); };
  buttons(`<button class="btn big mash" id="tt">${isBox ? '¡SALTO!' : '¡ARRIBA!'}</button>`, () => (el('tt').onpointerdown = (e) => { e.preventDefault(); tap(); }));
  frame((dt) => {
    const { ctx, w, h, d } = G;
    Z.t += dt;
    Z.pos = (Math.sin(Z.t * Z.speed * 2) + 1) / 2;
    gymBg(ctx, w, h, d);
    const sc = Math.max(3, Math.round(h / 22 / 3.6));
    const gx = w * 0.42, gy = h * 0.88;
    if (Z.anim > 0) Z.anim -= dt * 2;
    if (isBox) {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(w * 0.48, h * 0.7, w * 0.22, h * 0.18);
      ctx.fillStyle = '#a47148'; ctx.fillRect(w * 0.48, h * 0.7, w * 0.22, 8 * d);
      const jump = Z.anim > 0 ? Math.sin((1 - Z.anim) * Math.PI) * h * 0.2 : 0;
      drawGuy(ctx, gx + (Z.anim > 0 ? (1 - Z.anim) * w * 0.15 : 0), gy - jump, sc, 'right');
    } else {
      const squat = Z.pos * 6 * sc;
      ctx.fillStyle = '#6c757d'; ctx.fillRect(gx - 80 * d, gy - 18 * sc + squat, 160 * d, 5 * d);
      ctx.fillStyle = '#222'; ctx.fillRect(gx - 90 * d, gy - 22 * sc + squat, 14 * d, 30 * d); ctx.fillRect(gx + 76 * d, gy - 22 * sc + squat, 14 * d, 30 * d);
      drawGuy(ctx, gx, gy + squat * 0.4, sc, 'down');
    }
    // barra de timing
    const bx = w * 0.82, by = h * 0.15, bh = h * 0.7;
    ctx.fillStyle = '#111'; ctx.fillRect(bx, by, 26 * d, bh);
    ctx.fillStyle = '#06d6a0'; ctx.fillRect(bx, by + bh * 0.42, 26 * d, bh * 0.16);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(bx, by + bh * 0.47, 26 * d, bh * 0.06);
    ctx.fillStyle = '#fff'; ctx.fillRect(bx - 8 * d, by + bh * Z.pos - 3 * d, 42 * d, 6 * d);
    if (Z.lastT > 0) { Z.lastT -= dt; pxText(ctx, Z.last, w * 0.42, h * 0.25, 13, Z.last.includes('Mala') ? '#ef476f' : '#06d6a0'); }
    hud(`Rep ${Math.min(Z.n + 1, reps)}/${reps}`);
  });
}

// PESO MUERTO: mantené apretado para subir, soltá para bajar. Mantené la aguja en verde.
export function holdGame(onEnd) {
  open('🏋️ Peso muerto', onEnd);
  onKeys();
  const H = { y: 0.2, v: 0, hold: false, prog: 0, reps: 0, t: 0, zone: 0.55, zt: 0, state: 'play', time: 25 };
  text('<div class="mg-result">Mantené apretado para subir la aguja y soltá para bajar.<br>Dejala en la zona verde para levantar la barra.</div>');
  setTimeout(() => text(''), 1800);
  buttons(`<button class="btn big mash" id="hh">MANTENÉ</button>`, () => {
    const b = el('hh');
    b.onpointerdown = (e) => { e.preventDefault(); H.hold = true; };
    b.onpointerup = b.onpointerleave = b.onpointercancel = () => { H.hold = false; };
  });
  G.onKey = (k) => { if (k === ' ') H.hold = true; };
  window.addEventListener('keyup', (e) => { if (e.key === ' ' && G) H.hold = false; }, { once: false });
  frame((dt) => {
    const { ctx, w, h, d } = G;
    if (H.state === 'play') {
      H.t += dt; H.time -= dt;
      H.zone = 0.5 + Math.sin(H.t * 1.3) * 0.25;
      H.v += (H.hold ? 1.6 : -1.4) * dt;
      H.v *= 0.96;
      H.y = clamp(H.y + H.v * dt, 0, 1);
      if (H.y <= 0 || H.y >= 1) H.v = 0;
      const inZ = Math.abs(H.y - H.zone) < 0.1;
      H.prog = clamp(H.prog + (inZ ? 0.45 : -0.25) * dt, 0, 1);
      if (H.prog >= 1) { H.reps++; H.prog = 0; sfx('done'); }
      if (H.reps >= 3 || H.time <= 0) {
        H.state = 'end';
        finish(`<b>${H.reps} de 3</b> levantamientos`, gymReward(H.reps, 3, 'fue'), 'pesomuerto');
      }
    }
    gymBg(ctx, w, h, d);
    const sc = Math.max(3, Math.round(h / 22 / 3.6));
    const gx = w * 0.4, gy = h * 0.88;
    const lift = H.prog * 10 * sc;
    drawGuy(ctx, gx, gy, sc, 'down');
    ctx.fillStyle = '#adb5bd'; ctx.fillRect(gx - 90 * d, gy - 6 * sc - lift, 180 * d, 5 * d);
    ctx.fillStyle = '#222'; ctx.fillRect(gx - 100 * d, gy - 12 * sc - lift, 16 * d, 12 * sc); ctx.fillRect(gx + 84 * d, gy - 12 * sc - lift, 16 * d, 12 * sc);
    const bx = w * 0.82, by = h * 0.12, bh = h * 0.72;
    ctx.fillStyle = '#111'; ctx.fillRect(bx, by, 28 * d, bh);
    ctx.fillStyle = '#06d6a0'; ctx.fillRect(bx, by + bh * (1 - H.zone - 0.1), 28 * d, bh * 0.2);
    ctx.fillStyle = '#fff'; ctx.fillRect(bx - 8 * d, by + bh * (1 - H.y) - 3 * d, 44 * d, 6 * d);
    ctx.fillStyle = '#222'; ctx.fillRect(w * 0.1, h * 0.1, w * 0.55, 12 * d);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(w * 0.1, h * 0.1, w * 0.55 * H.prog, 12 * d);
    hud(`Levantadas ${H.reps}/3 · ⏱ ${Math.max(0, H.time).toFixed(0)} s`);
  });
}

// DOMINADAS: tocá izquierda y derecha alternando
export function altGame(onEnd) {
  open('🧗 Dominadas', onEnd);
  onKeys();
  const A = { next: 'L', up: 0, reps: 0, time: 15, state: 'play', streak: 0 };
  text('<div class="mg-result">Tocá ◀ y ▶ alternando, lo más rápido posible.<br>Cada vez que llegás arriba cuenta una dominada.</div>');
  setTimeout(() => text(''), 1600);
  const tap = (s) => {
    if (A.state !== 'play') return;
    if (s === A.next) { A.up += 0.12 + statLvl('fue') * 0.004; A.next = s === 'L' ? 'R' : 'L'; sfx('step'); }
    else { A.up = Math.max(0, A.up - 0.15); sfx('miss'); }
    if (A.up >= 1) { A.reps++; A.up = 0; sfx('done'); }
  };
  G.onKey = (k) => { if (k === 'arrowleft' || k === 'a') tap('L'); if (k === 'arrowright' || k === 'd') tap('R'); };
  buttons(`<div class="row2"><button class="btn big" id="al">◀</button><button class="btn big" id="ar">▶</button></div>`, () => {
    el('al').onpointerdown = (e) => { e.preventDefault(); tap('L'); };
    el('ar').onpointerdown = (e) => { e.preventDefault(); tap('R'); };
  });
  frame((dt) => {
    const { ctx, w, h, d } = G;
    if (A.state === 'play') {
      A.time -= dt; A.up = Math.max(0, A.up - dt * 0.25);
      if (A.time <= 0) { A.state = 'end'; finish(`<b>${A.reps}</b> dominadas`, gymReward(Math.min(A.reps, 10), 10, 'fue'), 'dominadas'); }
    }
    gymBg(ctx, w, h, d);
    const sc = Math.max(3, Math.round(h / 22 / 3.8));
    ctx.fillStyle = '#6c757d'; ctx.fillRect(w * 0.25, h * 0.18, 8 * d, h * 0.7); ctx.fillRect(w * 0.65, h * 0.18, 8 * d, h * 0.7);
    ctx.fillStyle = '#adb5bd'; ctx.fillRect(w * 0.25, h * 0.18, w * 0.4 + 8 * d, 6 * d);
    const gy = h * 0.18 + 24 * sc - A.up * 7 * sc;
    drawGuy(ctx, w * 0.45, gy, sc, 'up');
    pxText(ctx, A.next === 'L' ? '◀' : '▶', w * 0.45, h * 0.92, 18, '#ffd166');
    hud(`Dominadas ${A.reps} · ⏱ ${Math.max(0, A.time).toFixed(1)} s`);
  });
}

// CINTA: tocá al ritmo
export function rhythmGame(onEnd) {
  open('🏃 Cinta', onEnd);
  onKeys();
  const R = { t: -1.2, beats: [], hit: 0, total: 22, state: 'play', fb: '', fbT: 0 };
  for (let i = 0; i < R.total; i++) R.beats.push({ t: i * 0.55 + (i > 10 ? -(i - 10) * 0.07 : 0), done: false });
  text('<div class="mg-result">Tocá cuando cada marca pasa por la línea amarilla.<br>¡Mantené el ritmo!</div>');
  setTimeout(() => text(''), 1200);
  const tap = () => {
    if (R.state !== 'play') return;
    const b = R.beats.find((x) => !x.done && Math.abs(x.t - R.t) < 0.16);
    if (b) { b.done = true; R.hit++; R.fb = Math.abs(b.t - R.t) < 0.06 ? '¡JUSTO!' : 'Bien'; sfx('step'); }
    else { R.fb = 'Fuera de ritmo'; sfx('miss'); }
    R.fbT = 0.5;
  };
  G.onKey = (k) => { if (k === ' ' || k === 'enter') tap(); };
  buttons(`<button class="btn big mash" id="rt">PASO</button>`, () => (el('rt').onpointerdown = (e) => { e.preventDefault(); tap(); }));
  frame((dt) => {
    const { ctx, w, h, d } = G;
    R.t += dt;
    if (R.state === 'play' && R.t > R.beats[R.beats.length - 1].t + 0.5) {
      R.state = 'end';
      finish(`<b>${R.hit} de ${R.total}</b> pasos al ritmo`, gymReward(R.hit, R.total, 'res'), 'cinta');
    }
    gymBg(ctx, w, h, d);
    const sc = Math.max(3, Math.round(h / 22 / 3.6));
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(w * 0.2, h * 0.82, w * 0.45, 14 * d);
    for (let x = 0; x < w * 0.45; x += 14 * d) { ctx.fillStyle = '#343a40'; ctx.fillRect(w * 0.2 + ((x + R.t * 160 * d) % (w * 0.45)), h * 0.82 + 3 * d, 6 * d, 8 * d); }
    ctx.fillStyle = '#495057'; ctx.fillRect(w * 0.58, h * 0.5, 8 * d, h * 0.32);
    drawGuy(ctx, w * 0.4, h * 0.83, sc, 'right', Math.floor(R.t * 10) % 3);
    // pista de ritmo
    const lane = h * 0.18;
    ctx.fillStyle = '#111'; ctx.fillRect(0, lane - 20 * d, w, 40 * d);
    const hitX = w * 0.2;
    ctx.fillStyle = '#ffd166'; ctx.fillRect(hitX - 2 * d, lane - 22 * d, 4 * d, 44 * d);
    for (const b of R.beats) {
      if (b.done) continue;
      const x = hitX + (b.t - R.t) * 260 * d;
      if (x < -20 || x > w + 20) continue;
      ctx.fillStyle = '#4cc9f0'; ctx.beginPath(); ctx.arc(x, lane, 12 * d, 0, Math.PI * 2); ctx.fill();
    }
    if (R.fbT > 0) { R.fbT -= dt; pxText(ctx, R.fb, w * 0.5, h * 0.36, 12, R.fb.includes('Fuera') ? '#ef476f' : '#06d6a0'); }
    hud(`Pasos ${R.hit}/${R.total}`);
  });
}

// SOGA: saltá cuando la soga pasa por abajo
export function ropeGame(onEnd) {
  open('🪢 Saltar la soga', onEnd);
  onKeys();
  const R = { a: -Math.PI / 2, speed: 3.2, jumps: 0, jump: 0, state: 'play', lastBottom: false };
  text('<div class="mg-result">Tocá para saltar justo cuando la soga pasa por tus pies.<br>¿Cuántos saltos seguidos hacés?</div>');
  setTimeout(() => text(''), 1500);
  const tap = () => { if (R.state === 'play' && R.jump <= 0) { R.jump = 0.42; sfx('step'); } };
  G.onKey = (k) => { if (k === ' ' || k === 'enter') tap(); };
  buttons(`<button class="btn big mash" id="ro">¡SALTO!</button>`, () => (el('ro').onpointerdown = (e) => { e.preventDefault(); tap(); }));
  frame((dt) => {
    const { ctx, w, h, d } = G;
    if (R.state === 'play') {
      R.a += R.speed * dt;
      if (R.jump > 0) R.jump -= dt;
      const bottom = Math.cos(R.a) > 0.97; // soga en los pies
      if (bottom && !R.lastBottom) {
        if (R.jump > 0.05) { R.jumps++; R.speed = Math.min(9, R.speed + 0.18); }
        else { R.state = 'end'; sfx('miss'); finish(`<b>${R.jumps}</b> saltos seguidos`, gymReward(Math.min(R.jumps, 30), 30, 'res'), 'soga'); }
      }
      R.lastBottom = bottom;
    }
    gymBg(ctx, w, h, d);
    const sc = Math.max(3, Math.round(h / 22 / 3.6));
    const gx = w * 0.45, gy = h * 0.85;
    const jy = R.jump > 0 ? Math.sin((R.jump / 0.42) * Math.PI) * 6 * sc : 0;
    // soga (elipse que gira)
    const ry = Math.cos(R.a);
    const ropeY = gy - 11 * sc + ry * 12 * sc;
    const behind = Math.sin(R.a) < 0;
    const drawRope = () => {
      ctx.strokeStyle = '#e63946'; ctx.lineWidth = 3 * d;
      ctx.beginPath(); ctx.moveTo(gx - 9 * sc, gy - 12 * sc - jy); ctx.quadraticCurveTo(gx, ropeY + (ry > 0 ? 6 * sc : -6 * sc), gx + 9 * sc, gy - 12 * sc - jy); ctx.stroke();
    };
    if (behind) drawRope();
    drawGuy(ctx, gx, gy - jy, sc, 'down');
    if (!behind) drawRope();
    pxText(ctx, `${R.jumps}`, w * 0.45, h * 0.2, 22, '#ffd166');
    hud(`Saltos ${R.jumps}`);
  });
}

// MANCUERNAS: tocá rápido pero cuidá la fatiga
export function curlGame(onEnd) {
  open('💪 Mancuernas', onEnd);
  onKeys();
  const C = { reps: 0, prog: 0, fat: 0, time: 15, state: 'play', rest: 0 };
  text('<div class="mg-result">Tocá para subir la mancuerna. Si la fatiga llega al rojo, tenés que descansar.<br>¡Ritmo constante!</div>');
  setTimeout(() => text(''), 1600);
  const tap = () => {
    if (C.state !== 'play' || C.rest > 0) return;
    C.prog += 0.25; C.fat += 0.09;
    if (C.fat >= 1) { C.rest = 1.6; sfx('miss'); }
    if (C.prog >= 1) { C.prog = 0; C.reps++; sfx('step'); }
  };
  G.onKey = (k) => { if (k === ' ' || k === 'enter') tap(); };
  buttons(`<button class="btn big mash" id="cu">¡ARRIBA!</button>`, () => (el('cu').onpointerdown = (e) => { e.preventDefault(); tap(); }));
  frame((dt) => {
    const { ctx, w, h, d } = G;
    if (C.state === 'play') {
      C.time -= dt; C.fat = Math.max(0, C.fat - dt * 0.35);
      if (C.rest > 0) { C.rest -= dt; if (C.rest <= 0) C.fat = 0.3; }
      if (C.time <= 0) { C.state = 'end'; finish(`<b>${C.reps}</b> repeticiones`, gymReward(Math.min(C.reps, 25), 25, 'fue'), 'mancuernas'); }
    }
    gymBg(ctx, w, h, d);
    const sc = Math.max(3, Math.round(h / 22 / 3.6));
    const gx = w * 0.42, gy = h * 0.88;
    drawGuy(ctx, gx, gy, sc, 'down');
    const arm = C.prog * 8 * sc;
    ctx.fillStyle = '#222'; ctx.fillRect(gx - 12 * sc, gy - 9 * sc - arm, 6 * sc, 3 * sc); ctx.fillRect(gx + 6 * sc, gy - 9 * sc - arm, 6 * sc, 3 * sc);
    ctx.fillStyle = '#111'; ctx.fillRect(w * 0.1, h * 0.12, w * 0.6, 12 * d);
    ctx.fillStyle = C.fat > 0.75 ? '#ef476f' : '#ffd166'; ctx.fillRect(w * 0.1, h * 0.12, w * 0.6 * C.fat, 12 * d);
    pxText(ctx, C.rest > 0 ? 'DESCANSÁ...' : 'FATIGA', w * 0.4, h * 0.1, 8, C.rest > 0 ? '#ef476f' : '#fff');
    hud(`Reps ${C.reps} · ⏱ ${Math.max(0, C.time).toFixed(1)} s`);
  });
}

// =============================================================
//  RUGBY: ejercicios de entrenamiento
// =============================================================
function pitchBg(ctx, w, h, d) {
  for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#4caf50' : '#43a047'; ctx.fillRect(0, (h / 10) * i, w, h / 10 + 1); }
}

// PASES DE MEDIO SCRUM: sacá rápido hacia el lado que te piden
export function passDrill(onEnd) {
  open('🏉 Pases de medio scrum', onEnd);
  onKeys();
  const P = { n: 0, total: 14, ok: 0, side: null, t: 0, wait: 0.8, react: [], state: 'play', ball: null, fb: '', fbT: 0 };
  text('<div class="mg-result">Sos el 9. Cuando un compañero pida la pelota, pasala a ese lado lo más rápido que puedas.</div>');
  setTimeout(() => text(''), 1500);
  const passTo = (s) => {
    if (P.state !== 'play' || !P.side) return;
    if (s === P.side) { P.ok++; P.react.push(P.t); P.fb = P.t < 0.45 ? '¡SALIDA RÁPIDA!' : 'Buen pase'; sfx('kick'); }
    else { P.fb = 'Pase al lado equivocado'; sfx('miss'); }
    P.fbT = 0.6; P.ball = { s, t: 0 };
    P.side = null; P.n++; P.wait = 0.5 + Math.random() * 0.6;
    if (P.n >= P.total) {
      P.state = 'end';
      const avg = P.react.length ? P.react.reduce((a, b) => a + b, 0) / P.react.length : 2;
      const score = Math.round(P.ok * (avg < 0.5 ? 1.2 : avg < 0.8 ? 1 : 0.8));
      setTimeout(() => finish(`<b>${P.ok} de ${P.total}</b> pases bien<br>Reacción promedio: ${avg.toFixed(2)} s`, { xp: 20 + score * 3, gold: 8 + score, aura: 100 + score * 30, stats: { dis: 3 + Math.round(score / 3), int: 2 } }, 'pases'), 500);
    }
  };
  G.onKey = (k) => { if (k === 'arrowleft' || k === 'a') passTo('L'); if (k === 'arrowright' || k === 'd') passTo('R'); };
  buttons(`<div class="row2"><button class="btn big" id="pl">◀ PASE</button><button class="btn big" id="pr">PASE ▶</button></div>`, () => {
    el('pl').onpointerdown = (e) => { e.preventDefault(); passTo('L'); };
    el('pr').onpointerdown = (e) => { e.preventDefault(); passTo('R'); };
  });
  frame((dt) => {
    const { ctx, w, h, d } = G;
    if (P.state === 'play') {
      if (P.side) P.t += dt;
      else { P.wait -= dt; if (P.wait <= 0) { P.side = Math.random() < 0.5 ? 'L' : 'R'; P.t = 0; } }
      if (P.side && P.t > 1.6) { P.fb = '¡Muy lento!'; P.fbT = 0.6; sfx('miss'); P.side = null; P.n++; P.wait = 0.6; if (P.n >= P.total) passTo('X'); }
    }
    pitchBg(ctx, w, h, d);
    const sc = Math.max(3, Math.round(h / 22 / 5));
    // ruck
    ctx.fillStyle = '#00000033'; ctx.beginPath(); ctx.ellipse(w / 2, h * 0.42, 60 * d, 18 * d, 0, 0, Math.PI * 2); ctx.fill();
    const riv = { jersey: { pattern: 'hoops', a: '#1d3557', b: '#ffd60a', n: '#fff' }, hair: { style: 'corto', c: '#222', d: '#000' }, boots: { c: '#111' } };
    for (let i = -1; i <= 1; i++) { const s = playerSprite(riv, 'down', 0); ctx.drawImage(s, w / 2 + i * 14 * sc - 8 * sc, h * 0.3 - 20 * sc, 16 * sc, 22 * sc); }
    drawGuy(ctx, w / 2, h * 0.62, sc, 'up');
    // compañeros a los costados
    const mates = [[w * 0.12, 'L'], [w * 0.88, 'R']];
    for (const [x, s] of mates) {
      const call = P.side === s;
      const tm = { jersey: { pattern: 'quarters', a: '#e53935', b: '#fff', n: '#1b1b1b' }, hair: { style: 'corto', c: '#3b2a1e', d: '#241a12' }, boots: { c: '#111' } };
      ctx.drawImage(playerSprite(tm, 'up', call ? Math.floor(G.t * 10) % 3 : 0), x - 8 * sc, h * 0.75 - 20 * sc, 16 * sc, 22 * sc);
      if (call) { pxText(ctx, '¡ACÁ!', x, h * 0.75 - 24 * sc, 12, '#ffd166'); }
    }
    if (P.ball) {
      P.ball.t += dt * 3;
      const tx = P.ball.s === 'L' ? w * 0.12 : w * 0.88;
      const t = Math.min(1, P.ball.t);
      const bx = w / 2 + (tx - w / 2) * t, by = h * 0.6 + (h * 0.66 - h * 0.6) * t - Math.sin(t * Math.PI) * 30 * d;
      ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(bx, by, 9 * d, 6 * d, t * 8, 0, Math.PI * 2); ctx.fill();
      if (t >= 1) P.ball = null;
    }
    if (P.fbT > 0) { P.fbT -= dt; pxText(ctx, P.fb, w / 2, h * 0.15, 12, P.fb.includes('equivocado') || P.fb.includes('lento') ? '#ef476f' : '#06d6a0'); }
    hud(`Pases ${P.ok}/${P.n}`);
  });
}

// LINE: elegí la llamada y tirá cuando el saltador está arriba
export function lineDrill(onEnd) {
  open('📏 Práctica de line', onEnd);
  onKeys();
  const L = { n: 0, total: 6, ok: 0, t: 0, call: 0, state: 'play', fly: null, fb: '', fbT: 0 };
  const calls = ['ADELANTE', 'MEDIO', 'ATRÁS'];
  L.call = Math.floor(Math.random() * 3);
  text('<div class="mg-result">Tirá la pelota cuando el saltador de la llamada esté en lo más alto.</div>');
  setTimeout(() => text(''), 1400);
  const tap = () => {
    if (L.state !== 'play' || L.fly) return;
    const hgt = Math.abs(Math.sin(L.t * 2.4));
    const ok = hgt > 0.82;
    L.fly = { t: 0, ok };
    sfx('kick');
  };
  G.onKey = (k) => { if (k === ' ' || k === 'enter') tap(); };
  buttons(`<button class="btn big mash" id="lt">¡TIRAR!</button>`, () => (el('lt').onpointerdown = (e) => { e.preventDefault(); tap(); }));
  frame((dt) => {
    const { ctx, w, h, d } = G;
    L.t += dt;
    pitchBg(ctx, w, h, d);
    ctx.fillStyle = '#fff'; ctx.fillRect(w * 0.08, 0, 4 * d, h);
    const sc = Math.max(3, Math.round(h / 22 / 5));
    const tm = { jersey: { pattern: 'quarters', a: '#e53935', b: '#fff', n: '#1b1b1b' }, hair: { style: 'rapado', c: '#3b2a1e', d: '#241a12' }, boots: { c: '#111' } };
    const ys = [h * 0.3, h * 0.5, h * 0.7];
    const lift = Math.abs(Math.sin(L.t * 2.4)) * 10 * sc;
    ys.forEach((y, i) => {
      const up = i === L.call ? lift : 0;
      ctx.drawImage(playerSprite(tm, 'left', 0), w * 0.55 - 8 * sc, y - 20 * sc - up, 16 * sc, 22 * sc);
      if (i === L.call) pxText(ctx, calls[i], w * 0.75, y - 6 * sc, 9, '#ffd166');
    });
    drawGuy(ctx, w * 0.06, h * 0.55, sc, 'right');
    if (L.fly) {
      L.fly.t += dt * 1.8;
      const t = Math.min(1, L.fly.t);
      const tx = w * 0.55, ty = ys[L.call] - 20 * sc - (L.fly.ok ? 10 * sc : 0);
      const bx = w * 0.08 + (tx - w * 0.08) * t, by = h * 0.5 + (ty - h * 0.5) * t - Math.sin(t * Math.PI) * 40 * d;
      ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(bx, by, 8 * d, 6 * d, t * 6, 0, Math.PI * 2); ctx.fill();
      if (t >= 1) {
        L.n++; if (L.fly.ok) { L.ok++; L.fb = '¡LINE LIMPIO!'; sfx('done'); } else { L.fb = 'Le erraste al salto'; sfx('miss'); }
        L.fbT = 0.7; L.fly = null; L.call = Math.floor(Math.random() * 3);
        if (L.n >= L.total) { L.state = 'end'; finish(`<b>${L.ok} de ${L.total}</b> lines ganados`, { xp: 20 + L.ok * 6, gold: 8 + L.ok * 3, aura: 100 + L.ok * 60, stats: { dis: 2 + L.ok, car: 2 } }, 'line'); }
      }
    }
    if (L.fbT > 0) { L.fbT -= dt; pxText(ctx, L.fb, w / 2, h * 0.12, 12, L.fb.includes('erraste') ? '#ef476f' : '#06d6a0'); }
    hud(`Lines ${L.ok}/${L.n}`);
  });
}

// TACKLE: tocá cuando el atacante entra en el círculo verde
export function tackleDrill(onEnd) {
  open('🛡️ Tackle', onEnd);
  onKeys();
  const K = { n: 0, total: 6, ok: 0, state: 'play', d: 1, swerve: 0, sp: 0.35, fb: '', fbT: 0, res: 0 };
  text('<div class="mg-result">El atacante viene hacia vos. Tocá TACKLE cuando entre al círculo verde.<br>¡Ojo con los amagues!</div>');
  setTimeout(() => text(''), 1500);
  const reset = () => { K.d = 1; K.sp = 0.32 + K.n * 0.05; K.swerve = (Math.random() - 0.5) * 2; K.res = 0; };
  reset();
  const tap = () => {
    if (K.state !== 'play' || K.res > 0) return;
    const good = K.d < 0.24 && K.d > 0.08;
    K.n++;
    if (good) { K.ok++; K.fb = '¡TACKLE!'; sfx('hit'); } else { K.fb = K.d >= 0.24 ? 'Muy temprano' : 'Te pasó'; sfx('miss'); }
    K.fbT = 0.8; K.res = 0.9;
  };
  G.onKey = (k) => { if (k === ' ' || k === 'enter') tap(); };
  buttons(`<button class="btn big mash" id="tk">TACKLE</button>`, () => (el('tk').onpointerdown = (e) => { e.preventDefault(); tap(); }));
  frame((dt) => {
    const { ctx, w, h, d } = G;
    if (K.state === 'play') {
      if (K.res > 0) { K.res -= dt; if (K.res <= 0) { if (K.n >= K.total) { K.state = 'end'; finish(`<b>${K.ok} de ${K.total}</b> tackles`, { xp: 20 + K.ok * 6, gold: 8 + K.ok * 3, aura: 100 + K.ok * 60, stats: { fue: 2 + K.ok, res: 2 } }, 'tackle'); } else reset(); } }
      else {
        K.d -= K.sp * dt;
        if (K.d <= 0) { K.n++; K.fb = 'Te pasó'; K.fbT = 0.8; K.res = 0.9; sfx('miss'); }
      }
    }
    pitchBg(ctx, w, h, d);
    const sc = Math.max(3, Math.round(h / 22 / 4));
    const meY = h * 0.85;
    ctx.strokeStyle = '#06d6a0'; ctx.lineWidth = 4 * d;
    ctx.beginPath(); ctx.ellipse(w / 2, meY - 4 * sc, w * 0.18, 18 * sc * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
    const ay = meY - K.d * h * 0.75;
    const ax = w / 2 + Math.sin(K.d * 9 + K.swerve * 3) * w * 0.12 * K.d * 2;
    const riv = { jersey: { pattern: 'hoops', a: '#2d6a4f', b: '#fff', n: '#fff' }, hair: { style: 'rapado', c: '#222', d: '#000' }, boots: { c: '#111' } };
    const s = 0.6 + (1 - K.d) * 0.6;
    ctx.drawImage(playerSprite(riv, 'down', Math.floor(G.t * 10) % 3), ax - 8 * sc * s, ay - 20 * sc * s, 16 * sc * s, 22 * sc * s);
    drawGuy(ctx, w / 2, meY + 14 * sc, sc, 'up');
    if (K.fbT > 0) { K.fbT -= dt; pxText(ctx, K.fb, w / 2, h * 0.15, 13, K.fb === '¡TACKLE!' ? '#06d6a0' : '#ef476f'); }
    hud(`Tackles ${K.ok}/${K.n}`);
  });
}
