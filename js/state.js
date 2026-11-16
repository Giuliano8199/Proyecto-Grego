// =============================================================
//  ESTADO Y LÓGICA DEL JUEGO
// =============================================================
import { MISSIONS, BAD_HABITS, CUSTOM_DIFF, CAT_STAT, AURA_RANKS, ACHIEVEMENTS, WEEKLY, SEASON_CHALLENGES, COSMETICS, CONSUMABLES, seasonFor, STATS } from './data.js';
import { dayKey, addDays, weekStart, clamp, daysBetween } from './util.js';

const KEY = 'giuli-rpg-v1';
const listeners = {};
export function on(ev, fn) { (listeners[ev] ||= []).push(fn); }
export function emit(ev, data) { (listeners[ev] || []).forEach((f) => f(data)); }

export function defaultState() {
  return {
    v: 1,
    created: Date.now(),
    xp: 0, gold: 50, aura: 0, hp: 99, energy: 6,
    statXp: { fue: 0, res: 0, int: 0, car: 0, dis: 0, esp: 0 },
    counts: {}, catCounts: {}, streaks: {}, log: [],
    inv: { mate: 2, alfajor: 2 },
    owned: COSMETICS.filter((c) => c.price === 0 && !c.unlock).map((c) => c.id),
    bought: 0,
    equip: { jersey: 'club', head: 'none', hair: 'corto', boots: 'negros', pet: 'ambos' },
    ach: {}, defeated: {}, wins: 0, losses: 0,
    weekClaims: {}, seasonClaims: {}, custom: [],
    lastDay: dayKey(), restDay: null, petDay: {},
    best: { kicks: 0, tries: 0, trivia: 0, scrum: 0 },
    settings: { sound: true, music: true },
    world: null,
    seen: { intro: false },
  };
}

export let S = defaultState();

function merge(def, saved) {
  if (saved === null || typeof saved !== 'object' || Array.isArray(saved)) return saved ?? def;
  const out = { ...def };
  for (const k of Object.keys(saved)) {
    if (def && typeof def[k] === 'object' && def[k] !== null && !Array.isArray(def[k])) out[k] = merge(def[k], saved[k]);
    else out[k] = saved[k];
  }
  return out;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) S = merge(defaultState(), JSON.parse(raw));
  } catch (e) {
    console.warn('No se pudo cargar la partida', e);
  }
  // asegurar cosméticos gratis nuevos
  for (const c of COSMETICS) if (c.price === 0 && !c.unlock && !S.owned.includes(c.id)) S.owned.push(c.id);
  dailyTick();
  S.hp = Math.min(S.hp, maxHp());
  S.energy = Math.min(S.energy, maxEnergy());
  save();
}

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('No se pudo guardar', e); }
  }, 50);
}
export function saveNow() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
}
export function exportSave() { return JSON.stringify(S); }
export function importSave(json) {
  const data = JSON.parse(json);
  if (!data || typeof data !== 'object' || !('xp' in data)) throw new Error('Archivo inválido');
  S = merge(defaultState(), data);
  saveNow();
  emit('change');
}
export function resetSave() {
  S = defaultState();
  saveNow();
  emit('change');
}

// Al cambiar de día: recuperás 25% de vida por día que pasó
export function dailyTick() {
  const today = dayKey();
  if (S.lastDay !== today) {
    const days = Math.max(1, daysBetween(S.lastDay, today));
    S.hp = Math.min(maxHp(), S.hp + Math.round(maxHp() * 0.25 * days));
    S.lastDay = today;
  }
}

// ---------------- NIVELES ----------------
const needFor = (lvl) => Math.round(80 * Math.pow(lvl, 1.4));
export function levelInfo(xp = S.xp) {
  let lvl = 1, rest = Math.max(0, xp);
  while (rest >= needFor(lvl) && lvl < 999) { rest -= needFor(lvl); lvl++; }
  const need = needFor(lvl);
  return { level: lvl, cur: rest, need, pct: rest / need };
}
export const level = () => levelInfo().level;

const statNeed = (lvl) => Math.round(40 * Math.pow(lvl, 1.3));
export function statInfo(k) {
  let lvl = 1, rest = Math.max(0, S.statXp[k] || 0);
  while (rest >= statNeed(lvl) && lvl < 999) { rest -= statNeed(lvl); lvl++; }
  return { level: lvl, cur: rest, need: statNeed(lvl), pct: rest / statNeed(lvl) };
}
export const statLvl = (k) => statInfo(k).level;

export function maxHp() { return 80 + level() * 10 + statLvl('res') * 5 + statLvl('esp') * 4; }
export function maxEnergy() { return 10 + Math.floor(level() / 5); }

export function auraRank(a = S.aura) {
  let idx = 0;
  AURA_RANKS.forEach((r, i) => { if (a >= r.min) idx = i; });
  const r = AURA_RANKS[idx];
  const next = AURA_RANKS[idx + 1];
  return { idx, ...r, next: next ? next.min : null, nextName: next?.name };
}

export function battleStats() {
  const L = level();
  return {
    level: L,
    maxHp: maxHp(),
    atk: 5 + L * 2 + statLvl('fue') * 2,
    def: 2 + L + statLvl('res') * 1.5,
    mag: 5 + L * 2 + statLvl('int') * 2,
    crit: Math.min(0.4, 0.05 + statLvl('car') * 0.01),
    dodge: Math.min(0.25, 0.03 + statLvl('dis') * 0.008),
  };
}

// ---------------- MISIONES ----------------
export function season() { return seasonFor(new Date()); }

export function allMissions() {
  const custom = S.custom.map((c) => {
    const d = CUSTOM_DIFF[c.diff] || CUSTOM_DIFF.media;
    const st = c.stat || CAT_STAT[c.cat] || 'dis';
    return { id: c.id, cat: c.cat, icon: c.icon || '⭐', name: c.name, xp: d.xp, gold: d.gold, aura: d.aura, stats: { [st]: d.stat }, energy: d.energy, hp: 0, daily: c.daily || 1, counter: false, season: null, custom: true, desc: `Misión personalizada · ${d.name}` };
  });
  return [...MISSIONS, ...custom];
}
export function missionDef(id) { return allMissions().find((x) => x.id === id); }
export function missionAvailable(mi) { return !mi.season || mi.season === season().type; }

export function todayEntries() {
  const t = dayKey();
  return S.log.filter((e) => e.d === t);
}
export function todayCount(id) {
  return todayEntries().filter((e) => e.id === id && (e.k === 'm' || e.k === 'r')).reduce((s, e) => s + (e.n || 1), 0);
}

function applyGains(g, sign = 1) {
  S.xp = Math.max(0, S.xp + sign * (g.xp || 0));
  S.gold = Math.max(0, S.gold + sign * (g.gold || 0));
  S.aura += sign * (g.aura || 0);
  if (g.stats) for (const [k, v] of Object.entries(g.stats)) S.statXp[k] = Math.max(0, (S.statXp[k] || 0) + sign * v);
  S.energy = clamp(S.energy + sign * (g.energy || 0), 0, maxEnergy());
  S.hp = clamp(S.hp + sign * (g.hp || 0), 0, maxHp());
}

function bumpStreak(id) {
  const t = dayKey();
  const y = dayKey(addDays(new Date(), -1));
  const prev = S.streaks[id] ? { ...S.streaks[id] } : null;
  const st = S.streaks[id] || { n: 0, last: null, best: 0 };
  if (st.last !== t) {
    st.n = st.last === y ? st.n + 1 : 1;
    st.last = t;
    st.best = Math.max(st.best || 0, st.n);
  }
  S.streaks[id] = st;
  return prev;
}
export function streakOf(id) {
  const st = S.streaks[id];
  if (!st) return 0;
  const t = dayKey();
  const y = dayKey(addDays(new Date(), -1));
  return st.last === t || st.last === y ? st.n : 0;
}

function pushLog(entry) {
  S.log.push({ t: Date.now(), d: dayKey(), ...entry });
  if (S.log.length > 6000) S.log.splice(0, S.log.length - 6000);
}

function afterChange(before) {
  const lvlNow = level();
  if (lvlNow > before.level) {
    S.hp = maxHp();
    emit('levelup', lvlNow);
  }
  const rankNow = auraRank().idx;
  if (rankNow > before.rank) emit('aurarank', auraRank());
  checkAchievements();
  save();
  emit('change');
}
const snapshot = () => ({ level: level(), rank: auraRank().idx });

// Completar una misión real
export function completeMission(id, qty = 1) {
  const mi = missionDef(id);
  if (!mi) return { ok: false, msg: 'Misión no encontrada' };
  if (!missionAvailable(mi)) return { ok: false, msg: 'Esta misión es de la otra temporada' };
  qty = Math.max(1, Math.floor(qty));
  const done = todayCount(id);
  if (done + qty > mi.daily) return { ok: false, msg: `Límite diario: ${mi.daily}` };
  const before = snapshot();
  const g = {
    xp: mi.xp * qty, gold: mi.gold * qty, aura: mi.aura * qty,
    energy: mi.energy * qty, hp: mi.hp * qty,
    stats: Object.fromEntries(Object.entries(mi.stats).map(([k, v]) => [k, v * qty])),
  };
  // Racha: bonus de XP +5% por día de racha (máx +50%)
  const prevStreak = bumpStreak(id);
  const st = S.streaks[id].n;
  const bonus = Math.min(0.5, (st - 1) * 0.05);
  g.xp = Math.round(g.xp * (1 + bonus));
  // calcular energía y vida reales aplicadas (por topes)
  const e0 = S.energy, h0 = S.hp;
  applyGains(g);
  g.energy = S.energy - e0;
  g.hp = S.hp - h0;
  S.counts[id] = (S.counts[id] || 0) + qty;
  S.catCounts[mi.cat] = (S.catCounts[mi.cat] || 0) + qty;
  pushLog({ k: 'm', id, n: qty, c: mi.cat, g, ps: prevStreak });
  emit('gains', { g, label: mi.name, icon: mi.icon, streak: st, bonus });
  afterChange(before);
  return { ok: true, g };
}

// Hábitos malos
export function badFall(id) {
  const b = BAD_HABITS.find((x) => x.id === id);
  if (!b) return;
  const before = snapshot();
  const h0 = S.hp;
  const g = { aura: -b.aura, hp: -b.hp };
  applyGains(g);
  g.hp = S.hp - h0;
  const prev = S.streaks['r_' + id] ? { ...S.streaks['r_' + id] } : null;
  if (S.streaks['r_' + id]) S.streaks['r_' + id].n = 0;
  S.counts['f_' + id] = (S.counts['f_' + id] || 0) + 1;
  pushLog({ k: 'b', id: 'f_' + id, n: 1, c: 'bad', g, ps: prev });
  emit('gains', { g, label: `Caíste: ${b.name}`, icon: b.icon, bad: true });
  afterChange(before);
}
export function badResist(id) {
  const b = BAD_HABITS.find((x) => x.id === id);
  if (!b) return { ok: false };
  if (todayCount('r_' + id) >= 1) return { ok: false, msg: 'Ya lo marcaste hoy. ¡Seguí así!' };
  const before = snapshot();
  const g = { xp: 15, gold: 5, aura: Math.round(b.aura / 2), stats: { dis: 5, esp: 2 } };
  applyGains(g);
  const prev = bumpStreak('r_' + id);
  S.counts['r_' + id] = (S.counts['r_' + id] || 0) + 1;
  S.catCounts.resist = (S.catCounts.resist || 0) + 1;
  pushLog({ k: 'r', id: 'r_' + id, n: 1, c: 'bad', g, ps: prev });
  emit('gains', { g, label: `Resististe: ${b.name}`, icon: '💪', streak: S.streaks['r_' + id].n });
  afterChange(before);
  return { ok: true };
}

// Deshacer una entrada del historial (misiones / hábitos)
export function undoEntry(t) {
  const i = S.log.findIndex((e) => e.t === t);
  if (i < 0) return;
  const e = S.log[i];
  if (!['m', 'b', 'r'].includes(e.k)) return;
  applyGains(e.g, -1);
  S.counts[e.id] = Math.max(0, (S.counts[e.id] || 0) - (e.n || 1));
  if (e.k === 'm') S.catCounts[e.c] = Math.max(0, (S.catCounts[e.c] || 0) - (e.n || 1));
  if (e.k === 'r') S.catCounts.resist = Math.max(0, (S.catCounts.resist || 0) - 1);
  const sid = e.k === 'b' ? 'r_' + e.id.slice(2) : e.id;
  if (e.ps === null) delete S.streaks[sid];
  else if (e.ps) S.streaks[sid] = e.ps;
  S.log.splice(i, 1);
  save();
  emit('change');
}

// Recompensas genéricas (peleas, minijuegos, desafíos, logros)
export function grant(g, label, kind = 'x', id = null) {
  const before = snapshot();
  const e0 = S.energy, h0 = S.hp;
  applyGains(g);
  const real = { ...g, energy: S.energy - e0, hp: S.hp - h0 };
  pushLog({ k: kind, id, n: 1, g: real, label });
  if (label) emit('gains', { g: real, label, icon: '🎁', quiet: kind === 'a' });
  afterChange(before);
}
export function spendEnergy(n) {
  if (S.energy < n) return false;
  S.energy -= n;
  save();
  emit('change');
  return true;
}
export function setHp(v) { S.hp = clamp(Math.round(v), 0, maxHp()); save(); emit('change'); }

// ---------------- LOGROS ----------------
export const H = {
  level,
  count: (id) => S.counts[id] || 0,
  cat: (c) => S.catCounts[c] || 0,
  totalMissions: () => Object.entries(S.catCounts).reduce((s, [k, v]) => s + (k === 'resist' ? 0 : v), 0),
  maxStreak: () => Math.max(0, ...Object.entries(S.streaks).filter(([k]) => !k.startsWith('r_')).map(([, v]) => v.best || 0)),
  maxResistStreak: () => Math.max(0, ...Object.entries(S.streaks).filter(([k]) => k.startsWith('r_')).map(([, v]) => v.best || 0)),
  balancedToday: () => {
    const cats = new Set(todayEntries().filter((e) => e.k === 'm').map((e) => e.c));
    return ['salud', 'int', 'work', 'home', 'social'].every((c) => cats.has(c));
  },
  boughtCosmetics: () => S.bought || 0,
};
export function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (S.ach[a.id]) continue;
    let ok = false;
    try { ok = a.check(S, H); } catch (e) { ok = false; }
    if (ok) {
      S.ach[a.id] = Date.now();
      const unlock = COSMETICS.find((c) => c.unlock === a.id);
      if (unlock && !S.owned.includes(unlock.id)) S.owned.push(unlock.id);
      if (a.reward && (a.reward.gold || a.reward.aura || a.reward.xp)) {
        applyGains(a.reward);
        pushLog({ k: 'a', id: a.id, n: 1, g: a.reward, label: `Logro: ${a.name}` });
      }
      emit('achievement', { ...a, unlock });
    }
  }
}

// ---------------- DESAFÍOS ----------------
function countRange(q, from, to) {
  const f = from.getTime(), t = to.getTime();
  let n = 0;
  for (const e of S.log) {
    if (e.t < f || e.t >= t) continue;
    if (q.cat) { if (e.k === 'm' && e.c === q.cat) n += e.n || 1; continue; }
    for (const id of q.ids) {
      if (id === 'resist' && e.k === 'r') n += 1;
      else if (id === 'battle' && e.k === 'w') n += 1;
      else if (e.k === 'm' && e.id === id) n += e.n || 1;
    }
  }
  return n;
}
export function weeklyStatus() {
  const ws = weekStart();
  const key = dayKey(ws);
  const claimed = S.weekClaims[key] || [];
  return WEEKLY.map((q) => {
    const p = countRange(q, ws, addDays(ws, 7));
    return { ...q, progress: Math.min(p, q.target), done: p >= q.target, claimed: claimed.includes(q.id) };
  });
}
export function claimWeekly(id) {
  const key = dayKey(weekStart());
  const q = weeklyStatus().find((x) => x.id === id);
  if (!q || !q.done || q.claimed) return;
  (S.weekClaims[key] ||= []).push(id);
  grant(q.reward, `Semanal: ${q.name}`, 'q', id);
}
export function seasonStatus() {
  const se = season();
  const claimed = S.seasonClaims[se.id] || [];
  return SEASON_CHALLENGES[se.type].map((q) => {
    const p = countRange(q, se.start, se.end);
    return { ...q, progress: Math.min(p, q.target), done: p >= q.target, claimed: claimed.includes(q.id) };
  });
}
export function claimSeason(id) {
  const se = season();
  const q = seasonStatus().find((x) => x.id === id);
  if (!q || !q.done || q.claimed) return;
  (S.seasonClaims[se.id] ||= []).push(id);
  grant(q.reward, `Temporada: ${q.name}`, 'q', id);
}

// ---------------- TIENDA ----------------
export function buyConsumable(id) {
  const c = CONSUMABLES.find((x) => x.id === id);
  if (!c) return { ok: false };
  if (S.gold < c.price) return { ok: false, msg: 'No te alcanza el oro' };
  S.gold -= c.price;
  S.inv[id] = (S.inv[id] || 0) + 1;
  save(); emit('change');
  return { ok: true };
}
export function useConsumable(id) {
  const c = CONSUMABLES.find((x) => x.id === id);
  if (!c || !(S.inv[id] > 0)) return 0;
  S.inv[id]--;
  const h0 = S.hp;
  S.hp = Math.min(maxHp(), S.hp + c.heal);
  save(); emit('change');
  return S.hp - h0;
}
export function buyCosmetic(id) {
  const c = COSMETICS.find((x) => x.id === id);
  if (!c || S.owned.includes(id)) return { ok: false };
  if (c.unlock) return { ok: false, msg: 'Se desbloquea con un logro' };
  if (S.gold < c.price) return { ok: false, msg: 'No te alcanza el oro' };
  S.gold -= c.price;
  S.owned.push(id);
  S.bought = (S.bought || 0) + 1;
  S.equip[c.slot] = id;
  checkAchievements();
  save(); emit('change');
  return { ok: true };
}
export function equip(id) {
  const c = COSMETICS.find((x) => x.id === id);
  if (!c || !S.owned.includes(id)) return;
  S.equip[c.slot] = id;
  save(); emit('change');
}
export function look() {
  const get = (slot) => COSMETICS.find((c) => c.id === S.equip[slot]) || COSMETICS.find((c) => c.slot === slot);
  return {
    jersey: get('jersey').look,
    hair: get('hair').look,
    boots: get('boots').look,
    head: S.equip.head,
  };
}

// ---------------- MISIONES PERSONALIZADAS ----------------
export function addCustom({ name, cat, diff, icon, daily, stat }) {
  const id = 'c_' + Date.now().toString(36);
  S.custom.push({ id, name: name.slice(0, 60), cat, diff, icon: icon || '⭐', daily: clamp(daily || 1, 1, 10), stat: STATS[stat] ? stat : null });
  save(); emit('change');
}
export function removeCustom(id) {
  S.custom = S.custom.filter((c) => c.id !== id);
  save(); emit('change');
}
