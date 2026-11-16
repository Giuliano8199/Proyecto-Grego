// =============================================================
//  MUNDO 2D: el barrio, el club por dentro y el gym por dentro
// =============================================================
import { makeCanvas, playerSprite, monsterSprite, dogSprite } from './pixel.js';
import { MONSTERS, ZONES, DOG_LINES, TEAMMATES } from './data.js';
import { S, look, level, save } from './state.js';
import { mulberry32, pick, clamp } from './util.js';
import { sfx } from './audio.js';

export const T = 16; // tamaño de tile

// Tiles
const G = 0, ROAD = 1, WALK = 2, TREE = 3, WALL = 4, ROOF = 5, DOOR = 6, WATER = 7, PITCH = 8, LINE = 9, POST = 10, PATH = 11, FENCE = 12, FLOWER = 13, BENCH = 14, BUSH = 15, FLOOR = 16, SAND = 17,
  RUBBER = 18, MIRROR = 19, IWALL = 20, EXIT = 21, STATION = 22, STAND = 23, TRACK = 24;
const SOLID = new Set([TREE, WALL, ROOF, WATER, POST, FENCE, BENCH, BUSH, MIRROR, IWALL, STATION, STAND]);

// ---------------------------------------------------------------
//  ESCENAS
// ---------------------------------------------------------------
const SCENES = {};
let SC = null; // escena actual

function newScene(id, w, h, def = G, zoneDef = id) {
  return {
    id, w, h,
    map: Array.from({ length: h }, () => new Array(w).fill(def)),
    zone: Array.from({ length: h }, () => new Array(w).fill(zoneDef)),
    doors: [], signs: [], stations: [], npcs: [], monsters: [], canvas: null, spawn: null,
  };
}
function tools(sc) {
  const fill = (x0, y0, w, h, t) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (sc.map[y] && x >= 0 && x < sc.w) sc.map[y][x] = t; };
  const zone = (x0, y0, w, h, z) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (sc.zone[y] && x >= 0 && x < sc.w) sc.zone[y][x] = z; };
  const rect = (x0, y0, w, h, t) => {
    for (let x = x0; x < x0 + w; x++) { sc.map[y0][x] = t; sc.map[y0 + h - 1][x] = t; }
    for (let y = y0; y < y0 + h; y++) { sc.map[y][x0] = t; sc.map[y][x0 + w - 1] = t; }
  };
  const building = (x0, y0, w, h, id, label, roof) => {
    fill(x0, y0, w, h - 2, ROOF);
    fill(x0, y0 + h - 2, w, 2, WALL);
    const dx = x0 + Math.floor(w / 2);
    sc.map[y0 + h - 1][dx] = DOOR;
    sc.doors.push({ x: dx, y: y0 + h - 1, id });
    sc.signs.push({ x: x0 + w / 2, y: y0 + h - 2.2, text: label, roof, bx: x0, by: y0, bw: w, bh: h });
  };
  const station = (id, x, y, w, h, label, kind) => {
    fill(x, y, w, h, STATION);
    sc.stations.push({ id, x, y, w, h, label, kind });
  };
  return { fill, zone, rect, building, station };
}

// ---------- BARRIO ----------
function buildBarrio() {
  const sc = newScene('barrio', 64, 48, G, 'barrio');
  const { fill, zone, rect, building } = tools(sc);
  const m = sc.map;
  fill(0, 21, 64, 3, ROAD); fill(0, 20, 64, 1, WALK); fill(0, 24, 64, 1, WALK);
  fill(29, 0, 3, 48, ROAD); fill(28, 0, 1, 48, WALK); fill(32, 0, 1, 48, WALK);
  for (let x = 0; x < 64; x++) { m[0][x] = TREE; m[47][x] = TREE; }
  for (let y = 0; y < 48; y++) { m[y][0] = TREE; m[y][63] = TREE; }
  for (const y of [21, 22, 23]) { m[y][0] = BUSH; m[y][63] = BUSH; }
  for (const x of [29, 30, 31]) { m[0][x] = BUSH; m[47][x] = BUSH; }
  // casa
  zone(1, 1, 15, 19, 'casa');
  rect(2, 3, 13, 15, FENCE);
  fill(3, 4, 11, 13, G);
  building(4, 4, 8, 6, 'casa', 'CASA', '#b23a48');
  fill(8, 10, 1, 7, PATH); m[17][8] = PATH;
  fill(10, 13, 3, 2, FLOWER);
  // plaza
  zone(16, 3, 12, 16, 'plaza');
  fill(17, 11, 10, 1, PATH); fill(21, 5, 2, 13, PATH);
  fill(20, 9, 4, 4, SAND); fill(21, 10, 2, 2, WATER);
  m[7][18] = BENCH; m[15][18] = BENCH; m[7][25] = BENCH; m[15][25] = BENCH;
  fill(17, 6, 2, 1, FLOWER); fill(25, 16, 2, 1, FLOWER);
  // canchita de barrio (antes estaba el gym; el gym ahora está adentro del club)
  zone(33, 1, 14, 19, 'barrio');
  fill(35, 6, 10, 10, SAND);
  rect(35, 6, 10, 10, FENCE); m[15][40] = SAND;
  // kiosco
  building(48, 12, 6, 5, 'kiosco', 'KIOSCO', '#f4a261');
  fill(51, 17, 1, 3, PATH);
  // abuelos
  building(55, 4, 7, 6, 'abuelos', 'ABUELOS', '#6a994e');
  fill(58, 10, 1, 10, PATH);
  fill(55, 11, 2, 1, FLOWER); fill(60, 11, 2, 1, FLOWER);
  // facultad
  zone(1, 25, 17, 22, 'facu');
  building(2, 27, 15, 8, 'facu', 'FACULTAD', '#1d3557');
  fill(3, 35, 13, 3, FLOOR);
  fill(9, 38, 1, 9, PATH);
  for (const x of [3, 6, 12, 15]) m[40][x] = TREE;
  // colegio
  zone(18, 25, 10, 22, 'cole');
  building(19, 28, 8, 6, 'cole', 'COLEGIO', '#5e60ce');
  fill(22, 34, 2, 2, PATH);
  fill(20, 36, 6, 1, FENCE);
  // club (desde afuera)
  zone(33, 25, 30, 22, 'club');
  building(40, 27, 12, 6, 'club', 'CLUB UNIVERSITARIO', '#e53935');
  fill(45, 33, 3, 3, PATH);
  rect(34, 36, 28, 11, FENCE);
  fill(35, 37, 26, 9, PITCH);
  for (let y = 37; y <= 45; y++) { m[y][37] = LINE; m[y][58] = LINE; m[y][47] = LINE; }
  m[40][36] = POST; m[42][36] = POST; m[40][59] = POST; m[42][59] = POST;
  // árboles
  const r = mulberry32(9);
  for (let i = 0; i < 160; i++) {
    const x = 1 + Math.floor(r() * 62), y = 1 + Math.floor(r() * 46);
    if (m[y][x] !== G) continue;
    if (sc.doors.some((d) => Math.abs(d.x - x) < 3 && Math.abs(d.y - y) < 4)) continue;
    if (y >= 19 && y <= 25) continue;
    if (y >= 32 && y <= 36 && x >= 33) continue;
    if (x >= 27 && x <= 33) continue;
    m[y][x] = r() < 0.7 ? TREE : r() < 0.5 ? BUSH : FLOWER;
  }
  sc.spawn = { x: 7.5 * T, y: 12 * T };
  sc.npcs = [
    { kind: 'dog', dog: 'piti', x: 5 * T, y: 15 * T, home: { x: 5 * T, y: 15 * T }, vx: 0, vy: 0, t: 0, flip: false, frame: 0 },
    { kind: 'dog', dog: 'catalina', x: 11 * T, y: 15 * T, home: { x: 11 * T, y: 15 * T }, vx: 0, vy: 0, t: 0, flip: false, frame: 0 },
  ];
  return sc;
}

// ---------- CLUB POR DENTRO ----------
function buildClub() {
  const sc = newScene('club', 48, 36, G, 'club');
  const { fill, rect, building, station } = tools(sc);
  const m = sc.map;
  rect(0, 0, 48, 36, FENCE);
  // salida al barrio
  m[35][23] = EXIT; m[35][24] = EXIT;
  fill(23, 32, 2, 3, PATH);
  // club house y gym
  building(2, 1, 14, 7, 'clubhouse', 'CLUB HOUSE', '#e53935');
  building(31, 1, 14, 7, 'gym', 'GYM', '#495057');
  fill(9, 8, 1, 3, PATH); fill(38, 8, 1, 3, PATH);
  fill(2, 10, 44, 1, PATH);
  // tribuna
  fill(17, 2, 12, 2, STAND);
  // cancha
  fill(3, 12, 42, 19, PITCH);
  for (let y = 12; y <= 30; y++) { m[y][6] = LINE; m[y][41] = LINE; m[y][23] = LINE; m[y][24] = LINE; m[y][14] = LINE; m[y][33] = LINE; }
  m[19][5] = POST; m[23][5] = POST; m[19][42] = POST; m[23][42] = POST;
  // estaciones de entrenamiento
  station('palos', 8, 13, 2, 2, 'Patadas a los palos', 'tee');
  station('conos', 16, 26, 3, 1, 'Corrida al try', 'cones');
  station('pases', 27, 26, 3, 1, 'Pases de medio scrum', 'cones2');
  station('scrum', 35, 14, 3, 2, 'Máquina de scrum', 'sled');
  station('line', 44, 20, 1, 3, 'Práctica de line', 'linepost');
  station('tackle', 28, 14, 2, 2, 'Tackle con bolsas', 'bags');
  station('partido', 20, 33, 2, 1, 'Jugar partido', 'board');
  sc.spawn = { x: 24 * T, y: 32 * T };
  sc.npcs = [{ kind: 'coach', name: 'Entrenador', x: 22 * T, y: 32 * T, still: true }];
  // compañeros en la cancha
  const spots = [[12, 18], [18, 22], [26, 17], [31, 24], [37, 19], [10, 27], [21, 15], [40, 27]];
  const mates = TEAMMATES.filter((t, i) => i % 2 === 0 || i === 11).slice(0, 7);
  mates.forEach((tm, i) => sc.npcs.push({ kind: 'mate', mate: tm, name: tm.name, x: spots[i][0] * T, y: spots[i][1] * T, home: { x: spots[i][0] * T, y: spots[i][1] * T }, vx: 0, vy: 0, t: Math.random() * 2, dir: 'down', frame: 0 }));
  return sc;
}

// ---------- GYM POR DENTRO ----------
function buildGym() {
  const sc = newScene('gym', 26, 18, RUBBER, 'gym');
  const { fill, station } = tools(sc);
  const m = sc.map;
  fill(0, 0, 26, 2, IWALL);
  fill(2, 0, 22, 2, MIRROR);
  for (let y = 0; y < 18; y++) { m[y][0] = IWALL; m[y][25] = IWALL; }
  fill(0, 17, 26, 1, IWALL);
  m[17][12] = EXIT; m[17][13] = EXIT;
  station('banca', 3, 4, 3, 2, 'Press de banca', 'bench');
  station('sentadilla', 8, 3, 3, 2, 'Sentadilla', 'rack');
  station('pesomuerto', 14, 4, 3, 1, 'Peso muerto', 'barbell');
  station('dominadas', 20, 3, 3, 1, 'Dominadas', 'pullup');
  station('cinta', 3, 10, 2, 3, 'Cinta (correr)', 'treadmill');
  station('soga', 9, 11, 1, 1, 'Saltar la soga', 'rope');
  station('cajon', 15, 11, 2, 2, 'Saltos al cajón', 'box');
  station('mancuernas', 20, 10, 3, 1, 'Mancuernas', 'dumbbells');
  sc.spawn = { x: 12.5 * T, y: 15.5 * T };
  const spots = [[6, 7], [12, 8], [18, 7], [22, 14]];
  const mates = TEAMMATES.filter((t, i) => i % 2 === 1).slice(0, 4);
  sc.npcs = mates.map((tm, i) => ({ kind: 'mate', mate: tm, name: tm.name, x: spots[i][0] * T, y: spots[i][1] * T, home: { x: spots[i][0] * T, y: spots[i][1] * T }, vx: 0, vy: 0, t: Math.random() * 2, dir: 'down', frame: 0 }));
  return sc;
}

// ---------------------------------------------------------------
//  DIBUJO DE TILES
// ---------------------------------------------------------------
function drawTile(ctx, t, x, y, r) {
  const X = x * T, Y = y * T;
  const px = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(X + a, Y + b, w, h); };
  const grass = () => {
    px(0, 0, 16, 16, '#5a9e4b');
    for (let i = 0; i < 5; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 2, '#4c8a3f');
    if (r() < 0.3) px(Math.floor(r() * 14), Math.floor(r() * 14), 2, 1, '#6fb35d');
  };
  const rubber = () => { px(0, 0, 16, 16, '#3a3d46'); px(0, 0, 16, 1, '#454956'); px(0, 0, 1, 16, '#454956'); if (r() < 0.3) px(Math.floor(r() * 14), Math.floor(r() * 14), 1, 1, '#555a68'); };
  switch (t) {
    case G: grass(); break;
    case ROAD:
      px(0, 0, 16, 16, '#4a4e69');
      for (let i = 0; i < 3; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#3f4259');
      if (SC_BUILD === 'barrio' && ((y === 22 && x % 4 < 2 && !(x >= 29 && x <= 31)) || (x === 30 && y % 4 < 2 && !(y >= 21 && y <= 23)))) {
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
    case ROOF: break;
    case DOOR: px(0, 0, 16, 16, '#e9d8a6'); px(4, 2, 8, 14, '#6b4226'); px(5, 3, 6, 12, '#8b5a2b'); px(9, 9, 1, 2, '#ffd166'); break;
    case WATER: px(0, 0, 16, 16, '#4cc9f0'); px(2, 4, 5, 1, '#bde0fe'); px(8, 10, 5, 1, '#bde0fe'); break;
    case PITCH: px(0, 0, 16, 16, x % 2 === 0 ? '#4caf50' : '#43a047'); break;
    case LINE: px(0, 0, 16, 16, x % 2 === 0 ? '#4caf50' : '#43a047'); px(7, 0, 2, 16, '#f8f9fa'); break;
    case POST: px(0, 0, 16, 16, x % 2 === 0 ? '#4caf50' : '#43a047'); px(6, 0, 4, 16, '#f8f9fa'); px(5, 12, 6, 4, '#d62828'); break;
    case PATH: px(0, 0, 16, 16, '#d4a373'); for (let i = 0; i < 4; i++) px(Math.floor(r() * 15), Math.floor(r() * 15), 1, 1, '#bc8a5f'); break;
    case SAND: px(0, 0, 16, 16, '#e9c46a'); px(Math.floor(r() * 14), Math.floor(r() * 14), 2, 1, '#f4d58d'); break;
    case FENCE: if (SC_BUILD === 'gym') rubber(); else grass(); px(0, 6, 16, 2, '#f1f3f5'); px(0, 11, 16, 2, '#f1f3f5'); px(2, 4, 2, 11, '#dee2e6'); px(12, 4, 2, 11, '#dee2e6'); break;
    case BENCH: grass(); px(1, 6, 14, 3, '#8b5a2b'); px(1, 9, 14, 1, '#5e3a1a'); px(2, 10, 2, 4, '#333'); px(12, 10, 2, 4, '#333'); break;
    case FLOOR: px(0, 0, 16, 16, '#adb5bd'); px(0, 0, 16, 1, '#ced4da'); px(0, 0, 1, 16, '#ced4da'); break;
    case RUBBER: rubber(); break;
    case MIRROR: px(0, 0, 16, 16, '#a9d6e5'); px(0, 0, 16, 2, '#6c757d'); px(0, 14, 16, 2, '#6c757d'); px(3, 3, 2, 9, '#e0f3fa'); px(9, 5, 1, 6, '#e0f3fa'); break;
    case IWALL: px(0, 0, 16, 16, '#22252e'); px(0, 14, 16, 2, '#14161c'); break;
    case EXIT: if (SC_BUILD === 'gym') { rubber(); px(2, 4, 12, 10, '#6b4226'); px(3, 5, 10, 8, '#8b5a2b'); } else { px(0, 0, 16, 16, '#d4a373'); } px(4, 7, 8, 2, '#ffd166'); break;
    case STATION: if (SC_BUILD === 'gym') rubber(); else px(0, 0, 16, 16, x % 2 === 0 ? '#4caf50' : '#43a047'); break;
    case STAND: px(0, 0, 16, 16, '#5a5f73'); for (let i = 0; i < 6; i++) px(1 + Math.floor(r() * 13), 1 + Math.floor(r() * 13), 2, 2, pick(['#e53935', '#ffffff', '#ffd166'])); px(0, 15, 16, 1, '#3d4152'); break;
    default: grass();
  }
}

function drawRoofs(ctx, sc) {
  for (const s of sc.signs) {
    const X = s.bx * T, Y = s.by * T, W = s.bw * T, Hh = (s.bh - 2) * T;
    ctx.fillStyle = s.roof; ctx.fillRect(X, Y, W, Hh);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = Y + 4; y < Y + Hh; y += 6) ctx.fillRect(X, y, W, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(X, Y, W, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(X, Y + Hh - 3, W, 3);
  }
}

// objetos de entrenamiento (pixel art en código)
function drawStation(ctx, st) {
  const X = st.x * T, Y = st.y * T, W = st.w * T, H = st.h * T;
  const r = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(X + x, Y + y, w, h); };
  switch (st.kind) {
    case 'bench': r(4, 10, W - 8, 6, '#1b1b1b'); r(6, 16, 3, 10, '#444'); r(W - 9, 16, 3, 10, '#444'); r(0, 4, W, 3, '#adb5bd'); r(0, 0, 5, 12, '#222'); r(W - 5, 0, 5, 12, '#222'); break;
    case 'rack': r(2, 0, 3, H, '#6c757d'); r(W - 5, 0, 3, H, '#6c757d'); r(0, 8, W, 3, '#adb5bd'); r(0, 4, 6, 12, '#222'); r(W - 6, 4, 6, 12, '#222'); r(4, H - 4, W - 8, 3, '#e9c46a'); break;
    case 'barbell': r(0, 6, W, 3, '#adb5bd'); r(2, 1, 6, 13, '#222'); r(W - 8, 1, 6, 13, '#222'); r(4, 0, 2, 15, '#e53935'); r(W - 6, 0, 2, 15, '#e53935'); break;
    case 'pullup': r(2, 0, 3, H, '#6c757d'); r(W - 5, 0, 3, H, '#6c757d'); r(0, 1, W, 3, '#adb5bd'); break;
    case 'treadmill': r(2, 0, W - 4, H, '#1b1b1b'); r(4, 6, W - 8, H - 10, '#343a40'); for (let y = 8; y < H - 6; y += 4) r(4, y, W - 8, 1, '#495057'); r(2, 0, W - 4, 6, '#495057'); r(6, 1, 8, 3, '#4cc9f0'); break;
    case 'rope': r(2, 4, 12, 2, '#e63946'); r(2, 4, 2, 10, '#e63946'); r(12, 4, 2, 10, '#e63946'); r(1, 12, 4, 3, '#222'); r(11, 12, 4, 3, '#222'); break;
    case 'box': r(2, 4, W - 4, H - 6, '#8b5a2b'); r(2, 4, W - 4, 3, '#a47148'); r(4, 10, W - 8, 1, '#5e3a1a'); break;
    case 'dumbbells': for (let i = 0; i < 3; i++) { r(4 + i * 15, 6, 8, 2, '#adb5bd'); r(2 + i * 15, 3, 3, 8, '#222'); r(11 + i * 15, 3, 3, 8, '#222'); } r(0, 12, W, 3, '#6c757d'); break;
    case 'tee': r(12, 18, 8, 4, '#ff6b35'); ctx.fillStyle = '#f1e3c8'; ctx.beginPath(); ctx.ellipse(X + 16, Y + 14, 4, 6, 0, 0, Math.PI * 2); ctx.fill(); r(2, 2, 8, 6, '#ffffffcc'); break;
    case 'cones': case 'cones2': for (let i = 0; i < st.w * 2; i++) { const c = i % 2 ? '#ff6b35' : '#ffd166'; r(3 + i * 8, 6, 5, 8, c); r(1 + i * 8, 13, 9, 2, c); } break;
    case 'sled': r(0, 18, W, 6, '#495057'); r(4, 4, 10, 16, '#1d3557'); r(W - 14, 4, 10, 16, '#1d3557'); r(4, 6, 10, 3, '#e53935'); r(W - 14, 6, 10, 3, '#e53935'); r(0, 24, W, 3, '#adb5bd'); break;
    case 'linepost': r(5, 0, 6, H, '#adb5bd'); r(2, 2, 12, 4, '#e53935'); r(2, H / 2, 12, 4, '#fff'); r(2, H - 6, 12, 4, '#e53935'); break;
    case 'bags': r(4, 2, 9, 26, '#1d3557'); r(18, 4, 9, 24, '#e53935'); r(4, 6, 9, 2, '#fff'); r(18, 8, 9, 2, '#fff'); break;
    case 'board': r(0, 2, W, 12, '#14182b'); r(1, 3, W - 2, 10, '#1d3557'); r(4, 6, W - 8, 2, '#ffd166'); r(4, 10, 10, 1, '#fff'); r(4, 14, 2, 2, '#444'); r(W - 6, 14, 2, 2, '#444'); break;
    default: break;
  }
}

let SC_BUILD = null;
function renderScene(sc) {
  SC_BUILD = sc.id;
  sc.canvas = makeCanvas(sc.w * T, sc.h * T);
  const ctx = sc.canvas.getContext('2d');
  const r = mulberry32(42);
  for (let y = 0; y < sc.h; y++) for (let x = 0; x < sc.w; x++) drawTile(ctx, sc.map[y][x], x, y, r);
  drawRoofs(ctx, sc);
  for (const st of sc.stations) drawStation(ctx, st);
  SC_BUILD = null;
}

function getScene(id) {
  if (!SCENES[id]) {
    SCENES[id] = id === 'barrio' ? buildBarrio() : id === 'club' ? buildClub() : buildGym();
    renderScene(SCENES[id]);
    if (id === 'barrio') spawnMonsters(SCENES[id]);
  }
  return SCENES[id];
}

// ---------------------------------------------------------------
//  ESTADO
// ---------------------------------------------------------------
const W = {
  running: false, canvas: null, ctx: null, scale: 3, dpr: 1,
  p: { x: 7.5 * T, y: 12 * T, dir: 'down', frame: 0, anim: 0, moving: false },
  trail: [], keys: {}, joy: { x: 0, y: 0 },
  lastDoor: null, cooldown: 0, msg: null, msgT: 0, zone: 'casa', zoneT: 0,
  cb: {}, raf: 0, last: 0, near: null,
};

export function initWorld(canvas, cb) {
  W.canvas = canvas; W.ctx = canvas.getContext('2d');
  W.cb = cb;
  const where = S.world?.scene && ['barrio', 'club', 'gym'].includes(S.world.scene) ? S.world.scene : 'barrio';
  SC = getScene(where);
  if (S.world && S.world.x) { W.p.x = S.world.x; W.p.y = S.world.y; W.p.dir = S.world.dir || 'down'; }
  if (blocked(W.p.x, W.p.y) || W.p.x > SC.w * T || W.p.y > SC.h * T) { W.p.x = SC.spawn.x; W.p.y = SC.spawn.y; }
  resetTrail();
  bindInput();
}
function resetTrail() { W.trail = Array.from({ length: 40 }, () => ({ x: W.p.x, y: W.p.y, dir: W.p.dir })); }

export function enterScene(id, at) {
  SC = getScene(id);
  if (at) { W.p.x = at.x; W.p.y = at.y; }
  else { W.p.x = SC.spawn.x; W.p.y = SC.spawn.y; }
  W.p.dir = 'down';
  W.zone = null; W.lastDoor = null;
  resetTrail();
  S.world = { scene: id, x: W.p.x, y: W.p.y, dir: W.p.dir };
  save();
  W.cb.onScene?.(id);
}
export function sceneId() { return SC?.id; }

function spawnMonsters(sc) {
  sc.monsters = [];
  const want = { casa: 2, barrio: 6, plaza: 2, club: 2, facu: 3 };
  for (const [z, n] of Object.entries(want)) {
    let tries = 0, placed = 0;
    while (placed < n && tries < 400) {
      tries++;
      const tx = 1 + Math.floor(Math.random() * (sc.w - 2)), ty = 1 + Math.floor(Math.random() * (sc.h - 2));
      if (sc.zone[ty][tx] !== z) continue;
      if (SOLID.has(sc.map[ty][tx]) || sc.map[ty][tx] === DOOR) continue;
      if (Math.hypot(tx * T - sc.spawn.x, ty * T - sc.spawn.y) < 6 * T) continue;
      sc.monsters.push(newMonster(pick(ZONES[z].monsters), tx, ty, z));
      placed++;
    }
  }
  sc.monsters.push(newMonster('pilar', 56, 34, 'club', true));
  sc.monsters.push(newMonster('final', 9, 41, 'facu', true));
  sc.monsters.push(newMonster('sombra', 22, 13, 'plaza', true));
}
function newMonster(id, tx, ty, zone, fixed = false) {
  return { id, zone, x: tx * T + 8, y: ty * T + 8, hx: tx * T + 8, hy: ty * T + 8, vx: 0, vy: 0, t: Math.random() * 3, fixed, bob: Math.random() * 6, dead: false };
}
export function removeMonster(m) {
  m.dead = true;
  const sc = getScene('barrio');
  setTimeout(() => {
    if (MONSTERS[m.id].boss) { m.dead = false; return; }
    for (let i = 0; i < 300; i++) {
      const tx = 1 + Math.floor(Math.random() * (sc.w - 2)), ty = 1 + Math.floor(Math.random() * (sc.h - 2));
      if (sc.zone[ty][tx] !== m.zone || SOLID.has(sc.map[ty][tx]) || sc.map[ty][tx] === DOOR) continue;
      Object.assign(m, newMonster(pick(ZONES[m.zone].monsters), tx, ty, m.zone));
      return;
    }
  }, 25000);
}

function tileAt(px, py) {
  const tx = Math.floor(px / T), ty = Math.floor(py / T);
  if (tx < 0 || ty < 0 || tx >= SC.w || ty >= SC.h) return TREE;
  return SC.map[ty][tx];
}
function blocked(x, y) {
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

// lo más cercano con lo que se puede interactuar
function findNear() {
  const p = W.p;
  let best = null, bd = 30;
  for (const n of SC.npcs) {
    const d = Math.hypot(n.x - p.x, n.y - p.y);
    if (d < bd && n.kind !== 'dog') { bd = d; best = { type: 'npc', n, label: n.kind === 'coach' ? 'Hablar con el entrenador' : `Hablar con ${n.name}` }; }
    if (d < bd && n.kind === 'dog') { bd = d; best = { type: 'dog', n, label: `Mimar a ${n.dog === 'piti' ? 'Piti' : 'Catalina'}` }; }
  }
  for (const st of SC.stations) {
    const cx = (st.x + st.w / 2) * T, cy = (st.y + st.h / 2) * T;
    const d = Math.hypot(cx - p.x, cy - p.y) - Math.max(st.w, st.h) * T * 0.45;
    if (d < bd) { bd = d; best = { type: 'station', st, label: st.label }; }
  }
  return best;
}

function interact() {
  const nr = findNear();
  if (nr) {
    if (nr.type === 'dog') { say(pick(DOG_LINES[nr.n.dog]), 3); sfx('bark'); return; }
    if (nr.type === 'npc') { W.cb.onNpc?.(nr.n); return; }
    if (nr.type === 'station') { W.cb.onStation?.(nr.st.id); return; }
  }
  const d = SC.doors.find((dd) => Math.hypot(dd.x * T + 8 - W.p.x, dd.y * T + 12 - W.p.y) < 20);
  if (d) { W.cb.onDoor?.(d.id); return; }
  say(SC.id === 'barrio' ? 'Caminá hasta una puerta o acercate a alguien y tocá A.' : 'Acercate a un compañero o a una máquina y tocá A.', 2.5);
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

  const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
  const z = SC.zone[ty]?.[tx] || SC.id;
  if (z !== W.zone) { W.zone = z; W.zoneT = 2.2; }
  if (W.zoneT > 0) W.zoneT -= dt;

  // salidas de escenas interiores
  if (SC.map[ty]?.[tx] === EXIT) {
    if (SC.id === 'club') { enterScene('barrio', { x: 45.5 * T, y: 34 * T }); return; }
    if (SC.id === 'gym') { enterScene('club', { x: 38.5 * T, y: 9.2 * T }); return; }
  }
  // puertas
  const onDoor = SC.map[ty]?.[tx] === DOOR ? SC.doors.find((d) => d.x === tx && d.y === ty) : null;
  if (onDoor && W.lastDoor !== onDoor) {
    W.lastDoor = onDoor; p.y = (ty + 1) * T + 5; p.dir = 'down';
    if (onDoor.id === 'club') { enterScene('club'); return; }
    if (onDoor.id === 'gym') { enterScene('gym'); return; }
    W.cb.onDoor?.(onDoor.id);
  }
  if (!onDoor) W.lastDoor = null;

  // monstruos (solo en el barrio)
  if (W.cooldown > 0) W.cooldown -= dt;
  for (const m of SC.monsters) {
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
      const tz = SC.zone[Math.floor(ny / T)]?.[Math.floor(nx / T)];
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
      W.cb.onEncounter?.(m);
    }
  }

  // NPCs
  for (const n of SC.npcs) {
    if (n.kind === 'dog') {
      const following = S.equip.pet === 'ambos' || S.equip.pet === n.dog;
      if (following) continue;
      wander(n, dt, 3 * T, 20);
      n.flip = n.vx < 0;
      n.frame = (n.vx || n.vy) ? Math.floor(performance.now() / 150) % 2 : 0;
    } else if (n.kind === 'mate') {
      const near = Math.hypot(n.x - p.x, n.y - p.y) < 28;
      if (near) { n.vx = 0; n.vy = 0; n.dir = Math.abs(p.x - n.x) > Math.abs(p.y - n.y) ? (p.x > n.x ? 'right' : 'left') : (p.y > n.y ? 'down' : 'up'); n.frame = 0; }
      else {
        wander(n, dt, 2.5 * T, 22);
        if (Math.hypot(n.vx, n.vy) > 1) { n.dir = Math.abs(n.vx) > Math.abs(n.vy) ? (n.vx > 0 ? 'right' : 'left') : (n.vy > 0 ? 'down' : 'up'); n.frame = [0, 1, 0, 2][Math.floor(performance.now() / 160) % 4]; }
        else n.frame = 0;
      }
    }
  }
  W.near = findNear();
  if (W.msgT > 0) W.msgT -= dt;

  W.saveT = (W.saveT || 0) + dt;
  if (W.saveT > 2) { W.saveT = 0; S.world = { scene: SC.id, x: p.x, y: p.y, dir: p.dir }; save(); }
}

function wander(n, dt, radius, speed) {
  n.t -= dt;
  if (n.t <= 0) {
    n.t = 1 + Math.random() * 2.5;
    const a = Math.random() * Math.PI * 2;
    const go = Math.random() < 0.55;
    n.vx = go ? Math.cos(a) * speed : 0; n.vy = go ? Math.sin(a) * speed * 0.7 : 0;
  }
  const nx = n.x + n.vx * dt, ny = n.y + n.vy * dt;
  if (!blocked(nx, ny) && Math.hypot(nx - n.home.x, ny - n.home.y) < radius) { n.x = nx; n.y = ny; }
  else { n.vx = -n.vx; n.vy = -n.vy; }
}

// ---------------------------------------------------------------
//  DIBUJO
// ---------------------------------------------------------------
const COACH_LOOK = { jersey: { pattern: 'solid', a: '#264653', b: '#2a9d8f', n: '#264653' }, hair: { style: 'rapado', c: '#9e9e9e', d: '#757575' }, boots: { c: '#111' }, head: 'gorra', shorts: '#1b1b1b', socks: '#264653' };

function draw() {
  const c = W.canvas, ctx = W.ctx;
  const sc = W.scale, d = W.dpr;
  const vw = c.width / sc, vh = c.height / sc;
  const p = W.p;
  const MWp = SC.w * T, MHp = SC.h * T;
  let camX = clamp(p.x - vw / 2, 0, MWp - vw);
  let camY = clamp(p.y - vh / 2, 0, MHp - vh);
  if (vw > MWp) camX = (MWp - vw) / 2;
  if (vh > MHp) camY = (MHp - vh) / 2;
  camX = Math.round(camX); camY = Math.round(camY);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = SC.id === 'gym' ? '#14161c' : '#2d6a4f';
  ctx.fillRect(0, 0, c.width, c.height);
  const sx0 = Math.max(0, camX), sy0 = Math.max(0, camY);
  ctx.drawImage(SC.canvas, sx0, sy0, Math.min(vw, MWp), Math.min(vh, MHp), (sx0 - camX) * sc, (sy0 - camY) * sc, Math.min(vw, MWp) * sc, Math.min(vh, MHp) * sc);

  const toS = (x, y) => [(x - camX) * sc, (y - camY) * sc];
  const sprites = [];
  for (const m of SC.monsters) {
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
        ctx.font = `bold ${8 * d}px "Press Start 2P", monospace`; ctx.textAlign = 'center';
        ctx.fillStyle = '#000'; ctx.fillText('JEFE', sx + 1, sy - h - 2);
        ctx.fillStyle = '#ffd166'; ctx.fillText('JEFE', sx, sy - h - 3);
      }
    } });
  }
  for (const n of SC.npcs) {
    if (n.kind === 'coach' || n.kind === 'mate') {
      const spr = playerSprite(n.kind === 'coach' ? COACH_LOOK : n.mate.look, n.dir || 'down', n.frame || 0);
      sprites.push({ y: n.y, draw: () => {
        const [sx, sy] = toS(n.x, n.y);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(sx, sy + 2 * sc, 6 * sc, 2 * sc, 0, 0, Math.PI * 2); ctx.fill();
        ctx.drawImage(spr, Math.round(sx - 8 * sc), Math.round(sy - 20 * sc), 16 * sc, 22 * sc);
      } });
    } else {
      const following = S.equip.pet === 'ambos' || S.equip.pet === n.dog;
      if (following && SC.id !== 'barrio') continue;
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
  const pspr = playerSprite(look(), p.dir, p.frame);
  sprites.push({ y: p.y, draw: () => {
    const [sx, sy] = toS(p.x, p.y);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(sx, sy + 2 * sc, 6 * sc, 2 * sc, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(pspr, Math.round(sx - 8 * sc), Math.round(sy - 20 * sc), 16 * sc, 22 * sc);
  } });
  sprites.sort((a, b) => a.y - b.y).forEach((s) => s.draw());

  // carteles de edificios
  ctx.textAlign = 'center';
  ctx.font = `${7 * d}px "Press Start 2P", monospace`;
  for (const s of SC.signs) {
    const [sx, sy] = toS(s.x * T, s.y * T);
    if (sx < -150 || sy < -50 || sx > c.width + 150 || sy > c.height + 50) continue;
    const text = s.text === 'COLEGIO' ? 'COLEGIO (pronto)' : s.text;
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = 'rgba(20,24,43,0.85)';
    ctx.fillRect(sx - w / 2, sy - 9 * d, w, 13 * d);
    ctx.fillStyle = s.text === 'COLEGIO' ? '#adb5bd' : '#fff';
    ctx.fillText(text, sx, sy);
  }
  // nombres de compañeros cerca
  ctx.font = `${6 * d}px "Press Start 2P", monospace`;
  for (const n of SC.npcs) {
    if (n.kind === 'dog') continue;
    if (Math.hypot(n.x - p.x, n.y - p.y) > 90) continue;
    const [sx, sy] = toS(n.x, n.y);
    ctx.fillStyle = '#000'; ctx.fillText(n.name, sx + 1, sy - 21 * sc + 1);
    ctx.fillStyle = n.kind === 'coach' ? '#ffd166' : '#fff'; ctx.fillText(n.name, sx, sy - 21 * sc);
  }
  // ayuda de interacción
  if (W.near) {
    const t = `A: ${W.near.label}`;
    ctx.font = `${9 * d}px "Press Start 2P", monospace`;
    const w = ctx.measureText(t).width + 20 * d;
    const x = c.width / 2, y = c.height - 150 * d;
    ctx.fillStyle = 'rgba(230,57,70,0.95)';
    ctx.fillRect(x - w / 2, y - 16 * d, w, 24 * d);
    ctx.fillStyle = '#fff'; ctx.fillText(t, x, y);
  }

  // noche según hora real (solo afuera)
  if (SC.id !== 'gym') {
    const now = new Date();
    const hr = now.getHours() + now.getMinutes() / 60;
    let dark = 0;
    if (hr >= 19.5 || hr < 6.5) dark = 0.4; else if (hr >= 18.5) dark = (hr - 18.5) * 0.4; else if (hr < 7.5) dark = (7.5 - hr) * 0.4;
    if (dark > 0) { ctx.fillStyle = `rgba(10,10,40,${dark})`; ctx.fillRect(0, 0, c.width, c.height); }
  }

  if (W.zoneT > 0) {
    const name = SC.id === 'gym' ? 'Gym del Club' : SC.id === 'club' ? 'Club Universitario' : ZONES[W.zone]?.name || '';
    ctx.globalAlpha = Math.min(1, W.zoneT);
    ctx.font = `${11 * d}px "Press Start 2P", monospace`;
    const w = ctx.measureText(name).width + 30 * d;
    ctx.fillStyle = 'rgba(20,24,43,0.9)';
    ctx.fillRect(c.width / 2 - w / 2, 12 * d, w, 30 * d);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(name, c.width / 2, 32 * d);
    ctx.globalAlpha = 1;
  }
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
  const x = (c.width - maxW) / 2, y = c.height - h - 190 * d;
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
  SC = getScene('barrio');
  W.p.x = SC.spawn.x; W.p.y = SC.spawn.y;
  resetTrail();
}
export function bumpBack() { W.p.y += 10; }
