// =============================================================
//  SONIDO: música chiptune y efectos generados en el navegador
//  (no usa archivos: todo es Web Audio, gratis y offline)
// =============================================================
let ac = null, master = null, musicGain = null, sfxGain = null;
let settings = { sound: true, music: true };
let current = null, timer = null, step = 0, nextTime = 0;

export function initAudio(s) {
  settings = s;
  const unlock = () => {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = 0.6; master.connect(ac.destination);
        musicGain = ac.createGain(); musicGain.gain.value = 0.22; musicGain.connect(master);
        sfxGain = ac.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master);
      } catch (e) { return; }
    }
    if (ac.state === 'suspended') ac.resume();
    if (pending) { const p = pending; pending = null; playMusic(p); }
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}
let pending = null;

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(n) {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 0;
  const midi = (parseInt(m[2]) + 1) * 12 + NOTE[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function tone(f, t, dur, type = 'square', vol = 0.2, dest = sfxGain, slide = 0) {
  if (!ac || !f) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(t, dur, vol = 0.2, dest = sfxGain, hp = 1000) {
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(); src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = ac.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(dest);
  src.start(t);
}

// ---------- canciones (pasos de 1/8) ----------
const SONGS = {
  world: {
    bpm: 112,
    lead: 'E5 - G5 - A5 - G5 E5 D5 - E5 - - - C5 - D5 - E5 - G5 - A5 - C6 - B5 A5 G5 - E5 - - - - - E5 - G5 - A5 - G5 E5 D5 - E5 - - - G5 - A5 - G5 - E5 - D5 - C5 - D5 - C5 - - - - - - -',
    bass: 'A2 - A3 - A2 - A3 - F2 - F3 - F2 - F3 - C3 - C4 - C3 - C4 - G2 - G3 - G2 - G3 - A2 - A3 - A2 - A3 - F2 - F3 - F2 - F3 - G2 - G3 - G2 - G3 - C3 - C4 - C3 - C4 -',
    drums: 'k - h - s - h - k - h - s - h h',
  },
  battle: {
    bpm: 150,
    lead: 'A4 C5 E5 A5 G5 E5 C5 E5 F4 A4 C5 F5 E5 C5 A4 C5 G4 B4 D5 G5 F5 D5 B4 D5 E5 - E5 - G#5 - B5 - A4 C5 E5 A5 G5 E5 C5 E5 F4 A4 C5 F5 E5 C5 A4 C5 D5 F5 A5 D6 C6 A5 F5 A5 E5 G#5 B5 E6 - - - -',
    bass: 'A2 A2 A3 A2 A2 A2 A3 A2 F2 F2 F3 F2 F2 F2 F3 F2 G2 G2 G3 G2 G2 G2 G3 G2 E2 E2 E3 E2 E2 E2 E3 E2',
    drums: 'k h s h k k s h',
  },
  mini: {
    bpm: 132,
    lead: 'C5 - E5 G5 - E5 C5 - D5 - F5 A5 - F5 D5 - E5 - G5 C6 - G5 E5 - D5 - G5 B5 - G5 D5 -',
    bass: 'C3 - C3 - C3 - C3 - D3 - D3 - D3 - D3 - E3 - E3 - E3 - E3 - G2 - G2 - G2 - G2 -',
    drums: 'k h s h k h s s',
  },
  boss: {
    bpm: 140,
    lead: 'D5 - D5 F5 - D5 C5 - A#4 - A#4 D5 - A#4 A4 - G4 - G4 A#4 - D5 F5 - E5 - C#5 - A4 - - - D5 - D5 F5 - D5 C5 - A#4 - D5 - F5 - A5 - G5 - F5 - E5 - D5 - - - - -',
    bass: 'D2 D3 D2 D3 D2 D3 D2 D3 A#1 A#2 A#1 A#2 A#1 A#2 A#1 A#2 G1 G2 G1 G2 G1 G2 G1 G2 A1 A2 A1 A2 A1 A2 A1 A2',
    drums: 'k k s h k k s s',
  },
};
for (const s of Object.values(SONGS)) {
  s.L = s.lead.split(/\s+/); s.B = s.bass.split(/\s+/); s.D = s.drums.split(/\s+/);
}

function schedule() {
  if (!ac || !current) return;
  const song = SONGS[current];
  const spb = 60 / song.bpm / 2;
  while (nextTime < ac.currentTime + 0.15) {
    const l = song.L[step % song.L.length];
    const b = song.B[step % song.B.length];
    const d = song.D[step % song.D.length];
    if (l && l !== '-') tone(freq(l), nextTime, spb * 1.6, 'square', 0.09, musicGain);
    if (b && b !== '-') tone(freq(b), nextTime, spb * 0.9, 'triangle', 0.22, musicGain);
    if (d === 'k') tone(120, nextTime, 0.12, 'sine', 0.35, musicGain, 0.3);
    if (d === 's') noise(nextTime, 0.1, 0.12, musicGain, 1500);
    if (d === 'h') noise(nextTime, 0.03, 0.05, musicGain, 6000);
    nextTime += spb;
    step++;
  }
}

export function playMusic(name) {
  if (!settings.music) { current = null; stopTimer(); return; }
  if (!ac) { pending = name; return; }
  if (current === name) return;
  current = name;
  step = 0;
  nextTime = ac.currentTime + 0.05;
  stopTimer();
  timer = setInterval(schedule, 40);
}
function stopTimer() { if (timer) clearInterval(timer); timer = null; }
export function stopMusic() { current = null; stopTimer(); }
export function refreshAudio(name) {
  if (!settings.music) stopMusic();
  else if (name) { current = null; playMusic(name); }
}

// ---------- efectos ----------
export function sfx(name) {
  if (!settings.sound || !ac) return;
  const t = ac.currentTime;
  switch (name) {
    case 'click': tone(880, t, 0.05, 'square', 0.08); break;
    case 'coin': tone(988, t, 0.08, 'square', 0.15); tone(1319, t + 0.08, 0.2, 'square', 0.15); break;
    case 'done':
      ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.07, 0.15, 'square', 0.14));
      break;
    case 'bad': tone(330, t, 0.25, 'sawtooth', 0.15, sfxGain, 0.5); tone(220, t + 0.2, 0.35, 'sawtooth', 0.15, sfxGain, 0.5); break;
    case 'levelup':
      ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => tone(freq(n), t + i * 0.09, 0.25, 'square', 0.15));
      tone(freq('C4'), t, 0.6, 'triangle', 0.25);
      break;
    case 'aura':
      tone(60, t, 0.8, 'sawtooth', 0.35, sfxGain, 0.4);
      noise(t, 0.6, 0.3, sfxGain, 200);
      ['G5', 'B5', 'D6', 'G6'].forEach((n, i) => tone(freq(n), t + 0.25 + i * 0.06, 0.4, 'triangle', 0.12));
      break;
    case 'hit': noise(t, 0.12, 0.35, sfxGain, 400); tone(150, t, 0.12, 'square', 0.2, sfxGain, 0.4); break;
    case 'crit': noise(t, 0.2, 0.45, sfxGain, 300); tone(400, t, 0.25, 'sawtooth', 0.25, sfxGain, 0.2); break;
    case 'miss': tone(600, t, 0.15, 'sine', 0.1, sfxGain, 0.5); break;
    case 'heal': ['E5', 'G#5', 'B5'].forEach((n, i) => tone(freq(n), t + i * 0.08, 0.2, 'triangle', 0.18)); break;
    case 'win': ['G4', 'C5', 'E5', 'G5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.1, 0.2, 'square', 0.14)); break;
    case 'lose': ['E4', 'D#4', 'D4', 'C#4'].forEach((n, i) => tone(freq(n), t + i * 0.22, 0.3, 'triangle', 0.2)); break;
    case 'kick': tone(200, t, 0.1, 'square', 0.25, sfxGain, 0.3); noise(t, 0.05, 0.2); break;
    case 'whistle': tone(2200, t, 0.4, 'sine', 0.15); tone(2300, t + 0.05, 0.35, 'sine', 0.1); break;
    case 'step': noise(t, 0.02, 0.04, sfxGain, 3000); break;
    case 'bark': tone(500, t, 0.08, 'sawtooth', 0.15, sfxGain, 0.6); tone(450, t + 0.12, 0.08, 'sawtooth', 0.15, sfxGain, 0.6); break;
    case 'encounter': ['C5', 'C5', 'G5', 'C6'].forEach((n, i) => tone(freq(n), t + i * 0.06, 0.08, 'square', 0.15)); break;
    default: break;
  }
}
