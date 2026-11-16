// =============================================================
//  INTERFAZ: pantallas, ventanas y notificaciones
// =============================================================
import { CATS, STATS, BAD_HABITS, CONSUMABLES, COSMETICS, SLOT_NAMES, ACHIEVEMENTS, CUSTOM_DIFF, PLAYER, MISSIONS } from './data.js';
import * as St from './state.js';
import { S } from './state.js';
import { playerSprite, dogSprite } from './pixel.js';
import { sfx } from './audio.js';
import { $, $$, fmt, signed, esc, timeAgo, dayKey } from './util.js';

// Escudo del club (dibujado en SVG)
export function crest(size = 40) {
  return `<svg class="crest" width="${size}" height="${size * 1.15}" viewBox="0 0 100 115" aria-label="Escudo Club Universitario">
    <path d="M10 8 Q30 2 50 4 Q70 2 90 8 Q86 14 90 22 L90 62 Q90 92 50 110 Q10 92 10 62 L10 22 Q14 14 10 8 Z" fill="#fff" stroke="#14141a" stroke-width="7" stroke-linejoin="round"/>
    <rect x="13" y="40" width="74" height="20" fill="#e53935"/>
    <path d="M30 20 h16 v6 h-4 v32 q0 12 8 12 q8 0 8 -12 v-32 h-4 v-6 h16 v6 h-4 v32 q0 22 -20 22 q-20 0 -20 -22 v-32 h-4 z" fill="#14141a"/>
    <text x="50" y="98" text-anchor="middle" font-family="Georgia, serif" font-size="13" fill="#14141a">1907</text>
  </svg>`;
}

export const ui = { tab: 'home', cat: 'rugby', shopTab: 'consumables' };

// ---------------- barra superior ----------------
export function renderTop() {
  const li = St.levelInfo();
  const rk = St.auraRank();
  $('#topbar').innerHTML = `
    <div class="lvl"><span class="lv">Nv</span><b>${li.level}</b></div>
    <div class="tb-main">
      <div class="xpbar" title="${fmt(li.cur)} / ${fmt(li.need)} XP"><i style="width:${(li.pct * 100).toFixed(1)}%"></i><span>${fmt(li.cur)} / ${fmt(li.need)} XP</span></div>
      <div class="res">
        <span title="Vida">❤️ ${fmt(S.hp)}/${fmt(St.maxHp())}</span>
        <span title="Energía para pelear y jugar: se gana con misiones reales">⚡ ${S.energy}/${St.maxEnergy()}</span>
        <span title="Oro">🪙 ${fmt(S.gold)}</span>
        <span title="Aura · ${esc(rk.name)}" style="color:${rk.color}">🗿 ${fmt(S.aura)}</span>
      </div>
    </div>`;
}

// ---------------- navegación ----------------
const TABS = [
  { id: 'home', icon: '🏠', name: 'Inicio' },
  { id: 'missions', icon: '📋', name: 'Misiones' },
  { id: 'world', icon: '🗺️', name: 'Mundo' },
  { id: 'shop', icon: '🛒', name: 'Tienda' },
  { id: 'ach', icon: '🏆', name: 'Logros' },
];
export function renderNav(onTab) {
  $('#nav').innerHTML = TABS.map((t) => `<button data-tab="${t.id}" class="${ui.tab === t.id ? 'on' : ''}"><span>${t.icon}</span><small>${t.name}</small></button>`).join('');
  $$('#nav button').forEach((b) => (b.onclick = () => { sfx('click'); onTab(b.dataset.tab); }));
}

export function render() {
  renderTop();
  const scr = $('#screen');
  if (ui.tab === 'world') return;
  const y = scr.scrollTop;
  if (ui.tab === 'home') scr.innerHTML = homeHTML();
  if (ui.tab === 'missions') scr.innerHTML = missionsHTML();
  if (ui.tab === 'shop') scr.innerHTML = shopHTML();
  if (ui.tab === 'ach') scr.innerHTML = achHTML();
  bindScreen();
  scr.scrollTop = y;
}

// ---------------- INICIO ----------------
function statBars() {
  return Object.entries(STATS).map(([k, s]) => {
    const i = St.statInfo(k);
    return `<div class="stat"><div class="st-h"><span>${s.icon} ${s.name}</span><b>Nv ${i.level}</b></div><div class="bar"><i style="width:${(i.pct * 100).toFixed(1)}%;background:${s.color}"></i></div></div>`;
  }).join('');
}
function homeHTML() {
  const se = St.season();
  const rk = St.auraRank();
  const today = St.todayEntries();
  const tXp = today.reduce((s, e) => s + (e.g?.xp || 0), 0);
  const tAura = today.reduce((s, e) => s + (e.g?.aura || 0), 0);
  const nM = today.filter((e) => e.k === 'm').length;
  const weekly = St.weeklyStatus();
  const bs = St.battleStats();
  const pctNext = rk.next ? Math.max(0, Math.min(1, (S.aura - Math.max(0, AURA_MIN(rk))) / (rk.next - Math.max(0, AURA_MIN(rk))))) : 1;
  const recent = [...S.log].reverse().slice(0, 12);
  return `
  <section class="season ${se.type}">
    <div><b>${se.short}</b><span>${esc(se.name)}</span></div>
    ${se.type === 'temporada' ? `<div class="todo-rojo">${crest(22)} #TodoRojoYBlanco</div>` : ''}
    <p>${esc(se.desc)}</p>
  </section>

  <section class="card hero">
    <div class="portrait"><canvas id="portrait" width="200" height="240"></canvas></div>
    <div class="hero-info">
      <div class="name-row"><h1>${PLAYER.name} <small>#${PLAYER.number}</small></h1>${crest(30)}</div>
      <div class="sub">${PLAYER.position} · ${PLAYER.club} · Nivel ${St.level()}</div>
      <div class="aura-rank" style="--c:${rk.color}">
        <div class="ar-top"><span>🗿 ${esc(rk.name)}</span><b>${fmt(S.aura)}</b></div>
        <div class="bar"><i style="width:${(pctNext * 100).toFixed(1)}%;background:${rk.color}"></i></div>
        <small>${rk.next ? `Próximo: ${esc(rk.nextName)} (${fmt(rk.next)})` : 'Rango máximo'}</small>
      </div>
      <div class="bstats"><span>⚔️ ${bs.atk}</span><span>🛡️ ${Math.round(bs.def)}</span><span>✨ ${bs.mag}</span><span>🎯 ${(bs.crit * 100).toFixed(0)}%</span></div>
    </div>
  </section>

  <section class="card today">
    <h2>Hoy</h2>
    <div class="tgrid">
      <div><b>${nM}</b><small>misiones</small></div>
      <div><b>${signed(tXp)}</b><small>XP</small></div>
      <div><b style="color:${tAura < 0 ? '#ef476f' : '#c77dff'}">${signed(tAura)}</b><small>aura</small></div>
    </div>
    <button class="btn big" data-go="missions">📋 Cargar lo que hice</button>
  </section>

  <section class="card">
    <h2>Stats</h2>
    <div class="stats">${statBars()}</div>
  </section>

  <section class="card">
    <h2>Misiones semanales</h2>
    <div class="quests">${weekly.map(questHTML('w')).join('')}</div>
  </section>

  <section class="card">
    <h2>🏉 Rugby</h2>
    <div class="tgrid four">
      <div><b>${fmt(St.H.count('partido'))}</b><small>partidos</small></div>
      <div><b>${fmt(St.H.count('try'))}</b><small>tries</small></div>
      <div><b>${fmt(St.H.count('tackle'))}</b><small>tackles</small></div>
      <div><b>${fmt(St.H.count('convocatoria'))}</b><small>convocatorias</small></div>
      <div><b>${fmt(St.H.count('entreno'))}</b><small>entrenos</small></div>
      <div><b>${fmt(St.H.count('buenpartido'))}</b><small>buenos</small></div>
      <div><b>${fmt(St.H.count('malpartido'))}</b><small>malos</small></div>
      <div><b>${fmt(S.wins)}</b><small>monstruos</small></div>
    </div>
  </section>

  <section class="card">
    <h2>Historial</h2>
    <div class="hist">${recent.length ? recent.map(histHTML).join('') : '<p class="muted">Todavía nada. ¡Cargá tu primera misión!</p>'}</div>
  </section>

  <section class="card">
    <button class="btn ghost" data-act="settings">⚙️ Ajustes, copia de seguridad e instalar</button>
  </section>`;
}
function AURA_MIN(rk) { return rk.min === -Infinity ? -1000 : rk.min; }

function questHTML(kind) {
  return (q) => `
    <div class="quest ${q.done ? 'done' : ''} ${q.claimed ? 'claimed' : ''}">
      <div class="q-h"><span>${esc(q.name)}</span><small>${q.desc ? esc(q.desc) : ''}</small></div>
      <div class="bar"><i style="width:${((q.progress / q.target) * 100).toFixed(1)}%"></i><span>${q.progress}/${q.target}</span></div>
      <div class="q-r">${q.reward.gold ? `🪙${fmt(q.reward.gold)} ` : ''}${q.reward.xp ? `⭐${fmt(q.reward.xp)} ` : ''}${q.reward.aura ? `🗿${fmt(q.reward.aura)}` : ''}
        ${q.claimed ? '<b class="ok">✔ Cobrado</b>' : q.done ? `<button class="btn sm gold" data-claim="${kind}:${q.id}">Cobrar</button>` : ''}
      </div>
    </div>`;
}

function histHTML(e) {
  const def = e.k === 'm' ? St.missionDef(e.id) : null;
  let icon = '🎁', name = e.label || '';
  if (e.k === 'm') { icon = def?.icon || '⭐'; name = (def?.name || e.id) + (e.n > 1 ? ` ×${e.n}` : ''); }
  if (e.k === 'b') { const b = BAD_HABITS.find((x) => 'f_' + x.id === e.id); icon = '😔'; name = `Caíste: ${b?.name || ''}`; }
  if (e.k === 'r') { const b = BAD_HABITS.find((x) => 'r_' + x.id === e.id); icon = '💪'; name = `Resististe: ${b?.name || ''}`; }
  if (e.k === 'w') { icon = '⚔️'; name = `Venciste a un monstruo`; }
  if (e.k === 'g') { icon = '🎮'; name = 'Minijuego'; }
  if (e.k === 'a') icon = '🏆';
  if (e.k === 'q') icon = '📜';
  const g = e.g || {};
  const undo = ['m', 'b', 'r'].includes(e.k) && Date.now() - e.t < 3 * 86400000;
  return `<div class="h-row"><span class="hi">${icon}</span><div class="hn"><div>${esc(name)}</div><small>${timeAgo(e.t)} · ${g.xp ? `${signed(g.xp)} XP ` : ''}${g.aura ? `${signed(g.aura)} aura ` : ''}${g.gold ? `${signed(g.gold)} oro` : ''}${g.hp && g.hp < 0 ? ` ${g.hp} vida` : ''}</small></div>${undo ? `<button class="btn sm ghost" data-undo="${e.t}">Deshacer</button>` : ''}</div>`;
}

// retrato animado con aura
let portraitRaf = 0;
export function animatePortrait() {
  cancelAnimationFrame(portraitRaf);
  const c = $('#portrait');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const rk = St.auraRank();
  const spr = playerSprite(St.look(), 'down', 0);
  const parts = Array.from({ length: 18 }, () => ({ x: Math.random(), y: Math.random(), s: 0.3 + Math.random() * 0.7 }));
  const loop = (t) => {
    if (!document.body.contains(c)) return;
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    const strength = S.aura >= 1000 ? Math.min(1, 0.35 + rk.idx * 0.1) : S.aura < 0 ? 0.2 : 0.12;
    const pulse = 0.75 + 0.25 * Math.sin(t / 400);
    const g = ctx.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, w * 0.6);
    g.addColorStop(0, rk.color + Math.round(strength * pulse * 255).toString(16).padStart(2, '0'));
    g.addColorStop(1, rk.color + '00');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    if (S.aura >= 1000) {
      ctx.fillStyle = rk.color;
      for (const p of parts) {
        p.y -= 0.004 * p.s; if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        ctx.globalAlpha = 0.6 * p.s;
        ctx.fillRect(p.x * w, p.y * h, 4 * p.s + 1, 4 * p.s + 1);
      }
      ctx.globalAlpha = 1;
    }
    const sc = 9;
    const bob = Math.round(Math.sin(t / 500) * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(w / 2, h - 18, 50, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(spr, w / 2 - 8 * sc, h - 22 * sc - 16 + bob, 16 * sc, 22 * sc);
    portraitRaf = requestAnimationFrame(loop);
  };
  portraitRaf = requestAnimationFrame(loop);
}

// ---------------- MISIONES ----------------
function missionsHTML() {
  const chips = [...CATS, { id: 'desafios', name: 'Desafíos', icon: '📜' }, { id: 'mias', name: 'Mis misiones', icon: '⭐' }];
  let body = '';
  if (ui.cat === 'bad') body = badHTML();
  else if (ui.cat === 'desafios') body = challengesHTML();
  else if (ui.cat === 'mias') body = customHTML();
  else {
    const list = St.allMissions().filter((m) => m.cat === ui.cat);
    const se = St.season();
    const avail = list.filter(St.missionAvailable);
    const other = list.filter((m) => !St.missionAvailable(m));
    body = avail.map(missionCard).join('') +
      (other.length ? `<div class="off-season"><h3>${se.type === 'vacaciones' ? '🔒 Vuelven en la temporada (febrero)' : '🔒 Solo en vacaciones (nov–ene)'}</h3>${other.map((m) => `<div class="mcard locked"><span class="mi">${m.icon}</span><div class="mn"><b>${esc(m.name)}</b></div></div>`).join('')}</div>` : '') +
      `<button class="btn ghost" data-act="newcustom" data-cat="${ui.cat}">➕ Agregar misión propia acá</button>`;
  }
  return `
  <div class="chips">${chips.map((c) => `<button class="chip ${ui.cat === c.id ? 'on' : ''}" data-cat="${c.id}">${c.icon} ${c.name}</button>`).join('')}</div>
  <div class="mlist">${body}</div>`;
}

function rewardLine(m) {
  const parts = [];
  if (m.xp) parts.push(`<span class="r xp">+${m.xp} XP</span>`);
  if (m.aura) parts.push(`<span class="r aura ${m.aura < 0 ? 'neg' : ''}">${m.aura > 0 ? '+' : ''}${fmt(m.aura)} aura</span>`);
  if (m.gold) parts.push(`<span class="r gold">+${m.gold} 🪙</span>`);
  if (m.energy) parts.push(`<span class="r en">+${m.energy} ⚡</span>`);
  if (m.hp) parts.push(`<span class="r hp">+${m.hp} ❤️</span>`);
  for (const [k, v] of Object.entries(m.stats || {})) parts.push(`<span class="r st" style="color:${STATS[k].color}">${STATS[k].short}+${v}</span>`);
  return parts.join('');
}

function missionCard(m) {
  const done = St.todayCount(m.id);
  const full = done >= m.daily;
  const streak = St.streakOf(m.id);
  return `
    <div class="mcard ${full ? 'full' : ''}">
      <span class="mi">${m.icon}</span>
      <div class="mn">
        <b>${esc(m.name)}</b>
        ${m.desc ? `<small class="muted">${esc(m.desc)}</small>` : ''}
        <div class="rw">${rewardLine(m)}</div>
        <small class="meta">${m.counter ? `Hoy: ${done} ${m.unit}` : `Hoy ${done}/${m.daily}`}${streak > 1 ? ` · 🔥 racha ${streak} días` : ''}</small>
      </div>
      <button class="btn do" data-do="${m.id}" ${full ? 'disabled' : ''}>${full ? '✔' : m.counter ? '＋' : 'Hecho'}</button>
    </div>`;
}

function badHTML() {
  return `<p class="muted pad">Sé honesto: si caíste, perdés vida y aura. Si resististe hoy, ganás aura y disciplina. 💪</p>` +
    BAD_HABITS.map((b) => {
      const st = St.streakOf('r_' + b.id);
      const resisted = St.todayCount('r_' + b.id) >= 1;
      const falls = St.H.count('f_' + b.id);
      return `
      <div class="mcard bad">
        <span class="mi">${b.icon}</span>
        <div class="mn">
          <b>${esc(b.name)}</b>
          <div class="rw"><span class="r aura neg">Caer: -${fmt(b.aura)} aura · -${b.hp} ❤️</span><span class="r aura">Resistir: +${fmt(Math.round(b.aura / 2))} aura</span></div>
          <small class="meta">${st ? `🧼 ${st} días resistiendo` : 'Sin racha'} · caídas: ${falls}</small>
        </div>
        <div class="bb">
          <button class="btn sm good" data-resist="${b.id}" ${resisted ? 'disabled' : ''}>${resisted ? '✔ Hoy' : 'Resistí'}</button>
          <button class="btn sm bad" data-fall="${b.id}">Caí</button>
        </div>
      </div>`;
    }).join('');
}

function challengesHTML() {
  const se = St.season();
  return `
    <section class="card"><h2>Semana</h2><div class="quests">${St.weeklyStatus().map(questHTML('w')).join('')}</div></section>
    <section class="card"><h2>${esc(se.name)}</h2><p class="muted">${esc(se.desc)}</p><div class="quests">${St.seasonStatus().map(questHTML('s')).join('')}</div></section>`;
}

function customHTML() {
  const list = S.custom;
  return `<p class="muted pad">Creá misiones propias para lo que quieras: "Hacer el TP", "Llamar al cliente X", "Correr 10 km"...</p>` +
    (list.length ? St.allMissions().filter((m) => m.custom).map((m) => missionCard(m).replace('</button>\n    </div>', `</button><button class="btn sm ghost del" data-delc="${m.id}">🗑</button>\n    </div>`)).join('') : '') +
    `<button class="btn big" data-act="newcustom">➕ Nueva misión</button>`;
}

// ---------------- TIENDA ----------------
function shopHTML() {
  const tabs = [{ id: 'consumables', name: '🧉 Consumibles' }, ...Object.entries(SLOT_NAMES).map(([id, name]) => ({ id, name }))];
  let body = '';
  if (ui.shopTab === 'consumables') {
    body = CONSUMABLES.map((c) => `
      <div class="item">
        <div class="ii">${c.icon}</div>
        <div class="in"><b>${c.name}</b><small>${c.desc}</small><small class="muted">Tenés: ${S.inv[c.id] || 0}</small></div>
        <div class="ib"><button class="btn sm gold" data-buy="${c.id}" ${S.gold < c.price ? 'disabled' : ''}>🪙 ${c.price}</button>
        <button class="btn sm ghost" data-use="${c.id}" ${!(S.inv[c.id] > 0) || S.hp >= St.maxHp() ? 'disabled' : ''}>Usar</button></div>
      </div>`).join('');
  } else {
    body = COSMETICS.filter((c) => c.slot === ui.shopTab).map((c) => {
      const owned = S.owned.includes(c.id);
      const eq = S.equip[c.slot] === c.id;
      const ach = c.unlock ? ACHIEVEMENTS.find((a) => a.id === c.unlock) : null;
      let btn;
      if (eq) btn = `<button class="btn sm" disabled>Puesto</button>`;
      else if (owned) btn = `<button class="btn sm good" data-equip="${c.id}">Usar</button>`;
      else if (c.unlock) btn = `<button class="btn sm" disabled>🔒 Logro</button>`;
      else btn = `<button class="btn sm gold" data-buyc="${c.id}" ${S.gold < c.price ? 'disabled' : ''}>🪙 ${c.price}</button>`;
      return `
      <div class="item ${eq ? 'eq' : ''}">
        <canvas class="prev" data-prev="${c.id}" width="64" height="88"></canvas>
        <div class="in"><b>${esc(c.name)}</b>${ach ? `<small class="muted">Logro: ${esc(ach.name)}</small>` : ''}</div>
        <div class="ib">${btn}</div>
      </div>`;
    }).join('');
  }
  return `
    <div class="shop-head"><span>🛒 Kiosco del barrio</span><b>🪙 ${fmt(S.gold)}</b></div>
    <div class="chips">${tabs.map((t) => `<button class="chip ${ui.shopTab === t.id ? 'on' : ''}" data-shop="${t.id}">${t.name}</button>`).join('')}</div>
    <div class="items ${ui.shopTab !== 'consumables' ? 'grid' : ''}">${body}</div>`;
}
function drawPreviews() {
  $$('canvas.prev').forEach((cv) => {
    const c = COSMETICS.find((x) => x.id === cv.dataset.prev);
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (c.slot === 'pet') {
      const dogs = c.id === 'ambos' ? ['piti', 'catalina'] : c.id === 'ninguno' ? [] : [c.id];
      dogs.forEach((d, i) => { const s = dogSprite(d, 0, false); ctx.drawImage(s, 0, 10 + i * 40, 64, s.height * 4); });
      if (!dogs.length) { ctx.font = '30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🚫', 32, 55); }
      return;
    }
    const lk = St.look();
    if (c.slot === 'jersey') lk.jersey = c.look;
    if (c.slot === 'hair') lk.hair = c.look;
    if (c.slot === 'boots') lk.boots = c.look;
    if (c.slot === 'head') lk.head = c.id;
    ctx.drawImage(playerSprite(lk, 'down', 0), 0, 0, 64, 88);
  });
}

// ---------------- LOGROS ----------------
function achHTML() {
  const got = ACHIEVEMENTS.filter((a) => S.ach[a.id]).length;
  return `
    <div class="shop-head"><span>🏆 Logros</span><b>${got}/${ACHIEVEMENTS.length}</b></div>
    <div class="achs">${ACHIEVEMENTS.map((a) => `
      <div class="ach ${S.ach[a.id] ? 'got' : ''}">
        <div class="ai">${S.ach[a.id] ? a.icon : '🔒'}</div>
        <b>${esc(a.name)}</b>
        <small>${esc(a.desc)}</small>
        ${a.reward && (a.reward.gold || a.reward.aura) ? `<small class="muted">${a.reward.gold ? `🪙${fmt(a.reward.gold)} ` : ''}${a.reward.aura ? `🗿${fmt(a.reward.aura)}` : ''}</small>` : ''}
      </div>`).join('')}</div>`;
}

// ---------------- eventos de pantalla ----------------
let goTab = null;
export function setGoTab(fn) { goTab = fn; }

function bindScreen() {
  const scr = $('#screen');
  scr.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const d = b.dataset;
    if (d.go) { goTab(d.go); return; }
    if (d.cat) { ui.cat = d.cat; sfx('click'); render(); scr.scrollTop = 0; return; }
    if (d.shop) { ui.shopTab = d.shop; sfx('click'); render(); return; }
    if (d.do) return doMission(d.do);
    if (d.fall) return confirmFall(d.fall);
    if (d.resist) { const r = St.badResist(d.resist); if (r && r.msg) toast(r.msg); return; }
    if (d.undo) { St.undoEntry(+d.undo); toast('Deshecho ↩️'); return; }
    if (d.claim) { const [k, id] = d.claim.split(':'); sfx('coin'); k === 'w' ? St.claimWeekly(id) : St.claimSeason(id); return; }
    if (d.buy) { const r = St.buyConsumable(d.buy); r.ok ? sfx('coin') : toast(r.msg); return; }
    if (d.use) { const n = St.useConsumable(d.use); if (n) { sfx('heal'); toast(`+${n} de vida ❤️`); } return; }
    if (d.buyc) { const r = St.buyCosmetic(d.buyc); if (r.ok) { sfx('coin'); toast('¡Comprado y puesto! 😎'); } else toast(r.msg); return; }
    if (d.equip) { St.equip(d.equip); sfx('click'); return; }
    if (d.delc) { if (confirm('¿Borrar esta misión?')) St.removeCustom(d.delc); return; }
    if (d.act === 'settings') return settingsModal();
    if (d.act === 'newcustom') return customModal(d.cat);
  };
  if (ui.tab === 'home') animatePortrait();
  if (ui.tab === 'shop') drawPreviews();
}

function doMission(id) {
  const m = St.missionDef(id);
  if (!m) return;
  if (m.counter) return counterModal(m);
  const r = St.completeMission(id);
  if (!r.ok) toast(r.msg);
}

function confirmFall(id) {
  const b = BAD_HABITS.find((x) => x.id === id);
  modal(`
    <h2>${b.icon} ${esc(b.name)}</h2>
    <p>¿Caíste hoy? Perdés <b>${fmt(b.aura)} de aura</b> y <b>${b.hp} de vida</b>.</p>
    <p class="muted">Ser honesto también es disciplina. Mañana es otro día.</p>
    <div class="row"><button class="btn ghost" data-close>Cancelar</button><button class="btn bad" id="cf">Sí, caí</button></div>`);
  $('#cf').onclick = () => { closeModal(); St.badFall(id); };
}

function counterModal(m) {
  let n = 1;
  const draw = () => { $('#cn').textContent = n; $('#cprev').innerHTML = `+${fmt(m.xp * n)} XP · +${fmt(m.aura * n)} aura · +${fmt(m.gold * n)} oro`; };
  modal(`
    <h2>${m.icon} ${esc(m.name)}</h2>
    <p>¿Cuántos ${m.unit}?</p>
    <div class="stepper"><button class="btn" id="cm">−</button><b id="cn">1</b><button class="btn" id="cp">+</button></div>
    <p class="center" id="cprev"></p>
    <div class="row"><button class="btn ghost" data-close>Cancelar</button><button class="btn good" id="cok">Cargar</button></div>`);
  $('#cm').onclick = () => { n = Math.max(1, n - 1); draw(); };
  $('#cp').onclick = () => { n = Math.min(m.daily, n + 1); draw(); };
  $('#cok').onclick = () => { closeModal(); const r = St.completeMission(m.id, n); if (!r.ok) toast(r.msg); };
  draw();
}

function customModal(cat) {
  const cats = CATS.filter((c) => c.id !== 'bad');
  modal(`
    <h2>➕ Nueva misión</h2>
    <label>Nombre<input id="cname" maxlength="60" placeholder="Ej: Terminar el TP de la facu"></label>
    <label>Ícono (emoji)<input id="cicon" maxlength="4" placeholder="⭐" value="⭐"></label>
    <label>Categoría<select id="ccat">${cats.map((c) => `<option value="${c.id}" ${c.id === cat ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}</select></label>
    <label>Stat que sube<select id="cstat"><option value="">Según la categoría</option>${Object.entries(STATS).map(([k, s]) => `<option value="${k}">${s.icon} ${s.name}</option>`).join('')}</select></label>
    <label>Dificultad<select id="cdiff">${Object.entries(CUSTOM_DIFF).map(([k, d]) => `<option value="${k}" ${k === 'media' ? 'selected' : ''}>${d.name} (+${d.xp} XP, +${d.aura} aura)</option>`).join('')}</select></label>
    <label>Veces por día<input id="cdaily" type="number" min="1" max="10" value="1"></label>
    <div class="row"><button class="btn ghost" data-close>Cancelar</button><button class="btn good" id="csave">Crear</button></div>`);
  $('#csave').onclick = () => {
    const name = $('#cname').value.trim();
    if (!name) { $('#cname').focus(); return; }
    const c = $('#ccat').value;
    ui.cat = c;
    St.addCustom({ name, cat: c, diff: $('#cdiff').value, icon: $('#cicon').value.trim() || '⭐', daily: +$('#cdaily').value, stat: $('#cstat').value });
    closeModal();
    toast('Misión creada ✅');
  };
}

export function settingsModal() {
  modal(`
    <h2>⚙️ Ajustes</h2>
    <label class="toggle"><input type="checkbox" id="ssound" ${S.settings.sound ? 'checked' : ''}> Efectos de sonido</label>
    <label class="toggle"><input type="checkbox" id="smusic" ${S.settings.music ? 'checked' : ''}> Música</label>
    <h3>Copia de seguridad</h3>
    <p class="muted">Tu partida se guarda en este dispositivo. Bajate una copia cada tanto para no perderla.</p>
    <div class="row"><button class="btn" id="sexp">⬇️ Descargar copia</button><label class="btn ghost filebtn">⬆️ Cargar copia<input type="file" id="simp" accept=".json,application/json" hidden></label></div>
    <h3>Instalar en el celular</h3>
    <p class="muted"><b>Android (Chrome):</b> menú ⋮ → "Instalar app" o "Agregar a pantalla principal".<br><b>iPhone (Safari):</b> botón Compartir → "Agregar a inicio".<br><b>Compu (Chrome/Edge):</b> ícono de instalar en la barra de direcciones.</p>
    <h3>Zona peligrosa</h3>
    <button class="btn bad" id="sreset">Borrar partida</button>
    <div class="row"><button class="btn good" data-close>Cerrar</button></div>`);
  $('#ssound').onchange = (e) => { S.settings.sound = e.target.checked; St.save(); };
  $('#smusic').onchange = (e) => { S.settings.music = e.target.checked; St.save(); St.emit('music'); };
  $('#sexp').onclick = () => {
    const blob = new Blob([St.exportSave()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `giuli-rpg-${dayKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('#simp').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { St.importSave(await f.text()); closeModal(); toast('Partida cargada ✅'); } catch (err) { toast('Archivo inválido'); }
  };
  $('#sreset').onclick = () => {
    if (confirm('¿Seguro? Se borra TODO tu progreso.') && confirm('¿Segurísimo? No se puede deshacer.')) { St.resetSave(); closeModal(); toast('Partida nueva'); }
  };
}

// ---------------- ventanas / toasts / efectos ----------------
export function modal(html) {
  const m = $('#modal');
  m.innerHTML = `<div class="mbox">${html}</div>`;
  m.hidden = false;
  m.onclick = (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModal(); };
}
export function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }

export function toast(text, cls = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + cls;
  t.innerHTML = text;
  const box = $('#toasts');
  while (box.children.length >= 3) box.firstChild.remove();
  box.appendChild(t);
  setTimeout(() => t.classList.add('out'), 2600);
  setTimeout(() => t.remove(), 3100);
}

export function bigFx(html, cls = '', ms = 1800) {
  const b = document.createElement('div');
  b.className = 'bigfx ' + cls;
  b.innerHTML = html;
  $('#bigfx').appendChild(b);
  setTimeout(() => b.remove(), ms);
}

export function onGains({ g, label, icon, streak, bonus, bad, quiet }) {
  if (quiet) return;
  const parts = [];
  if (g.xp) parts.push(`${signed(g.xp)} XP`);
  if (g.gold) parts.push(`${signed(g.gold)} 🪙`);
  if (g.aura) parts.push(`<span style="color:${g.aura < 0 ? '#ef476f' : '#c77dff'}">${signed(g.aura)} aura</span>`);
  if (g.energy) parts.push(`${signed(g.energy)} ⚡`);
  if (g.hp) parts.push(`${signed(g.hp)} ❤️`);
  toast(`<b>${icon || ''} ${esc(label)}</b><br>${parts.join(' · ')}${streak > 1 ? `<br>🔥 Racha ${streak} días${bonus ? ` (+${Math.round(bonus * 100)}% XP)` : ''}` : ''}`, bad ? 'bad' : '');
  if (bad) { sfx('bad'); if (g.aura <= -100) bigFx(`<div class="aura-meme neg">${signed(g.aura)}<br><small>DE AURA 💀</small></div>`, 'neg'); return; }
  if (g.aura >= 500) { sfx('aura'); bigFx(`<div class="aura-meme">${signed(g.aura)}<br><small>DE AURA 🗿</small></div>`); }
  else sfx('done');
}
export function onLevelUp(l) {
  sfx('levelup');
  bigFx(`<div class="lvlup">¡NIVEL ${l}!<small>Vida al máximo · stats mejorados</small></div>`, 'lv', 2400);
}
export function onAchievement(a) {
  setTimeout(() => {
    sfx('coin');
    toast(`<b>🏆 Logro: ${esc(a.name)}</b><br>${esc(a.desc)}${a.unlock ? `<br>🎁 Desbloqueaste: ${esc(a.unlock.name)}` : ''}`, 'ach');
  }, 600);
}
export function onAuraRank(rk) {
  setTimeout(() => bigFx(`<div class="aura-meme rank" style="color:${rk.color}">NUEVO RANGO<br><small>${esc(rk.name)}</small></div>`, '', 2400), 900);
}

export { MISSIONS };
