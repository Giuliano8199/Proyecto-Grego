// =============================================================
//  LA CASA Y LA FAMILIA
// =============================================================
import { S } from './state.js';
import * as St from './state.js';
import { FAMILY, DOG_LINES } from './data.js';
import { playerSprite, dogSprite } from './pixel.js';
import { modal, closeModal, toast, optBtn } from './ui.js';
import { sfx } from './audio.js';
import { $, $$, esc, pick, dayKey } from './util.js';

const doneToday = (k) => S.daily?.[k] === dayKey();
const markToday = (k) => { S.daily = { ...(S.daily || {}), [k]: dayKey() }; St.save(); };

function famSprite(f) {
  return playerSprite(f.look, 'down', 0);
}
function drawPortraits(root = document) {
  $$('canvas[data-fam]', root).forEach((cv) => {
    const id = cv.dataset.fam;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    if (id === 'giuli') { ctx.drawImage(playerSprite(St.look(), 'down', 0), 0, 0, cv.width, cv.height); return; }
    if (id === 'piti' || id === 'catalina') {
      const s = dogSprite(id, 0, false);
      ctx.drawImage(s, 0, cv.height - s.height * 3 - 4, cv.width, s.height * 3);
      return;
    }
    const f = FAMILY.find((x) => x.id === id);
    const s = famSprite(f);
    const k = f.small ? 0.78 : 1;
    const w = cv.width * k, h = cv.height * k;
    ctx.drawImage(s, (cv.width - w) / 2, cv.height - h, w, h);
  });
}

// ---------------- pantalla de la casa ----------------
export function openHouse() {
  const rested = doneToday('rest');
  const dogs = doneToday('dogs');
  const fam = FAMILY.filter((f) => f.id !== 'tommy');
  const tommy = FAMILY.find((f) => f.id === 'tommy');
  modal(`
    <div class="house">
      <h2>🏠 Casa de Giuli</h2>
      <div class="fam-row">
        ${[...FAMILY.map((f) => f.id), 'giuli'].map((id) => {
          const f = FAMILY.find((x) => x.id === id);
          return `<button class="fam" data-who="${id}"><canvas data-fam="${id}" width="64" height="88"></canvas><b>${f ? f.name : 'Giuli'}</b><small>${f ? f.age : 17} años</small></button>`;
        }).join('')}
      </div>
      <p class="muted center">Tocá a alguien para estar con él o ella.</p>
      <div class="opts">
        ${fam.map((f) => optBtn(`f_${f.id}`, f.icon, f.action, doneToday(f.id) ? 'Ya compartieron hoy. Mañana de nuevo 💛' : f.actionDesc, doneToday(f.id) ? '✓ Hoy' : f.tag, doneToday(f.id))).join('')}
        ${optBtn('f_tommy', '🤍', `Un rato con ${tommy.name}`, 'Un lugar tranquilo para estar con tu hermano', '', false, 'soft')}
        ${optBtn('f_dogs', '🐾', 'Jugar con Piti y Catalina', dogs ? 'Ya jugaron hoy. Están rendidos 😴' : 'Pelotita en el patio', dogs ? '✓ Hoy' : '+100 aura', dogs)}
        ${optBtn('f_rest', '😴', 'Descansar en tu cuarto', rested ? 'Ya descansaste hoy' : 'Recuperás toda la vida', rested ? '✓ Hoy' : '❤️ 100%', rested)}
      </div>
      <button class="btn ghost wide" data-close>🚪 Salir al barrio</button>
    </div>`);
  drawPortraits($('#modal'));
  $$('#modal .fam').forEach((b) => (b.onclick = () => {
    const id = b.dataset.who;
    if (id === 'tommy') return openTommy();
    if (id === 'giuli') { toast('Ese sos vos, crack 😎'); return; }
    if (id === 'piti' || id === 'catalina') return;
    const f = FAMILY.find((x) => x.id === id);
    talk(f);
  }));
  $('#o_f_tommy').onclick = openTommy;
  for (const f of fam) { const el = $(`#o_f_${f.id}`); if (el) el.onclick = () => talk(f, true); }
  $('#o_f_dogs').onclick = () => {
    markToday('dogs');
    sfx('bark');
    St.grant({ aura: 100, stats: { esp: 2 } }, 'Jugaste con Piti y Catalina', 'x', 'pet');
    toast(pick(DOG_LINES.piti) + '<br>' + pick(DOG_LINES.catalina));
    openHouse();
  };
  $('#o_f_rest').onclick = () => {
    markToday('rest');
    St.setHp(St.maxHp());
    sfx('heal');
    toast('Dormiste una siesta. Vida al máximo ❤️');
    openHouse();
  };
}

function talk(f, doAction = false) {
  const line = pick(f.lines);
  const can = !doneToday(f.id);
  modal(`
    <div class="talk">
      <div class="talk-head"><canvas data-fam="${f.id}" width="96" height="132"></canvas>
        <div><h2>${f.icon} ${esc(f.name)}</h2><small class="muted">${esc(f.role)} · ${f.age} años</small></div></div>
      <div class="bubble">"${esc(line)}"</div>
      <div class="opts">
        ${optBtn('t_do', f.icon, f.action, can ? f.actionDesc : 'Ya compartieron hoy 💛', can ? f.tag : '✓ Hoy', !can)}
        ${optBtn('t_more', '💬', 'Seguir charlando', 'Otra frase', '')}
      </div>
      <button class="btn ghost wide" id="t_back">↩️ Volver a la casa</button>
    </div>`);
  drawPortraits($('#modal'));
  $('#t_back').onclick = openHouse;
  $('#o_t_more').onclick = () => talk(f);
  $('#o_t_do').onclick = () => {
    markToday(f.id);
    sfx('heal');
    St.grant(f.reward, `${f.action}`, 'x', 'fam_' + f.id);
    if (f.gift && Math.random() < 0.5) { S.inv[f.gift] = (S.inv[f.gift] || 0) + 1; St.save(); toast(`${f.name} te dio un ${f.gift === 'mate' ? 'mate 🧉' : 'alfajor 🍫'}`); }
    talk(f);
  };
  if (doAction && can) $('#o_t_do').classList.add('pulse');
}

// ---------------- espacio con Tommy ----------------
export function openTommy() {
  const t = FAMILY.find((f) => f.id === 'tommy');
  const fam = S.fam || { notes: [], lines: [] };
  const memory = fam.lines.length ? pick(fam.lines) : null;
  modal(`
    <div class="tommy">
      <div class="tommy-scene"><canvas id="tscene" width="320" height="150"></canvas></div>
      <h2 class="center">🤍 Un rato con ${esc(t.name)}</h2>
      ${memory ? `<div class="bubble soft">⭐ Cosas de ${esc(t.name)}<br><b>"${esc(memory.text)}"</b></div>` : `<p class="center muted">${esc(t.name)} está acá, con vos. Tomate el tiempo que quieras.</p>`}
      <div class="opts">
        ${optBtn('tm_write', '✍️', 'Contarle algo', 'Lo que quieras: cómo te fue, qué te pasa, qué lograste', '', false, 'soft')}
        ${optBtn('tm_read', '📖', 'Lo que le conté', fam.notes.length ? `${fam.notes.length} ${fam.notes.length === 1 ? 'mensaje guardado' : 'mensajes guardados'}` : 'Todavía nada', '', !fam.notes.length, 'soft')}
        ${optBtn('tm_lines', '⭐', `Cosas de ${t.name}`, 'Frases y recuerdos suyos que quieras guardar', '', false, 'soft')}
        ${optBtn('tm_hug', '🫂', 'Un abrazo', '', '', false, 'soft')}
      </div>
      <p class="tiny muted center">Todo lo que escribas acá queda guardado solo en tu celu.</p>
      <button class="btn ghost wide" id="tm_back">↩️ Volver a la casa</button>
    </div>`);
  drawTommyScene(false);
  $('#tm_back').onclick = openHouse;
  $('#o_tm_write').onclick = writeNote;
  $('#o_tm_read').onclick = readNotes;
  $('#o_tm_lines').onclick = editLines;
  $('#o_tm_hug').onclick = () => { drawTommyScene(true); };
}

let sceneRaf = 0;
function drawTommyScene(hug) {
  cancelAnimationFrame(sceneRaf);
  const c = $('#tscene');
  if (!c) return;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const t = FAMILY.find((f) => f.id === 'tommy');
  const start = performance.now();
  const hearts = [];
  const loop = (now) => {
    if (!document.body.contains(c)) return;
    const el = (now - start) / 1000;
    const w = c.width, h = c.height;
    // atardecer en el patio
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f4a261'); g.addColorStop(0.55, '#e9c46a'); g.addColorStop(0.56, '#5a9e4b'); g.addColorStop(1, '#40804a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffe8a3'; ctx.beginPath(); ctx.arc(w * 0.8, h * 0.42, 18, 0, Math.PI * 2); ctx.fill();
    const sc = 4;
    const cx = w / 2;
    const near = hug ? Math.max(0, 1 - el * 1.2) : 1; // 1 = separados, 0 = juntos
    const off = 26 + near * 40;
    const dirMe = hug && near === 0 ? 'down' : 'right';
    const dirHim = hug && near === 0 ? 'down' : 'left';
    const meS = playerSprite(St.look(), dirMe, 0);
    const himS = playerSprite(t.look, dirHim, 0);
    ctx.drawImage(meS, cx - off - 8 * sc, h - 22 * sc - 4, 16 * sc, 22 * sc);
    ctx.drawImage(himS, cx + off - 8 * sc, h - 22 * sc - 4, 16 * sc, 22 * sc);
    if (hug && near === 0) {
      // brazos sobre los hombros
      ctx.fillStyle = '#f4cdb0';
      ctx.fillRect(cx - off + 5 * sc, h - 22 * sc - 4 + 12 * sc, (off * 2 - 10 * sc), sc);
    }
    const gap = hug ? near * 70 : 70;
    if (hug && gap === 0) {
      if (hearts.length < 14 && Math.random() < 0.15) hearts.push({ x: cx + (Math.random() - 0.5) * 50, y: h - 70, v: 12 + Math.random() * 14, t: 0 });
      for (const ht of hearts) {
        ht.t += 1 / 60; ht.y -= ht.v / 60;
        ctx.globalAlpha = Math.max(0, 1 - ht.t / 2.5);
        ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🤍', ht.x, ht.y);
      }
      ctx.globalAlpha = 1;
    }
    sceneRaf = requestAnimationFrame(loop);
  };
  sceneRaf = requestAnimationFrame(loop);
}

function writeNote() {
  const t = FAMILY.find((f) => f.id === 'tommy');
  modal(`
    <div class="tommy">
      <h2>✍️ Para ${esc(t.name)}</h2>
      <textarea id="tm_text" rows="7" maxlength="2000" placeholder="Hola ${esc(t.name)}..."></textarea>
      <div class="row"><button class="btn ghost" id="tm_cancel">Volver</button><button class="btn good" id="tm_save">Guardar</button></div>
    </div>`);
  setTimeout(() => $('#tm_text')?.focus(), 50);
  $('#tm_cancel').onclick = openTommy;
  $('#tm_save').onclick = () => {
    const text = $('#tm_text').value.trim();
    if (!text) return openTommy();
    S.fam = S.fam || { notes: [], lines: [] };
    S.fam.notes.push({ t: Date.now(), text });
    St.save();
    toast(`Guardado 🤍`);
    openTommy();
  };
}

function readNotes() {
  const t = FAMILY.find((f) => f.id === 'tommy');
  const notes = [...(S.fam?.notes || [])].reverse();
  modal(`
    <div class="tommy">
      <h2>📖 Lo que le conté a ${esc(t.name)}</h2>
      <div class="notes">${notes.map((n) => `<div class="note"><small>${new Date(n.t).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</small><p>${esc(n.text).replace(/\n/g, '<br>')}</p><button class="btn sm ghost" data-del="${n.t}">Borrar</button></div>`).join('')}</div>
      <button class="btn ghost wide" id="tm_back2">↩️ Volver</button>
    </div>`);
  $('#tm_back2').onclick = openTommy;
  $$('#modal [data-del]').forEach((b) => (b.onclick = () => {
    if (!confirm('¿Borrar este mensaje?')) return;
    S.fam.notes = S.fam.notes.filter((n) => n.t !== +b.dataset.del);
    St.save();
    S.fam.notes.length ? readNotes() : openTommy();
  }));
}

function editLines() {
  const t = FAMILY.find((f) => f.id === 'tommy');
  const lines = S.fam?.lines || [];
  modal(`
    <div class="tommy">
      <h2>⭐ Cosas de ${esc(t.name)}</h2>
      <p class="muted">Frases que decía, chistes, consejos, recuerdos. Cuando entres a estar con él, va a aparecer una.</p>
      <div class="notes">${lines.map((l) => `<div class="note"><p>"${esc(l.text)}"</p><button class="btn sm ghost" data-dl="${l.t}">Borrar</button></div>`).join('') || '<p class="muted center">Todavía no agregaste ninguna.</p>'}</div>
      <textarea id="tm_line" rows="2" maxlength="300" placeholder="Ej: una frase que siempre te decía"></textarea>
      <div class="row"><button class="btn ghost" id="tm_back3">Volver</button><button class="btn good" id="tm_add">Agregar</button></div>
    </div>`);
  $('#tm_back3').onclick = openTommy;
  $('#tm_add').onclick = () => {
    const text = $('#tm_line').value.trim();
    if (!text) return;
    S.fam = S.fam || { notes: [], lines: [] };
    S.fam.lines.push({ t: Date.now(), text });
    St.save();
    editLines();
  };
  $$('#modal [data-dl]').forEach((b) => (b.onclick = () => {
    S.fam.lines = S.fam.lines.filter((l) => l.t !== +b.dataset.dl);
    St.save();
    editLines();
  }));
}
