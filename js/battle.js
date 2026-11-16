// =============================================================
//  COMBATE POR TURNOS
// =============================================================
import { MONSTERS, SKILLS, CONSUMABLES } from './data.js';
import { S, battleStats, level, auraRank, grant, setHp, useConsumable, look, save, emit } from './state.js';
import { playerSprite, monsterSprite, makeCanvas } from './pixel.js';
import { sfx, playMusic } from './audio.js';
import { rand, randi, pick, clamp, fmt, esc } from './util.js';

let B = null;

export function startBattle(monsterId, zone, onEnd) {
  const def = MONSTERS[monsterId];
  const ps = battleStats();
  const L = def.boss ? Math.max(level(), def.final ? 10 : 5) : clamp(level() + randi(-1, 1), 1, 99);
  const k = (x, f) => Math.round(x * (1 + f * (L - 1)));
  B = {
    id: monsterId, def, zone, L,
    m: { hp: k(def.hp, 0.28), max: k(def.hp, 0.28), atk: k(def.atk, 0.2), def: k(def.def, 0.18) },
    p: { ...ps, hp: Math.max(1, S.hp) },
    guard: false, auraUsed: false, busy: false, over: false,
    fx: [], shakeM: 0, shakeP: 0, flashM: 0, flashP: 0, t: 0, onEnd,
    log: [`¡Apareció ${def.name}! (Nv. ${L})`, def.desc],
  };
  renderUI();
  playMusic(def.boss ? 'boss' : 'battle');
  requestAnimationFrame(loop);
}

function el(id) { return document.getElementById(id); }

function renderUI() {
  const ov = el('battle');
  ov.innerHTML = `
    <div class="b-scene"><canvas id="bcanvas"></canvas></div>
    <div class="b-panel">
      <div class="b-log" id="blog"></div>
      <div class="b-actions" id="bact"></div>
    </div>`;
  ov.hidden = false;
  const c = el('bcanvas');
  const r = c.parentElement.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.floor(r.width * dpr); c.height = Math.floor(r.height * dpr);
  B.dpr = dpr;
  B.canvas = c; B.ctx = c.getContext('2d');
  showActions();
  renderLog();
}

function renderLog() {
  const l = el('blog');
  if (!l) return;
  l.innerHTML = B.log.slice(-3).map((t) => `<div>${esc(t)}</div>`).join('');
}
function say(t) { B.log.push(t); renderLog(); }

function showActions() {
  const a = el('bact');
  const L = level();
  if (B.over) {
    a.innerHTML = `<button class="btn big" id="bexit">Volver al mapa</button>`;
    el('bexit').onclick = end;
    return;
  }
  const items = CONSUMABLES.filter((c) => (S.inv[c.id] || 0) > 0);
  a.innerHTML = SKILLS.map((s) => {
    let dis = L < s.lvl;
    let sub = dis ? `Nv. ${s.lvl}` : s.desc;
    if (s.id === 'aura') {
      if (B.auraUsed) { dis = true; sub = 'Ya usado'; }
      else if (S.aura < 500) { dis = true; sub = 'Necesitás 500 de aura'; }
    }
    return `<button class="skill" data-s="${s.id}" ${dis || B.busy ? 'disabled' : ''}><span class="si">${s.icon}</span><span class="sn">${s.name}</span><span class="ss">${sub}</span></button>`;
  }).join('') + `
    <button class="skill" data-s="item" ${B.busy || !items.length ? 'disabled' : ''}><span class="si">🎒</span><span class="sn">Objetos</span><span class="ss">${items.length ? items.map((i) => i.icon + '×' + S.inv[i.id]).join(' ') : 'Vacío'}</span></button>
    <button class="skill" data-s="run" ${B.busy ? 'disabled' : ''}><span class="si">🏃</span><span class="sn">Huir</span><span class="ss">${B.def.boss ? 'No se puede' : '70%'}</span></button>`;
  a.querySelectorAll('button[data-s]').forEach((b) => (b.onclick = () => act(b.dataset.s)));
}

function showItems() {
  const a = el('bact');
  const items = CONSUMABLES.filter((c) => (S.inv[c.id] || 0) > 0);
  a.innerHTML = items.map((c) => `<button class="skill" data-i="${c.id}"><span class="si">${c.icon}</span><span class="sn">${c.name} ×${S.inv[c.id]}</span><span class="ss">${c.desc}</span></button>`).join('') + `<button class="skill" data-i="back"><span class="si">↩️</span><span class="sn">Volver</span><span class="ss"></span></button>`;
  a.querySelectorAll('button[data-i]').forEach((b) => (b.onclick = () => {
    if (b.dataset.i === 'back') return showActions();
    const before = S.hp;
    S.hp = B.p.hp;
    const healed = useConsumable(b.dataset.i);
    B.p.hp = S.hp;
    S.hp = before;
    sfx('heal');
    float(`+${healed}`, 'p', '#06d6a0');
    say(`Usaste ${CONSUMABLES.find((c) => c.id === b.dataset.i).name}. +${healed} de vida.`);
    B.busy = true; showActions();
    setTimeout(enemyTurn, 700);
  }));
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function float(text, who, color, big = false) {
  B.fx.push({ text, who, color, t: 0, big });
}

function dmg(power, def) {
  return Math.max(1, Math.round(power * rand(0.9, 1.1) - def * 0.5));
}

async function act(s) {
  if (B.busy || B.over) return;
  if (s === 'item') return showItems();
  B.busy = true; showActions();
  const p = B.p, m = B.m;
  const hitM = (d, crit) => {
    m.hp = Math.max(0, m.hp - d);
    B.shakeM = 0.3; B.flashM = 0.2;
    sfx(crit ? 'crit' : 'hit');
    float(`-${d}${crit ? '!' : ''}`, 'm', crit ? '#ffd166' : '#fff', crit);
  };
  const tryCrit = () => Math.random() < p.crit;
  switch (s) {
    case 'tackle': {
      if (Math.random() > 0.95) { say('¡Tackle errado!'); sfx('miss'); break; }
      const c = tryCrit();
      const d = dmg(p.atk * (c ? 1.8 : 1), m.def);
      hitM(d, c); say(`¡Tackle! ${d} de daño${c ? ' (CRÍTICO)' : ''}.`);
      break;
    }
    case 'pase': {
      for (let i = 0; i < 2; i++) {
        const c = tryCrit();
        const d = dmg(p.atk * 0.55 * (c ? 1.8 : 1), m.def * 0.5);
        hitM(d, c);
        await wait(280);
      }
      say('¡Pase rápido! Dos golpes seguidos.');
      break;
    }
    case 'patada': {
      if (Math.random() > 0.85) { say('El box kick se fue largo...'); sfx('miss'); break; }
      const c = tryCrit();
      const d = dmg(p.mag * 1.3 * (c ? 1.8 : 1), m.def * 0.3);
      hitM(d, c); say(`¡Box kick perfecto! ${d} de daño.`);
      break;
    }
    case 'scrum': {
      if (Math.random() > 0.8) { say('¡El scrum se desarmó! Fallaste.'); sfx('miss'); break; }
      const c = tryCrit();
      const d = dmg(p.atk * 1.8 * (c ? 1.8 : 1), m.def);
      hitM(d, c); say(`¡Salida de scrum devastadora! ${d} de daño.`);
      break;
    }
    case 'aura': {
      B.auraUsed = true;
      const rk = auraRank();
      const d = dmg((p.atk + p.mag) * (1.2 + rk.idx * 0.3), 0);
      sfx('aura');
      B.auraFx = 1.2;
      float('+1000 AURA', 'p', '#c77dff', true);
      await wait(600);
      hitM(d, true);
      say(`🗿 ATAQUE DE AURA (${rk.name}): ${d} de daño.`);
      break;
    }
    case 'defender': {
      B.guard = true;
      const heal = Math.round(p.maxHp * 0.06);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      float(`+${heal}`, 'p', '#06d6a0');
      sfx('heal');
      say('Te cubrís y respirás hondo.');
      break;
    }
    case 'run': {
      if (B.def.boss) { say('¡No podés huir de un jefe!'); B.busy = false; showActions(); return; }
      if (Math.random() < 0.7) {
        say('Te escapaste por el lateral.');
        B.over = true; B.result = 'run';
        B.busy = false; showActions();
        return;
      }
      say('¡No pudiste escapar!');
      break;
    }
  }
  await wait(650);
  if (m.hp <= 0) return win();
  enemyTurn();
}

async function enemyTurn() {
  const p = B.p, m = B.m;
  const move = pick(B.def.moves);
  const special = Math.random() < 0.3;
  if (Math.random() < p.dodge) {
    say(`${B.def.name} usó "${move}"... ¡lo esquivaste!`);
    sfx('miss');
    float('ESQUIVE', 'p', '#4cc9f0');
  } else {
    let d = dmg(m.atk * (special ? 1.4 : 1), p.def);
    if (B.guard) d = Math.max(1, Math.round(d * 0.4));
    p.hp = Math.max(0, p.hp - d);
    B.shakeP = 0.3; B.flashP = 0.2;
    sfx('hit');
    float(`-${d}`, 'p', '#ef476f');
    say(`${B.def.name} usó "${move}". Te hizo ${d} de daño.`);
  }
  B.guard = false;
  await wait(500);
  if (p.hp <= 0) return lose();
  B.busy = false;
  showActions();
}

function win() {
  B.over = true; B.result = 'win';
  sfx('win');
  const def = B.def;
  const xp = Math.round(def.xp * (1 + 0.15 * (B.L - 1)));
  const gold = Math.round(def.gold * (1 + 0.1 * (B.L - 1)) * rand(0.8, 1.2));
  const aura = def.aura || 30 + B.L * 5;
  S.wins++;
  S.defeated[B.id] = (S.defeated[B.id] || 0) + 1;
  S.hp = B.p.hp;
  let drop = '';
  if (Math.random() < 0.25) { const it = pick(['mate', 'alfajor', 'alfajor', 'isotonica']); S.inv[it] = (S.inv[it] || 0) + 1; drop = ` y encontraste ${CONSUMABLES.find((c) => c.id === it).icon}`; }
  grant({ xp, gold, aura, stats: { fue: 2, int: 1 } }, null, 'w', B.id);
  say(`¡Venciste a ${def.name}! +${fmt(xp)} XP, +${fmt(gold)} oro, +${fmt(aura)} aura${drop}.`);
  if (def.final) say('🏆 ¡Le ganaste al Giuli de Ayer! Hoy sos mejor que ayer.');
  B.busy = false;
  showActions();
}

function lose() {
  B.over = true; B.result = 'lose';
  sfx('lose');
  const lost = Math.round(S.gold * 0.15);
  S.gold -= lost;
  S.losses++;
  setHp(Math.round(battleStats().maxHp * 0.3));
  say(`Te ganó ${B.def.name}... Perdiste ${fmt(lost)} oro. Volvés a casa con un poco de vida.`);
  say('Completá misiones reales para hacerte más fuerte. 💪');
  save(); emit('change');
  B.busy = false;
  showActions();
}

function end() {
  const ov = el('battle');
  ov.hidden = true; ov.innerHTML = '';
  if (B.result === 'run') { S.hp = B.p.hp; save(); emit('change'); }
  const r = B.result;
  const cb = B.onEnd;
  B = null;
  cb?.(r);
}

// ---------- dibujo de la escena ----------
function bg(ctx, w, h, zone) {
  const sky = { club: ['#4cc9f0', '#90e0ef'], gym: ['#495057', '#6c757d'], facu: ['#a2d2ff', '#cdb4db'], casa: ['#ffd6a5', '#ffadad'], plaza: ['#8ecae6', '#bde0fe'] }[zone] || ['#8ecae6', '#caf0f8'];
  const g = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const ground = { club: '#43a047', gym: '#adb5bd', facu: '#b08968', casa: '#90be6d' }[zone] || '#5a9e4b';
  ctx.fillStyle = ground; ctx.fillRect(0, h * 0.55, w, h * 0.45);
  if (zone === 'club') {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) ctx.fillRect(0, h * (0.62 + i * 0.1), w, 3 * B.dpr);
    // palos
    const px = w * 0.82, pw = 4 * B.dpr;
    ctx.fillRect(px, h * 0.18, pw, h * 0.4); ctx.fillRect(px + 40 * B.dpr, h * 0.18, pw, h * 0.4); ctx.fillRect(px, h * 0.42, 40 * B.dpr, pw);
  }
  // plataformas
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(w * 0.7, h * 0.5, w * 0.16, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(w * 0.28, h * 0.86, w * 0.18, h * 0.05, 0, 0, Math.PI * 2); ctx.fill();
}

function bar(ctx, x, y, w, h, pct, col, label, sub) {
  const d = B.dpr;
  ctx.fillStyle = 'rgba(20,24,43,0.9)';
  ctx.fillRect(x - 6 * d, y - 22 * d, w + 12 * d, h + 30 * d);
  ctx.fillStyle = '#fff';
  ctx.font = `${9 * d}px "Press Start 2P", monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y - 8 * d);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#adb5bd';
  ctx.fillText(sub, x + w, y - 8 * d);
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = pct > 0.5 ? col : pct > 0.2 ? '#ffd166' : '#ef476f';
  ctx.fillRect(x, y, w * clamp(pct, 0, 1), h);
}

function loop(ts) {
  if (!B || !B.ctx) return;
  const dt = Math.min(0.05, (ts - (B.last || ts)) / 1000);
  B.last = ts; B.t += dt;
  const ctx = B.ctx, w = B.canvas.width, h = B.canvas.height, d = B.dpr;
  ctx.imageSmoothingEnabled = false;
  bg(ctx, w, h, B.zone);

  const unit = Math.min(w / 16 / 4.2, h / 22 / 2.2);
  const ms = monsterSprite(B.id, B.def);
  const mScale = unit * (B.def.boss ? 1.6 : 1.35) * (B.def.tpl === 'player' ? 1.1 : 1.4);
  const mx = w * 0.7, my = h * 0.5;
  const shakeM = B.shakeM > 0 ? Math.sin(B.t * 80) * 6 * d : 0;
  let alpha = 1;
  if (B.m.hp <= 0) { B.deadT = (B.deadT || 0) + dt; alpha = Math.max(0, 1 - B.deadT * 1.5); }
  if (alpha > 0) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(ms, mx - (ms.width * mScale) / 2 + shakeM, my - ms.height * mScale + Math.sin(B.t * 3) * 3 * d, ms.width * mScale, ms.height * mScale);
    ctx.globalAlpha = 1;
  }

  const ps = playerSprite(look(), 'up', 0);
  const pScale = unit * 1.6;
  const px = w * 0.28, py = h * 0.86;
  const shakeP = B.shakeP > 0 ? Math.sin(B.t * 80) * 6 * d : 0;
  // aura alrededor del jugador
  const rk = auraRank();
  if (S.aura >= 1000 || B.auraFx > 0) {
    const a = 0.25 + 0.15 * Math.sin(B.t * 5) + (B.auraFx > 0 ? 0.4 : 0);
    const g = ctx.createRadialGradient(px, py - ps.height * pScale * 0.5, 4, px, py - ps.height * pScale * 0.5, ps.height * pScale * 0.8);
    g.addColorStop(0, rk.color + 'cc'); g.addColorStop(1, rk.color + '00');
    ctx.globalAlpha = clamp(a, 0, 1);
    ctx.fillStyle = g;
    ctx.fillRect(px - ps.height * pScale, py - ps.height * pScale * 1.4, ps.height * pScale * 2, ps.height * pScale * 1.6);
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(ps, px - (ps.width * pScale) / 2 + shakeP, py - ps.height * pScale, ps.width * pScale, ps.height * pScale);
  if (B.flashP > 0) { ctx.fillStyle = 'rgba(255,0,0,0.25)'; ctx.fillRect(0, 0, w, h); }
  if (B.auraFx > 0) { ctx.fillStyle = `rgba(199,125,255,${B.auraFx * 0.3})`; ctx.fillRect(0, 0, w, h); B.auraFx -= dt; }

  // barras
  const bw = Math.min(w * 0.42, 240 * d);
  bar(ctx, 14 * d, 34 * d, bw, 10 * d, B.m.hp / B.m.max, '#06d6a0', B.def.name.length > 13 ? B.def.name.slice(0, 12) + '…' : B.def.name, `Nv${B.L}`);
  bar(ctx, w - bw - 14 * d, h - 26 * d, bw, 10 * d, B.p.hp / B.p.maxHp, '#06d6a0', 'Giuli', `${Math.ceil(B.p.hp)}/${B.p.maxHp}`);

  // números flotantes
  for (const f of B.fx) {
    f.t += dt;
    const x = f.who === 'm' ? mx : px;
    const y = (f.who === 'm' ? my - ms.height * mScale * 0.6 : py - ps.height * pScale * 0.9) - f.t * 40 * d;
    ctx.globalAlpha = clamp(1.4 - f.t, 0, 1);
    ctx.font = `${(f.big ? 18 : 13) * d}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000'; ctx.fillText(f.text, x + 2, y + 2);
    ctx.fillStyle = f.color; ctx.fillText(f.text, x, y);
    ctx.globalAlpha = 1;
  }
  B.fx = B.fx.filter((f) => f.t < 1.5);
  B.shakeM -= dt; B.shakeP -= dt; B.flashM -= dt; B.flashP -= dt;
  requestAnimationFrame(loop);
}
