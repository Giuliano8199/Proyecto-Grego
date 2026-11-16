// =============================================================
//  PARTIDO DE RUGBY XV (pantalla horizontal)
//  Universitario vs. un rival. Giuli juega de 9 (medio scrum).
// =============================================================
import { S, look, statLvl, level, grant, save, emit } from './state.js';
import { playerSprite } from './pixel.js';
import { sfx, playMusic } from './audio.js';
import { TEAMMATES, RIVALS } from './data.js';
import { clamp, rand, pick, shuffle, fmt } from './util.js';

const K = 0.62; // aplastamiento vertical (vista 2.5D)
const N = 15;
const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const FWD = (i) => i < 8;
const SPEED = [5.7, 6.0, 5.7, 5.9, 5.9, 6.4, 6.5, 6.3, 6.8, 6.9, 7.6, 7.0, 7.1, 7.6, 7.3].map((v) => v * 0.8);
const POWER = [1.25, 1.1, 1.25, 1.15, 1.15, 1.1, 1.05, 1.15, 0.85, 0.9, 0.85, 1.0, 0.95, 0.85, 0.9];
const DIFFS = {
  facil: { name: 'Fácil', tackle: 0.32, speed: 0.92, ko: 0.06, pass: 0.7, k: 0.7 },
  normal: { name: 'Normal', tackle: 0.42, speed: 1.0, ko: 0.04, pass: 0.85, k: 1 },
  dificil: { name: 'Difícil', tackle: 0.55, speed: 1.06, ko: 0.025, pass: 1.0, k: 1.4 },
};
const EXTRA_NAMES = ['Bauti', 'Fran', 'Nico', 'Lucho'];
const ZONE_IDX = { adelante: 3, medio: 4, atras: 7 };

let M = null;
const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------
//  PANTALLA PREVIA
// ---------------------------------------------------------------
export function startMatch(onEnd) {
  const ov = $('match');
  ov.hidden = false;
  document.body.classList.add('in-match');
  const sel = { rival: Math.floor(Math.random() * RIVALS.length), diff: 'normal', len: 150 };
  const draw = () => {
    const r = RIVALS[sel.rival];
    ov.innerHTML = `
      <div class="prematch">
        <div class="pm-head"><span>🏟️ PARTIDO</span><button class="x" id="pmx">✕</button></div>
        <div class="pm-teams"><div class="pm-team u"><b>UNIVERSITARIO</b><small>Rojo y blanco · 1907</small></div><div class="pm-vs">VS</div>
          <div class="pm-team" style="--c:${r.a};--d:${r.b}"><b>${r.name.toUpperCase()}</b><small>Rival</small></div></div>
        <div class="pm-sec">Rival</div>
        <div class="pm-row">${RIVALS.map((x, i) => `<button class="pm-chip ${i === sel.rival ? 'on' : ''}" data-r="${i}" style="--c:${x.a};--d:${x.b}">${x.short}</button>`).join('')}</div>
        <div class="pm-sec">Dificultad</div>
        <div class="pm-row">${Object.entries(DIFFS).map(([k, d]) => `<button class="pm-chip ${k === sel.diff ? 'on' : ''}" data-d="${k}">${d.name}</button>`).join('')}</div>
        <div class="pm-sec">Duración</div>
        <div class="pm-row">${[[120, '2×2 min'], [150, '2×2½ min'], [240, '2×4 min']].map(([v, n]) => `<button class="pm-chip ${v === sel.len ? 'on' : ''}" data-l="${v}">${n}</button>`).join('')}</div>
        <div class="pm-help">🕹️ Correr (al máximo = sprint) · <b>PASE ▲▼</b> · <b>PATADA</b> mantener y soltar (corta = grubber) · <b>AMAGUE</b> · Al ser tackleado: <b>PASE</b> = offload · Defensa: <b>TACKLE</b> (cerca del ruck = robo) · <b>CAMBIAR</b></div>
        <div class="pm-energy">Tenés ⚡ ${S.energy}</div>
        ${S.energy >= 3 ? '<button class="btn big" id="pmgo">¡A LA CANCHA! (3 ⚡)</button>' : ''}
        <button class="btn ${S.energy >= 3 ? 'ghost' : 'big'}" id="pmfree">🤝 Amistoso libre (sin energía, sin premios)</button>
      </div>`;
    ov.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => { sel.rival = +b.dataset.r; draw(); }));
    ov.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { sel.diff = b.dataset.d; draw(); }));
    ov.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { sel.len = +b.dataset.l; draw(); }));
    $('pmx').onclick = () => { ov.hidden = true; ov.innerHTML = ''; document.body.classList.remove('in-match'); onEnd?.('cancel'); };
    if ($('pmgo')) $('pmgo').onclick = () => begin(sel, onEnd, false);
    $('pmfree').onclick = () => begin(sel, onEnd, true);
  };
  draw();
}

function begin(sel, onEnd, free = false) {
  if (!free) {
    if (S.energy < 3) return;
    S.energy -= 3; save(); emit('change');
  }
  const rival = RIVALS[sel.rival];
  const df = DIFFS[sel.diff];
  const diffScale = df.speed * clamp(0.97 + level() * 0.004, 0.97, 1.06);
  // Formación de la U (índice = número - 1)
  const LINEUP = ['cava', 'mano', 'calvo', 'rocha', 'molina', 'valendepa', 'mosquito', 'augusto', null, 'canolo', 'justo', 'bachi', 'ponce', 'tizot', null];
  const byId = Object.fromEntries(TEAMMATES.map((t) => [t.id, t]));
  M = {
    onEnd, rival, df, free, half: 1, halfReal: sel.len,
    teams: [
      { name: 'Universitario', short: 'LA U', d: 1, score: 0, col: '#e53935', tries: 0 },
      { name: rival.name, short: rival.short, d: -1, score: 0, col: rival.a, tries: 0 },
    ],
    players: [], ball: { x: 50, y: 35, z: 0, owner: null, mode: 'dead' },
    phase: 'kickoff', pt: 0, clock: 0,
    cam: { x: 50, y: 35 }, msg: null, sub: null, msgT: 0, hint: '', hintT: 0,
    input: { x: 0, y: 0, kick: false, kickT: 0 }, keys: {},
    ctrl: null, stats: { tries: 0, tackles: 0, passes: 0, metres: 0, kicks: 0, myTries: 0, offloads: 0, steals: 0, breaks: 0 },
    pstats: {}, fx: [], log: [], t: 0, last: 0, alive: true, set: null, form: null, crowd: 0,
  };
  let mi = 0;
  for (let team = 0; team < 2; team++) {
    for (let i = 0; i < N; i++) {
      let name, lk;
      if (team === 0) {
        if (i === 8) { name = 'Giuli'; lk = look(); }
        else {
          const tm = byId[LINEUP[i]];
          name = tm ? (tm.short || tm.name) : EXTRA_NAMES[mi % EXTRA_NAMES.length];
          const base = tm ? tm.look : { hair: { style: pick(['corto', 'rapado', 'flequillo']), c: pick(['#3b2a1e', '#6b4226', '#1b1b1b']), d: '#111' }, boots: { c: '#1b1b1b' } };
          lk = { ...base, jersey: { pattern: 'quarters', a: '#e53935', b: '#ffffff', n: '#1b1b1b' }, shorts: '#f1f3f5', socks: '#e53935', head: 'none' };
          mi++;
        }
      } else {
        name = `${rival.short} ${NUMS[i]}`;
        lk = { jersey: { pattern: 'hoops', a: rival.a, b: rival.b, n: '#fff' }, hair: { style: pick(['corto', 'rapado', 'flequillo', 'largo']), c: pick(['#1b1b1b', '#3b2a1e', '#6b4226', '#8a6a3c', '#c9a227']), d: '#111' }, boots: { c: '#111' }, shorts: rival.shorts, socks: rival.a, skin: pick(['#f4cdb0', '#e0b090', '#c68642', '#f1c9a5']), skinD: '#a0705a', beard: Math.random() < 0.25 ? '#3b2a1e' : undefined };
      }
      M.players.push({
        team, idx: i, num: NUMS[i], name, look: lk,
        x: 50, y: 35, vx: 0, vy: 0, tx: 50, ty: 35, ox: 0, oy: 35, state: 'run', t: 0,
        dir: team === 0 ? 'right' : 'left', anim: 0, frame: 0, inv: 0, stepCd: 0, recover: 0,
        speed: SPEED[i] * (team === 1 ? diffScale : 1) * (team === 0 && i === 8 ? 1 + statLvl('res') * 0.008 : 1),
        power: POWER[i] * (team === 0 && i === 8 ? 1 + statLvl('fue') * 0.01 : 1),
        stamina: 1,
      });
    }
  }
  M.giuli = P(0, 8);
  window.__M = M;
  window.__Mf = { startScrum, startLineout, startPenalty, startGoalKick, endScreen: () => { M.phase = 'end'; endScreen(); } };
  buildUI();
  playMusic('battle');
  setKickoff(1);
  banner(`${M.teams[0].short} vs ${M.teams[1].short}`, `${df.name} · Primer tiempo`, 2.2);
  say('¡Arranca el partido en el Club Universitario!');
  requestAnimationFrame(loop);
}

const P = (team, i) => M.players[team * N + i];
const teamOf = (team) => M.players.slice(team * N, team * N + N);
const other = (t) => 1 - t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const D = (team) => M.teams[team].d;
const up = (p) => p.state === 'run';

// ---------------------------------------------------------------
//  INTERFAZ
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
        <button class="mb push" data-b="push">¡EMPUJÁ!</button>
      </div>
      <div id="mpanel" class="mpanel" hidden></div>
    </div>`;
  layout();
  window.addEventListener('resize', layout);
  M.onResize = layout;
  $('mquit').onclick = () => { if (confirm('¿Abandonar el partido?')) finish(true); };
  ov.querySelectorAll('.mb').forEach((b) => {
    const k = b.dataset.b;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.classList.add('on'); press(k, true); });
    const upf = (e) => { e.preventDefault(); if (b.classList.contains('on')) { b.classList.remove('on'); press(k, false); } };
    b.addEventListener('pointerup', upf);
    b.addEventListener('pointerleave', upf);
    b.addEventListener('pointercancel', upf);
  });
  bindJoy();
  $('mcv').addEventListener('pointerdown', (e) => {
    if (!M) return;
    if (M.phase === 'gk' || (M.phase === 'lineout' && M.set?.step === 'throw') || M.mash) { e.preventDefault(); press('tap', true); }
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
    if (k === 'enter') press('tap', true);
  };
  M.ku = (e) => { const k = e.key.toLowerCase(); M.keys[k] = false; if (k === ' ') press('kick', false); if (k === 'q') press('up', false); if (k === 'e') press('down', false); };
  window.addEventListener('keydown', M.kd);
  window.addEventListener('keyup', M.ku);
  try {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  } catch (e) { /* nada */ }
}

function layout() {
  if (!M) return;
  const mx = $('mx');
  if (!mx) return;
  const W = window.innerWidth, H = window.innerHeight;
  M.rot = H > W;
  if (M.rot) { mx.style.width = H + 'px'; mx.style.height = W + 'px'; mx.style.transform = `translate(${W}px, 0) rotate(90deg)`; }
  else { mx.style.width = W + 'px'; mx.style.height = H + 'px'; mx.style.transform = 'none'; }
  const cw = M.rot ? H : W, ch = M.rot ? W : H;
  const c = $('mcv');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.floor(cw * dpr); c.height = Math.floor(ch * dpr);
  c.style.width = cw + 'px'; c.style.height = ch + 'px';
  M.c = c; M.ctx = c.getContext('2d'); M.dpr = dpr; M.w = c.width; M.h = c.height;
  M.S = M.w / 66;
  if (M.h / (M.S * K) < 38) M.S = M.h / (38 * K);
}

function bindJoy() {
  const base = $('mjoy'), knob = $('mjoyk');
  let id = null, cx = 0, cy = 0;
  const R = 45;
  const start = (e) => { id = e.pointerId; const r = base.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; base.setPointerCapture?.(e.pointerId); move(e); };
  const move = (e) => {
    if (id !== e.pointerId || !M) return;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    if (M.rot) { const t = dx; dx = dy; dy = -t; }
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    M.input.x = dx / R; M.input.y = dy / R;
  };
  const end = (e) => { if (id !== e.pointerId || !M) return; id = null; M.input.x = 0; M.input.y = 0; knob.style.transform = ''; };
  base.addEventListener('pointerdown', start);
  base.addEventListener('pointermove', move);
  base.addEventListener('pointerup', end);
  base.addEventListener('pointercancel', end);
}

function setButtons() {
  const b = $('mbtns');
  if (!b) return;
  if (M.mash) { b.className = 'mbtns mash'; return; }
  const att = M.ball.owner ? M.ball.owner.team === 0 : M.attacking;
  M.attacking = att;
  b.className = 'mbtns ' + (att ? 'att' : 'def');
}

function press(k, down) {
  if (!M || !M.alive) return;
  if (M.phase === 'gk') { if (down) gkTap(); return; }
  if (M.mash) { if (down) M.mash.tap(); return; }
  if (M.phase === 'lineout' && M.set?.step === 'throw') { if (down) lineoutThrow(); return; }
  if (M.phase === 'tackle' && M.offload && down && (k === 'up' || k === 'down')) return tryOffload(k === 'up' ? -1 : 1);
  if (M.phase === 'ruck' && down && k === 'tackle') return tryJackal();
  if (M.phase !== 'play') return;
  const c = M.ctrl;
  if (!c) return;
  if (k === 'kick') {
    if (M.ball.owner === c) {
      if (down) { M.aim = { x: c.x + D(0) * 22, y: c.y, t: 0 }; M.input.kick = true; }
      else if (M.aim) { const a = M.aim; M.aim = null; M.input.kick = false; kickTo(c, a.x, a.y); }
    }
    return;
  }
  if (k === 'up' || k === 'down') {
    const dir = k === 'up' ? -1 : 1;
    if (down && M.ball.owner === c) M.passHold = { dir, t: 0 };
    else if (!down && M.passHold && M.passHold.dir === dir) {
      const skip = M.passHold.t > 0.28;
      M.passHold = null;
      if (M.ball.owner === c) pass(c, dir, skip);
    }
    return;
  }
  if (!down) return;
  if (k === 'step' && M.ball.owner === c && c.stepCd <= 0) {
    const s = Math.abs(M.input.y) > 0.2 ? Math.sign(M.input.y) : (Math.random() < 0.5 ? -1 : 1);
    c.vy = s * 11; c.inv = 0.45; c.stepCd = 1.0; sfx('step');
    float(c, 'AMAGUE', '#4cc9f0');
  }
  if (k === 'tackle' && M.ball.owner && M.ball.owner.team === 1 && up(c)) dive(c, M.ball.owner, true);
  if (k === 'switch' && !M.attacking) switchCtrl(true);
}

// ---------------------------------------------------------------
//  MENSAJES, RELATO Y EFECTOS
// ---------------------------------------------------------------
function banner(text, sub = '', t = 1.6) { M.msg = text; M.sub = sub; M.msgT = t; }
function float(p, text, col) { M.fx.push({ x: p.x, y: p.y, text, col, t: 0 }); }
function say(text) { M.log.push({ text, t: 0 }); if (M.log.length > 3) M.log.shift(); }
function stat(p, k) { if (p.team !== 0) return; const s = (M.pstats[p.name] ||= { tackles: 0, tries: 0, breaks: 0, carries: 0 }); s[k]++; }
function panel(html, bind) {
  const p = $('mpanel');
  if (!p) return;
  if (!html) { p.hidden = true; p.innerHTML = ''; return; }
  p.innerHTML = html; p.hidden = false;
  bind?.(p);
}

// ---------------------------------------------------------------
//  FORMACIONES (carriles de ataque y defensa)
// ---------------------------------------------------------------
function setForm(att, rx, ry, teleport = false) {
  const s = ry < 35 ? 1 : -1; // lado abierto (hacia donde hay más cancha)
  const openW = s > 0 ? 70 - ry : ry; // metros hacia el lado abierto
  const blindW = 70 - openW;
  M.form = { att, rx, ry, s };
  const openWing = s > 0 ? 13 : 10, blindWing = s > 0 ? 10 : 13;
  const L = (lat) => clamp(ry + s * lat, 2.5, 67.5);
  // Ataque 1-3-3-1: 9 en el ruck, pods de forwards en la línea de ventaja,
  // backs escalonados hacia el lado abierto y el 15 en segunda línea.
  const flyLat = Math.min(9, 4 + openW * 0.12);
  const ATT = {
    8: [-1.2, 0],
    0: [-2.6, openW * 0.2 - 1.8], 1: [-2.2, openW * 0.2], 2: [-2.6, openW * 0.2 + 1.8],
    3: [-2.8, blindW > 14 ? -blindW * 0.45 - 1.8 : openW * 0.45 - 1.8], 4: [-2.4, blindW > 14 ? -blindW * 0.45 : openW * 0.45], 5: [-2.8, blindW > 14 ? -blindW * 0.45 + 1.8 : openW * 0.45 + 1.8],
    6: [-2.8, openW * 0.66 - 1.6], 7: [-2.8, openW * 0.66 + 1.6],
    9: [-5.5, flyLat], 11: [-6.5, flyLat + 7], 12: [-7.5, flyLat + 14],
    14: [-11, openW * 0.42],
  };
  ATT[openWing] = [-7.5, openW - 4];
  ATT[blindWing] = [-6, blindW > 10 ? -(blindW - 5) : -blindW * 0.5];
  // Defensa: línea plana a lo ancho, forwards cerca del ruck, backs hacia afuera, 15 atrás
  const DEF = {
    0: [1, -1.6], 1: [1, 1.6], 2: [1, -4.6], 3: [1, 4.6], 4: [1, 8], 5: [1, -8], 6: [1, 11.5], 7: [1, -11.5],
    8: [3, 0.5], 9: [1, 16], 11: [1, 21.5], 12: [1.2, 27.5], 14: [16, openW * 0.35],
  };
  DEF[openWing] = [3, Math.max(31, openW - 6)];
  DEF[blindWing] = [3, -Math.max(6, Math.min(16, blindW - 5))];
  for (const p of M.players) {
    const i = p.idx;
    const [ox, lat] = (p.team === att ? ATT : DEF)[i];
    p.ox = ox; p.oy = L(lat);
    if (teleport) {
      p.x = clamp(rx + D(att) * ox, -9, 109);
      p.y = p.oy;
      p.vx = 0; p.vy = 0; p.state = 'run'; p.t = 0; p.recover = 0; p.wait = 0;
      p.dir = D(p.team) > 0 ? 'right' : 'left';
    }
  }
}

function formTarget(p, carrier) {
  const f = M.form;
  if (!f) return [p.x, p.y];
  const anchorX = carrier ? carrier.x : f.rx;
  const anchorY = carrier ? carrier.y : f.ry;
  const attTeam = carrier ? carrier.team : f.att;
  if (p.team === attTeam) {
    const d = D(p.team);
    const drift = (anchorY - f.ry) * 0.15;
    const ox = p.team === f.att ? p.ox : -4;
    return [anchorX + d * Math.min(-0.8, ox), clamp(p.oy + drift, 2, 68)];
  }
  const dA = D(attTeam);
  const drift = (anchorY - f.ry) * 0.7;
  const ox = p.team !== f.att ? p.ox : 2;
  return [anchorX + dA * ox, clamp(p.oy + drift, 1.5, 68.5)];
}

function setKickoff(team) {
  M.phase = 'kickoff'; M.pt = 1.6; M.kickTeam = team;
  M.ball.owner = null; M.ball.mode = 'dead';
  const d = D(team);
  for (const p of M.players) {
    p.state = 'run'; p.vx = 0; p.vy = 0; p.recover = 0; p.wait = 0;
    const i = p.idx;
    if (p.team === team) {
      if (i === 9) { p.x = 50 - d * 3; p.y = 35; }
      else { p.x = 50 - d * 1.5; p.y = 4 + (i < 9 ? i : i - 1) * 4.6; }
    } else {
      const dd = D(p.team);
      if (FWD(i)) { p.x = 50 - dd * 12; p.y = 14 + i * 6; }
      else if (i === 14) { p.x = 50 - dd * 38; p.y = 35; }
      else if (i === 10 || i === 13) { p.x = 50 - dd * 30; p.y = i === 10 ? 12 : 58; }
      else { p.x = 50 - dd * 22; p.y = 20 + (i - 8) * 6; }
    }
    p.tx = p.x; p.ty = p.y; p.oy = p.y; p.dir = D(p.team) > 0 ? 'right' : 'left';
  }
  M.form = null;
  M.ball.x = 50; M.ball.y = 35; M.ball.z = 0;
  M.cam.x = 50; M.cam.y = 35;
  M.attacking = team !== 0;
  setButtons();
}

// ---------------------------------------------------------------
//  PELOTA: pases, patadas, recepción
// ---------------------------------------------------------------
function giveBall(p) {
  M.ball.owner = p; M.ball.mode = 'held'; M.ball.z = 1;
  p.hold = 0; p.wait = 0;
  if (p.team === 0) M.ctrl = p;
  else switchCtrl();
  if (!M.form || M.form.att !== p.team) setForm(p.team, p.x, p.y);
  stat(p, 'carries');
  setButtons();
}

function pass(from, dir, skip = false) {
  const d = D(from.team);
  const mates = teamOf(from.team).filter((p) => p !== from && up(p));
  const cands = mates.filter((p) => (p.x - from.x) * d <= 0.6 && (p.y - from.y) * dir > 1.2 && dist(p, from) < 22);
  if (!cands.length) { if (from.team === 0) float(from, 'Sin apoyo', '#adb5bd'); return false; }
  cands.sort((a, b) => Math.abs(a.y - from.y) + Math.abs(a.x - from.x) * 0.6 - (Math.abs(b.y - from.y) + Math.abs(b.x - from.x) * 0.6));
  const to = skip && cands[1] ? cands[1] : cands[0];
  doPass(from, to);
  if (skip && cands[1] && from.team === 0) float(from, 'PASE LARGO', '#4cc9f0');
  return true;
}
function doPass(from, to, offload = false) {
  const d = D(from.team);
  const dd = dist(from, to);
  const T = 0.2 + dd / 19;
  let tx = to.x + to.vx * T, ty = to.y + to.vy * T;
  if ((tx - from.x) * d > 0.3) tx = from.x + d * 0.3; // nunca para adelante
  const b = M.ball;
  b.owner = null; b.mode = 'pass'; b.fx = from.x; b.fy = from.y; b.tx = tx; b.ty = ty; b.t = 0; b.T = T; b.h = 0.5 + dd * 0.04; b.target = to; b.team = from.team; b.intercepted = false; b.offload = offload;
  to.wait = T; to.tx = tx; to.ty = ty;
  if (from.team === 0) { M.stats.passes++; sfx('kick'); }
  from.passAnim = 0.25;
}

function kick(from, pw) {
  const d = D(from.team);
  const grubber = pw < 0.33;
  let tx, ty, T, h;
  if (grubber) { tx = from.x + d * (8 + pw * 18); ty = from.y + (from.team === 0 ? M.input.y * 6 : rand(-4, 4)); T = 0.5; h = 0.6; }
  else { tx = from.x + d * (14 + 42 * pw); ty = from.y + (from.team === 0 ? M.input.y * 16 : 0); T = 1.0 + 1.4 * pw; h = 6 + 11 * pw; }
  launchAir(from.x, from.y, tx, ty, T, h, from.team, grubber);
  if (from.team === 0) M.stats.kicks++;
  sfx('kick');
  float(from, grubber ? 'GRUBBER' : '¡PATADA!', '#ffd166');
  say(`${from.name} ${grubber ? 'la empuja con un grubber' : 'patea largo'}.`);
  from.kickAnim = 0.3;
}

function kickTo(from, tx, ty) {
  const d = D(from.team);
  const dk = Math.hypot(tx - from.x, ty - from.y);
  const err = dk * 0.05;
  tx += rand(-err, err); ty += rand(-err, err);
  const grubber = dk < 15;
  if (grubber) launchAir(from.x, from.y, tx, ty, 0.45 + dk / 40, 0.6, from.team, true);
  else launchAir(from.x, from.y, tx, ty, 0.8 + dk / 32, 3 + dk * 0.22, from.team);
  if (from.team === 0) M.stats.kicks++;
  sfx('kick');
  const toPosts = (from.team === 0 ? 100 - tx : tx);
  const label = grubber ? 'GRUBBER' : Math.abs(toPosts) < 3 && Math.abs(ty - 35) < 5 ? '¡DROP!' : dk > 35 ? 'PATADA LARGA' : 'CHIP';
  float(from, label, '#ffd166');
  say(`${from.name}: ${label.toLowerCase().replace(/[¡!]/g, '')}.`);
  from.kickAnim = 0.3;
}

function kickTouch(from) {
  const d = D(from.team);
  const side = from.y < 35 ? -6 : 76;
  launchAir(from.x, from.y, from.x + d * rand(22, 34), side, 1.6, 12, from.team);
  sfx('kick');
  say(`${from.name} busca el touch con una patada.`);
}

function launchAir(fx, fy, tx, ty, T, h, team, grubber = false) {
  const b = M.ball;
  b.owner = null; b.mode = 'air'; b.fx = fx; b.fy = fy; b.tx = tx; b.ty = ty; b.t = 0; b.T = T; b.h = h; b.team = team; b.grubber = grubber; b.x = fx; b.y = fy;
  M.attacking = team !== 0;
  setButtons();
}

function knockOn(p) {
  banner('KNOCK-ON', `Scrum para ${M.teams[other(p.team)].short}`, 1.6);
  say(`Knock-on de ${p.name}. Scrum.`);
  sfx('whistle');
  startScrum(other(p.team), M.ball.x, M.ball.y);
}

// ---------------------------------------------------------------
//  TACKLES, OFFLOADS Y RUCKS
// ---------------------------------------------------------------
function dive(p, car, user = false) {
  const lead = 0.25;
  const a = Math.atan2(car.y + car.vy * lead - p.y, car.x + car.vx * lead - p.x);
  p.state = 'dive'; p.t = 0.38; p.vx = Math.cos(a) * 11; p.vy = Math.sin(a) * 11; p.userDive = user;
}

function contact(def, car) {
  if (car.inv > 0) return;
  let chance;
  if (def.userDive) chance = 0.78 + statLvl('fue') * 0.008;
  else if (def.state === 'dive') chance = def.team === 1 ? M.df.tackle : 0.5;
  else chance = Math.hypot(car.vx, car.vy) < 2.5 ? 0.75 : 0.35;
  chance *= def.power / car.power;
  if (car.team === 0 && car.sprint) chance -= 0.07;
  if (Math.random() < chance) tackle(def, car);
  else {
    def.state = 'down'; def.t = 0.8;
    car.inv = 0.35; car.vx *= 0.7;
    float(car, '¡ROMPE EL TACKLE!', '#ffd166');
    if (car.team === 0) { M.stats.breaks++; stat(car, 'breaks'); }
    say(`${car.name} rompe el tackle de ${def.name}.`);
  }
}

function tackle(def, car) {
  car.state = 'fall'; car.t = 0.45; car.vx *= 0.3; car.vy *= 0.3;
  def.state = 'down'; def.t = 1.0; def.vx = car.vx; def.vy = car.vy;
  const b = M.ball;
  b.owner = null; b.mode = 'dead'; b.x = car.x; b.y = car.y; b.z = 0.3;
  sfx('hit');
  if (def.team === 0) { M.stats.tackles++; stat(def, 'tackles'); float(def, '¡TACKLE!', '#06d6a0'); say(`¡Tacklazo de ${def.name}!`); }
  else { float(car, 'TACKLEADO', '#ef476f'); say(`${def.name} tacklea a ${car.name}.`); }
  if (def.power > 1.1 && Math.random() < 0.3) { float(def, 'BIG HIT', '#ff6b35'); M.crowd = 0.6; }
  M.phase = 'tackle'; M.pt = 0.5; M.ruck = { x: car.x, y: car.y, att: car.team, car };
  M.offload = car.team === 0 ? car : null;
  if (car.team === 0) { M.hint = '¡OFFLOAD! Tocá PASE'; M.hintT = 0.5; }
  const r = Math.random();
  if (r < 0.05) M.ruck.pen = { team: car.team, why: 'Tackle alto' };
  else if (r < 0.09) M.ruck.pen = { team: def.team, why: 'No soltó la pelota' };
  else if (r < 0.11) M.ruck.pen = { team: car.team, why: 'Fuera de juego' };
  // la máquina también hace offloads a veces
  if (car.team === 1 && !M.ruck.pen && Math.random() < 0.12) {
    const sup = teamOf(1).filter((p) => up(p) && p !== car && dist(p, car) < 4 && (p.x - car.x) * D(1) <= 0.5);
    if (sup.length) { M.phase = 'play'; M.ruck = null; car.state = 'down'; car.t = 1; doPass(car, sup[0], true); say(`¡Offload de ${car.name}!`); }
  }
}

function tryOffload(dir) {
  const car = M.offload;
  M.offload = null;
  const d = D(car.team);
  const sup = teamOf(car.team).filter((p) => up(p) && p !== car && dist(p, car) < 5 && (p.x - car.x) * d <= 0.8 && (p.y - car.y) * dir > -0.5);
  if (!sup.length) { float(car, 'Sin apoyo', '#adb5bd'); return; }
  sup.sort((a, b) => dist(a, car) - dist(b, car));
  M.ruck = null;
  if (Math.random() < 0.18) { knockOn(car); return; }
  M.phase = 'play';
  car.state = 'down'; car.t = 1;
  doPass(car, sup[0], true);
  M.stats.offloads++;
  float(car, '¡OFFLOAD!', '#4cc9f0');
  say(`¡Qué offload de ${car.name}!`);
}

function startRuck() {
  const r = M.ruck;
  M.offload = null;
  if (r.car && r.car.state === 'fall') { r.car.state = 'down'; r.car.t = 1.4; }
  if (r.pen) return startPenalty(r.pen.team, r.x, r.y, r.pen.why);
  M.phase = 'ruck';
  const bind = (team, n) => M.players.filter((p) => p.team === team && up(p) && p !== M.ctrl && dist(p, r) < 9).sort((a, b) => dist(a, r) - dist(b, r)).slice(0, n);
  const atk = bind(r.att, 2), def = bind(other(r.att), 2);
  const d = D(r.att);
  atk.forEach((p, i) => { p.state = 'bind'; p.t = 1.8; p.x = r.x - d * 0.9; p.y = r.y + (i ? 0.8 : -0.8); p.dir = d > 0 ? 'right' : 'left'; });
  def.forEach((p, i) => { p.state = 'bind'; p.t = 1.8; p.x = r.x + d * 0.9; p.y = r.y + (i ? 0.8 : -0.8); p.dir = d > 0 ? 'left' : 'right'; });
  const support = atk.length;
  let turnover = support >= 2 ? 0.05 : support === 1 ? 0.12 : 0.35;
  if (def.length === 0) turnover = 0;
  r.winner = Math.random() < turnover ? other(r.att) : r.att;
  M.pt = support >= 2 ? 1.0 : 1.5;
  r.jackal = false;
  setForm(r.att, r.x, r.y);
  banner('RUCK', '', 0.7);
  if (r.att === 1) { M.hint = 'TACKLE cerca del ruck = ¡ROBO!'; M.hintT = 1.2; switchCtrl(); }
  setButtons();
}

function tryJackal() {
  const r = M.ruck;
  if (!r || r.jackal || r.att === 0) return;
  r.jackal = true;
  const c = M.ctrl;
  if (!c || dist(c, r) > 3.5) { if (c) float(c, 'Muy lejos', '#adb5bd'); return; }
  c.state = 'bind'; c.t = 1; c.x = r.x + D(r.att) * 0.6; c.y = r.y;
  if (Math.random() < 0.35 + statLvl('fue') * 0.01) { r.winner = 0; M.stats.steals++; float(c, '¡ROBO!', '#06d6a0'); say(`¡${c.name} se roba la pelota en el ruck!`); sfx('done'); }
  else if (Math.random() < 0.25) r.pen = { team: 1, why: 'Manos en el ruck' };
  else float(c, 'No llegó', '#adb5bd');
}

function endRuck() {
  const r = M.ruck;
  if (r.pen) return startPenalty(r.pen.team, r.x, r.y, r.pen.why);
  const w = r.winner;
  if (w !== r.att) { banner('¡RECUPERACIÓN!', M.teams[w].short, 1.2); sfx(w === 0 ? 'done' : 'miss'); }
  setForm(w, r.x, r.y);
  M.phase = 'play';
  M.ruck = null;
  const nine = P(w, 8);
  nine.state = 'run';
  nine.x = r.x - D(w) * 1.2; nine.y = r.y + 0.6;
  giveBall(nine);
  if (w === 0) { M.hint = 'Sacá: PASE ▲▼, corré o PATEÁ'; M.hintT = 2.2; }
  else nine.hold = 0.55;
}

// ---------------------------------------------------------------
//  SCRUM 8 vs 8
// ---------------------------------------------------------------
function startScrum(feed, x, y) {
  x = clamp(x, 5, 95); y = clamp(y, 15, 55);
  M.ruck = null; M.offload = null;
  M.ball.owner = null; M.ball.mode = 'dead'; M.ball.x = x; M.ball.y = y; M.ball.z = 0;
  setForm(feed, x, y, true);
  const pack = [[0.9, -1.1], [0.9, 0], [0.9, 1.1], [1.9, -0.55], [1.9, 0.55], [2.0, -1.7], [2.0, 1.7], [2.9, 0]];
  for (const p of M.players) {
    const pd = D(p.team);
    if (p.idx < 8) { p.x = x - pd * pack[p.idx][0]; p.y = y + pack[p.idx][1]; p.state = 'scrum'; p.dir = pd > 0 ? 'right' : 'left'; }
    else if (p.idx === 8) { p.x = x - pd * (p.team === feed ? 0.4 : 1.2); p.y = y + (p.team === feed ? 2.4 : -2.4); }
    else p.x = x - pd * Math.max(5, Math.abs(p.x - x));
  }
  M.phase = 'scrum'; M.pt = 0;
  M.set = { feed, x, y, step: 'call', t: 0, bar: 0.5 };
  M.attacking = true; setButtons();
  panel('');
  say(`Scrum para ${M.teams[feed].short}.`);
}
function updateScrum(dt) {
  const s = M.set;
  s.t += dt;
  if (s.step === 'call') {
    const calls = ['¡Agachar!', '¡Tomar!', '¡YA!'];
    M.msg = calls[Math.min(2, Math.floor(s.t / 0.7))]; M.sub = 'Scrum'; M.msgT = 0.3;
    if (s.t > 2.1) {
      s.step = 'push'; s.t = 0; sfx('hit');
      M.mash = { tap: () => { s.bar += 0.04 + statLvl('fue') * 0.0018; sfx('step'); } };
      setButtons();
    }
  } else if (s.step === 'push') {
    s.bar -= (0.16 * (M.df.tackle / 0.55) + (s.feed === 1 ? 0.03 : 0)) * dt;
    s.bar = clamp(s.bar, 0, 1);
    M.msg = '¡EMPUJÁ!'; M.sub = 'Tocá rápido'; M.msgT = 0.2;
    for (const p of M.players) if (p.state === 'scrum') p.x += (s.bar - 0.5) * dt * 0.8;
    if (s.t > 2.6 || s.bar >= 1 || s.bar <= 0) {
      const thr = s.feed === 0 ? 0.4 : 0.6;
      s.winner = s.bar >= thr ? 0 : 1;
      if (s.bar >= 0.9) s.pen = 0; else if (s.bar <= 0.1) s.pen = 1;
      s.step = 'done'; s.t = 0; M.mash = null; setButtons();
      banner(s.winner === 0 ? '¡SCRUM GANADO!' : 'Scrum perdido', '', 1.1);
      sfx(s.winner === 0 ? 'done' : 'miss');
    }
  } else if (s.step === 'done' && s.t > 0.9) {
    for (const p of M.players) if (p.state === 'scrum') p.state = 'run';
    M.set = null;
    if (s.pen !== undefined && Math.random() < 0.5) return startPenalty(s.pen, s.x, s.y, 'Scrum dominado');
    M.ruck = { x: s.x, y: s.y, att: s.winner, winner: s.winner };
    endRuck();
  }
}

// ---------------------------------------------------------------
//  LINE + MAUL
// ---------------------------------------------------------------
function startLineout(team, x, side) {
  x = clamp(x, 6, 94);
  const sy = side === 0 ? 0 : 70, inw = side === 0 ? 1 : -1;
  M.ruck = null; M.offload = null;
  M.ball.owner = null; M.ball.mode = 'dead'; M.ball.x = x; M.ball.y = sy; M.ball.z = 1.5;
  setForm(team, x, sy + inw * 12, true);
  const slots = [5.5, 7, 8.5, 10, 11.5, 13, 14.5];
  for (const p of M.players) {
    const pd = D(p.team);
    if (p.idx < 8 && !(p.team === team && p.idx === 1)) {
      const k = p.idx === 0 ? 0 : p.idx === 1 ? 3 : p.idx - 1;
      p.x = x - pd * 1.1; p.y = sy + inw * slots[Math.min(6, k)]; p.dir = side === 0 ? 'up' : 'down';
    }
    if (p.team === team && p.idx === 1) { p.x = x; p.y = sy - inw * 0.7; p.dir = side === 0 ? 'down' : 'up'; }
    if (p.idx === 8) { p.x = x - pd * 2; p.y = sy + inw * 17; }
    p.vx = 0; p.vy = 0; p.state = 'run';
  }
  M.phase = 'lineout';
  M.set = { team, x, side, sy, inw, step: 'call', t: 0, zone: null };
  M.attacking = true; setButtons();
  say(`Line para ${M.teams[team].short}.`);
  const zones = [['adelante', 'Adelante'], ['medio', 'Medio'], ['atras', 'Atrás']];
  const ask = team === 0 ? '¿A quién tiramos?' : '¿Dónde saltamos para robar?';
  panel(`<div class="mp-t">LINE · ${M.teams[team].short}</div><div class="mp-s">${ask}</div><div class="mp-row">${zones.map(([k, n]) => `<button class="btn" data-z="${k}">${n}</button>`).join('')}</div>`, (p) => {
    p.querySelectorAll('[data-z]').forEach((b) => (b.onclick = () => {
      M.set.zone = b.dataset.z;
      panel('');
      if (team === 0) { M.set.step = 'throw'; M.set.t = 0; }
      else resolveLineout(Math.random() < 0.6 ? 0.9 : 0.5);
    }));
  });
}
function lineoutThrow() { resolveLineout(Math.abs(Math.sin(M.set.t * 2.4))); }
function resolveLineout(q) {
  const s = M.set;
  s.oppZone = pick(['adelante', 'medio', 'atras']);
  let win;
  if (s.team === 0) win = Math.random() < (s.oppZone === s.zone ? 0.42 : 0.88) * (0.5 + q * 0.5) ? 0 : 1;
  else win = Math.random() < (s.oppZone === s.zone ? 0.5 : 0.07) ? 0 : 1;
  s.step = 'fly'; s.t = 0; s.win = win; s.q = q;
  s.jumpZone = s.team === 0 ? s.zone : s.oppZone;
  sfx('kick');
}
function updateLineout(dt) {
  const s = M.set;
  s.t += dt;
  if (s.step === 'throw') {
    M.msg = '¡TIRÁ!'; M.sub = 'Cuando el saltador esté arriba'; M.msgT = 0.2;
    if (s.t > 6) resolveLineout(0.3);
  } else if (s.step === 'fly') {
    if (s.t > 0.95) {
      const stolen = s.win !== s.team;
      banner(stolen ? '¡ROBADO!' : s.win === 0 ? '¡LINE GANADO!' : `Line ${M.teams[s.win].short}`, '', 1.1);
      sfx(s.win === 0 ? 'done' : 'miss');
      say(stolen ? `${M.teams[s.win].short} roba el line.` : `${M.teams[s.win].short} gana su line.`);
      s.step = 'done'; s.t = 0;
      if (s.win === 0 && 100 - s.x < 30) {
        s.step = 'ask';
        panel(`<div class="mp-t">LINE GANADO</div><div class="mp-s">Estás a ${Math.round(100 - s.x)} m del try</div><div class="mp-row"><button class="btn gold" id="mmaul">🐂 Armar maul</button><button class="btn" id="mout">🏉 Sacar rápido</button></div>`, () => {
          $('mmaul').onclick = () => { panel(''); startMaul(); };
          $('mout').onclick = () => { panel(''); s.step = 'go'; };
        });
      }
    }
  } else if ((s.step === 'done' && s.t > 0.7) || s.step === 'go') {
    const y = s.sy + s.inw * 10;
    M.set = null;
    M.ruck = { x: s.x, y, att: s.win, winner: s.win };
    endRuck();
  }
}

function startMaul() {
  const s = M.set;
  const y = s.sy + s.inw * 9;
  M.phase = 'maul';
  M.set = { kind: 'maul', x: s.x, y, t: 0, prog: 0.4, stall: 0 };
  M.mash = { tap: () => { M.set.prog += 0.2 + statLvl('fue') * 0.008; sfx('step'); } };
  setButtons();
  for (const p of M.players) {
    if (p.idx < 8) {
      const k = p.idx;
      p.state = 'scrum';
      p.x = s.x - D(p.team) * (0.8 + (k % 3) * 0.8);
      p.y = y + ((k % 3) - 1) * 0.9 + (k > 5 ? 0.5 : 0);
      p.dir = D(p.team) > 0 ? 'right' : 'left';
    }
  }
  say('¡Se arma el maul!');
}
function updateMaul(dt) {
  const s = M.set;
  s.t += dt;
  s.prog = clamp(s.prog - dt * (0.55 * (M.df.tackle / 0.55)), -0.6, 2.2);
  const move = s.prog * dt;
  M.msg = '¡EMPUJÁ EL MAUL!'; M.sub = 'Tocá rápido'; M.msgT = 0.2;
  s.x += move;
  for (const p of M.players) if (p.state === 'scrum') p.x += move;
  M.ball.x = s.x - 1.5; M.ball.y = s.y; M.ball.z = 0.8;
  if (s.prog <= 0.02) s.stall += dt; else s.stall = 0;
  if (s.x >= 100) {
    M.mash = null;
    for (const p of M.players) if (p.state === 'scrum') p.state = 'run';
    M.set = null;
    const g = P(0, 1);
    g.x = 100.5; g.y = s.y;
    say('¡TRY DE MAUL! El pack de la U lo empujó todo.');
    return scoreTry(g);
  }
  if (s.t > 7 || s.stall > 1.5) {
    M.mash = null;
    for (const p of M.players) if (p.state === 'scrum') p.state = 'run';
    M.set = null;
    M.ruck = { x: s.x, y: s.y, att: 0, winner: 0 };
    endRuck();
  }
}

// ---------------------------------------------------------------
//  PENALES Y PATADAS A LOS PALOS
// ---------------------------------------------------------------
function startPenalty(team, x, y, why) {
  sfx('whistle');
  M.ruck = null; M.offload = null; M.mash = null;
  for (const p of M.players) if (p.state !== 'run') p.state = 'run';
  x = clamp(x, 3, 97); y = clamp(y, 3, 67);
  M.ball.owner = null; M.ball.mode = 'dead'; M.ball.x = x; M.ball.y = y; M.ball.z = 0;
  M.phase = 'penalty';
  setForm(team, x, y);
  banner(`PENAL ${M.teams[team].short}`, why, 1.6);
  say(`Penal para ${M.teams[team].short}: ${why.toLowerCase()}.`);
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
        else if (c === 'touch') startLineout(0, Math.min(94, x + 20), y < 35 ? 0 : 1);
        else { setForm(0, x, y, true); M.phase = 'play'; const n = P(0, 8); n.x = x - 1; n.y = y; giveBall(n); }
      }));
    });
  } else { M.pt = 1.6; M.penAI = { x, y, toPosts }; }
  setButtons();
}

function startGoalKick(team, x, y, pts) {
  if (team === 1) {
    const ok = Math.random() < clamp(0.88 - x / 90 - Math.abs(y - 35) / 120, 0.25, 0.88);
    M.phase = 'aikick'; M.pt = 1.8; M.aik = { ok, pts, x, y, t: 0 };
    banner(pts === 2 ? 'Conversión rival' : 'Penal a los palos', '', 1.2);
    return;
  }
  const distK = clamp(100 - x, 8, 50);
  M.phase = 'gk';
  M.gk = { pts, dist: Math.round(distK + 5), spot: clamp((y - 35) / 35, -0.9, 0.9), wind: +(rand(-1, 1)).toFixed(1), step: 'aim', aim: 0, pow: 0, t: 0 };
  panel('');
  M.attacking = true; setButtons();
}
function gkTap() {
  const g = M.gk;
  if (!g) return;
  if (g.step === 'aim') { g.lockAim = g.aim; g.step = 'power'; g.t = 0; sfx('click'); }
  else if (g.step === 'power') {
    g.lockPow = g.pow; g.step = 'run'; g.t = 0; sfx('click');
    const need = 0.45 + g.dist / 110 - Math.min(0.15, statLvl('fue') * 0.01);
    const lateral = g.lockAim + g.wind * 0.12 + g.spot * 0.15 * (1 - Math.abs(g.lockAim));
    g.ok = Math.abs(lateral) < 0.16 + Math.min(0.06, statLvl('dis') * 0.004) && g.lockPow >= need;
    g.short = g.lockPow < need; g.lat = lateral; g.trail = [];
  }
}
function afterGoalKick(team, ok, pts) {
  if (ok) { M.teams[team].score += pts; banner(pts === 2 ? '¡CONVERSIÓN!' : '¡ADENTRO!', `+${pts}`, 1.5); sfx(team === 0 ? 'done' : 'miss'); say(`${M.teams[team].short} suma ${pts} con la patada.`); if (team === 0) M.crowd = 1; }
  else { banner('¡Afuera!', '', 1.2); sfx(team === 0 ? 'miss' : 'done'); say('La patada se va afuera.'); }
  M.phase = 'wait'; M.pt = 1.4;
  M.next = () => { if (pts === 2 || ok) setKickoff(other(team)); else restart22(other(team)); };
}

function restart22(team) {
  const x = team === 0 ? 22 : 78;
  setForm(team, x, 35, true);
  M.phase = 'play';
  const p = P(team, 9); p.x = x; p.y = 35;
  giveBall(p);
  if (team === 1) p.hold = 0.6;
  banner('Saque de 22', M.teams[team].short, 1.2);
}

// ---------------------------------------------------------------
//  TRY
// ---------------------------------------------------------------
function scoreTry(p) {
  const team = p.team;
  M.mash = null;
  M.teams[team].score += 5; M.teams[team].tries++;
  M.ball.owner = null; M.ball.mode = 'dead'; M.ball.x = p.x; M.ball.y = p.y; M.ball.z = 0;
  p.state = 'dive'; p.t = 0.5; p.vx = D(team) * 6; p.vy = 0; p.tryDive = true;
  M.phase = 'try'; M.pt = 2.8; M.tryAt = { team, x: p.x, y: clamp(p.y, 2, 68) };
  if (team === 0) {
    M.stats.tries++; stat(p, 'tries');
    if (p === M.giuli) M.stats.myTries++;
    banner('¡TRY!', `${p.name} · +5`, 2.6);
    say(`¡TRY DE LA U! Lo apoya ${p.name}.`);
    sfx('aura'); M.crowd = 1.5;
  } else { banner('Try rival', `${M.teams[1].short} +5`, 2.4); say(`Try de ${M.teams[1].short}.`); sfx('lose'); }
  setButtons();
}

// ---------------------------------------------------------------
//  CAMBIO DE JUGADOR CONTROLADO
// ---------------------------------------------------------------
function switchCtrl(force = false) {
  const b = M.ball;
  const target = b.owner || (M.ruck ? M.ruck : { x: b.mode === 'air' ? b.tx : b.x, y: b.mode === 'air' ? b.ty : b.y });
  const mine = teamOf(0).filter((p) => up(p) || p.state === 'dive');
  if (!mine.length) return;
  mine.sort((a, c) => dist(a, target) - dist(c, target));
  let pk = mine[0];
  if (force && pk === M.ctrl && mine[1]) pk = mine[1];
  M.ctrl = pk;
}

// ---------------------------------------------------------------
//  MOVIMIENTO
// ---------------------------------------------------------------
function moveTo(p, tx, ty, sp, dt) {
  const dx = tx - p.x, dy = ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.2) { p.vx *= 0.75; p.vy *= 0.75; return; }
  const s = Math.min(sp, d * 3.5);
  p.vx += ((dx / d) * s - p.vx) * Math.min(1, dt * 7);
  p.vy += ((dy / d) * s - p.vy) * Math.min(1, dt * 7);
}

const MOVING_PHASES = ['play', 'kickoff', 'ruck', 'tackle', 'try'];
function updatePlayers(dt) {
  const b = M.ball;
  const car = b.owner;
  for (const p of M.players) {
    if (p.inv > 0) p.inv -= dt;
    if (p.stepCd > 0) p.stepCd -= dt;
    if (p.passAnim > 0) p.passAnim -= dt;
    if (p.kickAnim > 0) p.kickAnim -= dt;
    if (p.state === 'scrum') { p.vx = 0; p.vy = 0; continue; }
    if (p.state === 'down' || p.state === 'bind' || p.state === 'fall') {
      p.t -= dt; p.vx *= 0.85; p.vy *= 0.85;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t <= 0) { if (p.state === 'fall') { p.state = 'down'; p.t = 1.2; } else { p.state = 'run'; p.recover = 0.25; } }
      continue;
    }
    if (p.state === 'dive') {
      p.t -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.9; p.vy *= 0.9;
      if (!p.tryDive && car && car.team !== p.team && dist(p, car) < 1.15 && M.phase === 'play') { contact(p, car); if (M.phase !== 'play') return; }
      if (p.t <= 0) { p.state = 'down'; p.t = p.tryDive ? 2 : 0.6; p.tryDive = false; p.userDive = false; }
      continue;
    }
    if (p.recover > 0) p.recover -= dt;
    if (!MOVING_PHASES.includes(M.phase)) { p.vx *= 0.8; p.vy *= 0.8; }
    else if (p === M.ctrl && M.phase === 'play') {
      let ix = M.input.x, iy = M.input.y;
      const k = M.keys;
      if (k.arrowleft || k.a) ix = -1; if (k.arrowright || k.d) ix = 1;
      if (k.arrowup || k.w) iy = -1; if (k.arrowdown || k.s) iy = 1;
      if (M.aim) { ix = D(0) * 0.3; iy = 0; }
      const len = Math.hypot(ix, iy);
      if (len > 1) { ix /= len; iy /= len; }
      p.sprint = (len > 0.92 || k.shift) && p.stamina > 0.05;
      if (p.sprint) p.stamina = Math.max(0, p.stamina - dt * 0.22); else p.stamina = Math.min(1, p.stamina + dt * 0.12);
      const sp = p.speed * (p.sprint ? 1.15 : 0.95);
      if (Math.abs(p.vy) <= 9) {
        p.vx += (ix * sp - p.vx) * Math.min(1, dt * 9);
        p.vy += (iy * sp - p.vy) * Math.min(1, dt * 9);
      } else p.vy *= 0.88;
    } else if (M.phase === 'try') {
      const ta = M.tryAt;
      if (p.team === ta.team) moveTo(p, ta.x - D(ta.team) * 2 + (p.idx % 3), ta.y + ((p.idx % 5) - 2) * 1.5, p.speed * 0.8, dt);
      else { p.vx *= 0.9; p.vy *= 0.9; }
    } else aiMove(p, dt);
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = clamp(p.x, -9.5, 109.5);
    if (p !== car) p.y = clamp(p.y, -1.5, 71.5);
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > 0.6) {
      p.anim += dt * sp * 1.7;
      p.frame = [0, 1, 0, 2][Math.floor(p.anim) % 4];
      if (Math.abs(p.vx) > Math.abs(p.vy) * 0.75) p.dir = p.vx > 0 ? 'right' : 'left';
      else p.dir = p.vy > 0 ? 'down' : 'up';
    } else { p.frame = 0; if (M.phase === 'play' && car && p !== car) p.dir = car.x > p.x ? 'right' : 'left'; }
  }
}

function aiMove(p, dt) {
  const b = M.ball;
  const car = b.owner;
  const sp0 = p.speed * 0.92;
  if (p.recover > 0) { p.vx *= 0.9; p.vy *= 0.9; return; }
  if (p.wait > 0) { p.wait -= dt; moveTo(p, p.tx, p.ty, p.speed, dt); return; }
  if (M.phase === 'kickoff') { moveTo(p, p.tx, p.ty, sp0, dt); return; }
  if (M.phase === 'ruck' || M.phase === 'tackle') {
    const [tx, ty] = formTarget(p, null);
    moveTo(p, tx, ty, p.speed * 1.3, dt);
    return;
  }
  if (b.mode === 'pass') {
    if (b.target === p) { moveTo(p, b.tx, b.ty, p.speed, dt); return; }
    const [tx, ty] = formTarget(p, b.target);
    moveTo(p, tx, ty, sp0, dt);
    return;
  }
  if (b.mode === 'air' || b.mode === 'loose') {
    const lx = b.mode === 'loose' ? b.x : b.tx, ly = b.mode === 'loose' ? b.y : b.ty;
    const team = teamOf(p.team).filter((q) => up(q) && q !== M.ctrl);
    team.sort((a, c) => Math.hypot(a.x - lx, a.y - ly) - Math.hypot(c.x - lx, c.y - ly));
    const rank = team.indexOf(p);
    if (rank <= 1) moveTo(p, lx, ly, p.speed, dt);
    else {
      const d = D(p.team);
      const tx = p.team === b.team ? p.x + d * 3 : lx + D(b.team) * (6 + rank * 1.5);
      moveTo(p, tx, clamp(p.oy, 2, 68), sp0 * 0.9, dt);
    }
    return;
  }
  if (!car) { moveTo(p, p.tx, p.ty, sp0, dt); return; }
  if (p === car) { aiCarrier(p, dt); return; }
  if (car.team === p.team) {
    const [tx, ty] = formTarget(p, car);
    moveTo(p, tx, ty, p.speed * 1.03, dt);
    return;
  }
  // DEFENSA: 1-2 van al tackle, el resto mantiene la línea
  const dA = D(car.team);
  const defs = teamOf(p.team).filter((q) => up(q) && q !== M.ctrl);
  const sorted = defs.slice().sort((a, c) => dist(a, car) - dist(c, car));
  const userClose = M.ctrl && M.ctrl.team === p.team && up(M.ctrl) && dist(M.ctrl, car) < 4;
  const rank = sorted.indexOf(p);
  if (rank > -1 && rank < 1 + (userClose ? 0 : (Math.floor(M.t / 4) % 2)) && ((p.x - car.x) * dA > -3 || dist(p, car) < 7)) {
    moveTo(p, car.x + car.vx * 0.3, car.y + car.vy * 0.3, p.speed * 1.03, dt);
    if (dist(p, car) < 1.9 && car.inv <= 0 && Math.random() < dt * 3) dive(p, car);
    return;
  }
  const [tx, ty] = formTarget(p, car);
  moveTo(p, tx, ty, p.speed * 0.98, dt);
}

function aiCarrier(p, dt) {
  const d = D(p.team);
  if (p.hold > 0) {
    p.hold -= dt; p.vx *= 0.8; p.vy *= 0.8;
    if (p.hold <= 0) {
      const toOwnLine = p.team === 1 ? 100 - p.x : p.x;
      const toTry = p.team === 1 ? p.x : 100 - p.x;
      const s = M.form ? M.form.s : 1;
      if (p.idx === 8 && toOwnLine < 25 && Math.random() < 0.55) kickTouch(p);
      else if (p.idx === 8 && toOwnLine < 45 && Math.random() < 0.18) kick(p, rand(0.55, 0.8));
      else if (p.idx === 8 && toTry < 6) {
        const f = teamOf(p.team).filter((q) => FWD(q.idx) && up(q)).sort((a, c) => dist(a, p) - dist(c, p))[0];
        if (f) doPass(p, f); else pass(p, s);
      } else if (!pass(p, s)) pass(p, -s);
    }
    return;
  }
  const defs = M.players.filter((q) => q.team !== p.team && up(q));
  let nearest = null, nd = 99;
  for (const q of defs) { const dd = dist(q, p); if (dd < nd && (q.x - p.x) * d > -1.5) { nd = dd; nearest = q; } }
  let ty = p.y;
  if (nearest && nd < 8) ty = p.y + (p.y > nearest.y ? 7 : -7);
  ty = clamp(ty, 4, 66);
  moveTo(p, p.x + d * 10, ty, p.speed * (nd < 6 ? 1.05 : 0.95), dt);
  p.passT = (p.passT || 0) + dt;
  if (nearest && nd < 3.2 && p.passT > 0.5 && Math.random() < dt * 4 * M.df.pass) {
    if (pass(p, nearest.y > p.y ? -1 : 1)) p.passT = 0;
  }
  if (p.idx === 9 && p.passT > 0.4 && nearest && nd < 6 && Math.random() < dt * 0.25) kick(p, Math.random() < 0.5 ? 0.2 : 0.7);
}

// ---------------------------------------------------------------
//  PELOTA
// ---------------------------------------------------------------
function updateBall(dt) {
  const b = M.ball;
  if (b.mode === 'held' && b.owner) {
    const p = b.owner;
    b.x = p.x + D(p.team) * 0.35; b.y = p.y + 0.1; b.z = 1;
    if (p.inv <= 0 && up(p)) {
      for (const q of M.players) {
        if (q.team === p.team || q.state !== 'run' || q.recover > 0) continue;
        if (dist(q, p) < 0.9) { contact(q, p); return; }
      }
    }
    if (p.team === 0 && p.x >= 100 && p.y > 0 && p.y < 70) return scoreTry(p);
    if (p.team === 1 && p.x <= 0 && p.y > 0 && p.y < 70) return scoreTry(p);
    if ((p.team === 0 && p.x < -0.5) || (p.team === 1 && p.x > 100.5)) {
      if (M.players.some((q) => q.team !== p.team && up(q) && dist(q, p) < 2)) { banner('Scrum de 5', '', 1.2); return startScrum(other(p.team), p.team === 0 ? 5 : 95, p.y); }
    }
    if (p.y < 0 || p.y > 70) {
      banner('TOUCH', `Line para ${M.teams[other(p.team)].short}`, 1.3); sfx('whistle');
      return startLineout(other(p.team), p.x, p.y < 0 ? 0 : 1);
    }
    if (p.team === 0) M.stats.metres += Math.max(0, p.vx * dt);
  } else if (b.mode === 'pass') {
    b.t += dt / b.T;
    const t = Math.min(1, b.t);
    b.x = b.fx + (b.tx - b.fx) * t; b.y = b.fy + (b.ty - b.fy) * t; b.z = 1 + Math.sin(t * Math.PI) * b.h;
    if (!b.intercepted && t > 0.3 && t < 0.8) {
      for (const q of M.players) {
        if (q.team === b.team || !up(q)) continue;
        if (Math.hypot(q.x - b.x, q.y - b.y) < 0.8) {
          b.intercepted = true;
          if (Math.random() < 0.3) { banner('¡INTERCEPCIÓN!', q.name, 1.4); say(`¡Intercepción de ${q.name}!`); sfx(q.team === 0 ? 'done' : 'miss'); giveBall(q); return; }
        }
      }
    }
    if (t >= 1) {
      const r = b.target;
      if (r && up(r) && Math.hypot(r.x - b.x, r.y - b.y) < 1.9) {
        const ko = r.team === 0 ? Math.max(0.005, 0.025 - statLvl('dis') * 0.001) : M.df.ko;
        if (Math.random() < ko + (b.offload ? 0.04 : 0)) { knockOn(r); return; }
        giveBall(r);
      } else { b.mode = 'loose'; b.vx = (b.tx - b.fx) * 0.15; b.vy = (b.ty - b.fy) * 0.15; b.z = 0.3; b.looseT = 0; }
    }
  } else if (b.mode === 'air') {
    b.t += dt / b.T;
    const t = Math.min(1, b.t);
    const px = b.x;
    b.x = b.fx + (b.tx - b.fx) * t; b.y = b.fy + (b.ty - b.fy) * t; b.z = 4 * b.h * t * (1 - t);
    // drop: la pelota pasa entre los palos por arriba del travesaño
    const goalX = b.team === 0 ? 100 : 0;
    if (!b.grubber && ((px < goalX && b.x >= goalX) || (px > goalX && b.x <= goalX)) && b.y > 32.2 && b.y < 37.8 && b.z > 3) {
      M.teams[b.team].score += 3;
      banner('¡DROP!', `${M.teams[b.team].short} +3`, 1.8);
      say(`¡Drop de ${M.teams[b.team].short}! Tres puntos.`);
      sfx(b.team === 0 ? 'aura' : 'lose');
      if (b.team === 0) M.crowd = 1;
      M.phase = 'wait'; M.pt = 1.6; const tm = b.team; M.next = () => setKickoff(other(tm));
      b.mode = 'dead';
      return;
    }
    if (t > 0.8) {
      const cands = M.players.filter((q) => up(q) && Math.hypot(q.x - b.x, q.y - b.y) < 1.7 && b.z < 3).sort((a, c) => (a.team === b.team ? 1 : 0) - (c.team === b.team ? 1 : 0));
      if (cands.length && b.y > 0 && b.y < 70) {
        const q = cands[0];
        if (Math.random() < (q.team === 0 ? 0.08 : 0.1)) { knockOn(q); return; }
        if ((q.team === 0 && b.x >= 100) || (q.team === 1 && b.x <= 0)) { q.x = b.x; q.y = b.y; return scoreTry(q); }
        giveBall(q);
        if (q.team === 0) float(q, '¡LA AGARRÓ!', '#06d6a0');
        say(`${q.name} recibe la patada.`);
        return;
      }
    }
    if (t >= 1) land();
  } else if (b.mode === 'loose') {
    b.looseT = (b.looseT || 0) + dt;
    b.x += (b.vx || 0) * dt; b.y += (b.vy || 0) * dt;
    b.vx = (b.vx || 0) * 0.96; b.vy = (b.vy || 0) * 0.96;
    b.z = Math.abs(Math.sin(b.looseT * 8)) * Math.max(0, 0.5 - b.looseT * 0.2);
    if (b.y < 0 || b.y > 70) { banner('TOUCH', '', 1.2); sfx('whistle'); return startLineout(other(b.team ?? 0), b.x, b.y < 0 ? 0 : 1); }
    if (b.x > 110 || b.x < -10) return restart22(b.x > 110 ? 1 : 0);
    if (b.looseT > 7) { banner('Pelota trabada', 'Scrum', 1.2); return startScrum(other(b.team ?? 0), b.x, b.y); }
    for (const q of M.players) {
      if (up(q) && Math.hypot(q.x - b.x, q.y - b.y) < 1.0) {
        if ((q.team === 0 && b.x >= 100) || (q.team === 1 && b.x <= 0)) { q.x = b.x; q.y = b.y; return scoreTry(q); }
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
    say('La pelota sale al touch.');
    return startLineout(other(b.team), clamp(b.tx, 6, 94), b.ty < 0 ? 0 : 1);
  }
  if (b.tx > 110 || b.tx < -10) { banner('Pelota muerta', 'Saque de 22', 1.3); return restart22(b.tx > 100 ? 1 : 0); }
  b.mode = 'loose'; b.x = b.tx; b.y = b.ty; b.z = 0.4; b.looseT = 0;
  const roll = b.grubber ? 0.35 : 0.08;
  b.vx = (b.tx - b.fx) * roll; b.vy = rand(-2, 2);
}

// ---------------------------------------------------------------
//  BUCLE
// ---------------------------------------------------------------
function update(dt) {
  M.t += dt;
  if (M.msgT > 0) M.msgT -= dt;
  if (M.hintT > 0) M.hintT -= dt;
  if (M.crowd > 0) M.crowd -= dt;
  for (const l of M.log) l.t += dt;
  M.log = M.log.filter((l) => l.t < 5);
  if (['play', 'tackle', 'ruck', 'kickoff'].includes(M.phase) && !M.aim) M.clock += dt * (2400 / M.halfReal);

  switch (M.phase) {
    case 'kickoff':
      M.pt -= dt;
      if (M.pt < 0.5) { const k = P(M.kickTeam, 9); k.vx = D(M.kickTeam) * 4; k.frame = Math.floor(M.t * 10) % 3; }
      if (M.pt <= 0) {
        const t = M.kickTeam;
        const k = P(t, 9);
        const tx = 50 + D(t) * rand(14, 22), ty = rand(12, 58);
        launchAir(k.x, k.y, tx, ty, 2.1, 13, t);
        sfx('kick'); sfx('whistle');
        say(`Patada inicial de ${M.teams[t].short}.`);
        M.phase = 'play';
        switchCtrl();
      }
      break;
    case 'play':
      if (M.ctrl && !up(M.ctrl) && M.ctrl.state !== 'dive' && !(M.ball.owner && M.ball.owner.team === 0)) switchCtrl();
      if (!M.attacking) {
        M.swT = (M.swT || 0) + dt;
        if (M.swT > 0.9) {
          M.swT = 0;
          const target = M.ball.owner || M.ball;
          const best = teamOf(0).filter(up).sort((a, b) => dist(a, target) - dist(b, target))[0];
          if (best && M.ctrl && dist(M.ctrl, target) - dist(best, target) > 3.5) M.ctrl = best;
        }
      }
      if (M.passHold) M.passHold.t += dt;
      if (M.aim) {
        const c = M.ctrl;
        if (!c || M.ball.owner !== c) { M.aim = null; M.input.kick = false; }
        else {
          let ix = M.input.x, iy = M.input.y;
          const kk = M.keys;
          if (kk.arrowleft || kk.a) ix = -1; if (kk.arrowright || kk.d) ix = 1;
          if (kk.arrowup || kk.w) iy = -1; if (kk.arrowdown || kk.s) iy = 1;
          M.aim.x += ix * 32 * dt; M.aim.y += iy * 28 * dt;
          const d0 = D(0);
          if ((M.aim.x - c.x) * d0 < 5) M.aim.x = c.x + d0 * 5;
          if ((M.aim.x - c.x) * d0 > 55) M.aim.x = c.x + d0 * 55;
          M.aim.y = clamp(M.aim.y, -6, 76);
          M.aim.t += dt;
        }
      }
      break;
    case 'tackle': M.pt -= dt; if (M.pt <= 0 && M.ruck) startRuck(); break;
    case 'ruck': M.pt -= dt; if (M.pt <= 0 && M.ruck) endRuck(); break;
    case 'scrum': updateScrum(dt); break;
    case 'lineout': updateLineout(dt); break;
    case 'maul': updateMaul(dt); break;
    case 'penalty':
      if (M.penAI) {
        M.pt -= dt;
        if (M.pt <= 0) {
          const { x, y, toPosts } = M.penAI; M.penAI = null;
          if (toPosts < 40) startGoalKick(1, x, y, 3);
          else if (toPosts > 60) { setForm(1, x, y, true); M.phase = 'play'; const n = P(1, 9); n.x = x; n.y = y; giveBall(n); kickTouch(n); }
          else { setForm(1, x, y, true); M.phase = 'play'; const n = P(1, 8); n.x = x + 1; n.y = y; giveBall(n); n.hold = 0.4; }
        }
      }
      break;
    case 'aikick': M.pt -= dt; M.aik.t += dt; if (M.pt <= 0) afterGoalKick(1, M.aik.ok, M.aik.pts); break;
    case 'gk': updateGK(dt); break;
    case 'try':
      M.pt -= dt;
      if (M.pt <= 0) {
        const ta = M.tryAt;
        const back = clamp(12 + Math.abs(ta.y - 35) * 0.25, 12, 25);
        startGoalKick(ta.team, ta.team === 0 ? 100 - back : back, ta.y, 2);
      }
      break;
    case 'wait': M.pt -= dt; if (M.pt <= 0) { const n = M.next; M.next = null; n?.(); } break;
    case 'half': M.pt -= dt; if (M.pt <= 0) { M.half = 2; setKickoff(0); banner('Segundo tiempo', '', 1.5); say('¡Arranca el segundo tiempo!'); } break;
    default: break;
  }

  const frozen = M.phase === 'play' && M.aim; // tiempo congelado para patear tranquilo
  if (!frozen && ['play', 'kickoff', 'tackle', 'ruck', 'scrum', 'lineout', 'maul', 'try'].includes(M.phase)) {
    updatePlayers(dt);
    if (M.phase === 'play') updateBall(dt);
  }

  // fin de cada tiempo (en una pausa natural o a los 2' de cumplido)
  const ballHeld = M.ball.mode === 'held';
  if (M.half === 1 && M.phase === 'play' && ((M.clock >= 2400 && ballHeld) || M.clock >= 2520)) {
    M.phase = 'half'; M.pt = 3; sfx('whistle');
    banner('MEDIO TIEMPO', `${M.teams[0].short} ${M.teams[0].score} - ${M.teams[1].score} ${M.teams[1].short}`, 3);
    say('Medio tiempo.');
  }
  if (M.half === 2 && M.phase === 'play' && ((M.clock >= 4800 && ballHeld) || M.clock >= 4920)) {
    M.phase = 'end'; sfx('whistle');
    endScreen();
  }

  const b = M.ball;
  let fx = b.owner ? b.owner.x + D(b.owner.team) * 5 : b.x;
  let fy = b.owner ? b.owner.y : b.y;
  if (M.phase === 'lineout' && M.set) { fx = M.set.x; fy = M.set.sy + M.set.inw * 8; }
  if (M.aim && M.ctrl) { fx = (M.ctrl.x + M.aim.x) / 2; fy = (M.ctrl.y + M.aim.y) / 2; }
  M.cam.x += (fx - M.cam.x) * Math.min(1, dt * 3);
  M.cam.y += (fy - M.cam.y) * Math.min(1, dt * 3);
}

function updateGK(dt) {
  const g = M.gk;
  g.t += dt;
  if (g.step === 'aim') {
    let ix = M.input.x;
    if (M.keys.arrowleft || M.keys.a) ix = -1; if (M.keys.arrowright || M.keys.d) ix = 1;
    if (Math.abs(ix) > 0.1) { g.manual = true; g.aim = clamp(g.aim + ix * dt * 0.7, -0.7, 0.7); }
    else if (!g.manual) g.aim = Math.sin(g.t * 1.8) * 0.6;
  }
  if (g.step === 'power') g.pow = (Math.sin(g.t * 3.2 - Math.PI / 2) + 1) / 2;
  if (g.step === 'run' && g.t > 0.7) { g.step = 'fly'; g.t = 0; sfx('kick'); }
  if (g.step === 'fly' && g.t > 1.25 && !g.done) {
    g.done = true;
    if (g.ok) { sfx('done'); M.crowd = 1.4; } else sfx('miss');
  }
  if (g.step === 'fly' && g.t > 2.1) { const { pts, ok } = g; M.gk = null; afterGoalKick(0, ok, pts); }
}

// ---------------------------------------------------------------
//  DIBUJO
// ---------------------------------------------------------------
function proj(x, y, z = 0) {
  return [(x - M.cam.x) * M.S + M.w / 2, (y - M.cam.y) * M.S * K + M.h / 2 - z * M.S];
}

function drawField(ctx) {
  const { w, h, S, dpr } = M;
  ctx.fillStyle = '#2f6b3a'; ctx.fillRect(0, 0, w, h);
  const [, y0] = proj(0, 0), [, y1] = proj(0, 70);
  for (let x = -10; x < 110; x += 5) {
    const [a] = proj(x, 0), [bx] = proj(x + 5, 0);
    if (bx < 0 || a > w) continue;
    ctx.fillStyle = x < 0 || x >= 100 ? '#3f8f4a' : (Math.floor(x / 5) % 2 ? '#4caf50' : '#46a64b');
    ctx.fillRect(a, y0, bx - a + 1, y1 - y0);
  }
  const [mx, my] = proj(50, 35);
  if (mx > -200 && mx < w + 200) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.ellipse(mx, my, 6 * S, 6 * S * K, 0, 0, Math.PI * 2); ctx.fill();
    ctx.font = `bold ${Math.round(5 * S * K)}px Georgia, serif`; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillText('U', mx, my + 1.8 * S * K);
  }
  const [, top] = proj(0, -3);
  if (top > 0) {
    ctx.fillStyle = '#4a4f63'; ctx.fillRect(0, 0, w, top);
    const jump = M.crowd > 0 ? Math.abs(Math.sin(M.t * 18)) * 3 * dpr : 0;
    const off = (-M.cam.x * S * 0.5) % (6 * dpr);
    for (let i = off; i < w; i += 6 * dpr) {
      for (let r = 2 * dpr; r < top - 4; r += 7 * dpr) {
        const k = Math.abs(Math.floor((i - off) / (6 * dpr)) * 7 + Math.floor(r / (7 * dpr)) + Math.floor(M.cam.x * 0.5)) % 6;
        ctx.fillStyle = ['#e53935', '#ffffff', '#ffd166', '#e53935', '#adb5bd', '#ffffff'][k];
        ctx.fillRect(i + ((Math.floor(r / (7 * dpr))) % 2) * 3, r - (k % 2 ? jump : 0), 3 * dpr, 3 * dpr);
      }
    }
    ctx.fillStyle = '#e53935'; ctx.fillRect(0, top - 6 * dpr, w, 6 * dpr);
  }
  const [, bot] = proj(0, 72);
  if (bot < h) {
    ctx.fillStyle = '#e53935'; ctx.fillRect(0, bot, w, h - bot);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${11 * dpr}px "Press Start 2P", monospace`; ctx.textAlign = 'left';
    const off = ((-M.cam.x * S) % (320 * dpr)) - 320 * dpr;
    for (let x = off; x < w; x += 320 * dpr) ctx.fillText('TODO ROJO Y BLANCO · 1907', x, bot + 20 * dpr);
  }
  const line = (x, dash) => {
    const [a, ya] = proj(x, 0), [, yb] = proj(x, 70);
    if (a < -10 || a > w + 10) return;
    ctx.fillStyle = '#ffffffdd';
    if (!dash) ctx.fillRect(a - dpr, ya, 2 * dpr, yb - ya);
    else for (let y = ya; y < yb; y += 12 * dpr) ctx.fillRect(a - dpr, y, 2 * dpr, 6 * dpr);
  };
  [-10, 0, 22, 50, 78, 100, 110].forEach((x) => line(x, false));
  [5, 40, 60, 95].forEach((x) => line(x, true));
  for (const yy of [0, 70]) { const [x0, ya] = proj(-10, yy), [x1] = proj(110, yy); ctx.fillStyle = '#fff'; ctx.fillRect(x0, ya - dpr, x1 - x0, 2 * dpr); }
  for (const yy of [5, 15, 55, 65]) {
    for (let x = 0; x <= 100; x += 5) {
      const [a, bb] = proj(x, yy);
      if (a < -5 || a > w + 5) continue;
      ctx.fillStyle = '#ffffffaa'; ctx.fillRect(a - 3 * dpr, bb, 6 * dpr, 2 * dpr);
    }
  }
  ctx.font = `${8 * dpr}px "Press Start 2P", monospace`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff99';
  for (const [x, t] of [[22, '22'], [40, '10'], [50, '50'], [60, '10'], [78, '22']]) { const [a, bb] = proj(x, 12); if (a > 0 && a < w) ctx.fillText(t, a, bb); }
}

function drawPosts(ctx, x) {
  const S = M.S, dpr = M.dpr;
  for (const y of [32.2, 37.8]) {
    const [a, bb] = proj(x, y);
    const [, t] = proj(x, y, 11);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(a - 2 * dpr, t, 4 * dpr, bb - t);
    ctx.fillStyle = '#e53935'; ctx.fillRect(a - 4 * dpr, bb - 1.8 * S, 8 * dpr, 1.8 * S);
  }
  const [a1, c1] = proj(x, 32.2, 3), [a2, c2] = proj(x, 37.8, 3);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4 * dpr;
  ctx.beginPath(); ctx.moveTo(a1, c1); ctx.lineTo(a2, c2); ctx.stroke();
}

function drawPlayer(ctx, p) {
  const sc = M.S * 0.14;
  const [sx, sy] = proj(p.x, p.y);
  if (sx < -60 || sx > M.w + 60 || sy < -90 || sy > M.h + 60) return;
  const w = 16 * sc, h = 22 * sc;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(sx, sy, 7 * sc, 2.5 * sc, 0, 0, Math.PI * 2); ctx.fill();
  const sideDir = D(p.team) > 0 ? 'right' : 'left';
  let lift = 0;
  if (M.phase === 'lineout' && M.set && M.set.step !== 'call') {
    const z = M.set.jumpZone || M.set.zone;
    const ji = ZONE_IDX[z];
    if (p.idx === ji && (p.team === M.set.team || M.set.oppZone === z)) lift = Math.min(1, Math.abs(Math.sin(M.set.t * 2.4)) + (M.set.step !== 'throw' ? 0.6 : 0)) * 2.2 * M.S;
  }
  const binding = p.state === 'scrum' || p.state === 'bind';
  const sdir = binding ? (p.dir === 'left' || p.dir === 'right' ? p.dir : sideDir) : p.dir;
  const spr = playerSprite(p.look, sdir, up(p) ? p.frame : 0);
  ctx.save();
  ctx.translate(sx, sy);
  if (p.state === 'down') { ctx.rotate(D(p.team) > 0 ? -Math.PI / 2 : Math.PI / 2); ctx.drawImage(spr, -w / 2, -h + 6 * sc, w, h); }
  else if (p.state === 'fall') { ctx.rotate((D(p.team) > 0 ? -1 : 1) * (1 - Math.max(0, p.t) / 0.45) * Math.PI / 2); ctx.drawImage(spr, -w / 2, -h, w, h); }
  else if (p.state === 'dive') { ctx.rotate((p.vx >= 0 ? 1 : -1) * Math.PI / 2.6); ctx.drawImage(spr, -w / 2, -h, w, h); }
  else if (binding) { ctx.rotate((sdir === 'right' ? 1 : -1) * 0.75); ctx.drawImage(spr, -w / 2, -h * 0.8, w, h * 0.8); }
  else {
    const squash = p.passAnim > 0 || p.kickAnim > 0 ? 0.95 : 1;
    ctx.drawImage(spr, -w / 2, -h * squash - lift, w, h * squash);
  }
  ctx.restore();
  if (p === M.ctrl) {
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.moveTo(sx, sy - h - 4 * sc - lift); ctx.lineTo(sx - 4 * sc, sy - h - 10 * sc - lift); ctx.lineTo(sx + 4 * sc, sy - h - 10 * sc - lift); ctx.fill();
    txt(ctx, `${p.num} ${p.name}`, sx, sy - h - 12 * sc, 7, '#fff');
    ctx.fillStyle = '#0008'; ctx.fillRect(sx - 6 * sc, sy + 3 * sc, 12 * sc, 1.6 * sc);
    ctx.fillStyle = p.stamina > 0.3 ? '#06d6a0' : '#ef476f'; ctx.fillRect(sx - 6 * sc, sy + 3 * sc, 12 * sc * p.stamina, 1.6 * sc);
  } else if (M.ball.owner === p) {
    txt(ctx, p.name, sx, sy - h - 3 * sc, 6, p.team === 0 ? '#ffd6d6' : '#cfe1ff');
  }
}

function drawBall(ctx) {
  const b = M.ball;
  const [gx, gy] = proj(b.x, b.y);
  const [sx, sy] = proj(b.x, b.y, b.z);
  const sc = M.S * 0.15;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(gx, gy, 3 * sc, 1.2 * sc, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(b.mode === 'held' || b.mode === 'dead' ? 0.3 : M.t * 8);
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

function drawRadar(ctx) {
  const { dpr } = M;
  const rw = 120 * dpr, rh = 70 * dpr, rx = 10 * dpr, ry = 8 * dpr;
  ctx.fillStyle = 'rgba(14,16,30,0.75)'; ctx.fillRect(rx - 3 * dpr, ry - 3 * dpr, rw + 6 * dpr, rh + 6 * dpr);
  ctx.fillStyle = '#2e7d32'; ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = '#ffffff55';
  for (const x of [0, 22, 50, 78, 100]) ctx.fillRect(rx + ((x + 10) / 120) * rw, ry, dpr, rh);
  for (const p of M.players) {
    ctx.fillStyle = p === M.ctrl ? '#ffd166' : p.team === 0 ? '#ff5a5f' : M.teams[1].col;
    ctx.fillRect(rx + ((p.x + 10) / 120) * rw - 1.5 * dpr, ry + (clamp(p.y, 0, 70) / 70) * rh - 1.5 * dpr, 3 * dpr, 3 * dpr);
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(rx + ((M.ball.x + 10) / 120) * rw - 2 * dpr, ry + (clamp(M.ball.y, 0, 70) / 70) * rh - 2 * dpr, 4 * dpr, 4 * dpr);
}

function drawHUD(ctx) {
  const { w, h, dpr } = M;
  const t0 = M.teams[0], t1 = M.teams[1];
  const min = Math.min(80, Math.floor(M.clock / 60));
  const bw = 300 * dpr, bx = (w - bw) / 2;
  ctx.fillStyle = 'rgba(14,16,30,0.9)'; ctx.fillRect(bx, 6 * dpr, bw, 30 * dpr);
  ctx.fillStyle = t0.col; ctx.fillRect(bx, 6 * dpr, 8 * dpr, 30 * dpr);
  ctx.fillStyle = t1.col; ctx.fillRect(bx + bw - 8 * dpr, 6 * dpr, 8 * dpr, 30 * dpr);
  txt(ctx, `${t0.short} ${t0.score}`, bx + 16 * dpr, 27 * dpr, 10, '#fff', 'left');
  txt(ctx, `${t1.score} ${t1.short}`, bx + bw - 16 * dpr, 27 * dpr, 10, '#fff', 'right');
  txt(ctx, `${min}'`, w / 2, 27 * dpr, 10, '#ffd166');
  if (M.phase !== 'gk') drawRadar(ctx);
  if (M.msgT > 0 && M.msg) {
    ctx.globalAlpha = Math.min(1, M.msgT * 2);
    txt(ctx, M.msg, w / 2, h * 0.3, 22, '#ffd166');
    if (M.sub) txt(ctx, M.sub, w / 2, h * 0.3 + 26 * dpr, 9, '#fff');
    ctx.globalAlpha = 1;
  }
  if (M.hintT > 0) txt(ctx, M.hint, w / 2, h * 0.2, 9, '#4cc9f0');
  M.log.forEach((l, i) => {
    ctx.globalAlpha = Math.max(0, Math.min(1, 5 - l.t));
    ctx.font = `${12 * dpr}px system-ui, sans-serif`; ctx.textAlign = 'center';
    const y = h - (14 + (M.log.length - 1 - i) * 17) * dpr;
    const tw = ctx.measureText(l.text).width + 16 * dpr;
    ctx.fillStyle = 'rgba(14,16,30,0.7)'; ctx.fillRect(w / 2 - tw / 2, y - 13 * dpr, tw, 17 * dpr);
    ctx.fillStyle = '#fff'; ctx.fillText(l.text, w / 2, y);
    ctx.globalAlpha = 1;
  });
  if (M.aim && M.ctrl) {
    const a = M.aim, c = M.ctrl;
    const dk = Math.hypot(a.x - c.x, a.y - c.y);
    const [ax, ay] = proj(a.x, a.y);
    const r = (1.5 + dk * 0.05) * M.S;
    ctx.strokeStyle = dk < 15 ? '#4cc9f0' : '#ffd166'; ctx.lineWidth = 3 * dpr;
    ctx.beginPath(); ctx.ellipse(ax, ay, r, r * K, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax - r * 0.5, ay); ctx.lineTo(ax + r * 0.5, ay); ctx.moveTo(ax, ay - r * 0.5 * K); ctx.lineTo(ax, ay + r * 0.5 * K); ctx.stroke();
    // trayectoria
    ctx.setLineDash([4 * dpr, 6 * dpr]);
    ctx.beginPath();
    const h = dk < 15 ? 0.6 : 3 + dk * 0.22;
    for (let i = 0; i <= 20; i++) { const t = i / 20; const [x, y] = proj(c.x + (a.x - c.x) * t, c.y + (a.y - c.y) * t, 4 * h * t * (1 - t)); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
    const toPosts = 100 - a.x;
    const label = dk < 15 ? 'GRUBBER' : (toPosts < 3 && toPosts > -3 && Math.abs(a.y - 35) < 5) ? 'DROP' : a.y < 0 || a.y > 70 ? 'AL TOUCH' : dk > 35 ? 'PATADA LARGA' : 'CHIP';
    txt(ctx, `${label} · ${Math.round(dk)} m`, ax, ay - r * K - 8 * dpr, 8, '#fff');
    txt(ctx, '⏸ Tiempo congelado · apuntá con el joystick y soltá PATADA', w / 2, h * 0 + M.h * 0.62, 8, '#ffd166');
  }
  if (M.passHold && M.passHold.t > 0.28) txt(ctx, 'PASE LARGO', w / 2, M.h * 0.62, 9, '#4cc9f0');
  for (const f of M.fx) {
    f.t += 1 / 60;
    const [sx, sy] = proj(f.x, f.y);
    ctx.globalAlpha = Math.max(0, 1 - f.t);
    txt(ctx, f.text, sx, sy - 55 * dpr - f.t * 30 * dpr, 9, f.col);
    ctx.globalAlpha = 1;
  }
  M.fx = M.fx.filter((f) => f.t < 1);
  if ((M.phase === 'scrum' && M.set?.step === 'push') || (M.phase === 'maul' && M.set)) {
    const x = w / 2 - 120 * dpr, y = h * 0.4;
    const v = M.phase === 'maul' ? clamp((M.set.prog + 0.6) / 2.8, 0, 1) : M.set.bar;
    ctx.fillStyle = '#222'; ctx.fillRect(x, y, 240 * dpr, 16 * dpr);
    ctx.fillStyle = '#e53935'; ctx.fillRect(x, y, 240 * dpr * v, 16 * dpr);
    if (M.phase === 'scrum') { ctx.fillStyle = '#fff'; ctx.fillRect(x + 240 * dpr * (M.set.feed === 0 ? 0.4 : 0.6), y - 4 * dpr, 2 * dpr, 24 * dpr); }
  }
  if (M.phase === 'lineout' && M.set && M.set.step === 'fly') {
    const s = M.set;
    const jumper = P(s.win, ZONE_IDX[s.jumpZone] ?? 4);
    const [ax, ay] = proj(s.x, s.sy, 1.8);
    const [bx2, by2] = proj(jumper.x, jumper.y, 4.2);
    const t = Math.min(1, s.t / 0.9);
    const x = ax + (bx2 - ax) * t, y = ay + (by2 - ay) * t - Math.sin(t * Math.PI) * 30 * dpr;
    ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(x, y, 5 * dpr, 3.5 * dpr, t * 6, 0, Math.PI * 2); ctx.fill();
  }
  if (M.phase === 'aikick' && M.aik) {
    const a = M.aik, t = Math.min(1, a.t / 1.4);
    const [px, py] = proj(a.x, a.y);
    const [gx, gy] = proj(0, a.ok ? 35 : 35 + (a.y > 35 ? 6 : -6), 6);
    const x = px + (gx - px) * t, y = py + (gy - py) * t - Math.sin(t * Math.PI) * 60 * dpr;
    ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(x, y, 5 * dpr, 3.5 * dpr, t * 8, 0, Math.PI * 2); ctx.fill();
  }
}

function drawGoalKick(ctx) {
  const g = M.gk;
  const { w, h, dpr } = M;
  const hz = h * 0.3; // horizonte
  // cielo y tribuna
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#5fa8d3'); sky.addColorStop(1, '#bde0fe');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, hz);
  ctx.fillStyle = '#4a4f63'; ctx.fillRect(0, hz - h * 0.12, w, h * 0.12);
  const jump = M.crowd > 0 ? Math.abs(Math.sin(M.t * 18)) * 3 * dpr : 0;
  for (let i = 0; i < w; i += 6 * dpr) for (let r = 0; r < 3; r++) {
    const k = (Math.floor(i / (6 * dpr)) * 3 + r) % 5;
    ctx.fillStyle = ['#e53935', '#fff', '#ffd166', '#e53935', '#adb5bd'][k];
    ctx.fillRect(i, hz - h * 0.11 + r * 9 * dpr - (k % 2 ? jump : 0), 4 * dpr, 4 * dpr);
  }
  ctx.fillStyle = '#e53935'; ctx.fillRect(0, hz - 5 * dpr, w, 5 * dpr);
  // pasto en perspectiva
  const vx = w / 2 + g.spot * w * 0.08; // punto de fuga
  for (let i = 0; i < 12; i++) {
    const t0 = i / 12, t1 = (i + 1) / 12;
    const y0 = hz + (h - hz) * Math.pow(t0, 1.8), y1 = hz + (h - hz) * Math.pow(t1, 1.8);
    ctx.fillStyle = i % 2 ? '#4caf50' : '#43a047'; ctx.fillRect(0, y0, w, y1 - y0 + 1);
  }
  ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 2 * dpr;
  for (const off of [-1.2, -0.45, 0.45, 1.2]) { ctx.beginPath(); ctx.moveTo(vx, hz); ctx.lineTo(vx + off * w, h); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, hz + 2 * dpr); ctx.lineTo(w, hz + 2 * dpr); ctx.stroke();
  // palos (más chicos cuanto más lejos)
  const sc = clamp(22 / g.dist, 0.45, 1.3);
  const pw = w * 0.16 * sc, ph = h * 0.5 * sc, base = hz + 4 * dpr, cx = vx;
  const cross = base - ph * 0.3;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - pw / 2 - 2 * dpr, base - ph, 4 * dpr, ph);
  ctx.fillRect(cx + pw / 2 - 2 * dpr, base - ph, 4 * dpr, ph);
  ctx.fillRect(cx - pw / 2, cross, pw, 4 * dpr);
  ctx.fillStyle = '#e53935';
  ctx.fillRect(cx - pw / 2 - 4 * dpr, base - 14 * dpr * sc, 8 * dpr, 14 * dpr * sc);
  ctx.fillRect(cx + pw / 2 - 4 * dpr, base - 14 * dpr * sc, 8 * dpr, 14 * dpr * sc);
  // jueces de línea con banderas
  const flagUp = g.step === 'fly' && g.t > 1.25 && g.ok;
  for (const sx of [cx - pw / 2 - 16 * dpr, cx + pw / 2 + 16 * dpr]) {
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(sx - 3 * dpr, base - 18 * dpr, 6 * dpr, 14 * dpr);
    ctx.fillStyle = '#f4cdb0'; ctx.fillRect(sx - 3 * dpr, base - 24 * dpr, 6 * dpr, 6 * dpr);
    ctx.fillStyle = '#adb5bd'; ctx.fillRect(sx + 3 * dpr, base - (flagUp ? 38 : 14) * dpr, 2 * dpr, flagUp ? 22 * dpr : 12 * dpr);
    ctx.fillStyle = '#ffd60a'; ctx.fillRect(sx + 5 * dpr, base - (flagUp ? 38 : 14) * dpr, 9 * dpr, 6 * dpr);
  }
  txt(ctx, `${g.pts === 2 ? 'CONVERSIÓN' : 'PENAL'} · ${g.dist} m`, w / 2, 56 * dpr, 10, '#fff');
  // viento
  const wx = w - 90 * dpr, wy = 60 * dpr;
  ctx.fillStyle = 'rgba(14,16,30,0.8)'; ctx.fillRect(wx - 50 * dpr, wy - 22 * dpr, 100 * dpr, 34 * dpr);
  txt(ctx, 'VIENTO', wx, wy - 8 * dpr, 7, '#adb5bd');
  txt(ctx, `${g.wind < 0 ? '◀' : g.wind > 0 ? '▶' : '·'} ${Math.abs(g.wind).toFixed(1)}`, wx, wy + 8 * dpr, 9, '#4cc9f0');
  // tee, pelota y pateador
  const bx = w / 2, by = h * 0.86;
  const ksc = h / 22 / 4.2;
  let kx = bx - 26 * ksc, ky = by + 2 * ksc;
  if (g.step === 'run') { const t = Math.min(1, g.t / 0.7); kx = bx - 26 * ksc + t * 18 * ksc; ky = by + 2 * ksc - t * 3 * ksc; }
  if (g.step === 'fly') { kx = bx - 8 * ksc; ky = by - 1 * ksc; }
  const frame = g.step === 'run' ? [1, 0, 2][Math.floor(g.t * 9) % 3] : 0;
  ctx.drawImage(playerSprite(look(), 'up', frame), kx - 8 * ksc, ky - 22 * ksc, 16 * ksc, 22 * ksc);
  ctx.fillStyle = '#ff6b35'; ctx.fillRect(bx - 6 * dpr, by + 4 * dpr, 12 * dpr, 5 * dpr);
  let ballX = bx, ballY = by - 2 * dpr, bs = 1, rot = 0.2;
  if (g.step === 'fly') {
    const t = Math.min(1, g.t / 1.25);
    const reach = g.short ? 0.8 : 1;
    const tt = Math.min(t, reach);
    // lateral con la curva del viento
    const aimX = cx + g.lockAim * w * 0.5 + g.spot * w * 0.12 * (1 - Math.abs(g.lockAim));
    const windX = g.wind * 0.12 * w * 0.5;
    ballX = bx + (aimX - bx) * tt + windX * tt * tt;
    const endY = cross - ph * 0.25;
    ballY = by + (endY - by) * tt - Math.sin(tt * Math.PI) * h * 0.12;
    if (g.short && t > reach) ballY += (t - reach) * h * 1.6;
    bs = 1 - tt * 0.78; rot = g.t * 14;
    g.trail.push([ballX, ballY, bs]);
    if (g.trail.length > 14) g.trail.shift();
    g.trail.forEach(([x, y, s2], i) => { ctx.globalAlpha = (i / g.trail.length) * 0.35; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 5 * dpr * s2, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
  }
  if (g.step !== 'fly' && g.step !== 'run') {
    // trayectoria prevista (con el viento)
    const a = g.step === 'aim' ? g.aim : g.lockAim;
    const aimX = cx + a * w * 0.5 + g.spot * w * 0.12 * (1 - Math.abs(a));
    const windX = g.wind * 0.12 * w * 0.5;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3 * dpr; ctx.setLineDash([6 * dpr, 6 * dpr]);
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) { const t = i / 20; const x = bx + (aimX - bx) * t + windX * t * t; const y = by + (cross - ph * 0.25 - by) * t - Math.sin(t * Math.PI) * h * 0.12; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.save(); ctx.translate(ballX, ballY); ctx.rotate(rot);
  ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(0, 0, 6 * dpr * bs, 9 * dpr * bs, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = dpr; ctx.stroke();
  ctx.restore();
  if (g.step === 'aim') txt(ctx, 'Apuntá con el joystick · tocá para confirmar', w / 2, h * 0.62, 9);
  if (g.step === 'power') {
    txt(ctx, 'Tocá para la POTENCIA', w / 2, h * 0.62, 10);
    const bw2 = w * 0.36, x = (w - bw2) / 2, y = h * 0.66;
    ctx.fillStyle = '#222'; ctx.fillRect(x, y, bw2, 14 * dpr);
    const grd = ctx.createLinearGradient(x, 0, x + bw2, 0);
    grd.addColorStop(0, '#ef476f'); grd.addColorStop(0.6, '#ffd166'); grd.addColorStop(1, '#06d6a0');
    ctx.fillStyle = grd; ctx.fillRect(x, y, bw2 * g.pow, 14 * dpr);
    const need = 0.45 + g.dist / 110 - Math.min(0.15, statLvl('fue') * 0.01);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + bw2 * need, y - 4 * dpr, 2 * dpr, 22 * dpr);
  }
  if (g.step === 'fly' && g.t > 1.25) txt(ctx, g.ok ? '¡ADENTRO!' : g.short ? 'Le faltó' : '¡AFUERA!', w / 2, h * 0.5, 20, g.ok ? '#06d6a0' : '#ef476f');
}

function draw() {
  const ctx = M.ctx;
  ctx.imageSmoothingEnabled = false;
  if (M.phase === 'gk' && M.gk) { drawGoalKick(ctx); drawHUD(ctx); return; }
  drawField(ctx);
  drawPosts(ctx, 0); drawPosts(ctx, 100);
  const list = [...M.players].sort((a, b) => a.y - b.y);
  let ballDrawn = false;
  for (const p of list) {
    if (!ballDrawn && M.ball.y < p.y && M.ball.owner !== p && M.ball.mode !== 'held') { drawBall(ctx); ballDrawn = true; }
    drawPlayer(ctx, p);
    if (M.ball.owner === p) { drawBall(ctx); ballDrawn = true; }
  }
  if (!ballDrawn) drawBall(ctx);
  if (M.crowd > 1) { ctx.fillStyle = `rgba(229,57,53,${(M.crowd - 1) * 0.25})`; ctx.fillRect(0, 0, M.w, M.h); }
  drawHUD(ctx);
}

function loop(ts) {
  if (!M || !M.alive) return;
  const dt = Math.min(0.05, (ts - (M.last || ts)) / 1000);
  M.last = ts;
  try { update(dt); draw(); } catch (e) { console.error(e); }
  if (M) requestAnimationFrame(loop);
}

// ---------------------------------------------------------------
//  FINAL
// ---------------------------------------------------------------
function endScreen() {
  const t0 = M.teams[0], t1 = M.teams[1];
  const win = t0.score > t1.score, tie = t0.score === t1.score;
  const st = M.stats;
  M.mash = null; setButtons();
  let mvp = 'Giuli', best = -1;
  for (const [n, s] of Object.entries(M.pstats)) { const v = s.tries * 5 + s.tackles * 1.5 + s.breaks * 2 + s.carries * 0.2; if (v > best) { best = v; mvp = n; } }
  const k = M.df.k;
  const reward = {
    xp: Math.round((80 + st.tries * 25 + st.tackles * 5 + (win ? 120 : tie ? 50 : 0)) * k),
    gold: Math.round((30 + st.tries * 15 + (win ? 80 : 20)) * k),
    aura: Math.round((win ? 1000 : tie ? 400 : 150) * k) + st.myTries * 1000 + st.tries * 200 + (mvp === 'Giuli' ? 500 : 0),
    stats: { fue: 4 + Math.min(10, st.tackles), res: 6, car: win ? 6 : 2, dis: 3 },
  };
  if (M.free) { reward.xp = 0; reward.gold = 0; reward.aura = 0; reward.stats = {}; }
  else {
    S.matches = (S.matches || 0) + 1;
    if (win) S.matchWins = (S.matchWins || 0) + 1;
    S.best.matchDiff = Math.max(S.best.matchDiff ?? -99, t0.score - t1.score);
    grant(reward, null, 'g', 'match');
  }
  panel(`
    <div class="mp-t">${win ? '🏆 ¡GANÓ LA U!' : tie ? '🤝 EMPATE' : 'Perdimos esta vez'}</div>
    <div class="mp-score">${t0.short} <b>${t0.score}</b> - <b>${t1.score}</b> ${t1.short}</div>
    <div class="mp-s">⭐ Figura del partido: <b>${mvp}</b></div>
    <div class="mp-s">Tries ${st.tries} (tuyos ${st.myTries}) · Tackles ${st.tackles} · Pases ${st.passes} · Rupturas ${st.breaks} · Offloads ${st.offloads} · Robos ${st.steals} · ${Math.round(st.metres)} m</div>
    <div class="mp-rew">${M.free ? 'Amistoso libre: sin premios' : `+${fmt(reward.xp)} XP · +${fmt(reward.gold)} oro · +${fmt(reward.aura)} aura`}</div>
    <div class="mp-row"><button class="btn good" id="mend">Volver al club</button></div>`, () => { $('mend').onclick = () => finish(false); });
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
