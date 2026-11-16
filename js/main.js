// =============================================================
//  ARRANQUE DE LA APP
// =============================================================
import * as St from './state.js';
import { S } from './state.js';
import { ui, render, renderNav, renderTop, setGoTab, modal, closeModal, toast, onGains, onLevelUp, onAchievement, onAuraRank } from './ui.js';
import { initWorld, startWorld, stopWorld, resizeWorld, bindJoystick, removeMonster, worldSay, teleportHome } from './world.js';
import { startBattle } from './battle.js';
import { kicks, tryRun, mash, trivia } from './minigames.js';
import { initAudio, playMusic, refreshAudio, sfx } from './audio.js';
import { MONSTERS, DOG_LINES, PLAYER } from './data.js';
import { $, dayKey, pick, fmt } from './util.js';

St.load();
initAudio(S.settings);

St.on('change', () => { if (!$('#battle').hidden || !$('#mini').hidden) { renderTop(); return; } render(); });
St.on('gains', onGains);
St.on('levelup', onLevelUp);
St.on('achievement', onAchievement);
St.on('aurarank', onAuraRank);
St.on('music', () => refreshAudio(ui.tab === 'world' ? 'world' : null));

function goTab(t) {
  if (ui.tab === 'world' && t !== 'world') stopWorld();
  ui.tab = t;
  renderNav(goTab);
  const world = t === 'world';
  $('#worldwrap').hidden = !world;
  $('#screen').hidden = world;
  document.body.classList.toggle('in-world', world);
  if (world) {
    renderTop();
    startWorld();
    playMusic('world');
  } else {
    render();
    $('#screen').scrollTop = 0;
  }
}
setGoTab(goTab);

// ---------------- mundo ----------------
initWorld($('#wcanvas'), { onDoor, onEncounter });
bindJoystick($('#joy'), $('#joyk'), $('#abtn'));
window.addEventListener('resize', () => { if (ui.tab === 'world') resizeWorld(); });

function needEnergy(n, then) {
  if (S.energy < n) {
    sfx('miss');
    toast(`Te falta energía ⚡ (necesitás ${n}).<br>Completá misiones de la vida real para ganar más.`, 'bad');
    return;
  }
  St.spendEnergy(n);
  then();
}

function pause() { stopWorld(); }
function resume() { if (ui.tab === 'world') { startWorld(); playMusic('world'); } renderTop(); }

function onEncounter(m) {
  const def = MONSTERS[m.id];
  const cost = def.boss ? 2 : 1;
  if (S.energy < cost) {
    worldSay(`${def.name} te bloquea el paso. Te falta energía ⚡ (${cost}). ¡Hacé misiones reales para cargarla!`, 4);
    return;
  }
  if (S.hp <= 0) { worldSay('No tenés vida. Descansá en tu casa o usá un mate 🧉.', 4); return; }
  pause();
  St.spendEnergy(cost);
  startBattle(m.id, m.zone, (result) => {
    if (result === 'win') removeMonster(m);
    if (result === 'lose') teleportHome();
    resume();
  });
}

function mini(fn, cost = 1) {
  closeModal();
  needEnergy(cost, () => { pause(); fn(() => resume()); });
}

function onDoor(id) {
  const today = dayKey();
  sfx('click');
  const opts = {
    casa: () => {
      const rested = S.restDay === today;
      const petted = S.petDay?.[today];
      modal(`
        <h2>🏠 Casa de Giuli</h2>
        <p>Piti 🌭 y Catalina 🐕 te reciben en la puerta.</p>
        <div class="opts">
          <button class="btn big" id="o1" ${rested ? 'disabled' : ''}>😴 Descansar ${rested ? '(mañana de nuevo)' : '(vida al 100%)'}</button>
          <button class="btn big" id="o2" ${petted ? 'disabled' : ''}>🐾 Jugar con los perros ${petted ? '(ya jugaste hoy)' : '(+100 aura)'}</button>
          <button class="btn ghost" data-close>Salir</button>
        </div>`);
      $('#o1').onclick = () => { S.restDay = today; St.setHp(St.maxHp()); sfx('heal'); closeModal(); toast('Dormiste una siesta. Vida al máximo ❤️'); };
      $('#o2').onclick = () => {
        S.petDay = { [today]: true };
        sfx('bark');
        St.grant({ aura: 100, stats: { esp: 2 } }, 'Jugaste con Piti y Catalina', 'x', 'pet');
        closeModal();
        toast(pick(DOG_LINES.piti) + '<br>' + pick(DOG_LINES.catalina));
      };
    },
    gym: () => {
      modal(`
        <h2>🏋️ El Gym</h2>
        <p>Olor a fierro y música a todo volumen.</p>
        <div class="opts">
          <button class="btn big" id="o1">🏋️ Press de banca (1 ⚡)</button>
          <button class="btn ghost" id="o2">✅ Fui al gym en la vida real</button>
          <button class="btn ghost" data-close>Salir</button>
        </div>`);
      $('#o1').onclick = () => mini((cb) => mash('gym', cb));
      $('#o2').onclick = () => { closeModal(); const r = St.completeMission('gym'); if (!r.ok) toast(r.msg); };
    },
    club: () => {
      const se = St.season();
      modal(`
        <h2>🏉 El Club</h2>
        <p>${se.type === 'vacaciones' ? 'Pretemporada: la cancha está libre para practicar.' : 'Temporada en marcha. ¡Se juega el sábado!'}</p>
        <div class="opts">
          <button class="btn big" id="o1">🦶 Patadas a los palos (1 ⚡)</button>
          <button class="btn big" id="o2">🏃 Corrida al try (1 ⚡)</button>
          <button class="btn big" id="o3">🐃 Scrum (1 ⚡)</button>
          <button class="btn ghost" data-close>Salir</button>
        </div>`);
      $('#o1').onclick = () => mini(kicks);
      $('#o2').onclick = () => mini(tryRun);
      $('#o3').onclick = () => mini((cb) => mash('scrum', cb));
    },
    facu: () => {
      modal(`
        <h2>🏛️ La Facultad</h2>
        <p>Próxima parada de Giuli. Mientras tanto, se entrena el cerebro.</p>
        <div class="opts">
          <button class="btn big" id="o1">🧠 Trivia (1 ⚡)</button>
          <button class="btn ghost" id="o2">✅ Estudié en la vida real</button>
          <button class="btn ghost" data-close>Salir</button>
        </div>`);
      $('#o1').onclick = () => mini(trivia);
      $('#o2').onclick = () => { closeModal(); const r = St.completeMission('estudiar'); if (!r.ok) toast(r.msg); };
    },
    cole: () => {
      modal(`<h2>🏫 Colegio Fátima</h2><p>🔒 Cerrado por ahora. ¡Te queda un mes, Giuli! Se habilita más adelante.</p><div class="row"><button class="btn good" data-close>Ok</button></div>`);
    },
    kiosco: () => { closeModal(); goTab('shop'); ui.shopTab = 'consumables'; render(); },
    abuelos: () => {
      modal(`
        <h2>👵👴 Casa de los abuelos</h2>
        <p>"¡Giuli! ¿Comiste? Pasá que hay algo rico."</p>
        <div class="opts">
          <button class="btn big" id="o1">🍝 Comer algo rico (+30 vida)</button>
          <button class="btn ghost" id="o2">✅ Los visité en la vida real</button>
          <button class="btn ghost" data-close>Salir</button>
        </div>`);
      const ate = S.petDay?.['ab' + today];
      if (ate) { $('#o1').disabled = true; $('#o1').textContent = '🍝 Ya comiste hoy'; }
      $('#o1').onclick = () => { S.petDay = { ...S.petDay, ['ab' + today]: true }; St.setHp(S.hp + 30); sfx('heal'); closeModal(); toast('La abuela te sirvió un plato enorme ❤️ +30'); };
      $('#o2').onclick = () => { closeModal(); const r = St.completeMission('abuelos'); if (!r.ok) toast(r.msg); };
    },
  };
  (opts[id] || (() => {}))();
}

// ---------------- primera vez ----------------
function intro() {
  if (S.seen.intro) return;
  modal(`
    <h2>¡Bienvenido, ${PLAYER.name}! 🏉</h2>
    <p>Esto es tu vida convertida en juego.</p>
    <ol class="intro">
      <li><b>📋 Misiones:</b> cargá lo que hacés en la vida real (gym, estudio, laburo, pasear a Piti y Catalina...). Ganás XP, oro, <b>aura</b> y <b>energía ⚡</b>.</li>
      <li><b>🗿 Aura:</b> se acumula. Un try = +1000 de aura. Los malos hábitos te la bajan.</li>
      <li><b>🗺️ Mundo:</b> recorré el barrio. Pelear contra monstruos y jugar minijuegos gasta energía, así que primero hay que cumplir en la vida real.</li>
      <li><b>🛒 Tienda:</b> comprá camisetas, peinados, botines y comida para recuperar vida.</li>
    </ol>
    <p class="muted">Temporada actual: <b>${St.season().short}</b>.</p>
    <div class="row"><button class="btn good big" id="ok">¡Vamos!</button></div>`);
  $('#ok').onclick = () => { S.seen.intro = true; St.save(); closeModal(); };
}

// ---------------- iniciar ----------------
goTab('home');
intro();
setInterval(() => { const before = S.lastDay; St.dailyTick(); if (S.lastDay !== before) { St.save(); render(); } }, 60000);
document.addEventListener('visibilitychange', () => { if (document.hidden) St.saveNow(); else { St.dailyTick(); renderTop(); } });

// PWA offline
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
window.__giuli = { St };
