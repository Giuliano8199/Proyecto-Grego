// =============================================================
//  PARTIDO DE RUGBY (pantalla horizontal, ~5 minutos)
//  Universitario vs. un rival. Vos sos el 9 (medio scrum).
// =============================================================
import { S, look, statLvl, level, grant, save, emit } from './state.js';
import { playerSprite } from './pixel.js';
import { sfx, playMusic } from './audio.js';
import { TEAMMATES, RIVALS } from './data.js';
import { clamp, rand, pick, shuffle, fmt } from './util.js';

const FIELD = { len: 100, wid: 70, ig: 10 };
const HALF_REAL = 150; // segundos reales por tiempo
const K = 0.62; // aplastamiento vertical (vista 2.5D)
const ROLES = ['pilar', 'hooker', 'pilar', 'medio', 'apertura', 'centro', 'wing'];
const NUMS = [1, 2, 3, 9, 10, 12, 14];
const FWD = (i) => i < 3;

let M = null;
const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------
export function startMatch(onEnd) {
  const rival = pick(RIVALS);
  const mates = shuffle(TEAMMATES).slice(0, 6);
  const diff = clamp(0.85 + level() * 0.012, 0.85, 1.15);
  M = {
    onEnd, rival, diff,
    teams: [
      { name: 'Universitario', short: 'LA U', d: 1, score: 0, col: '#e53935', tries: 0 },
      { name: rival.name, short: rival.short, d: -1, score: 0, col: rival.a, tries: 0 },
    ],
    players: [], ball: { x: 50, y: 35, z: 0, owner: null, mode: 'dead' },
    phase: 'intro', pt: 0, clock: 0, half: 1, firstKick: 1,
    cam: { x: 50, y: 35 }, msg: null, msgT: 0, sub: null,
    input: { x: 0, y: 0, kick: false, kickT: 0 }, keys: {},
    ctrl: null, stats: { tries: 0, tackles: 0, passes: 0, metres: 0, kicks: 0, myTries: 0 },
    fx: [], t: 0, last: 0, alive: true, choice: null, gk: null, set: null,
  };
  // jugadores
  for (let team = 0; team < 2; team++) {
    for (let i = 0; i < 7; i++) {
      let name, lk;
      if (team === 0) {
        if (i === 3) { name = 'Giuli'; lk = look(); }
        else {
          const tm = mates[i > 3 ? i - 1 : i];
          name = tm.name;
          lk = { ...tm.look, jersey: { pattern: 'quarters', a: '#e53935', b: '#ffffff', n: '#1b1b1b' }, shorts: '#f1f3f5', socks: '#e53935' };
        }
      } else {
        name = `${rival.short} ${NUMS[i]}`;
        lk = { jersey: { pattern: 'hoops', a: rival.a, b: rival.b, n: '#fff' }, hair: { style: pick(['corto', 'rapado', 'flequillo']), c: pick(['#1b1b1b', '#3b2a1e', '#6b4226', '#8a6a3c']), d: '#111' }, boots: { c: '#111' }, shorts: rival.shorts, socks: rival.a, skin: pick(['#f4cdb0', '#e0b090', '#c68642']), skinD: '#a0705a' };
      }
      M.players.push({
        team, idx: i, num: NUMS[i], role: ROLES[i], name, look: lk,
        x: 50, y: 35, vx: 0, vy: 0, tx: 50, ty: 35, state: 'run', t: 0,
        dir: team === 0 ? 'right' : 'left', anim: 0, frame: 0, inv: 0, stepCd: 0,
        speed: (FWD(i) ? 6.0 : 7.0) * (team === 1 ? diff : 1) * (i === 3 && team === 0 ? 1 + statLvl('res') * 0.01 : 1),
      });
    }
  }
  M.giuli = M.players[3];
  window.__M = M;
  window.__Mf = { startScrum, startLineout, startPenalty, scoreTry, startGoalKick, endScreen: () => { M.phase = 'end'; endScreen(); } };
  buildUI();
  playMusic('battle');
  setKickoff(1);
  banner(`${M.teams[0].short} vs ${M.teams[1].short}`, 'Primer tiempo', 2);
  requestAnimationFrame(loop);
}

const P = (team, i) => M.players[team * 7 + i];
const teamOf = (team) => M.players.slice(team * 7, team * 7 + 7);
const other = (t) => 1 - t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const D = (team) => M.teams[team].d;

// ---------------------------------------------------------------
//  INTERFAZ (HTML sobre el canvas)
// ---------------------------------------------------------------
function buildUI() {
  const ov = $('match');
  ov.innerHTML = `
    <div id="mx" class="mx">
      <canvas id="mcv"></canvas>
      <div class="mx-top"><button class="x" id="mquit">✕</button></div>
      <div id="mjoy" class="mjoy"><div id="mjoyk"></div></div>
      <div class="mbtns att" id="mbtns">
        <button class="mb pass" data-b="up">PASE<br>▲</button>
        <button class="mb pass" data-b="down">PASE<br>▼</button>
        <button class="mb kick" data-b="kick">PATADA</button>
        <button class="mb step" data-b="step">AMAGUE</button>
        <button class="mb tackle" data-b="tackle">TACKLE</button>
        <button class="mb switch" data-b="switch">CAMBIAR</button>
      </div>
      <div id="mpanel" class="mpanel" hidden></div>
      <div id="mrotate" class="mrotate" hidden>📱↻ Girá el celu para jugar en horizontal</div>
    </div>`;
  ov.hidden = false;
  document.body.classList.add('in-match');
  layout();
  window.addEventListener('resize', layout);
  M.onResize = layout;
  $('mquit').onclick = () => { if (confirm('¿Abandonar el partido?')) finish(true); };
  // botones
  ov.querySelectorAll('.mb').forEach((b) => {
    const k = b.dataset.b;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(k, true); b.classList.add('on'); });
    const up = (e) => { e.preventDefault(); press(k, false); b.classList.remove('on'); };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointerleave', up);
    b.addEventListener('pointercancel', up);
  });
  bindJoy();
  $('mcv').addEventListener('pointerdown', (e) => {
    if (!M) return;
    if (M.phase === 'gk' || (M.phase === 'lineout' && M.set?.step === 'throw') || (M.phase === 'scrum' && M.set?.step === 'push')) { e.preventDefault(); press('tap', true); }
  });
  M.kd = (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (M.keys[k]) return;
    M.keys[k] = true;
    if (k === 'q') press('up', true);
    if (k === 'e') press('down', true);
    if (k === ' ') press('kick', true);
    if (k === 'f' || k === 'k') press(M.attacking ? 'step' : 'tackle', true);
    if (k === 'c') press('switch', true);
  };
  M.ku = (e) => {
    const k = e.key.toLowerCase();
    M.keys[k] = false;
    if (k === ' ') press('kick', false);
  };
  window.addEventListener('keydown', M.kd);
  window.addEventListener('keyup', M.ku);
  // pantalla completa + horizontal (Android)
  try {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  } catch (e) { /* nada */ }
}

function layout() {
  if (!M) return;
  const mx = $('mx');
  const W = window.innerWidth, H = window.innerHeight;
  M.rot = H > W; // vertical → rotamos todo 90°
  if (M.rot) {
    mx.style.width = H + 'px'; mx.style.height = W + 'px';
    mx.style.transform = `translate(${W}px, 0) rotate(90deg)`;
  } else {
    mx.style.width = W + 'px'; mx.style.height = H + 'px';
    mx.style.transform = 'none';
  }
  const cw = M.rot ? H : W, ch = M.rot ? W : H;
  const c = $('mcv');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.floor(cw * dpr); c.height = Math.floor(ch * dpr);
  c.style.width = cw + 'px'; c.style.height = ch + 'px';
  M.c = c; M.ctx = c.getContext('2d'); M.dpr = dpr; M.w = c.width; M.h = c.height;
  M.S = M.w / 44; // metros visibles a lo ancho
  if (M.h / (M.S * K) < 26) M.S = M.h / (26 * K);
}

function bindJoy() {
  const base = $('mjoy'), knob = $('mjoyk');
  let id = null, cx = 0, cy = 0;
  const R = 45;
  const start = (e) => {
    id = e.pointerId;
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    base.setPointerCapture?.(e.pointerId);
    move(e);
  };
  const move = (e) => {
    if (id !== e.pointerId) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    if (M.rot) { const t = dx; dx = dy; dy = -t; }
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    M.input.x = dx / R; M.input.y = dy / R;
  };
  const end = (e) => { if (id !== e.pointerId) return; id = null; M.input.x = 0; M.input.y = 0; knob.style.transform = ''; };
  base.addEventListener('pointerdown', start);
  base.addEventListener('pointermove', move);
  base.addEventListener('pointerup', end);
  base.addEventListener('pointercancel', end);
}

function setButtons() {
  const b = $('mbtns');
  if (!b) return;
  const att = M.ball.owner ? M.ball.owner.team === 0 : M.attacking;
  M.attacking = att;
  b.className = 'mbtns ' + (att ? 'att' : 'def');
}

function press(k, down) {
  if (!M || !M.alive) return;
  if (M.phase === 'gk') { if (down) gkTap(); return; }
  if (M.phase === 'scrum' && M.set?.step === 'push') { if (down) M.set.bar += 0.045 + statLvl('fue') * 0.002; return; }
  if (M.phase === 'lineout' && M.set?.step === 'throw') { if (down) lineoutThrow(); return; }
  if (M.phase !== 'play') return;
  const c = M.ctrl;
  if (!c) return;
  if (k === 'kick') {
    if (M.ball.owner === c) {
      if (down) { M.input.kick = true; M.input.kickT = 0; }
      else if (M.input.kick) { M.input.kick = false; kick(c, Math.min(1, M.input.kickT / 0.9)); }
    }
    return;
  }
  if (!down) return;
  if ((k === 'up' || k === 'down') && M.ball.owner === c) pass(c, k === 'up' ? -1 : 1);
  if (k === 'step' && M.ball.owner === c && c.stepCd <= 0) {
    const s = M.input.y !== 0 ? Math.sign(M.input.y) : (Math.random() < 0.5 ? -1 : 1);
    c.vy = s * 11; c.inv = 0.4; c.stepCd = 1.1; sfx('step');
    float(c, 'AMAGUE', '#4cc9f0');
  }
  if (k === 'tackle' && M.ball.owner && M.ball.owner.team === 1 && c.state === 'run') {
    const car = M.ball.owner;
    const a = Math.atan2(car.y - c.y, car.x - c.x);
    c.state = 'dive'; c.t = 0.35; c.vx = Math.cos(a) * 12; c.vy = Math.sin(a) * 12;
  }
  if (k === 'switch' && !M.attacking) switchCtrl(true);
}

// ---------------------------------------------------------------
//  MENSAJES
// ---------------------------------------------------------------
function banner(text, sub = '', t = 1.6) { M.msg = text; M.sub = sub; M.msgT = t; }
function float(p, text, col) { M.fx.push({ x: p.x, y: p.y, text, col, t: 0 }); }

function panel(html, bind) {
  const p = $('mpanel');
  if (!html) { p.hidden = true; p.innerHTML = ''; return; }
  p.innerHTML = html; p.hidden = false;
  bind?.(p);
}

// ---------------------------------------------------------------
//  FORMACIONES
// ---------------------------------------------------------------
function placeLines(att, x, y, kind) {
  // coloca a los dos equipos para una formación fija
  const d = D(att);
  const open = y < 35 ? 1 : -1;
  for (const p of M.players) {
    p.state = 'run'; p.vx = 0; p.vy = 0; p.t = 0;
    const atk = p.team === att;
    const pd = D(p.team);
    let px, py;
    if (kind === 'kickoff') {
      // el que patea en la mitad; el resto repartido
      const lanes = [12, 22, 32, 35, 42, 52, 60];
      if (atk) { px = 50 - pd * (p.idx === 4 ? 0.5 : 2); py = p.idx === 4 ? 35 : lanes[p.idx]; }
      else { px = 50 - pd * (p.idx < 3 ? 12 : p.idx === 6 ? 32 : 20 + p.idx * 2); py = [20, 35, 50, 30, 40, 22, 35][p.idx]; }
    } else if (kind === 'scrum') {
      if (p.idx < 3) { px = x - pd * 2.3; py = y + (p.idx - 1) * 2.2; }
      else if (atk) { const k = p.idx - 3; px = x - d * (1.5 + k * 3); py = clamp(y + open * (k === 0 ? 1.5 : 5 + k * 6), 3, 67); }
      else { const k = p.idx - 3; px = x - pd * (k === 0 ? 1.5 : 5); py = clamp(y + open * (k === 0 ? 2 : 4 + k * 7), 3, 67); }
    } else if (kind === 'lineout') {
      const side = y < 35 ? 0 : 70, inward = side === 0 ? 1 : -1;
      if (p.idx < 3) { px = x - pd * 0.8; py = side + inward * (5 + p.idx * 3); }
      else if (atk && p.idx === 3) { px = x - d * 1.5; py = side + inward * 16; }
      else { const k = p.idx - 3; px = x - pd * (atk ? 4 + k * 3 : 6); py = clamp(side + inward * (16 + k * 9), 3, 67); }
      if (atk && p.idx === 1) { px = x; py = side - inward * 0.6; } // hooker tira
    } else { // tras ruck / jugada
      const k = p.idx;
      if (atk) {
        if (k === 3) { px = x - d * 1; py = y; }
        else if (k < 3) { px = x - d * 0.5; py = y + (k - 1) * 3; }
        else { const j = k - 3; px = x - d * (4 + j * 2.5); py = clamp(y + open * (6 + j * 7), 3, 67); }
      } else {
        const lanes = [-3, 0, 3, -12, 8, 16, 24];
        px = x - pd * (k === 6 ? 15 : 2.5); py = clamp(y + open * lanes[k], 3, 67);
      }
    }
    p.x = clamp(px, -8, 108); p.y = clamp(py, 1, 69); p.tx = p.x; p.ty = p.y;
    p.dir = pd > 0 ? 'right' : 'left';
  }
}

function setKickoff(team) {
  M.phase = 'kickoff'; M.pt = 1.4; M.kickTeam = team;
  M.ball.owner = null; M.ball.mode = 'dead';
  placeLines(team, 50, 35, 'kickoff');
  M.ball.x = 50; M.ball.y = 35; M.ball.z = 0;
  M.cam.x = 50; M.cam.y = 35;
  M.attacking = team !== 0;
  setButtons();
}

// ---------------------------------------------------------------
//  ACCIONES CON PELOTA
// ---------------------------------------------------------------
function giveBall(p) {
  M.ball.owner = p; M.ball.mode = 'held'; M.ball.z = 1;
  if (p.team === 0) { M.ctrl = p; }
  else if (!M.ctrl || M.ctrl.team !== 0) switchCtrl();
  else switchCtrl();
  setButtons();
}

function pass(from, dir) {
  const d = D(from.team);
  const mates = teamOf(from.team).filter((p) => p !== from && p.state === 'run');
  let cands = mates.filter((p) => (p.x - from.x) * d <= 0.8 && (p.y - from.y) * dir > 1 && dist(p, from) < 24);
  if (!cands.length) cands = mates.filter((p) => (p.y - from.y) * dir > 0.5 && dist(p, from) < 24);
  if (!cands.length) { if (from.team === 0) float(from, 'Sin apoyo', '#adb5bd'); return false; }
  cands.sort((a, b) => Math.abs(a.y - from.y) + Math.abs(a.x - from.x) * 0.5 - (Math.abs(b.y - from.y) + Math.abs(b.x - from.x) * 0.5));
  const to = cands[0];
  const dd = dist(from, to);
  const T = 0.22 + dd / 18;
  let tx = to.x + to.vx * T, ty = to.y + to.vy * T;
  // nunca para adelante
  if ((tx - from.x) * d > 0.3) tx = from.x + d * 0.3;
  const b = M.ball;
  b.owner = null; b.mode = 'pass'; b.fx = from.x; b.fy = from.y; b.tx = tx; b.ty = ty; b.t = 0; b.T = T; b.h = 0.6 + dd * 0.04; b.target = to; b.team = from.team; b.intercepted = false;
  to.tx = tx; to.ty = ty; to.wait = T;
  if (from.team === 0) { M.stats.passes++; sfx('kick'); }
  return true;
}

function kick(from, pw) {
  const d = D(from.team);
  const distK = 12 + 38 * pw;
  const yOff = from.team === 0 ? M.input.y * 14 : rand(-12, 12);
  const tx = from.x + d * distK, ty = from.y + yOff;
  launchAir(from.x, from.y, tx, ty, 1.1 + 1.4 * pw, 5 + 10 * pw, from.team);
  if (from.team === 0) M.stats.kicks++;
  sfx('kick');
  float(from, '¡PATADA!', '#ffd166');
}

function launchAir(fx, fy, tx, ty, T, h, team) {
  const b = M.ball;
  b.owner = null; b.mode = 'air'; b.fx = fx; b.fy = fy; b.tx = tx; b.ty = ty; b.t = 0; b.T = T; b.h = h; b.team = team;
  M.attacking = team !== 0; // mientras vuela, se defiende
  setButtons();
}

function knockOn(p) {
  banner('KNOCK-ON', `Scrum para ${M.teams[other(p.team)].short}`, 1.6);
  sfx('whistle');
  startScrum(other(p.team), M.ball.x, M.ball.y);
}

// ---------------------------------------------------------------
//  TACKLE Y RUCK
// ---------------------------------------------------------------
function tackle(def, car) {
  car.state = 'down'; car.t = 1.0;
  def.state = 'down'; def.t = 0.9;
  const b = M.ball;
  b.owner = null; b.mode = 'dead'; b.x = car.x; b.y = car.y; b.z = 0;
  sfx('hit');
  if (def.team === 0) { M.stats.tackles++; float(def, '¡TACKLE!', '#06d6a0'); }
  else float(car, 'TACKLEADO', '#ef476f');
  M.phase = 'tackle'; M.pt = 0.6; M.ruck = { x: car.x, y: car.y, att: car.team };
  // penales ocasionales
  const r = Math.random();
  if (r < 0.06) M.ruck.pen = { team: car.team, why: 'Tackle alto' };
  else if (r < 0.1) M.ruck.pen = { team: def.team, why: 'No soltó la pelota' };
}

function startRuck() {
  const r = M.ruck;
  if (r.pen) return startPenalty(r.pen.team, r.x, r.y, r.pen.why);
  M.phase = 'ruck'; M.pt = 1.2;
  banner('RUCK', '', 0.9);
  // jugadores cerca se suman al ruck
  const near = M.players.filter((p) => p.state === 'run' && dist(p, r) < 7).sort((a, b) => dist(a, r) - dist(b, r)).slice(0, 4);
  near.forEach((p, i) => { p.state = 'bind'; p.t = 1.2; p.x = r.x + (p.team === r.att ? -D(p.team) : -D(p.team)) * 0.6; p.y = r.y + (i % 2 ? 0.7 : -0.7); });
  const support = M.players.filter((p) => p.team === r.att && dist(p, r) < 5).length;
  const turnover = support >= 1 ? 0.08 : 0.3;
  r.winner = Math.random() < turnover ? other(r.att) : r.att;
}

function endRuck() {
  const r = M.ruck;
  const w = r.winner;
  if (w !== r.att) { banner('¡RECUPERACIÓN!', M.teams[w].short, 1.2); sfx(w === 0 ? 'done' : 'miss'); }
  placeLines(w, r.x, r.y, 'phase');
  M.phase = 'play';
  const nine = P(w, 3);
  nine.x = r.x - D(w) * 1; nine.y = r.y;
  giveBall(nine);
  if (w === 0) { M.hint = 'Pasá ▲▼, corré o pateá'; M.hintT = 2.5; }
  else nine.hold = 0.5;
}

// ---------------------------------------------------------------
//  SCRUM
// ---------------------------------------------------------------
function startScrum(feed, x, y) {
  x = clamp(x, 5, 95); y = clamp(y, 15, 55);
  M.ball.owner = null; M.ball.mode = 'dead'; M.ball.x = x; M.ball.y = y; M.ball.z = 0;
  placeLines(feed, x, y, 'scrum');
  M.phase = 'scrum'; M.pt = 0;
  M.set = { feed, x, y, step: 'call', t: 0, bar: 0.5 };
  M.attacking = true; setButtons();
  panel('');
}
function updateScrum(dt) {
  const s = M.set;
  s.t += dt;
  if (s.step === 'call') {
    const calls = ['¡Agachar!', '¡Tomar!', '¡YA!'];
    const i = Math.min(2, Math.floor(s.t / 0.7));
    M.msg = calls[i]; M.sub = 'Scrum'; M.msgT = 0.3;
    if (s.t > 2.1) { s.step = 'push'; s.t = 0; sfx('whistle'); }
  } else if (s.step === 'push') {
    const oppPush = 0.17 * M.diff + (s.feed === 1 ? 0.03 : 0);
    s.bar -= oppPush * dt;
    s.bar = clamp(s.bar, 0, 1);
    M.msg = '¡EMPUJÁ!'; M.sub = 'Tocá cualquier botón rápido'; M.msgT = 0.2;
    if (s.t > 2.6 || s.bar >= 1 || s.bar <= 0) {
      const thr = s.feed === 0 ? 0.4 : 0.6;
      const w = s.bar >= thr ? 0 : 1;
      s.step = 'done'; s.t = 0;
      banner(w === 0 ? '¡SCRUM GANADO!' : 'Scrum perdido', '', 1.2);
      sfx(w === 0 ? 'done' : 'miss');
      s.winner = w;
    }
  } else if (s.step === 'done' && s.t > 1.0) {
    M.set = null;
    M.ruck = { x: s.x, y: s.y, att: s.winner, winner: s.winner };
    endRuck();
  }
}

// ---------------------------------------------------------------
//  LINE (lateral)
// ---------------------------------------------------------------
function startLineout(team, x, side) {
  x = clamp(x, 6, 94);
  const y = side === 0 ? 0.5 : 69.5;
  M.ball.owner = null; M.ball.mode = 'dead'; M.ball.x = x; M.ball.y = y; M.ball.z = 1.5;
  placeLines(team, x, side === 0 ? 1 : 69, 'lineout');
  M.phase = 'lineout';
  M.set = { team, x, side, step: 'call', t: 0, zone: null };
  M.attacking = true; setButtons();
  const zones = [['adelante', 'Adelante'], ['medio', 'Medio'], ['atras', 'Atrás']];
  const ask = team === 0 ? '¿A quién tiramos?' : '¿Dónde saltamos para robar?';
  panel(`<div class="mp-t">LINE · ${M.teams[team].short}</div><div class="mp-s">${ask}</div><div class="mp-row">${zones.map(([k, n]) => `<button class="btn" data-z="${k}">${n}</button>`).join('')}</div>`, (p) => {
    p.querySelectorAll('[data-z]').forEach((b) => (b.onclick = () => {
      M.set.zone = b.dataset.z;
      panel('');
      if (team === 0) { M.set.step = 'throw'; M.set.t = 0; }
      else resolveLineout(Math.random() < 0.5 ? 0.9 : 0.6);
    }));
  });
}
function lineoutThrow() {
  const s = M.set;
  // calidad según qué tan cerca del pico está el saltador
  const h = Math.abs(Math.sin(s.t * 2.2));
  resolveLineout(h);
}
function resolveLineout(q) {
  const s = M.set;
  const oppZone = pick(['adelante', 'medio', 'atras']);
  let win;
  if (s.team === 0) {
    const pWin = (oppZone === s.zone ? 0.4 : 0.85) * (0.55 + q * 0.45);
    win = Math.random() < pWin ? 0 : 1;
  } else {
    const steal = oppZone === s.zone ? 0.5 : 0.08;
    win = Math.random() < steal ? 0 : 1;
  }
  s.step = 'fly'; s.t = 0; s.win = win; s.q = q;
  sfx('kick');
}
function updateLineout(dt) {
  const s = M.set;
  s.t += dt;
  if (s.step === 'throw') {
    M.msg = '¡TIRÁ!'; M.sub = 'Tocá cuando el saltador esté arriba'; M.msgT = 0.2;
    if (s.t > 6) resolveLineout(0.3);
  } else if (s.step === 'fly') {
    if (s.t > 0.9) {
      banner(s.win === s.team ? (s.win === 0 ? '¡LINE GANADO!' : `Line de ${M.teams[s.win].short}`) : '¡ROBADO!', '', 1.2);
      sfx(s.win === 0 ? 'done' : 'miss');
      s.step = 'done'; s.t = 0;
    }
  } else if (s.step === 'done' && s.t > 0.8) {
    const y = s.side === 0 ? 12 : 58;
    M.set = null;
    M.ruck = { x: s.x, y, att: s.win, winner: s.win };
    endRuck();
  }
}

// ---------------------------------------------------------------
//  PENALES Y PATADAS A LOS PALOS
// ---------------------------------------------------------------
function startPenalty(team, x, y, why) {
  sfx('whistle');
  M.ball.owner = null; M.ball.mode = 'dead'; M.ball.x = x; M.ball.y = y; M.ball.z = 0;
  M.phase = 'penalty';
  banner(`PENAL ${M.teams[team].short}`, why, 1.6);
  const toPosts = team === 0 ? 100 - x : x;
  if (team === 0) {
    panel(`<div class="mp-t">PENAL PARA LA U</div><div class="mp-s">${why} · a ${Math.round(toPosts)} m de los palos</div><div class="mp-row">
      <button class="btn gold" data-p="palos" ${toPosts > 48 ? 'disabled' : ''}>🎯 A los palos</button>
      <button class="btn" data-p="touch">📏 Al touch</button>
      <button class="btn good" data-p="rapido">⚡ Jugar rápido</button></div>`, (p) => {
      p.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => {
        panel('');
        const c = b.dataset.p;
        if (c === 'palos') startGoalKick(0, x, y, 3);
        else if (c === 'touch') startLineout(0, Math.min(94, x + 18), y < 35 ? 0 : 1);
        else { placeLines(0, x, y, 'phase'); M.phase = 'play'; const n = P(0, 3); n.x = x - 1; n.y = y; giveBall(n); }
      }));
    });
  } else {
    M.pt = 1.6;
    M.penAI = { x, y, toPosts };
  }
}

function startGoalKick(team, x, y, pts) {
  if (team === 1) {
    // la máquina patea
    const distK = team === 1 ? x : 100 - x;
    const ok = Math.random() < clamp(0.85 - distK / 100 - Math.abs(y - 35) / 120, 0.25, 0.85);
    M.phase = 'aikick'; M.pt = 1.6; M.aik = { ok, pts };
    banner(pts === 2 ? 'Conversión rival' : 'Penal a los palos', '', 1.4);
    return;
  }
  const distK = clamp(100 - x, 8, 50);
  M.phase = 'gk';
  M.gk = { pts, dist: Math.round(distK + 5), spot: clamp((y - 35) / 35, -0.9, 0.9), wind: +(rand(-1, 1)).toFixed(1), step: 'aim', aim: 0, pow: 0, t: 0, ball: null };
  panel('');
  M.attacking = true; setButtons();
}
function gkTap() {
  const g = M.gk;
  if (g.step === 'aim') { g.lockAim = g.aim; g.step = 'power'; sfx('click'); }
  else if (g.step === 'power') {
    g.lockPow = g.pow; g.step = 'fly'; g.t = 0; sfx('kick');
    const need = 0.45 + g.dist / 110 - Math.min(0.15, statLvl('fue') * 0.01);
    const lateral = g.lockAim + g.wind * 0.12 + g.spot * 0.15 * (1 - Math.abs(g.lockAim));
    g.ok = Math.abs(lateral) < 0.16 + Math.min(0.06, statLvl('dis') * 0.004) && g.lockPow >= need;
    g.short = g.lockPow < need; g.lat = lateral;
  }
}
function afterGoalKick(team, ok, pts) {
  if (ok) { M.teams[team].score += pts; banner(pts === 2 ? '¡CONVERSIÓN!' : '¡PENAL ADENTRO!', `+${pts}`, 1.5); sfx(team === 0 ? 'done' : 'miss'); }
  else { banner('¡Afuera!', '', 1.2); sfx(team === 0 ? 'miss' : 'done'); }
  M.phase = 'wait'; M.pt = 1.4;
  M.next = () => {
    if (pts === 2 || ok) setKickoff(other(team));
    else restart22(other(team));
  };
}

function restart22(team) {
  const x = team === 0 ? 22 : 78;
  placeLines(team, x, 35, 'phase');
  M.phase = 'play';
  const p = P(team, 4); p.x = x; p.y = 35;
  giveBall(p);
  banner('Saque de 22', M.teams[team].short, 1.2);
}

// ---------------------------------------------------------------
//  TRY
// ---------------------------------------------------------------
function scoreTry(p) {
  const team = p.team;
  M.teams[team].score += 5; M.teams[team].tries++;
  M.ball.owner = null; M.ball.mode = 'dead'; M.ball.x = p.x; M.ball.y = p.y; M.ball.z = 0;
  p.state = 'down'; p.t = 1.5;
  M.phase = 'try'; M.pt = 2.4; M.tryAt = { team, x: p.x, y: p.y };
  if (team === 0) {
    M.stats.tries++;
    if (p === M.giuli) M.stats.myTries++;
    banner('¡TRY!', `${p.name} · +5`, 2.3);
    sfx('aura');
  } else { banner('Try rival', `${M.teams[1].short} +5`, 2.2); sfx('lose'); }
}

// ---------------------------------------------------------------
//  CAMBIO DE JUGADOR CONTROLADO
// ---------------------------------------------------------------
function switchCtrl(force = false) {
  const target = M.ball.owner || { x: M.ball.mode === 'air' ? M.ball.tx : M.ball.x, y: M.ball.mode === 'air' ? M.ball.ty : M.ball.y };
  const mine = teamOf(0).filter((p) => p.state === 'run' || p.state === 'dive');
  if (!mine.length) return;
  mine.sort((a, b) => dist(a, target) - dist(b, target));
  let pickP = mine[0];
  if (force && pickP === M.ctrl && mine[1]) pickP = mine[1];
  M.ctrl = pickP;
}

// ---------------------------------------------------------------
//  ACTUALIZACIÓN
// ---------------------------------------------------------------
function moveTo(p, tx, ty, sp, dt) {
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.15) { p.vx *= 0.7; p.vy *= 0.7; }
  else {
    const s = Math.min(sp, d * 4);
    p.vx += ((dx / d) * s - p.vx) * Math.min(1, dt * 8);
    p.vy += ((dy / d) * s - p.vy) * Math.min(1, dt * 8);
  }
}

function updatePlayers(dt) {
  const b = M.ball;
  const car = b.owner;
  for (const p of M.players) {
    if (p.inv > 0) p.inv -= dt;
    if (p.stepCd > 0) p.stepCd -= dt;
    if (p.state === 'down' || p.state === 'bind') {
      p.t -= dt; p.vx *= 0.85; p.vy *= 0.85;
      if (p.t <= 0) p.state = 'run';
      p.x += p.vx * dt; p.y += p.vy * dt;
      continue;
    }
    if (p.state === 'dive') {
      p.t -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.9; p.vy *= 0.9;
      if (car && car.team !== p.team && dist(p, car) < 1.3 && car.inv <= 0) {
        if (Math.random() < 0.8 + statLvl('fue') * 0.01) { tackle(p, car); return; }
        car.inv = 0.4;
      }
      if (p.t <= 0) { p.state = 'down'; p.t = 0.6; }
      continue;
    }
    if (M.phase !== 'play' && M.phase !== 'kickoff') { p.vx *= 0.8; p.vy *= 0.8; }
    else if (p === M.ctrl) {
      // jugador controlado
      let ix = M.input.x, iy = M.input.y;
      const k = M.keys;
      if (k.arrowleft || k.a) ix = -1; if (k.arrowright || k.d) ix = 1;
      if (k.arrowup || k.w) iy = -1; if (k.arrowdown || k.s) iy = 1;
      const len = Math.hypot(ix, iy);
      if (len > 1) { ix /= len; iy /= len; }
      const sp = p.speed * (car === p ? 1 : 1.05);
      if (p.vy && Math.abs(p.vy) > 9) { /* amague en curso */ }
      p.vx += (ix * sp - p.vx) * Math.min(1, dt * 9);
      p.vy += (iy * sp - p.vy) * Math.min(1, dt * 9);
    } else {
      aiMove(p, dt);
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = clamp(p.x, -9.5, 109.5);
    if (p !== car) p.y = clamp(p.y, -2, 72);
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 0.5) {
      p.anim += dt * sp * 1.6;
      p.frame = [0, 1, 0, 2][Math.floor(p.anim) % 4];
      if (Math.abs(p.vx) > Math.abs(p.vy) * 0.8) p.dir = p.vx > 0 ? 'right' : 'left';
      else p.dir = p.vy > 0 ? 'down' : 'up';
    } else p.frame = 0;
  }
}

function aiMove(p, dt) {
  const b = M.ball;
  const car = b.owner;
  const d = D(p.team);
  let tx = p.x, ty = p.y, sp = p.speed * 0.95;
  if (p.wait > 0) { p.wait -= dt; tx = p.tx; ty = p.ty; sp = p.speed; moveTo(p, tx, ty, sp, dt); return; }
  if (M.phase === 'kickoff') { moveTo(p, p.tx, p.ty, sp, dt); return; }
  if (b.mode === 'air' || b.mode === 'loose' || b.mode === 'pass') {
    const lx = b.mode === 'loose' ? b.x : b.tx, ly = b.mode === 'loose' ? b.y : b.ty;
    // los más cercanos van a la pelota
    const team = teamOf(p.team).filter((q) => q.state === 'run' && q !== M.ctrl);
    team.sort((a, c) => Math.hypot(a.x - lx, a.y - ly) - Math.hypot(c.x - lx, c.y - ly));
    const rank = team.indexOf(p);
    if (b.mode === 'pass' && b.target === p) { tx = b.tx; ty = b.ty; sp = p.speed; }
    else if (rank === 0 || (rank === 1 && b.mode !== 'pass')) { tx = lx; ty = ly; sp = p.speed; }
    else { tx = p.x + (lx - p.x) * 0.3; ty = p.y + (ly - p.y) * 0.3; }
    moveTo(p, tx, ty, sp, dt);
    return;
  }
  if (!car) { moveTo(p, p.tx, p.ty, sp, dt); return; }
  if (p === car) { aiCarrier(p, dt); return; }
  if (car.team === p.team) {
    // apoyo en ataque: diagonal detrás del portador
    const open = car.y < 35 ? 1 : -1;
    const others = teamOf(p.team).filter((q) => q !== car);
    const k = others.indexOf(p);
    const slots = [[-2.5, open * 5], [-4.5, open * 11], [-6.5, open * 17], [-2.5, -open * 5], [-1.5, open * 2], [-4.5, -open * 12]];
    const order = others.map((q) => q).sort((a, c) => (FWD(a.idx) ? 0 : 1) - (FWD(c.idx) ? 0 : 1));
    const slot = slots[order.indexOf(p)] || slots[k % slots.length];
    tx = car.x + d * slot[0]; ty = clamp(car.y + slot[1], 2, 68);
    sp = p.speed * 1.02;
  } else {
    // defensa: línea delante del portador + un perseguidor
    const dc = D(car.team);
    const defs = teamOf(p.team).filter((q) => q.state === 'run' && q !== M.ctrl);
    const chaser = defs.slice().sort((a, c) => dist(a, car) - dist(c, car))[0];
    if (p === chaser && !(M.ctrl && M.ctrl.team === p.team && dist(M.ctrl, car) < dist(p, car) - 1)) {
      tx = car.x + car.vx * 0.25; ty = car.y + car.vy * 0.25; sp = p.speed * 1.02;
    } else {
      const sorted = defs.slice().sort((a, c) => a.y - c.y);
      const lanes = sorted.map((_, i) => car.y + (i - (sorted.length - 1) / 2) * 8);
      const i = sorted.indexOf(p);
      tx = car.x + dc * (p.idx === 6 ? 14 : 3.5); ty = clamp(lanes[i] ?? car.y, 2, 68);
    }
  }
  moveTo(p, tx, ty, sp, dt);
}

function aiCarrier(p, dt) {
  const d = D(p.team);
  if (p.hold > 0) {
    p.hold -= dt; p.vx *= 0.8; p.vy *= 0.8;
    if (p.hold <= 0) {
      const ownDeep = p.team === 1 ? p.x > 72 : p.x < 28;
      if (ownDeep && Math.random() < 0.45) kick(p, rand(0.6, 0.9));
      else pass(p, Math.random() < 0.5 ? -1 : 1);
    }
    return;
  }
  const defs = M.players.filter((q) => q.team !== p.team && q.state === 'run');
  let nearest = null, nd = 99;
  for (const q of defs) { const dd = dist(q, p); if (dd < nd && (q.x - p.x) * d > -1) { nd = dd; nearest = q; } }
  let ty = p.y;
  if (nearest && nd < 7) ty = p.y + (p.y > nearest.y ? 6 : -6);
  ty = clamp(ty, 4, 66);
  moveTo(p, p.x + d * 10, ty, p.speed * 0.98, dt);
  p.passT = (p.passT || 0) + dt;
  if (nearest && nd < 2.8 && p.passT > 0.6 && Math.random() < dt * 3.5) {
    if (pass(p, nearest.y > p.y ? -1 : 1)) p.passT = 0;
  }
}

function updateBall(dt) {
  const b = M.ball;
  if (b.mode === 'held' && b.owner) {
    const p = b.owner;
    b.x = p.x + D(p.team) * 0.3; b.y = p.y; b.z = 1;
    // contacto con defensores
    if (p.inv <= 0) {
      for (const q of M.players) {
        if (q.team === p.team || q.state !== 'run') continue;
        if (dist(q, p) < 0.95) {
          let chance = q === M.ctrl ? 0.5 : q.team === 1 ? 0.5 * M.diff : 0.4;
          if (p.team === 0 && Math.hypot(p.vx, p.vy) > 6.5) chance -= 0.08;
          if (Math.random() < chance) { tackle(q, p); return; }
          q.state = 'down'; q.t = 0.7; p.inv = 0.3;
          if (p.team === 0) float(p, '¡ROMPIÓ!', '#ffd166');
        }
      }
    }
    // try
    if (p.team === 0 && p.x >= 100 && p.y > 0 && p.y < 70) return scoreTry(p);
    if (p.team === 1 && p.x <= 0 && p.y > 0 && p.y < 70) return scoreTry(p);
    // touch
    if (p.y < 0 || p.y > 70) {
      banner('TOUCH', `Line para ${M.teams[other(p.team)].short}`, 1.3); sfx('whistle');
      return startLineout(other(p.team), p.x, p.y < 0 ? 0 : 1);
    }
    if (p.team === 0) M.stats.metres = Math.max(M.stats.metres, 0) + Math.max(0, p.vx * dt);
  } else if (b.mode === 'pass') {
    b.t += dt / b.T;
    const t = Math.min(1, b.t);
    b.x = b.fx + (b.tx - b.fx) * t; b.y = b.fy + (b.ty - b.fy) * t; b.z = 1 + Math.sin(t * Math.PI) * b.h;
    if (!b.intercepted && t > 0.3 && t < 0.8) {
      for (const q of M.players) {
        if (q.team === b.team || q.state !== 'run') continue;
        if (Math.hypot(q.x - b.x, q.y - b.y) < 0.8) {
          b.intercepted = true;
          if (Math.random() < 0.3) { banner('¡INTERCEPCIÓN!', q.name, 1.3); sfx(q.team === 0 ? 'done' : 'miss'); giveBall(q); return; }
        }
      }
    }
    if (t >= 1) {
      const r = b.target;
      if (r && r.state === 'run' && Math.hypot(r.x - b.x, r.y - b.y) < 1.8) {
        const ko = r.team === 0 ? 0.02 - statLvl('dis') * 0.001 : 0.03;
        if (Math.random() < ko) { knockOn(r); return; }
        giveBall(r);
      } else { b.mode = 'loose'; b.vx = (b.tx - b.fx) * 0.15; b.vy = (b.ty - b.fy) * 0.15; b.z = 0.3; }
    }
  } else if (b.mode === 'air') {
    b.t += dt / b.T;
    const t = Math.min(1, b.t);
    b.x = b.fx + (b.tx - b.fx) * t; b.y = b.fy + (b.ty - b.fy) * t; b.z = 4 * b.h * t * (1 - t);
    if (t > 0.82) {
      // atrapar en el aire (prioridad al equipo que recibe)
      const cands = M.players.filter((q) => q.state === 'run' && Math.hypot(q.x - b.x, q.y - b.y) < 1.6).sort((a, c) => (a.team === b.team ? 1 : 0) - (c.team === b.team ? 1 : 0));
      if (cands.length && b.y > 0 && b.y < 70) {
        const q = cands[0];
        if (Math.random() < 0.1) { knockOn(q); return; }
        giveBall(q);
        if (q.team === 0) float(q, '¡LA AGARRÓ!', '#06d6a0');
        return;
      }
    }
    if (t >= 1) land();
  } else if (b.mode === 'loose') {
    b.x += (b.vx || 0) * dt; b.y += (b.vy || 0) * dt;
    b.vx = (b.vx || 0) * 0.95; b.vy = (b.vy || 0) * 0.95;
    b.z = Math.max(0, b.z - dt * 2);
    if (b.y < 0 || b.y > 70) {
      banner('TOUCH', '', 1.2); sfx('whistle');
      return startLineout(other(b.team ?? 0), b.x, b.y < 0 ? 0 : 1);
    }
    for (const q of M.players) {
      if (q.state === 'run' && Math.hypot(q.x - b.x, q.y - b.y) < 1.0) {
        giveBall(q);
        if (q.team === 0) float(q, 'Pelota recuperada', '#06d6a0');
        return;
      }
    }
  }
}

function land() {
  const b = M.ball;
  if (b.ty < 0 || b.ty > 70) {
    banner('¡AL TOUCH!', `Line para ${M.teams[other(b.team)].short}`, 1.3); sfx('whistle');
    return startLineout(other(b.team), clamp(b.tx, 6, 94), b.ty < 0 ? 0 : 1);
  }
  if (b.tx > 100 || b.tx < 0) {
    banner('Pelota muerta', 'Saque de 22', 1.3);
    return restart22(b.tx > 100 ? 1 : 0);
  }
  b.mode = 'loose'; b.x = b.tx; b.y = b.ty; b.z = 0.4;
  b.vx = (b.tx - b.fx) * 0.08; b.vy = rand(-2, 2);
}

// ---------------------------------------------------------------
//  BUCLE PRINCIPAL
// ---------------------------------------------------------------
function update(dt) {
  M.t += dt;
  if (M.msgT > 0) M.msgT -= dt;
  if (M.hintT > 0) M.hintT -= dt;
  const clockRuns = ['play', 'tackle', 'ruck', 'kickoff'].includes(M.phase);
  if (clockRuns) M.clock += dt * (2400 / HALF_REAL);

  switch (M.phase) {
    case 'intro': break;
    case 'kickoff':
      M.pt -= dt;
      if (M.pt <= 0) {
        const t = M.kickTeam;
        const kicker = P(t, 4);
        const tx = 50 + D(t) * rand(17, 25), ty = rand(14, 56);
        launchAir(kicker.x, kicker.y, tx, ty, 2.0, 12, t);
        sfx('kick');
        M.phase = 'play';
        // persiguen
        for (const p of teamOf(t)) { p.tx = tx; p.ty = p.y; }
        switchCtrl();
      }
      break;
    case 'play':
      if (M.ctrl && M.ctrl.state !== 'run' && M.ctrl.state !== 'dive' && !(M.ball.owner && M.ball.owner.team === 0)) switchCtrl();
      // auto cambio en defensa
      if (!M.attacking) {
        M.swT = (M.swT || 0) + dt;
        if (M.swT > 1.2) {
          M.swT = 0;
          const target = M.ball.owner || M.ball;
          const best = teamOf(0).filter((p) => p.state === 'run').sort((a, b) => dist(a, target) - dist(b, target))[0];
          if (best && M.ctrl && dist(M.ctrl, target) - dist(best, target) > 4) M.ctrl = best;
        }
      }
      if (M.input.kick) M.input.kickT += dt;
      break;
    case 'tackle':
      M.pt -= dt;
      if (M.pt <= 0) startRuck();
      break;
    case 'ruck':
      M.pt -= dt;
      if (M.pt <= 0) endRuck();
      break;
    case 'scrum': updateScrum(dt); break;
    case 'lineout': updateLineout(dt); break;
    case 'penalty':
      if (M.penAI) {
        M.pt -= dt;
        if (M.pt <= 0) {
          const { x, y, toPosts } = M.penAI; M.penAI = null;
          if (toPosts < 40) startGoalKick(1, x, y, 3);
          else { placeLines(1, x, y, 'phase'); M.phase = 'play'; const n = P(1, 3); n.x = x + 1; n.y = y; giveBall(n); n.hold = 0.4; }
        }
      }
      break;
    case 'aikick':
      M.pt -= dt;
      if (M.pt <= 0) afterGoalKick(1, M.aik.ok, M.aik.pts);
      break;
    case 'gk': updateGK(dt); break;
    case 'try':
      M.pt -= dt;
      if (M.pt <= 0) startGoalKick(M.tryAt.team, M.tryAt.team === 0 ? 100 - 12 : 12, M.tryAt.y, 2);
      break;
    case 'wait':
      M.pt -= dt;
      if (M.pt <= 0) { const n = M.next; M.next = null; n?.(); }
      break;
    case 'half':
      M.pt -= dt;
      if (M.pt <= 0) { M.half = 2; setKickoff(0); banner('Segundo tiempo', '', 1.5); }
      break;
    case 'end': break;
  }

  if (['play', 'kickoff', 'tackle', 'ruck'].includes(M.phase) || M.phase === 'scrum' || M.phase === 'lineout') {
    updatePlayers(dt);
    if (M.phase === 'play') updateBall(dt);
  }

  // fin de cada tiempo (en una pausa natural)
  if (M.half === 1 && M.clock >= 2400 && ['tackle', 'ruck', 'wait'].includes(M.phase) === false && M.phase === 'play' && M.ball.mode === 'held') {
    M.phase = 'half'; M.pt = 3; sfx('whistle');
    banner('MEDIO TIEMPO', `${M.teams[0].short} ${M.teams[0].score} - ${M.teams[1].score} ${M.teams[1].short}`, 3);
  }
  if (M.half === 2 && M.clock >= 4800 && M.phase === 'play' && M.ball.mode === 'held') {
    M.phase = 'end'; sfx('whistle');
    endScreen();
  }

  // cámara sigue la pelota
  const b = M.ball;
  const fx = b.owner ? b.owner.x + D(b.owner.team) * 4 : b.mode === 'air' ? b.x : b.x;
  M.cam.x += (fx - M.cam.x) * Math.min(1, dt * 3);
  M.cam.y += (b.y - M.cam.y) * Math.min(1, dt * 3);
}

function updateGK(dt) {
  const g = M.gk;
  g.t += dt;
  if (g.step === 'aim') g.aim = Math.sin(g.t * 2.4) * 0.6;
  if (g.step === 'power') g.pow = (Math.sin(g.t * 3.2 - Math.PI / 2) + 1) / 2;
  if (g.step === 'fly' && g.t > 1.3) {
    const pts = g.pts, ok = g.ok;
    M.gk = null;
    afterGoalKick(0, ok, pts);
  }
}

// ---------------------------------------------------------------
//  DIBUJO
// ---------------------------------------------------------------
function proj(x, y, z = 0) {
  return [(x - M.cam.x) * M.S + M.w / 2, (y - M.cam.y) * M.S * K + M.h / 2 - z * M.S];
}

function drawField(ctx) {
  const { w, h, S } = M;
  ctx.fillStyle = '#2f6b3a'; ctx.fillRect(0, 0, w, h);
  // franjas cada 5 m
  for (let x = -10; x < 110; x += 5) {
    const [a] = proj(x, 0), [bx] = proj(x + 5, 0);
    if (bx < 0 || a > w) continue;
    ctx.fillStyle = x < 0 || x >= 100 ? '#3f8f4a' : (Math.floor(x / 5) % 2 ? '#4caf50' : '#46a64b');
    const [, y0] = proj(0, 0), [, y1] = proj(0, 70);
    ctx.fillRect(a, y0, bx - a + 1, y1 - y0);
  }
  // tribuna arriba
  const [, top] = proj(0, -3);
  ctx.fillStyle = '#5a5f73'; ctx.fillRect(0, 0, w, Math.max(0, top));
  for (let i = 0; i < w; i += 6 * M.dpr) {
    for (let r = 0; r < top - 4; r += 7 * M.dpr) {
      ctx.fillStyle = ['#e53935', '#ffffff', '#ffd166', '#1d3557', '#adb5bd'][(Math.floor(i / 6) * 7 + Math.floor(r / 7)) % 5];
      ctx.fillRect(i + ((r / 7) % 2) * 3, r + 2, 3 * M.dpr, 3 * M.dpr);
    }
  }
  // cartelería abajo
  const [, bot] = proj(0, 72);
  if (bot < h) {
    ctx.fillStyle = '#e53935'; ctx.fillRect(0, bot, w, h - bot);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${12 * M.dpr}px "Press Start 2P", monospace`; ctx.textAlign = 'left';
    const off = ((-M.cam.x * S) % (300 * M.dpr)) - 300 * M.dpr;
    for (let x = off; x < w; x += 300 * M.dpr) ctx.fillText('TODO ROJO Y BLANCO · 1907', x, bot + 20 * M.dpr);
  }
  // líneas
  const line = (x, dash) => {
    const [a, y0] = proj(x, 0), [, y1] = proj(x, 70);
    if (a < -10 || a > w + 10) return;
    ctx.fillStyle = '#ffffffdd';
    if (!dash) ctx.fillRect(a - M.dpr, y0, 2 * M.dpr, y1 - y0);
    else for (let y = y0; y < y1; y += 12 * M.dpr) ctx.fillRect(a - M.dpr, y, 2 * M.dpr, 6 * M.dpr);
  };
  [-10, 0, 22, 50, 78, 100, 110].forEach((x) => line(x, false));
  [40, 60].forEach((x) => line(x, true));
  for (const yy of [0, 70]) {
    const [x0, y0] = proj(-10, yy), [x1] = proj(110, yy);
    ctx.fillStyle = '#fff'; ctx.fillRect(x0, y0 - M.dpr, x1 - x0, 2 * M.dpr);
  }
  for (const yy of [5, 15, 55, 65]) {
    for (let x = 0; x <= 100; x += 5) {
      const [a, b] = proj(x, yy);
      if (a < -5 || a > w + 5) continue;
      ctx.fillStyle = '#ffffffaa'; ctx.fillRect(a - 3 * M.dpr, b, 6 * M.dpr, 2 * M.dpr);
    }
  }
}

function drawPosts(ctx, x) {
  const S = M.S;
  for (const y of [32.2, 37.8]) {
    const [a, b] = proj(x, y);
    const [, t] = proj(x, y, 11);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(a - 2 * M.dpr, t, 4 * M.dpr, b - t);
    ctx.fillStyle = '#e53935'; ctx.fillRect(a - 4 * M.dpr, b - 1.6 * S, 8 * M.dpr, 1.6 * S);
  }
  const [a1, c1] = proj(x, 32.2, 3), [a2, c2] = proj(x, 37.8, 3);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * M.dpr;
  ctx.beginPath(); ctx.moveTo(a1, c1); ctx.lineTo(a2, c2); ctx.stroke();
}

function drawPlayer(ctx, p) {
  const sc = M.S * 0.15;
  const [sx, sy] = proj(p.x, p.y);
  if (sx < -60 || sx > M.w + 60 || sy < -80 || sy > M.h + 60) return;
  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(sx, sy, 7 * sc, 2.5 * sc, 0, 0, Math.PI * 2); ctx.fill();
  let dir = p.dir, frame = p.frame;
  if (M.phase === 'scrum' && p.idx < 3) dir = D(p.team) > 0 ? 'right' : 'left';
  const spr = playerSprite(p.look, dir, p.state === 'run' ? frame : 0);
  const w = 16 * sc, h = 22 * sc;
  ctx.save();
  ctx.translate(sx, sy);
  if (p.state === 'down') { ctx.rotate(D(p.team) > 0 ? -Math.PI / 2 : Math.PI / 2); ctx.drawImage(spr, -w / 2, -h + 6 * sc, w, h); }
  else if (p.state === 'bind' || (M.phase === 'scrum' && p.idx < 3)) {
    const lean = (D(p.team) > 0 ? 1 : -1) * 0.6;
    ctx.rotate(lean); ctx.drawImage(spr, -w / 2, -h * 0.85, w, h * 0.85);
  } else if (p.state === 'dive') { ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2 * (p.vx > 0 ? 1 : -1) * 0.5); ctx.drawImage(spr, -w / 2, -h, w, h); }
  else {
    // saltador del line
    let lift = 0;
    if (M.phase === 'lineout' && M.set && p.idx === 0 && (p.team === M.set.team || M.set.step === 'fly')) lift = Math.abs(Math.sin(M.set.t * 2.2)) * 1.8 * M.S;
    ctx.drawImage(spr, -w / 2, -h - lift, w, h);
  }
  ctx.restore();
  // marcador del controlado
  if (p === M.ctrl) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(sx, sy - h - 4 * sc); ctx.lineTo(sx - 4 * sc, sy - h - 10 * sc); ctx.lineTo(sx + 4 * sc, sy - h - 10 * sc); ctx.fill();
    ctx.font = `${8 * M.dpr}px "Press Start 2P", monospace`; ctx.textAlign = 'center';
    ctx.fillStyle = '#000'; ctx.fillText(p.name, sx + M.dpr, sy - h - 12 * sc + M.dpr);
    ctx.fillStyle = '#fff'; ctx.fillText(p.name, sx, sy - h - 12 * sc);
  } else if (M.ball.owner === p) {
    ctx.font = `${7 * M.dpr}px "Press Start 2P", monospace`; ctx.textAlign = 'center';
    ctx.fillStyle = '#000'; ctx.fillText(p.name, sx + M.dpr, sy - h - 3 * sc + M.dpr);
    ctx.fillStyle = p.team === 0 ? '#ffd6d6' : '#cfe1ff'; ctx.fillText(p.name, sx, sy - h - 3 * sc);
  }
}

function drawBall(ctx) {
  const b = M.ball;
  const [gx, gy] = proj(b.x, b.y);
  const [sx, sy] = proj(b.x, b.y, b.z);
  const sc = M.S * 0.15;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(gx, gy, 3 * sc, 1.2 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(M.t * (b.mode === 'held' ? 0 : 6));
  ctx.fillStyle = '#f1e3c8';
  ctx.beginPath(); ctx.ellipse(0, 0, 3.6 * sc, 2.4 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = M.dpr; ctx.stroke();
  ctx.restore();
}

function txt(ctx, t, x, y, size, col = '#fff', align = 'center') {
  ctx.font = `${size * M.dpr}px "Press Start 2P", monospace`; ctx.textAlign = align;
  ctx.fillStyle = '#000'; ctx.fillText(t, x + 2 * M.dpr, y + 2 * M.dpr);
  ctx.fillStyle = col; ctx.fillText(t, x, y);
}

function drawHUD(ctx) {
  const { w, dpr } = M;
  const t0 = M.teams[0], t1 = M.teams[1];
  const min = Math.min(80, Math.floor(M.clock / 60));
  const bw = 300 * dpr, bx = (w - bw) / 2;
  ctx.fillStyle = 'rgba(14,16,30,0.9)'; ctx.fillRect(bx, 6 * dpr, bw, 30 * dpr);
  ctx.fillStyle = t0.col; ctx.fillRect(bx, 6 * dpr, 8 * dpr, 30 * dpr);
  ctx.fillStyle = t1.col; ctx.fillRect(bx + bw - 8 * dpr, 6 * dpr, 8 * dpr, 30 * dpr);
  txt(ctx, `${t0.short} ${t0.score}`, bx + 16 * dpr, 27 * dpr, 10, '#fff', 'left');
  txt(ctx, `${t1.score} ${t1.short}`, bx + bw - 16 * dpr, 27 * dpr, 10, '#fff', 'right');
  txt(ctx, `${min}'`, w / 2, 27 * dpr, 10, '#ffd166');
  if (M.msgT > 0 && M.msg) {
    ctx.globalAlpha = Math.min(1, M.msgT * 2);
    txt(ctx, M.msg, w / 2, M.h * 0.32, 22, '#ffd166');
    if (M.sub) txt(ctx, M.sub, w / 2, M.h * 0.32 + 26 * dpr, 9, '#fff');
    ctx.globalAlpha = 1;
  }
  if (M.hintT > 0 && M.phase === 'play') txt(ctx, M.hint, w / 2, M.h - 18 * dpr, 8, '#fff');
  if (M.input.kick) {
    const p = Math.min(1, M.input.kickT / 0.9);
    const x = w / 2 - 80 * dpr, y = M.h - 40 * dpr;
    ctx.fillStyle = '#222'; ctx.fillRect(x, y, 160 * dpr, 10 * dpr);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x, y, 160 * dpr * p, 10 * dpr);
    txt(ctx, 'POTENCIA', w / 2, y - 6 * dpr, 7);
  }
  // efectos flotantes
  for (const f of M.fx) {
    f.t += 1 / 60;
    const [sx, sy] = proj(f.x, f.y);
    ctx.globalAlpha = Math.max(0, 1 - f.t);
    txt(ctx, f.text, sx, sy - 50 * dpr - f.t * 30 * dpr, 9, f.col);
    ctx.globalAlpha = 1;
  }
  M.fx = M.fx.filter((f) => f.t < 1);
  // barra de scrum
  if (M.phase === 'scrum' && M.set?.step === 'push') {
    const x = w / 2 - 120 * dpr, y = M.h * 0.45;
    ctx.fillStyle = '#222'; ctx.fillRect(x, y, 240 * dpr, 16 * dpr);
    ctx.fillStyle = '#e53935'; ctx.fillRect(x, y, 240 * dpr * M.set.bar, 16 * dpr);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 240 * dpr * (M.set.feed === 0 ? 0.4 : 0.6), y - 4 * dpr, 2 * dpr, 24 * dpr);
  }
  // pelota del line volando
  if (M.phase === 'lineout' && M.set && M.set.step === 'fly') {
    const s = M.set;
    const jumper = P(s.win, 0);
    const [ax, ay] = proj(s.x, s.side === 0 ? 0 : 70, 1.8);
    const [bx2, by2] = proj(jumper.x, jumper.y, 3);
    const t = Math.min(1, s.t / 0.9);
    const x = ax + (bx2 - ax) * t, y = ay + (by2 - ay) * t - Math.sin(t * Math.PI) * 30 * dpr;
    ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(x, y, 5 * dpr, 3.5 * dpr, t * 6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGoalKick(ctx) {
  const g = M.gk;
  const { w, h, dpr } = M;
  ctx.fillStyle = '#8ecae6'; ctx.fillRect(0, 0, w, h * 0.38);
  ctx.fillStyle = '#5a5f73'; ctx.fillRect(0, h * 0.26, w, h * 0.12);
  for (let i = 0; i < w; i += 8 * dpr) { ctx.fillStyle = ['#e53935', '#fff', '#ffd166'][Math.floor(i / 8) % 3]; ctx.fillRect(i, h * 0.28 + (i % 3) * 3, 4 * dpr, 4 * dpr); }
  ctx.fillStyle = '#4caf50'; ctx.fillRect(0, h * 0.38, w, h * 0.62);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, h * 0.4, w, 2 * dpr);
  const cx = w / 2, pw = w * 0.14, base = h * 0.4, top = h * 0.05;
  ctx.fillRect(cx - pw / 2 - 3 * dpr, top, 6 * dpr, base - top);
  ctx.fillRect(cx + pw / 2 - 3 * dpr, top, 6 * dpr, base - top);
  ctx.fillRect(cx - pw / 2, base - (base - top) * 0.32, pw, 5 * dpr);
  txt(ctx, `${g.pts === 2 ? 'CONVERSIÓN' : 'PENAL'} · ${g.dist} m · viento ${g.wind > 0 ? '→' : g.wind < 0 ? '←' : '·'} ${Math.abs(g.wind)}`, w / 2, h * 0.47, 9);
  const bx = w / 2 + g.spot * w * 0.22, by = h * 0.86;
  const me = playerSprite(look(), 'up', 0);
  const sc = h / 22 / 4;
  ctx.drawImage(me, bx - 20 * sc, by - 14 * sc, 16 * sc, 22 * sc);
  let ballX = bx, ballY = by, s = 1;
  if (g.step === 'fly') {
    const t = Math.min(1, g.t / 1.1);
    const reach = g.short ? 0.75 : 1;
    const tt = Math.min(t, reach);
    const targetX = w / 2 + g.lat * w * 0.5;
    ballX = bx + (targetX - bx) * tt;
    ballY = by + (h * 0.2 - by) * tt - Math.sin(tt * Math.PI) * h * 0.15;
    if (g.short && t > reach) ballY += (t - reach) * h * 1.5;
    s = 1 - tt * 0.7;
  }
  ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(ballX, ballY, 7 * dpr * s, 10 * dpr * s, 0.4, 0, Math.PI * 2); ctx.fill();
  if (g.step === 'aim' || g.step === 'power') {
    const a = g.step === 'aim' ? g.aim : g.lockAim;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4 * dpr;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + (w / 2 + a * w * 0.5 - bx) * 0.5, by - h * 0.3); ctx.stroke();
    txt(ctx, g.step === 'aim' ? 'Tocá para APUNTAR' : 'Tocá para la POTENCIA', w / 2, h * 0.58, 10);
  }
  if (g.step === 'power') {
    const bw = w * 0.4, x = (w - bw) / 2, y = h * 0.93;
    ctx.fillStyle = '#222'; ctx.fillRect(x, y, bw, 12 * dpr);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x, y, bw * g.pow, 12 * dpr);
    const need = 0.45 + g.dist / 110 - Math.min(0.15, statLvl('fue') * 0.01);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + bw * need, y - 4 * dpr, 2 * dpr, 20 * dpr);
  }
}

function draw() {
  const ctx = M.ctx;
  ctx.imageSmoothingEnabled = false;
  if (M.phase === 'gk' && M.gk) { drawGoalKick(ctx); drawHUD(ctx); return; }
  drawField(ctx);
  // palos de fondo (los de arriba se dibujan antes que los jugadores)
  drawPosts(ctx, 0); drawPosts(ctx, 100);
  const list = [...M.players].sort((a, b) => a.y - b.y);
  let ballDrawn = false;
  for (const p of list) {
    if (!ballDrawn && M.ball.y < p.y && M.ball.mode !== 'held') { drawBall(ctx); ballDrawn = true; }
    drawPlayer(ctx, p);
    if (M.ball.owner === p) { drawBall(ctx); ballDrawn = true; }
  }
  if (!ballDrawn) drawBall(ctx);
  drawHUD(ctx);
}

function loop(ts) {
  if (!M || !M.alive) return;
  const dt = Math.min(0.05, (ts - (M.last || ts)) / 1000);
  M.last = ts;
  if (M.phase === 'intro') { M.pt += dt; if (M.pt > 0.1) M.phase = 'kickoff'; }
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------
//  FINAL
// ---------------------------------------------------------------
function endScreen() {
  const t0 = M.teams[0], t1 = M.teams[1];
  const win = t0.score > t1.score, draw = t0.score === t1.score;
  const st = M.stats;
  const reward = {
    xp: 80 + st.tries * 25 + st.tackles * 5 + (win ? 120 : draw ? 50 : 0),
    gold: 30 + st.tries * 15 + (win ? 80 : 20),
    aura: (win ? 1000 : draw ? 400 : 150) + st.myTries * 1000 + st.tries * 200,
    stats: { fue: 4 + st.tackles, res: 6, car: win ? 6 : 2, dis: 3 },
  };
  S.matches = (S.matches || 0) + 1;
  if (win) S.matchWins = (S.matchWins || 0) + 1;
  S.best.matchDiff = Math.max(S.best.matchDiff || -99, t0.score - t1.score);
  grant(reward, null, 'g', 'match');
  panel(`
    <div class="mp-t">${win ? '🏆 ¡GANÓ LA U!' : draw ? '🤝 EMPATE' : 'Perdimos esta vez'}</div>
    <div class="mp-score">${t0.short} <b>${t0.score}</b> - <b>${t1.score}</b> ${t1.short}</div>
    <div class="mp-s">Tries: ${st.tries} (tuyos: ${st.myTries}) · Tackles: ${st.tackles} · Pases: ${st.passes} · Patadas: ${st.kicks}</div>
    <div class="mp-rew">+${fmt(reward.xp)} XP · +${fmt(reward.gold)} oro · +${fmt(reward.aura)} aura</div>
    <div class="mp-row"><button class="btn good" id="mend">Volver al club</button></div>`, () => {
    $('mend').onclick = () => finish(false);
  });
  sfx(win ? 'win' : 'lose');
}

function finish(abandoned) {
  if (!M) return;
  M.alive = false;
  window.removeEventListener('keydown', M.kd);
  window.removeEventListener('keyup', M.ku);
  window.removeEventListener('resize', M.onResize);
  const ov = $('match'); ov.hidden = true; ov.innerHTML = '';
  document.body.classList.remove('in-match');
  try { if (document.fullscreenElement) document.exitFullscreen(); screen.orientation?.unlock?.(); } catch (e) { /* nada */ }
  const cb = M.onEnd; M = null;
  save(); emit('change');
  cb?.(abandoned ? 'quit' : 'done');
}
