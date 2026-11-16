// =============================================================
//  ARRANQUE DE LA APP
// =============================================================
import * as St from './state.js';
import { S } from './state.js';
import { crest, optBtn, ui, render, renderNav, renderTop, setGoTab, modal, closeModal, toast, onGains, onLevelUp, onAchievement, onAuraRank } from './ui.js';
import { initWorld, startWorld, stopWorld, resizeWorld, bindJoystick, removeMonster, worldSay, teleportHome, sceneId } from './world.js';
import { startMatch } from './match.js';
import { startBattle } from './battle.js';
import { openHouse } from './family.js';
import { kicks, tryRun, mash, trivia, timingGame, holdGame, altGame, rhythmGame, ropeGame, curlGame, passDrill, lineDrill, tackleDrill } from './minigames.js';
import { initAudio, playMusic, refreshAudio, sfx } from './audio.js';
import { MONSTERS, DOG_LINES, PLAYER, TALK_TOPICS, COACH_TIPS } from './data.js';
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
    playMusic(sceneId() === 'barrio' ? 'world' : 'mini');
  } else {
    render();
    $('#screen').scrollTop = 0;
  }
}
setGoTab(goTab);

// ---------------- mundo ----------------
initWorld($('#wcanvas'), { onDoor, onEncounter, onNpc, onStation, onScene: (id) => playMusic(id === 'barrio' ? 'world' : 'mini') });
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
function resume() { if (ui.tab === 'world') { startWorld(); playMusic(sceneId() === 'barrio' ? 'world' : 'mini'); } renderTop(); }

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
    casa: () => openHouse(),
    gym: () => {
      const done = St.todayCount('gym') >= 1;
      modal(`
        <h2>🏋️ El Gym</h2>
        <p class="muted">Olor a fierro y música a todo volumen.</p>
        <div class="opts">
          ${optBtn('g1', '🏋️', 'Press de banca', 'Tocá rápido para levantar la barra', '1 ⚡')}
          ${optBtn('g2', '✅', 'Fui al gym en la vida real', done ? 'Ya lo cargaste hoy 💪' : 'Cargá la misión de hoy', done ? '✓ Hoy' : '+40 XP', done)}
        </div>
        <button class="btn ghost wide" data-close>🚪 Salir</button>`);
      $('#o_g1').onclick = () => mini((cb) => mash('gym', cb));
      $('#o_g2').onclick = () => { closeModal(); const r = St.completeMission('gym'); if (!r.ok) toast(r.msg); };
    },
    clubhouse: () => {
      modal(`<div class="intro-crest">${crest(56)}</div><h2 class="center">Club House</h2><p class="muted center">Fotos de planteles desde 1907, trofeos y el olor a vestuario de siempre.</p><div class="opts">${optBtn('h1', '🏟️', 'Jugar partido', 'Universitario vs. un rival', '3 ⚡')}${optBtn('h2', '🚿', 'Vestuario', 'Te bañás y recuperás un poco de vida', '+20 ❤️')}</div><button class="btn ghost wide" data-close>Salir</button>`);
      $('#o_h1').onclick = () => matchMenu();
      $('#o_h2').onclick = () => { closeModal(); St.setHp(S.hp + 20); sfx('heal'); toast('Ducha caliente después del entreno 🚿 +20'); };
    },
    club: () => {
      const se = St.season();
      modal(`
        <div class="intro-crest">${crest(48)}</div><h2 class="center">🏉 Club Universitario</h2>
        <p class="muted center">${se.type === 'vacaciones' ? 'Pretemporada: la cancha está libre para practicar.' : 'Temporada en marcha. ¡Todo rojo y blanco, se juega el sábado!'}</p>
        <div class="opts">
          ${optBtn('c1', '🦶', 'Patadas a los palos', 'Apuntá, medí la potencia, ojo con el viento', '1 ⚡')}
          ${optBtn('c2', '🏃', 'Corrida al try', 'Esquivá defensores hasta el ingoal', '1 ⚡')}
          ${optBtn('c3', '🐃', 'Scrum', 'Empujá más fuerte que el pack rival', '1 ⚡')}
        </div>
        <button class="btn ghost wide" data-close>🚪 Salir</button>`);
      $('#o_c1').onclick = () => mini(kicks);
      $('#o_c2').onclick = () => mini(tryRun);
      $('#o_c3').onclick = () => mini((cb) => mash('scrum', cb));
    },
    facu: () => {
      const done = St.todayCount('estudiar') >= 3;
      modal(`
        <h2>🏛️ La Facultad</h2>
        <p class="muted">Próxima parada de Giuli. Mientras tanto, se entrena el cerebro.</p>
        <div class="opts">
          ${optBtn('u1', '🧠', 'Trivia', '5 preguntas de rugby, web y cultura general', '1 ⚡')}
          ${optBtn('u2', '✅', 'Estudié en la vida real', 'Cargá una sesión de estudio', done ? '✓ Hoy' : '+30 XP', done)}
        </div>
        <button class="btn ghost wide" data-close>🚪 Salir</button>`);
      $('#o_u1').onclick = () => mini(trivia);
      $('#o_u2').onclick = () => { closeModal(); const r = St.completeMission('estudiar'); if (!r.ok) toast(r.msg); };
    },
    cole: () => {
      modal(`<h2>🏫 Colegio Fátima</h2><p>🔒 Cerrado por ahora. ¡Te queda un mes, Giuli! Se habilita más adelante.</p><button class="btn good wide" data-close>Ok</button>`);
    },
    kiosco: () => { closeModal(); goTab('shop'); ui.shopTab = 'consumables'; render(); },
    abuelos: () => {
      const ate = S.daily?.abuelos === today;
      modal(`
        <h2>👵👴 Casa de los abuelos</h2>
        <div class="bubble">"¡Giuli! ¿Comiste? Pasá que hay algo rico."</div>
        <div class="opts">
          ${optBtn('a1', '🍝', 'Comer algo rico', ate ? 'Ya comiste hoy, no entra nada más 😅' : 'La abuela cocina como nadie', ate ? '✓ Hoy' : '+30 ❤️', ate)}
          ${optBtn('a2', '✅', 'Los visité en la vida real', 'Cargá la misión', '+300 aura')}
        </div>
        <button class="btn ghost wide" data-close>🚪 Salir</button>`);
      $('#o_a1').onclick = () => { S.daily = { ...(S.daily || {}), abuelos: today }; St.setHp(S.hp + 30); sfx('heal'); closeModal(); toast('La abuela te sirvió un plato enorme ❤️ +30'); };
      $('#o_a2').onclick = () => { closeModal(); const r = St.completeMission('abuelos'); if (!r.ok) toast(r.msg); };
    },
  };
  (opts[id] || (() => {}))();
}

// ---------------- club y gym por dentro ----------------
const STATIONS = {
  // gym
  banca: { icon: '🏋️', name: 'Press de banca', desc: 'Tocá rápido para levantar la barra.', play: (cb) => mash('gym', cb), real: 'gym' },
  sentadilla: { icon: '🦵', name: 'Sentadilla', desc: 'Tocá cuando la marca esté en verde: profundidad justa.', play: (cb) => timingGame('sentadilla', cb), real: 'gym' },
  pesomuerto: { icon: '🏋️', name: 'Peso muerto', desc: 'Mantené apretado y controlá la aguja en la zona verde.', play: (cb) => holdGame(cb), real: 'gym' },
  dominadas: { icon: '🧗', name: 'Dominadas', desc: 'Tocá izquierda y derecha alternando.', play: (cb) => altGame(cb), real: 'gym' },
  cinta: { icon: '🏃', name: 'Cinta', desc: 'Tocá al ritmo de los pasos.', play: (cb) => rhythmGame(cb), real: 'correr' },
  soga: { icon: '🪢', name: 'Saltar la soga', desc: 'Saltá justo cuando la soga pasa por los pies.', play: (cb) => ropeGame(cb), real: 'gym' },
  cajon: { icon: '📦', name: 'Saltos al cajón', desc: 'Saltá en el momento justo.', play: (cb) => timingGame('cajon', cb), real: 'gym' },
  mancuernas: { icon: '💪', name: 'Mancuernas', desc: 'Ritmo constante sin pasarte de fatiga.', play: (cb) => curlGame(cb), real: 'gym' },
  // club
  palos: { icon: '🦶', name: 'Patadas a los palos', desc: 'Apuntá, medí la potencia, ojo con el viento.', play: (cb) => kicks(cb), real: 'entreno' },
  conos: { icon: '🏃', name: 'Corrida al try', desc: 'Esquivá defensores hasta el ingoal.', play: (cb) => tryRun(cb), real: 'entreno' },
  pases: { icon: '🏉', name: 'Pases de medio scrum', desc: 'Sacá rápido de abajo del ruck hacia el lado que te piden.', play: (cb) => passDrill(cb), real: 'pases' },
  scrum: { icon: '🐃', name: 'Máquina de scrum', desc: 'Empujá más fuerte que el pack rival.', play: (cb) => mash('scrum', cb), real: 'entreno' },
  line: { icon: '📏', name: 'Práctica de line', desc: 'Tirá cuando el saltador está arriba.', play: (cb) => lineDrill(cb), real: 'entreno' },
  tackle: { icon: '🛡️', name: 'Tackle con bolsas', desc: 'Tackleá en el momento justo.', play: (cb) => tackleDrill(cb), real: 'entreno' },
};

function onStation(id) {
  sfx('click');
  if (id === 'partido') return matchMenu();
  const st = STATIONS[id];
  if (!st) return;
  const done = St.todayCount(st.real) >= (St.missionDef(st.real)?.daily || 1);
  modal(`
    <h2>${st.icon} ${st.name}</h2>
    <p class="muted">${st.desc}</p>
    <div class="opts">
      ${optBtn('s1', '🎮', 'Jugar', 'Minijuego de entrenamiento', '1 ⚡')}
      ${optBtn('s2', '✅', 'Lo hice en la vida real', done ? 'Ya lo cargaste hoy' : `Cargar: ${St.missionDef(st.real)?.name || ''}`, done ? '✓ Hoy' : '+XP', done)}
    </div>
    <button class="btn ghost wide" data-close>Volver</button>`);
  $('#o_s1').onclick = () => mini(st.play);
  $('#o_s2').onclick = () => { closeModal(); const r = St.completeMission(st.real); if (!r.ok) toast(r.msg); };
}

function matchMenu() {
  const se = St.season();
  modal(`
    <div class="intro-crest">${crest(48)}</div>
    <h2 class="center">🏟️ Partido</h2>
    <p class="muted center">${se.type === 'vacaciones' ? 'Amistoso de pretemporada.' : 'Partido oficial del torneo.'} Dos tiempos de 2½ minutos. Vos sos el 9.</p>
    <div class="howto">
      <b>Cómo se juega</b>
      <ul>
        <li>🕹️ Joystick: correr · <b>PASE ▲ / ▼</b>: pasar arriba o abajo (siempre para atrás)</li>
        <li><b>PATADA</b>: mantené para cargar potencia y soltá · <b>AMAGUE</b>: esquivar un tackle</li>
        <li>Defendiendo: <b>TACKLE</b> para tirarte · <b>CAMBIAR</b> de jugador</li>
        <li>En el scrum tocá rápido, en el line elegí la llamada y tirá en el momento justo</li>
        <li>💻 En la compu: flechas, Q/E pases, espacio patada, F tackle/amague, C cambiar</li>
      </ul>
      <small>Se juega en horizontal: girá el celu.</small>
    </div>
    <div class="opts">${optBtn('m1', '🏉', 'Jugar partido', 'Universitario vs. un rival', '3 ⚡')}</div>
    <button class="btn ghost wide" data-close>Volver</button>`);
  $('#o_m1').onclick = () => {
    closeModal();
    pause();
    startMatch(() => resume());
  };
}

function onNpc(n) {
  sfx('click');
  if (n.kind === 'coach') {
    modal(`
      <h2>📋 Entrenador</h2>
      <div class="bubble">"${pick(COACH_TIPS).replace(/^Entrenador: /, '').replace(/"/g, '')}"</div>
      <div class="opts">
        ${optBtn('c1', '🏟️', 'Jugar un partido', 'Universitario vs. un rival', '3 ⚡')}
        ${optBtn('c2', '📈', '¿Cómo vengo?', 'El entrenador evalúa tu nivel', '')}
      </div>
      <button class="btn ghost wide" data-close>Volver</button>`);
    $('#o_c1').onclick = () => matchMenu();
    $('#o_c2').onclick = () => {
      const b = St.battleStats();
      const tips = [];
      if (St.statLvl('fue') <= St.statLvl('res')) tips.push('Más gym: necesito fuerza en los rucks.');
      else tips.push('Mucha fuerza, ahora sumá pasadas para la resistencia.');
      if ((S.matches || 0) < 3) tips.push('Jugá más partidos para agarrar ritmo.');
      tips.push(`Nivel ${b.level} · Partidos jugados: ${S.matches || 0} · Ganados: ${S.matchWins || 0}`);
      toast(tips.join('<br>'));
    };
    return;
  }
  // compañero
  const today = dayKey();
  const key = 'm_' + n.mate.id;
  const first = S.daily?.[key] !== today;
  modal(`
    <div class="talk">
      <div class="talk-head"><canvas id="mtc" width="96" height="132"></canvas>
        <div><h2>${n.name}</h2><small class="muted">Compañero de la U</small></div></div>
      <div class="bubble" id="mtb">"¡Giuli! ¿Qué onda, todo bien?"</div>
      <div class="opts">${TALK_TOPICS.map((t) => optBtn('t_' + t.id, t.icon, t.name, '', first ? '+aura' : '')).join('')}</div>
      <button class="btn ghost wide" data-close>Volver</button>
    </div>`);
  const cv = $('#mtc');
  if (cv) { import('./pixel.js').then(({ playerSprite }) => { const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(playerSprite(n.mate.look, 'down', 0), 0, 0, 96, 132); }); }
  for (const t of TALK_TOPICS) {
    $(`#o_t_${t.id}`).onclick = () => {
      $('#mtb').textContent = `"${pick(t.lines)}"`;
      sfx('click');
      if (S.daily?.[key] !== today) {
        S.daily = { ...(S.daily || {}), [key]: today };
        St.grant({ aura: 40, stats: { car: 2 } }, `Charla con ${n.name}`, 'x', 'mate');
      }
    };
  }
}

// ---------------- primera vez ----------------
function intro() {
  if (S.seen.intro) return;
  modal(`
    <div class="intro-crest">${crest(56)}</div>
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
