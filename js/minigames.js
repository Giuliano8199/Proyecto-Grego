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
function buttons(html, bind) { const b = el('mgbtns'); b.innerHTML = html; bind?.(b); }
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
