// =============================================================
//  MUNDO ABIERTO 2D: el barrio de Giuli
// =============================================================
import { makeCanvas, playerSprite, monsterSprite, dogSprite } from './pixel.js';
import { MONSTERS, ZONES, COACH_TIPS, DOG_LINES } from './data.js';
import { S, look, level, save } from './state.js';
import { mulberry32, pick, clamp, dayKey } from './util.js';
import { sfx } from './audio.js';

export const T = 16; // tamaño de tile
export const MW = 64, MH = 48;

// Tiles
const G = 0, ROAD = 1, WALK = 2, TREE = 3, WALL = 4, ROOF = 5, DOOR = 6, WATER = 7, PITCH = 8, LINE = 9, POST = 10, PATH = 11, FENCE = 12, FLOWER = 13, BENCH = 14, BUSH = 15, FLOOR = 16, SAND = 17;
const SOLID = new Set([TREE, WALL, ROOF, WATER, POST, FENCE, BENCH, BUSH]);

let map, zoneMap, mapCanvas, doors = [], signs = [];

function build() {
  map = Array.from({ length: MH }, () => new Array(MW).fill(G));
  zoneMap = Array.from({ length: MH }, () => new Array(MW).fill('barrio'));
  doors = []; signs = [];
  const fill = (x0, y0, w, h, t) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (map[y] && x >= 0 && x < MW) map[y][x] = t; };
  const zone = (x0, y0, w, h, z) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (zoneMap[y] && x >= 0 && x < MW) zoneMap[y][x] = z; };
  const rect = (x0, y0, w, h, t) => {
    for (let x = x0; x < x0 + w; x++) { map[y0][x] = t; map[y0 + h - 1][x] = t; }
    for (let y = y0; y < y0 + h; y++) { map[y][x0] = t; map[y][x0 + w - 1] = t; }
  };
  const building = (x0, y0, w, h, id, label, roof) => {
    fill(x0, y0, w, h - 2, ROOF);
    fill(x0, y0 + h - 2, w, 2, WALL);
    const dx = x0 + Math.floor(w / 2);
    map[y0 + h - 1][dx] = DOOR;
    doors.push({ x: dx, y: y0 + h - 1, id });
    signs.push({ x: x0 + w / 2, y: y0 + h - 2.2, text: label, roof, bx: x0, by: y0, bw: w, bh: h });
  };

  // Calles principales
  fill(0, 21, MW, 3, ROAD); fill(0, 20, MW, 1, WALK); fill(0, 24, MW, 1, WALK);
  fill(29, 0, 3, MH, ROAD); fill(28, 0, 1, MH, WALK); fill(32, 0, 1, MH, WALK);
  // Borde de árboles
  for (let x = 0; x < MW; x++) { map[0][x] = TREE; map[MH - 1][x] = TREE; }
  for (let y = 0; y < MH; y++) { map[y][0] = TREE; map[y][MW - 1] = TREE; }
  // salidas de calle cerradas por arbustos
  for (const y of [21, 22, 23]) { map[y][0] = BUSH; map[y][MW - 1] = BUSH; }
  for (const x of [29, 30, 31]) { map[0][x] = BUSH; map[MH - 1][x] = BUSH; }

  // ---- CASA DE GIULI (arriba a la izquierda)
  zone(1, 1, 15, 19, 'casa');
  rect(2, 3, 13, 15, FENCE);
  fill(3, 4, 11, 13, G);
  building(4, 4, 8, 6, 'casa', 'CASA', '#b23a48');
  fill(8, 10, 1, 7, PATH); map[17][8] = PATH; // portón
  fill(10, 13, 3, 2, FLOWER);
  map[14][4] = BUSH;

  // ---- PLAZA (arriba al centro)
  zone(16, 3, 12, 16, 'plaza');
  fill(17, 5, 10, 13, G);
  fill(17, 11, 10, 1, PATH); fill(21, 5, 2, 13, PATH);
  fill(20, 9, 4, 4, SAND); fill(21, 10, 2, 2, WATER);
  map[7][18] = BENCH; map[15][18] = BENCH; map[7][25] = BENCH; map[15][25] = BENCH;
  fill(17, 6, 2, 1, FLOWER); fill(25, 16, 2, 1, FLOWER);

  // ---- GYM (arriba a la derecha)
  zone(33, 1, 14, 19, 'gym');
  building(35, 6, 10, 7, 'gym', 'GYM', '#495057');
  fill(35, 13, 10, 5, FLOOR);
  fill(40, 13, 1, 7, PATH);

  // ---- KIOSCO (esquina)
  building(48, 12, 6, 5, 'kiosco', 'KIOSCO', '#f4a261');
  fill(51, 17, 1, 3, PATH);

  // ---- ABUELOS
  zone(55, 1, 8, 19, 'barrio');
  building(55, 4, 7, 6, 'abuelos', 'ABUELOS', '#6a994e');
  fill(58, 10, 1, 10, PATH);
  fill(55, 11, 2, 1, FLOWER); fill(60, 11, 2, 1, FLOWER);

  // ---- FACULTAD (abajo a la izquierda)
  zone(1, 25, 17, 22, 'facu');
  building(2, 27, 15, 8, 'facu', 'FACULTAD', '#1d3557');
  fill(3, 35, 13, 3, FLOOR);
  fill(9, 38, 1, 9, PATH); fill(9, 35, 1, 4, PATH);
  for (const x of [3, 6, 12, 15]) map[40][x] = TREE;

  // ---- COLEGIO FÁTIMA (bloqueado por ahora)
  zone(18, 25, 10, 22, 'cole');
  building(19, 28, 8, 6, 'cole', 'COLEGIO', '#5e60ce');
  fill(22, 34, 2, 2, PATH);
  fill(20, 36, 6, 1, FENCE);

  // ---- CLUB DE RUGBY (abajo a la derecha)
  zone(33, 25, 30, 22, 'club');
  building(34, 26, 8, 5, 'club', 'LA U', '#e53935');
  rect(34, 32, 28, 15, FENCE);
  fill(35, 33, 26, 13, PITCH);
  // líneas: try, 22, mitad
  for (let y = 33; y <= 45; y++) { map[y][37] = LINE; map[y][58] = LINE; map[y][47] = LINE; map[y][48] = LINE; map[y][42] = LINE; map[y][53] = LINE; }
  // palos (H)
  map[38][36] = POST; map[40][36] = POST; map[38][59] = POST; map[40][59] = POST;
  map[39][34] = PATH; map[39][33] = PATH; // entrada a la cancha
  fill(38, 31, 1, 1, PATH);
  fill(44, 27, 6, 1, BENCH);
  fill(52, 26, 9, 5, FLOOR);

  // Árboles y arbustos decorativos (semilla fija)
  const r = mulberry32(9);
  for (let i = 0; i < 160; i++) {
    const x = 1 + Math.floor(r() * (MW - 2)), y = 1 + Math.floor(r() * (MH - 2));
    if (map[y][x] !== G) continue;
    // no bloquear cerca de puertas
    if (doors.some((d) => Math.abs(d.x - x) < 3 && Math.abs(d.y - y) < 4)) continue;
    if (y >= 19 && y <= 25) continue;
    if (y >= 30 && y <= 32 && x >= 33) continue;
    if (x >= 27 && x <= 33) continue;
    map[y][x] = r() < 0.7 ? TREE : r() < 0.5 ? BUSH : FLOWER;
  }
}

// ---------- dibujo de tiles ----------
function drawTile(ctx, t, x, y, r) {
  const X = x * T, Y = y * T;
  const px = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(X + a, Y + b, w, h); };
  const grass = () => {
    px(0, 0, 16, 16, '#5a9e4b');
    for (let i = 0; i < 5; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 2, '#4c8a3f');
    if (r() < 0.3) px(Math.floor(r() * 14), Math.floor(r() * 14), 2, 1, '#6fb35d');
  };
  switch (t) {
    case G: grass(); break;
    case ROAD:
      px(0, 0, 16, 16, '#4a4e69');
      for (let i = 0; i < 3; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#3f4259');
      if ((y === 22 && x % 4 < 2 && !(x >= 29 && x <= 31)) || (x === 30 && y % 4 < 2 && !(y >= 21 && y <= 23))) {
        if (y === 22) px(0, 7, 16, 2, '#f2e8cf'); else px(7, 0, 2, 16, '#f2e8cf');
      }
      break;
    case WALK: px(0, 0, 16, 16, '#b8b8c0'); px(0, 0, 16, 1, '#9a9aa5'); px(0, 0, 1, 16, '#9a9aa5'); px(8, 0, 1, 16, '#a5a5b0'); break;
    case TREE:
      grass();
      px(6, 11, 4, 5, '#6b4226');
      px(2, 2, 12, 10, '#2d6a4f'); px(3, 1, 10, 2, '#2d6a4f'); px(4, 3, 5, 4, '#40916c'); px(1, 5, 2, 5, '#2d6a4f'); px(13, 5, 2, 5, '#2d6a4f');
      px(9, 8, 3, 2, '#1b4332');
      break;
    case BUSH: grass(); px(2, 5, 12, 9, '#386641'); px(3, 4, 10, 2, '#386641'); px(4, 6, 4, 3, '#52a35a'); if (r() < 0.5) px(10, 8, 2, 2, '#e63946'); break;
    case FLOWER: grass(); for (let i = 0; i < 4; i++) { const fx = Math.floor(r() * 13) + 1, fy = Math.floor(r() * 13) + 1; px(fx, fy, 2, 2, pick(['#ffd166', '#ef476f', '#f1f3f5', '#c77dff'])); } break;
    case WALL: px(0, 0, 16, 16, '#e9d8a6'); px(0, 15, 16, 1, '#bfa77a'); px(3, 4, 4, 5, '#8ecae6'); px(10, 4, 4, 5, '#8ecae6'); px(3, 4, 4, 1, '#fff'); px(10, 4, 4, 1, '#fff'); break;
    case ROOF: break; // se dibuja por edificio
    case DOOR: px(0, 0, 16, 16, '#e9d8a6'); px(4, 2, 8, 14, '#6b4226'); px(5, 3, 6, 12, '#8b5a2b'); px(9, 9, 1, 2, '#ffd166'); break;
    case WATER: px(0, 0, 16, 16, '#4cc9f0'); px(2, 4, 5, 1, '#bde0fe'); px(8, 10, 5, 1, '#bde0fe'); break;
    case PITCH: px(0, 0, 16, 16, x % 2 === 0 ? '#4caf50' : '#43a047'); break;
    case LINE: px(0, 0, 16, 16, x % 2 === 0 ? '#4caf50' : '#43a047'); px(7, 0, 2, 16, '#f8f9fa'); break;
    case POST: px(0, 0, 16, 16, x % 2 === 0 ? '#4caf50' : '#43a047'); px(6, 0, 4, 16, '#f8f9fa'); px(5, 12, 6, 4, '#d62828'); break;
    case PATH: px(0, 0, 16, 16, '#d4a373'); for (let i = 0; i < 4; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#bc8a5f'); break;
    case SAND: px(0, 0, 16, 16, '#e9c46a'); px(Math.floor(r() * 14), Math.floor(r() * 14), 2, 1, '#f4d58d'); break;
    case FENCE: grass(); px(0, 6, 16, 2, '#f1f3f5'); px(0, 11, 16, 2, '#f1f3f5'); px(2, 4, 2, 11, '#dee2e6'); px(12, 4, 2, 11, '#dee2e6'); break;
    case BENCH: grass(); px(1, 6, 14, 3, '#8b5a2b'); px(1, 9, 14, 1, '#5e3a1a'); px(2, 10, 2, 4, '#333'); px(12, 10, 2, 4, '#333'); break;
    case FLOOR: px(0, 0, 16, 16, '#adb5bd'); px(0, 0, 16, 1, '#ced4da'); px(0, 0, 1, 16, '#ced4da'); break;
    default: grass();
  }
}

function drawRoofs(ctx) {
  for (const s of signs) {
    const X = s.bx * T, Y = s.by * T, W = s.bw * T, Hh = (s.bh - 2) * T;
    ctx.fillStyle = s.roof; ctx.fillRect(X, Y, W, Hh);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = Y + 4; y < Y + Hh; y += 6) ctx.fillRect(X, y, W, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(X, Y, W, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X, Y + Hh - 3, W, 3);
  }
}

function renderMap() {
  mapCanvas = makeCanvas(MW * T, MH * T);
  const ctx = mapCanvas.getContext('2d');
  const r = mulberry32(42);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) drawTile(ctx, map[y][x], x, y, r);
  drawRoofs(ctx);
}

// ---------- estado del mundo ----------
const W = {
  running: false, canvas: null, ctx: null, scale: 3, dpr: 1,
  p: { x: 7.5 * T, y: 12 * T, dir: 'down', frame: 0, anim: 0, moving: false },
  trail: [], monsters: [], npcs: [], keys: {}, joy: { x: 0, y: 0 },
  lastDoor: null, cooldown: 0, msg: null, msgT: 0, zone: 'casa', zoneT: 0,
  onDoor: null, onEncounter: null, raf: 0, last: 0,
};

export function initWorld(canvas, { onDoor, onEncounter }) {
  if (!map) { build(); renderMap(); }
  W.canvas = canvas; W.ctx = canvas.getContext('2d');
  W.onDoor = onDoor; W.onEncounter = onEncounter;
  if (S.world && S.world.x) { W.p.x = S.world.x; W.p.y = S.world.y; W.p.dir = S.world.dir || 'down'; }
  if (blocked(W.p.x, W.p.y)) { W.p.x = 7.5 * T; W.p.y = 12 * T; }
  W.trail = Array.from({ length: 40 }, () => ({ x: W.p.x, y: W.p.y, dir: W.p.dir }));
  spawnAll();
  W.npcs = [
    { kind: 'coach', x: 45 * T, y: 31 * T, name: 'Entrenador' },
    { kind: 'dog', dog: 'piti', x: 5 * T, y: 15 * T, home: { x: 5 * T, y: 15 * T }, vx: 0, vy: 0, t: 0, flip: false, frame: 0 },
    { kind: 'dog', dog: 'catalina', x: 11 * T, y: 15 * T, home: { x: 11 * T, y: 15 * T }, vx: 0, vy: 0, t: 0, flip: false, frame: 0 },
  ];
  bindInput();
}

function spawnAll() {
  W.monsters = [];
  const r = Math.random;
  const want = { casa: 2, barrio: 5, plaza: 2, gym: 2, club: 3, facu: 3 };
  for (const [z, n] of Object.entries(want)) {
    let tries = 0, placed = 0;
    while (placed < n && tries < 400) {
      tries++;
      const tx = 1 + Math.floor(r() * (MW - 2)), ty = 1 + Math.floor(r() * (MH - 2));
      if (zoneMap[ty][tx] !== z) continue;
      if (SOLID.has(map[ty][tx]) || map[ty][tx] === DOOR) continue;
      if (Math.hypot(tx * T - W.p.x, ty * T - W.p.y) < 6 * T) continue;
      const id = pick(ZONES[z].monsters);
      W.monsters.push(newMonster(id, tx, ty, z));
      placed++;
    }
  }
  // Jefes
  W.monsters.push(newMonster('pilar', 54, 39, 'club', true));
  W.monsters.push(newMonster('final', 9, 41, 'facu', true));
  W.monsters.push(newMonster('sombra', 22, 13, 'plaza', true));
}
function newMonster(id, tx, ty, zone, fixed = false) {
  return { id, zone, x: tx * T + 8, y: ty * T + 8, hx: tx * T + 8, hy: ty * T + 8, vx: 0, vy: 0, t: Math.random() * 3, fixed, bob: Math.random() * 6, dead: false };
}
export function removeMonster(m) {
  m.dead = true;
  // reaparece en otro lugar después de un rato
  setTimeout(() => {
    if (MONSTERS[m.id].boss) { m.dead = false; return; }
    const z = m.zone;
    for (let i = 0; i < 300; i++) {
      const tx = 1 + Math.floor(Math.random() * (MW - 2)), ty = 1 + Math.floor(Math.random() * (MH - 2));
      if (zoneMap[ty][tx] !== z || SOLID.has(map[ty][tx]) || map[ty][tx] === DOOR) continue;
      Object.assign(m, newMonster(pick(ZONES[z].monsters), tx, ty, z));
      return;
    }
  }, 25000);
}

function tileAt(px, py) {
  const tx = Math.floor(px / T), ty = Math.floor(py / T);
  if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return TREE;
  return map[ty][tx];
}
function blocked(x, y) {
  // caja de colisión de los pies
  const pts = [[x - 5, y - 3], [x + 5, y - 3], [x - 5, y + 3], [x + 5, y + 3]];
  return pts.some(([a, b]) => SOLID.has(tileAt(a, b)));
}

function bindInput() {
  if (W.bound) return;
  W.bound = true;
  window.addEventListener('keydown', (e) => {
    if (!W.running) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(k)) e.preventDefault();
    W.keys[k] = true;
    if (k === ' ' || k === 'e' || k === 'enter') interact();
  });
  window.addEventListener('keyup', (e) => { W.keys[e.key.toLowerCase()] = false; });
}

// joystick táctil
export function bindJoystick(base, knob, abtn) {
  let id = null, cx = 0, cy = 0;
  const R = 40;
  const start = (e) => {
    const t = e.changedTouches ? e.changedTouches[0] : e;
    id = t.identifier ?? 'm';
    const r = base.getBoundingClientRect();
    cx = r.left + r.width / 2; cy = r.top + r.height / 2;
    move(e);
    e.preventDefault();
  };
  const move = (e) => {
    if (id === null) return;
    const list = e.changedTouches ? [...e.changedTouches] : [e];
    const t = list.find((x) => (x.identifier ?? 'm') === id);
    if (!t) return;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    W.joy.x = dx / R; W.joy.y = dy / R;
    e.preventDefault();
  };
  const end = (e) => {
    const list = e.changedTouches ? [...e.changedTouches] : [e];
    if (!list.some((x) => (x.identifier ?? 'm') === id)) return;
    id = null; W.joy.x = 0; W.joy.y = 0; knob.style.transform = '';
  };
  base.addEventListener('touchstart', start, { passive: false });
  window.addEventListener('touchmove', move, { passive: false });
  window.addEventListener('touchend', end);
  window.addEventListener('touchcancel', end);
  base.addEventListener('mousedown', start);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  abtn.addEventListener('pointerdown', (e) => { e.preventDefault(); interact(); });
}

function say(text, t = 3) { W.msg = text; W.msgT = t; }

function interact() {
  const p = W.p;
  // NPCs cercanos
  for (const n of W.npcs) {
    if (Math.hypot(n.x - p.x, n.y - p.y) < 26) {
      if (n.kind === 'coach') say(pick(COACH_TIPS), 5);
      if (n.kind === 'dog') { say(pick(DOG_LINES[n.dog]), 3); sfx('bark'); }
      return;
    }
  }
  // puerta adelante
  const d = doorNear(p.x, p.y, 20);
  if (d) { W.onDoor?.(d.id); return; }
  say('Caminá hasta una puerta o acercate a alguien y tocá A.', 2.5);
}
function doorNear(x, y, dist) {
  return doors.find((d) => Math.hypot(d.x * T + 8 - x, d.y * T + 12 - y) < dist);
}

function update(dt) {
  const p = W.p;
  let mx = 0, my = 0;
  const k = W.keys;
  if (k['arrowleft'] || k['a']) mx -= 1;
  if (k['arrowright'] || k['d']) mx += 1;
  if (k['arrowup'] || k['w']) my -= 1;
  if (k['arrowdown'] || k['s']) my += 1;
  if (Math.abs(W.joy.x) > 0.2 || Math.abs(W.joy.y) > 0.2) { mx = W.joy.x; my = W.joy.y; }
  const len = Math.hypot(mx, my);
  p.moving = len > 0.1;
  if (p.moving) {
    if (len > 1) { mx /= len; my /= len; }
    const sp = 80 * dt;
    const nx = p.x + mx * sp, ny = p.y + my * sp;
    if (!blocked(nx, p.y)) p.x = nx;
    if (!blocked(p.x, ny)) p.y = ny;
    if (Math.abs(mx) > Math.abs(my)) p.dir = mx > 0 ? 'right' : 'left';
    else p.dir = my > 0 ? 'down' : 'up';
    p.anim += dt * 8;
    p.frame = [0, 1, 0, 2][Math.floor(p.anim) % 4];
    const last = W.trail[W.trail.length - 1];
    if (Math.hypot(last.x - p.x, last.y - p.y) > 2) {
      W.trail.push({ x: p.x, y: p.y, dir: p.dir });
      if (W.trail.length > 60) W.trail.shift();
    }
  } else p.frame = 0;

  // zona actual
  const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
  const z = zoneMap[ty]?.[tx] || 'barrio';
  if (z !== W.zone) { W.zone = z; W.zoneT = 2.2; }
  if (W.zoneT > 0) W.zoneT -= dt;

  // puertas al pisarlas
  const onDoor = map[ty]?.[tx] === DOOR ? doors.find((d) => d.x === tx && d.y === ty) : null;
  if (onDoor && W.lastDoor !== onDoor) { W.lastDoor = onDoor; p.y = (ty + 1) * T + 5; p.dir = 'down'; W.onDoor?.(onDoor.id); }
  if (!onDoor) W.lastDoor = null;

  // monstruos
  if (W.cooldown > 0) W.cooldown -= dt;
  for (const m of W.monsters) {
    if (m.dead) continue;
    m.bob += dt * 4;
    if (!m.fixed) {
      m.t -= dt;
      if (m.t <= 0) {
        m.t = 1 + Math.random() * 2.5;
        const a = Math.random() * Math.PI * 2;
        const go = Math.random() < 0.6;
        m.vx = go ? Math.cos(a) * 18 : 0; m.vy = go ? Math.sin(a) * 18 : 0;
      }
      const nx = m.x + m.vx * dt, ny = m.y + m.vy * dt;
      const tz = zoneMap[Math.floor(ny / T)]?.[Math.floor(nx / T)];
      if (!blocked(nx, ny) && tz === m.zone && Math.hypot(nx - m.hx, ny - m.hy) < 5 * T) { m.x = nx; m.y = ny; }
      else { m.vx = -m.vx; m.vy = -m.vy; }
    }
    const dist = Math.hypot(m.x - p.x, m.y - p.y);
    if (dist < 14 && W.cooldown <= 0) {
      W.cooldown = 2;
      const def = MONSTERS[m.id];
      if (m.id === 'sombra' && (level() < 8 || S.wins < 15)) {
        say(`El Giuli de Ayer: "Todavía no estás listo." (Necesitás nivel 8 y 15 victorias. Tenés nivel ${level()} y ${S.wins}.)`, 5);
        p.y += 10;
        continue;
      }
      if (def.boss && m.id !== 'sombra' && level() < 4) {
        say(`${def.name}: "Volvé cuando seas nivel 4, pibe."`, 4);
        p.x += (p.x - m.x) * 0.6; p.y += (p.y - m.y) * 0.6;
        continue;
      }
      sfx('encounter');
      W.onEncounter?.(m);
    }
  }

  // perros en la casa / mascotas que siguen
  for (const n of W.npcs) {
    if (n.kind !== 'dog') continue;
    const following = S.equip.pet === 'ambos' || S.equip.pet === n.dog;
    if (following) continue;
    n.t -= dt;
    if (n.t <= 0) {
      n.t = 1 + Math.random() * 2;
      const a = Math.random() * Math.PI * 2;
      n.vx = Math.random() < 0.6 ? Math.cos(a) * 20 : 0; n.vy = Math.random() < 0.6 ? Math.sin(a) * 12 : 0;
    }
    const nx = n.x + n.vx * dt, ny = n.y + n.vy * dt;
    if (!blocked(nx, ny) && Math.hypot(nx - n.home.x, ny - n.home.y) < 3 * T) { n.x = nx; n.y = ny; }
    if (n.vx) n.flip = n.vx < 0;
    n.frame = (n.vx || n.vy) ? Math.floor(performance.now() / 150) % 2 : 0;
  }
  if (W.msgT > 0) W.msgT -= dt;

  // guardar posición cada tanto
  W.saveT = (W.saveT || 0) + dt;
  if (W.saveT > 2) { W.saveT = 0; S.world = { x: p.x, y: p.y, dir: p.dir }; save(); }
}

function draw() {
  const c = W.canvas, ctx = W.ctx;
  const sc = W.scale;
  const vw = c.width / sc, vh = c.height / sc;
  const p = W.p;
  let camX = clamp(p.x - vw / 2, 0, MW * T - vw);
  let camY = clamp(p.y - vh / 2, 0, MH * T - vh);
  if (vw > MW * T) camX = (MW * T - vw) / 2;
  if (vh > MH * T) camY = (MH * T - vh) / 2;
  camX = Math.round(camX); camY = Math.round(camY);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2d6a4f';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(mapCanvas, camX, camY, vw, vh, 0, 0, vw * sc, vh * sc);

  const toS = (x, y) => [(x - camX) * sc, (y - camY) * sc];
  const sprites = [];
  // monstruos
  for (const m of W.monsters) {
    if (m.dead) continue;
    const def = MONSTERS[m.id];
    const spr = monsterSprite(m.id, def);
    const s = def.boss ? 1.4 : 1;
    sprites.push({ y: m.y, draw: () => {
      const [sx, sy] = toS(m.x, m.y);
      const w = spr.width * sc * s, h = spr.height * sc * s;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(sx, sy + 2 * sc, 6 * sc * s, 2 * sc, 0, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(spr, Math.round(sx - w / 2), Math.round(sy - h + 2 * sc + Math.sin(m.bob) * sc), w, h);
      if (def.boss) {
        ctx.font = `bold ${8 * W.dpr}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000'; ctx.fillText('JEFE', sx + 1, sy - h - 2);
        ctx.fillStyle = '#ffd166'; ctx.fillText('JEFE', sx, sy - h - 3);
      }
    } });
  }
  // npcs
  for (const n of W.npcs) {
    if (n.kind === 'coach') {
      const spr = playerSprite({ jersey: { pattern: 'solid', a: '#264653', b: '#2a9d8f', n: '#fff' }, hair: { style: 'rapado', c: '#9e9e9e', d: '#757575' }, boots: { c: '#111' }, head: 'gorra' }, 'down', 0);
      sprites.push({ y: n.y, draw: () => { const [sx, sy] = toS(n.x, n.y); ctx.drawImage(spr, sx - 8 * sc, sy - 20 * sc, 16 * sc, 22 * sc); } });
    } else {
      const following = S.equip.pet === 'ambos' || S.equip.pet === n.dog;
      let x = n.x, y = n.y, flip = n.flip, frame = n.frame;
      if (following) {
        const idx = Math.max(0, W.trail.length - 1 - (n.dog === 'piti' ? 10 : 20));
        const tp = W.trail[idx];
        x = tp.x + (n.dog === 'piti' ? -4 : 4); y = tp.y + 2;
        flip = tp.dir === 'left';
        frame = p.moving ? Math.floor(performance.now() / 150) % 2 : 0;
        n.x = x; n.y = y;
      }
      const spr = dogSprite(n.dog, frame, flip);
      sprites.push({ y, draw: () => { const [sx, sy] = toS(x, y); ctx.drawImage(spr, Math.round(sx - 8 * sc), Math.round(sy - spr.height * sc + 2 * sc), 16 * sc, spr.height * sc); } });
    }
  }
  // Giuli
  const lk = look();
  const pspr = playerSprite(lk, p.dir, p.frame);
  sprites.push({ y: p.y, draw: () => {
    const [sx, sy] = toS(p.x, p.y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 2 * sc, 6 * sc, 2 * sc, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(pspr, Math.round(sx - 8 * sc), Math.round(sy - 20 * sc), 16 * sc, 22 * sc);
  } });
  sprites.sort((a, b) => a.y - b.y).forEach((s) => s.draw());

  // carteles
  ctx.textAlign = 'center';
  ctx.font = `${7 * W.dpr}px "Press Start 2P", monospace`;
  for (const s of signs) {
    const [sx, sy] = toS(s.x * T, s.y * T);
    if (sx < -100 || sy < -50 || sx > c.width + 100 || sy > c.height + 50) continue;
    const w = ctx.measureText(s.text).width + 10;
    ctx.fillStyle = 'rgba(20,24,43,0.85)';
    ctx.fillRect(sx - w / 2, sy - 9 * W.dpr, w, 13 * W.dpr);
    ctx.fillStyle = s.text === 'COLEGIO' ? '#adb5bd' : '#fff';
    ctx.fillText(s.text === 'COLEGIO' ? 'COLEGIO (pronto)' : s.text, sx, sy);
  }

  // noche según hora real
  const hr = new Date().getHours() + new Date().getMinutes() / 60;
  let dark = 0;
  if (hr >= 19.5 || hr < 6.5) dark = 0.4; else if (hr >= 18.5) dark = (hr - 18.5) * 0.4; else if (hr < 7.5) dark = (7.5 - hr) * 0.4;
  if (dark > 0) { ctx.fillStyle = `rgba(10,10,40,${dark})`; ctx.fillRect(0, 0, c.width, c.height); }

  // cartel de zona
  if (W.zoneT > 0) {
    const name = ZONES[W.zone]?.name || '';
    ctx.globalAlpha = Math.min(1, W.zoneT);
    const d = W.dpr;
    ctx.font = `${11 * d}px "Press Start 2P", monospace`;
    const w = ctx.measureText(name).width + 30 * d;
    ctx.fillStyle = 'rgba(20,24,43,0.9)';
    ctx.fillRect(c.width / 2 - w / 2, 12 * d, w, 30 * d);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(name, c.width / 2, 32 * d);
    ctx.globalAlpha = 1;
  }
  // mensaje
  if (W.msgT > 0 && W.msg) drawMsg(ctx, c, W.msg);
}

function drawMsg(ctx, c, text) {
  const d = W.dpr;
  ctx.font = `${14 * d}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  const maxW = Math.min(c.width - 32 * d, 520 * d);
  const words = text.split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW - 24 * d) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  const h = (lines.length * 20 + 20) * d;
  const x = (c.width - maxW) / 2, y = c.height - h - 150 * d;
  ctx.fillStyle = 'rgba(20,24,43,0.95)';
  ctx.fillRect(x, y, maxW, h);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, maxW - 2, h - 2);
  ctx.fillStyle = '#fff';
  lines.forEach((l, i) => ctx.fillText(l, x + 12 * d, y + (24 + i * 20) * d));
}

function loop(t) {
  if (!W.running) return;
  const dt = Math.min(0.05, (t - (W.last || t)) / 1000);
  W.last = t;
  update(dt);
  draw();
  W.raf = requestAnimationFrame(loop);
}

export function resizeWorld() {
  const c = W.canvas;
  if (!c) return;
  const r = c.parentElement.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  W.dpr = dpr;
  c.width = Math.floor(r.width * dpr); c.height = Math.floor(r.height * dpr);
  c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
  // escala entera: que se vean ~14 tiles de ancho en el celu
  W.scale = Math.max(2, Math.round((c.width / (14 * T))));
  if (W.scale > 5 * dpr) W.scale = Math.round(5 * dpr);
}
export function startWorld() {
  if (W.running) return;
  W.running = true; W.last = 0;
  resizeWorld();
  W.raf = requestAnimationFrame(loop);
}
export function stopWorld() {
  W.running = false;
  cancelAnimationFrame(W.raf);
  W.keys = {}; W.joy.x = 0; W.joy.y = 0;
}
export function worldSay(t, s) { say(t, s); }
export function currentZone() { return W.zone; }
export function teleportHome() {
  W.p.x = 7.5 * T; W.p.y = 12 * T;
  W.trail = Array.from({ length: 40 }, () => ({ x: W.p.x, y: W.p.y, dir: 'down' }));
}
export function bumpBack() { W.p.y += 10; }
