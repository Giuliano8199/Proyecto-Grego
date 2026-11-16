// =============================================================
//  PIXEL ART: plantillas y dibujo de sprites (todo en código)
// =============================================================

// --- Giuli (16x20). J = camiseta, N = número, H/h = pelo, S/s = piel
const P_DOWN = [
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...HSSSSSSSSH...',
  '...SSSSSSSSSS...',
  '...SSESSSSESS...',
  '...SSESSSSESS...',
  '...sSSSSSSSSs...',
  '....SSSMMSSS....',
  '.....ssSSss.....',
  '...JJJJJJJJJJ...',
  '..JJJJJJJJJJJJ..',
  '..SJJJJJJJJJJS..',
  '..SJJJJJJJJJJS..',
  '..sJJJJJJJJJJs..',
  '....PPPPPPPP....',
  '....PPPppPPP....',
  '....SS....SS....',
  '....KK....KK....',
  '....OO....OO....',
];
const P_UP = [
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...ShhhhhhhhS...',
  '....SSSSSSSS....',
  '.....ssSSss.....',
  '...JJJJNNNJJJ...',
  '..JJJJJNJNJJJJ..',
  '..SJJJJNNNJJJS..',
  '..SJJJJJJNJJJS..',
  '..sJJJJNNNJJJs..',
  '....PPPPPPPP....',
  '....PPPppPPP....',
  '....SS....SS....',
  '....KK....KK....',
  '....OO....OO....',
];
const P_SIDE = [
  '.....HHHHHHH....',
  '....HHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...HHHHHSSSSH...',
  '...HHHSSSSSSS...',
  '...HHSSSSSESS...',
  '...HHSSSSSESS...',
  '...hSSSSSSSSs...',
  '....sSSSSSSMS...',
  '.....ssSSs......',
  '....JJJJJJJ.....',
  '...JJJJJJJJJ....',
  '...JJJSJJJJJ....',
  '...JJJSJJJJJ....',
  '...JJJsJJJJJ....',
  '....PPPPPPP.....',
  '....PPPPPPP.....',
  '.....SS..SS.....',
  '.....KK..KK.....',
  '.....OOO.OOO....',
];
// Variaciones de piernas para caminar
const LEGS = {
  down: [
    ['....SS....SS....', '....KK....KK....', '....OO....OO....'],
    ['....SS....SS....', '....KK....OO....', '....OO..........'],
    ['....SS....SS....', '....OO....KK....', '..........OO....'],
  ],
  side: [
    ['.....SS..SS.....', '.....KK..KK.....', '.....OOO.OOO....'],
    ['....SS....SS....', '...KK......KK...', '..OOO......OOO..'],
    ['......SSSS......', '......KKKK......', '.....OOOOOO.....'],
  ],
};

export const TPL = {
  // Procrastinación / Excusa
  slime: [
    '................',
    '................',
    '................',
    '................',
    '......GGGG......',
    '....GGGGGGGG....',
    '...GGGGGGGGGG...',
    '..GGggGGGGggGG..',
    '..GGEEGGGGEEGG..',
    '.GGGGGGGGGGGGGG.',
    '.GGGGGGggGGGGGG.',
    '.GGWGGGGGGGGGGG.',
    'GGGGGGGGGGGGGGGG',
    'gGGGGGGGGGGGGGGg',
    '.gggggggggggggg.',
    '................',
  ],
  phone: [
    '....KKKKKKKK....',
    '...KKKKKKKKKK...',
    '...KBBBBBBBBK...',
    '...KBBBBBBBBK...',
    '...KBRRBBRRBK...',
    '...KBRRBBRRBK...',
    '.ggKBBBBBBBBKgg.',
    '.g.KBBWWWWBBK.g.',
    '...KBWBWBWBBK...',
    '...KBBBBBBBBK...',
    '...KBBBBBBBBK...',
    '...KKKKKKKKKK...',
    '...KKKKWWKKKK...',
    '....KKKKKKKK....',
    '....gg....gg....',
    '...ggg....ggg...',
  ],
  couch: [
    '................',
    '................',
    '................',
    '...RRRRRRRRRR...',
    '..RRRRRRRRRRRR..',
    '..RRYYRRRRYYRR..',
    '..RRYERRRRYERR..',
    '..RRRRRRRRRRRR..',
    'RRRRrrrrrrrrRRRR',
    'RRRrWrWrWrWrrRRR',
    'RRRrrrrrrrrrrRRR',
    'RRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRR',
    'rrrrrrrrrrrrrrrr',
    '.rr..........rr.',
    '.rr..........rr.',
  ],
  burger: [
    '................',
    '................',
    '................',
    '.....TTTTTT.....',
    '...TTTTTTTTTT...',
    '..TTTWETTWETTT..',
    '..TTTTTTTTTTTT..',
    '.LLLLLLLLLLLLLL.',
    '.YYYYYYYYYYYYYY.',
    '.MMMMMMMMMMMMMM.',
    '.MMWMWMWMWMWMMM.',
    '.MMMMMMMMMMMMMM.',
    '..tttttttttttt..',
    '..TTTTTTTTTTTT..',
    '...TTTTTTTTTT...',
    '................',
  ],
  ghost: [
    '................',
    '......VVVV......',
    '....VVVVVVVV....',
    '...VVVVVVVVVV...',
    '..VVVWWVVWWVVV..',
    '..VVVWEVVWEVVV..',
    '..VVVVVVVVVVVV..',
    '..VVVVvvvvVVVV..',
    '..VVVvVVVVvVVV..',
    '..VVVVVVVVVVVV..',
    '.VVVVVVVVVVVVVV.',
    '.VVVVVVVVVVVVVV.',
    '..VVVVVVVVVVVV..',
    '..VV.VVV.VVV.VV.',
    '..V...V...V...V.',
    '................',
  ],
  question: [
    '................',
    '....QQQQQQ......',
    '...QQQQQQQQ.....',
    '..QQWEQQWEQQ....',
    '..QQ......QQ....',
    '..........QQ....',
    '.........QQQ....',
    '........QQQ.....',
    '.......QQQ......',
    '......QQQ.......',
    '......QQ........',
    '......QQ........',
    '................',
    '......QQ........',
    '......QQ........',
    '................',
  ],
  book: [
    '................',
    '................',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..BBWWBBBBWWBB..',
    '..BBWEBBBBWEBB..',
    '..BBBBBBBBBBBB..',
    '..BBRRRRRRRRBB..',
    '..BBRWRWRWRWBB..',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..WWWWWWWWWWWW..',
    '..bbbbbbbbbbbb..',
    '...b........b...',
    '..bb........bb..',
    '................',
  ],
  suit: [
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    '..KKKKKKKKKKKK..',
    '....SSSSSSSS....',
    '....SESSSSES....',
    '....SSSSSSSS....',
    '....SSMMMMSS....',
    '.....SSSSSS.....',
    '...KKKWRRWKKK...',
    '..KKKKWRRWKKKK..',
    '..KKKKKRRKKKKK..',
    '..KKKKKRRKKKKK..',
    '..SKKKKKKKKKKS..',
    '....KKKKKKKK....',
    '....KK....KK....',
    '....KK....KK....',
  ],
  // Perros (mirando a la derecha)
  piti: [
    '...........dD...',
    '..........DDDD..',
    'd.........DDEDD.',
    '.dDDDDDDDDDDDDDn',
    '..DDDDDDDDDDDd..',
    '..DDDDDDDDDDD...',
    '..Dd......Dd....',
    '..dd......dd....',
  ],
  catalina: [
    '..........CC....',
    '.........CCCC...',
    '.........CEmmm..',
    'C........CCmmm..',
    '.CCCCCCCCCCWW...',
    '.CCCCCCCCCCW....',
    '.CCWWCCCCCCW....',
    '.CCWWWWCCCC.....',
    '.CC.C....CC.C...',
    '.CC.C....WC.C...',
    '.WW.W....WW.W...',
  ],
};
export const DOG_PAL = {
  piti: { D: '#8b5a2b', d: '#5e3a1a', E: '#111', n: '#111' },
  catalina: { C: '#d9a066', W: '#fbf5e9', m: '#2b2118', E: '#111' },
};

// ---------- utilidades de canvas ----------
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return c;
}

export function drawTpl(ctx, tpl, ox, oy, colorFn, flip = false) {
  const w = tpl[0].length;
  for (let y = 0; y < tpl.length; y++) {
    const row = tpl[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const col = colorFn(ch, x, y);
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(ox + (flip ? w - 1 - x : x), oy + y, 1, 1);
    }
  }
}

const cache = new Map();
function cached(key, w, h, fn) {
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(w, h);
  fn(c.getContext('2d'));
  cache.set(key, c);
  return c;
}
export function clearSpriteCache() { cache.clear(); }

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r * f)));
  g = Math.max(0, Math.min(255, Math.round(g * f)));
  b = Math.max(0, Math.min(255, Math.round(b * f)));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function applyHair(tpl, style, dir) {
  const t = tpl.map((r) => r.split(''));
  const set = (x, y, ch) => { if (t[y] && t[y][x] !== undefined) t[y][x] = ch; };
  if (style === 'giuli') {
    if (dir === 'down') {
      // costados hasta la oreja
      for (const x of [2, 13]) for (let y = 2; y <= 7; y++) set(x, y, 'H');
      set(2, 8, 'h'); set(13, 8, 'h');
      // flequillo barrido hacia un costado
      for (let x = 3; x <= 10; x++) set(x, 3, 'H');
      set(9, 4, 'H'); set(10, 4, 'H'); set(11, 4, 'h');
      // reflejo claro siguiendo el barrido
      set(5, 1, 'L'); set(6, 1, 'L'); set(7, 2, 'L'); set(8, 2, 'L'); set(9, 3, 'L');
    } else if (dir === 'up') {
      for (const x of [2, 13]) for (let y = 2; y <= 8; y++) set(x, y, 'H');
      for (let x = 3; x <= 12; x++) { set(x, 7, 'H'); set(x, 8, 'h'); }
      for (let x = 5; x <= 10; x++) set(x, 9, 'h');
      set(5, 1, 'L'); set(6, 1, 'L'); set(7, 2, 'L'); set(8, 3, 'L');
    } else {
      for (let y = 3; y <= 9; y++) set(3, y, 'H');
      for (let y = 7; y <= 9; y++) set(4, y, 'h');
      for (let x = 8; x <= 12; x++) set(x, 3, 'H');
      set(12, 4, 'h');
      set(6, 1, 'L'); set(7, 2, 'L'); set(8, 2, 'L'); set(9, 3, 'L');
    }
  } else if (style === 'coleta') {
    // pelo atado: más volumen atrás y colita
    if (dir === 'down') {
      for (const x of [2, 13]) for (let y = 3; y <= 6; y++) set(x, y, 'H');
      set(4, 3, 'H'); set(5, 3, 'H'); set(10, 3, 'H'); set(11, 3, 'H');
      set(5, 1, 'L'); set(6, 1, 'L'); set(9, 2, 'L');
      set(14, 7, 'H'); set(14, 8, 'h'); set(14, 9, 'h');
    } else if (dir === 'up') {
      for (const x of [2, 13]) for (let y = 3; y <= 6; y++) set(x, y, 'H');
      set(7, 7, 'h'); set(8, 7, 'h');
      for (let y = 8; y <= 12; y++) { set(7, y, 'H'); set(8, y, 'H'); }
      set(7, 13, 'h'); set(8, 13, 'L');
      set(5, 1, 'L'); set(9, 2, 'L'); set(6, 4, 'L');
    } else {
      for (let y = 3; y <= 6; y++) set(3, y, 'H');
      set(2, 6, 'H'); set(1, 7, 'H'); set(1, 8, 'H'); set(1, 9, 'h'); set(2, 7, 'h');
      set(6, 1, 'L'); set(9, 2, 'L');
    }
  } else if (style === 'rapado') {
    for (let x = 0; x < 16; x++) { if (t[0][x] === 'H') t[0][x] = '.'; }
    if (dir !== 'up') for (let x = 0; x < 16; x++) { if (t[1][x] === 'H') t[1][x] = '.'; }
  } else if (style === 'largo') {
    const cols = dir === 'side' ? [3] : [2, 13];
    for (const c of cols) for (let y = 3; y <= 9; y++) set(c, y, 'H');
    if (dir === 'up') for (let y = 7; y <= 9; y++) for (let x = 4; x <= 11; x++) set(x, y, 'H');
  } else if (style === 'flequillo') {
    if (dir === 'down') for (let x = 4; x <= 9; x++) set(x, 3, 'H');
    if (dir === 'side') for (let x = 9; x <= 12; x++) set(x, 3, 'H');
  } else if (style === 'mohicano') {
    for (let y = 0; y <= 2; y++) for (let x = 0; x < 16; x++) {
      if (t[y][x] === 'H' && (x < 6 || x > 9)) t[y][x] = y === 2 ? 'S' : '.';
    }
    if (dir !== 'up') for (let x = 0; x < 16; x++) if (t[3][x] === 'H' && (x < 6 || x > 9)) t[3][x] = 'S';
    if (dir === 'up') for (let y = 3; y <= 6; y++) for (let x = 0; x < 16; x++) if (t[y][x] === 'H' && (x < 6 || x > 9)) t[y][x] = 'S';
  }
  return t.map((r) => r.join(''));
}

/**
 * Sprite de Giuli (16x22, con 2px de margen arriba para accesorios).
 * look = { jersey:{pattern,a,b,n}, hair:{style,c,d}, boots:{c}, head }
 * dir: down | up | left | right ; frame: 0..2
 * mode: null | 'shadow' | 'rival'
 */
export function playerSprite(look, dir = 'down', frame = 0, mode = null) {
  const key = `p|${JSON.stringify(look)}|${dir}|${frame}|${mode}`;
  return cached(key, 16, 22, (ctx) => {
    const base = dir === 'up' ? P_UP : dir === 'down' ? P_DOWN : P_SIDE;
    const vdir = dir === 'left' || dir === 'right' ? 'side' : dir;
    let tpl = applyHair(base, look.hair?.style || 'corto', vdir);
    const legs = LEGS[vdir === 'side' ? 'side' : 'down'][frame % 3];
    tpl = [...tpl.slice(0, 17), ...legs];
    const j = look.jersey || { pattern: 'hoops', a: '#d62828', b: '#fff', n: '#1b1b1b' };
    let pal = {
      H: look.hair?.c || '#6b4226', h: look.hair?.d || '#4a2c17', L: look.hair?.l || look.hair?.c || '#a07a50',
      S: look.skin || '#f4cdb0', s: look.skinD || '#dfab8c', E: look.eye || '#3d5a6c', M: '#c27a72',
      P: look.shorts || '#f1f3f5', p: look.shorts ? shade(look.shorts, 0.8) : '#ced4da', K: look.socks || j.a, O: look.boots?.c || '#1b1b1b',
    };
    if (mode === 'rival') {
      pal = { ...pal, H: '#1b1b1b', h: '#000', L: '#1b1b1b', S: '#c68642', s: '#a0522d', P: '#1d3557', p: '#14213d', K: '#ffd60a', O: '#111' };
    }
    const jersey = (x, y) => {
      if (mode === 'rival') return (Math.floor((y - 10) / 2) % 2 === 0) ? '#1d3557' : '#ffd60a';
      switch (j.pattern) {
        case 'quarters': return ((x < 8) === (y < 13)) ? j.a : j.b;
        case 'hoops': return (Math.floor((y - 10) / 2) % 2 === 0) ? j.a : j.b;
        case 'vstripes': return (Math.floor(x / 2) % 2 === 0) ? j.a : j.b;
        case 'halves': return x < 8 ? j.a : j.b;
        case 'print': if (vdir !== 'down') return j.a; return (y >= 11 && y <= 13 && x >= 5 && x <= 10) ? (y === 11 || x === 5 || x === 10 ? (j.c || j.n) : j.b) : j.a;
        case 'rose': if (vdir !== 'down') return j.a; return (y >= 12 && y <= 13 && x >= 7 && x <= 9) ? ((x + y) % 2 ? j.b : '#2d6a4f') : (y === 11 && x >= 6 && x <= 10 ? (j.c || j.n) : j.a);
        case 'vneck': if (vdir === 'up') return j.a; return (y === 10 && (x === 7 || x === 8)) || (y === 11 && (x === 7 || x === 8)) ? (look.skin || '#f4cdb0') : j.a;
        default: return (y === 10 || y === 11) && (x === 3 || x === 12) ? j.b : j.a;
      }
    };
    const fn = (ch, x, y) => {
      let col;
      if (ch === 'J') col = jersey(x, y);
      else if (ch === 'N') col = mode === 'rival' ? '#fff' : (j.pattern === 'solid' ? j.n : j.n);
      else col = pal[ch];
      if (mode === 'shadow' && col) {
        if (ch === 'E') return '#ff1744';
        return shade('#3c096c', 0.6 + ((parseInt(col.slice(1, 3), 16) + parseInt(col.slice(3, 5), 16)) / 510) * 0.7);
      }
      return col;
    };
    const flip = dir === 'left';
    drawTpl(ctx, tpl, 0, 2, fn, flip);
    if (mode) return; // rivales y sombra sin accesorios
    const pp = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? 15 - x : x, y + 2, 1, 1); };
    if (look.beard) {
      const b = look.beard;
      if (vdir === 'down') {
        pp(3, 7, b); pp(12, 7, b);
        for (const x of [4, 5, 6, 9, 10, 11]) pp(x, 8, b);
        pp(6, 7, b); pp(7, 7, b); pp(8, 7, b); pp(9, 7, b);
        for (let x = 5; x <= 10; x++) pp(x, 9, b);
      } else if (vdir === 'side') {
        pp(5, 7, b); pp(6, 8, b); pp(7, 8, b); pp(8, 8, b); pp(9, 8, b); pp(10, 7, b); pp(11, 7, b); pp(6, 9, b); pp(7, 9, b);
      }
    }
    if (look.chain && vdir === 'down') {
      const c = '#e9ecef';
      pp(6, 10, c); pp(7, 11, c); pp(8, 11, c); pp(9, 10, c); pp(7, 12, '#adb5bd');
    }
    drawHead(ctx, look.head, vdir, flip);
  });
}

function drawHead(ctx, head, vdir, flip) {
  const px = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(flip ? 15 - x : x, y + 2, 1, 1); };
  const row = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) px(x, y, c); };
  switch (head) {
    case 'casco': {
      const c = '#c1121f', d = '#780000';
      row(4, 11, -1, c); row(3, 12, 0, c); row(3, 12, 1, d); row(3, 12, 2, c);
      if (vdir !== 'up') { px(3, 3, c); px(12, 3, c); px(3, 4, d); px(12, 4, d); row(4, 11, 8, '#00000033'); }
      break;
    }
    case 'vincha': row(3, 12, 3, '#ffd60a'); break;
    case 'gorra': case 'gorraVerde': case 'gorraGris': case 'gorraLevis': {
      const col = { gorra: ['#1d3557', '#457b9d', '#14213d'], gorraVerde: ['#2d9c4a', '#3fbf5f', '#1e6b33'], gorraGris: ['#d6d3cc', '#ece9e2', '#a8a49b'], gorraLevis: ['#f1ece0', '#f8f4ea', '#c1121f'] }[head];
      const [c, l, d] = col;
      row(4, 11, -1, c); row(3, 12, 0, c); row(3, 12, 1, c); row(3, 12, 2, l);
      if (head === 'gorraLevis') { row(6, 9, 0, '#c1121f'); row(4, 11, -1, '#1d3557'); }
      if (vdir === 'down') row(3, 12, 3, d);
      if (vdir === 'side') row(10, 14, 3, d);
      break;
    }
    case 'lentes':
      if (vdir === 'down') { row(4, 6, 5, '#111'); row(9, 11, 5, '#111'); row(4, 11, 4, '#111'); px(5, 6, '#111'); px(10, 6, '#111'); }
      if (vdir === 'side') { row(8, 12, 4, '#111'); row(9, 11, 5, '#111'); }
      break;
    case 'auris':
      row(3, 12, -1, '#222'); px(2, 0, '#222'); px(13, 0, '#222');
      if (vdir !== 'up') { px(2, 4, '#e63946'); px(2, 5, '#e63946'); px(13, 4, '#e63946'); px(13, 5, '#e63946'); }
      else { px(2, 4, '#e63946'); px(13, 4, '#e63946'); }
      break;
    case 'corona': {
      const g = '#ffd60a', o = '#e09f3e';
      row(5, 10, 0, g); row(5, 10, -1, o); px(5, -2, g); px(7, -2, g); px(8, -2, g); px(10, -2, g); px(7, -1, '#e63946');
      break;
    }
    default: break;
  }
}

export function monsterSprite(id, def) {
  if (def.tpl === 'player') {
    const look = { jersey: { pattern: 'hoops', a: '#1d3557', b: '#ffd60a', n: '#fff' }, hair: { style: 'rapado', c: '#1b1b1b', d: '#000' }, boots: { c: '#111' }, head: 'none' };
    return playerSprite(look, 'down', 0, def.shadow ? 'shadow' : 'rival');
  }
  const tpl = TPL[def.tpl];
  return cached('m|' + id, tpl[0].length, tpl.length, (ctx) => drawTpl(ctx, tpl, 0, 0, (ch) => def.pal[ch]));
}

export function dogSprite(name, frame = 0, flip = false) {
  const tpl = TPL[name];
  return cached(`d|${name}|${frame}|${flip}`, 16, tpl.length + 1, (ctx) => {
    let t = tpl;
    if (frame === 1) {
      // patitas alternadas
      t = tpl.map((r, y) => (y >= tpl.length - 2 ? r.replace(/^(..)(..)/, '$2$1') : r));
    }
    drawTpl(ctx, t, 0, frame === 1 ? 1 : 0, (ch) => DOG_PAL[name][ch], flip);
  });
}

// Dibuja un sprite (canvas) escalado
export function blit(ctx, spr, x, y, scale = 1) {
  ctx.drawImage(spr, Math.round(x), Math.round(y), spr.width * scale, spr.height * scale);
}

export function validateTemplates() {
  const bad = [];
  const check = (name, t) => t.forEach((r, i) => { if (r.length !== t[0].length) bad.push(`${name}[${i}] len ${r.length}`); });
  check('P_DOWN', P_DOWN); check('P_UP', P_UP); check('P_SIDE', P_SIDE);
  Object.entries(LEGS).forEach(([k, arr]) => arr.forEach((l, i) => check(`LEGS.${k}.${i}`, [P_DOWN[0], ...l])));
  Object.entries(TPL).forEach(([k, t]) => check(k, t));
  return bad;
}
