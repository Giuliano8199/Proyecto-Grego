// =============================================================
//  CONTENIDO DEL JUEGO: misiones, temporadas, monstruos, tienda...
//  Editá este archivo para agregar o cambiar cosas.
// =============================================================

export const PLAYER = {
  name: 'Giuli',
  fullName: 'Giuliano Cicconi',
  position: 'Medio Scrum',
  number: 9,
  age: 17,
  club: 'Club Universitario',
  clubShort: 'La U',
};

export const STATS = {
  fue: { name: 'Fuerza', short: 'FUE', icon: '💪', color: '#ef476f' },
  res: { name: 'Resistencia', short: 'RES', icon: '🫀', color: '#f78c6b' },
  int: { name: 'Inteligencia', short: 'INT', icon: '🧠', color: '#4cc9f0' },
  car: { name: 'Carisma', short: 'CAR', icon: '😎', color: '#ffd166' },
  dis: { name: 'Disciplina', short: 'DIS', icon: '🎯', color: '#06d6a0' },
  esp: { name: 'Espíritu', short: 'ESP', icon: '🧘', color: '#b388ff' },
};

export const CATS = [
  { id: 'rugby', name: 'Rugby', icon: '🏉', color: '#e63946' },
  { id: 'salud', name: 'Salud y físico', icon: '💪', color: '#f78c6b' },
  { id: 'int', name: 'Inteligencia', icon: '🧠', color: '#4cc9f0' },
  { id: 'skill', name: 'Nueva habilidad', icon: '✨', color: '#c77dff' },
  { id: 'work', name: 'Trabajo', icon: '💼', color: '#ffd166' },
  { id: 'money', name: 'Finanzas', icon: '💰', color: '#06d6a0' },
  { id: 'home', name: 'Hogar', icon: '🏠', color: '#90be6d' },
  { id: 'social', name: 'Social', icon: '👥', color: '#ff8fab' },
  { id: 'bad', name: 'Hábitos malos', icon: '🚫', color: '#8d99ae' },
];

// m(id, categoría, ícono, nombre, opciones)
// xp, gold (oro), aura, stats (xp de cada stat), energy (energía ⚡ para pelear),
// hp (vida que recupera), daily (máximo por día), counter (pide cantidad),
// season: 'temporada' | 'vacaciones' (si solo aparece en una temporada)
const m = (id, cat, icon, name, o = {}) => ({
  id, cat, icon, name,
  xp: o.xp ?? 20, gold: o.gold ?? 5, aura: o.aura ?? 0,
  stats: o.stats ?? {}, energy: o.energy ?? 1, hp: o.hp ?? 0,
  daily: o.daily ?? 1, counter: !!o.counter, season: o.season ?? null,
  desc: o.desc ?? '', unit: o.unit ?? '',
});

export const MISSIONS = [
  // 🏉 RUGBY
  m('entreno', 'rugby', '🏉', 'Entrenamiento de rugby', { xp: 45, gold: 15, aura: 80, stats: { fue: 8, res: 10 }, energy: 2, desc: 'Fuiste a entrenar con el club.' }),
  m('pretemporada', 'rugby', '🔥', 'Físico de pretemporada', { xp: 40, gold: 12, aura: 60, stats: { res: 10, fue: 5 }, energy: 2, season: 'vacaciones', desc: 'Físico por tu cuenta para llegar a full a febrero.' }),
  m('pases', 'rugby', '🤾', 'Práctica de pase (medio scrum)', { xp: 25, gold: 8, aura: 40, stats: { dis: 5, int: 3 }, desc: 'Pase de ruck, box kick, salida rápida.' }),
  m('video', 'rugby', '📺', 'Ver video / analizar rugby', { xp: 15, gold: 4, stats: { int: 5 }, desc: 'Ver partidos y aprender del juego.' }),
  m('partido', 'rugby', '🏟️', 'Partido jugado', { xp: 90, gold: 35, aura: 300, stats: { fue: 10, res: 12, car: 5 }, energy: 3, season: 'temporada' }),
  m('try', 'rugby', '🙌', 'Try', { xp: 50, gold: 20, aura: 1000, stats: { car: 6, fue: 3 }, energy: 1, counter: true, daily: 20, unit: 'tries', season: 'temporada', desc: '+1000 de aura por try. Así de simple.' }),
  m('tackle', 'rugby', '🛡️', 'Tackle', { xp: 8, gold: 3, aura: 50, stats: { fue: 2, res: 1 }, energy: 0, counter: true, daily: 60, unit: 'tackles', season: 'temporada' }),
  m('buenpartido', 'rugby', '⭐', 'Buen partido', { xp: 60, gold: 20, aura: 500, stats: { car: 8, esp: 4 }, season: 'temporada' }),
  m('malpartido', 'rugby', '🌧️', 'Mal partido (igual fuiste)', { xp: 20, gold: 5, aura: -200, stats: { esp: 6 }, energy: 0, season: 'temporada', desc: 'Se aprende. El aura se recupera.' }),
  m('convocatoria', 'rugby', '📣', 'Convocatoria / citación', { xp: 120, gold: 60, aura: 1500, stats: { car: 10, esp: 5 }, energy: 2, season: 'temporada' }),

  // 💪 SALUD Y FÍSICO
  m('gym', 'salud', '🏋️', 'Ir al gym', { xp: 40, gold: 12, aura: 100, stats: { fue: 10, res: 4 }, energy: 2 }),
  m('correr', 'salud', '🏃', 'Salir a correr', { xp: 35, gold: 10, aura: 80, stats: { res: 12 }, energy: 2 }),
  m('dormir', 'salud', '😴', 'Dormir bien (7-8 h)', { xp: 20, gold: 5, aura: 30, stats: { esp: 5, res: 2 }, hp: 30 }),
  m('meditar', 'salud', '🧘', 'Meditar', { xp: 20, gold: 5, aura: 60, stats: { esp: 8 } }),
  m('comersano', 'salud', '🥗', 'Comer sano', { xp: 15, gold: 4, aura: 20, stats: { res: 3, esp: 2 }, hp: 10, daily: 3, energy: 0 }),
  m('agua', 'salud', '💧', 'Tomar 2 L de agua', { xp: 10, gold: 3, aura: 10, stats: { res: 2 }, hp: 5, energy: 0 }),
  m('estirar', 'salud', '🤸', 'Elongar / movilidad', { xp: 12, gold: 3, stats: { res: 3, esp: 2 }, energy: 0 }),

  // 🧠 INTELIGENCIA
  m('estudiar', 'int', '📚', 'Sesión de estudio', { xp: 30, gold: 8, aura: 30, stats: { int: 8, dis: 3 }, daily: 3 }),
  m('curso', 'int', '🤖', 'Clase del curso de Claude', { xp: 40, gold: 10, aura: 80, stats: { int: 10 }, energy: 2, daily: 3 }),
  m('terminarcurso', 'int', '🎓', 'Terminar un curso completo', { xp: 300, gold: 150, aura: 2000, stats: { int: 30, dis: 10 }, energy: 3 }),
  m('parcial', 'int', '📝', 'Rendir un parcial / examen', { xp: 120, gold: 40, aura: 500, stats: { int: 15, esp: 5 }, energy: 2 }),
  m('aprobar', 'int', '✅', 'Aprobar un parcial / examen', { xp: 150, gold: 60, aura: 1000, stats: { int: 15, car: 5 }, energy: 2 }),
  m('facu', 'int', '🏛️', 'Preparar el ingreso a la facu', { xp: 40, gold: 10, aura: 60, stats: { int: 8, dis: 4 }, daily: 2 }),
  m('leer', 'int', '📖', 'Leer 20 minutos', { xp: 15, gold: 4, stats: { int: 4, esp: 2 }, energy: 0 }),

  // ✨ NUEVA HABILIDAD
  m('aprender', 'skill', '💡', 'Aprender algo nuevo', { xp: 30, gold: 8, aura: 60, stats: { int: 5, esp: 5 } }),
  m('practicar', 'skill', '🎸', 'Practicar una habilidad (30 min)', { xp: 25, gold: 6, stats: { dis: 5, int: 3 }, daily: 2 }),
  m('programar', 'skill', '💻', 'Proyecto personal / programar', { xp: 40, gold: 10, aura: 50, stats: { int: 8, dis: 4 }, daily: 2 }),
  m('idioma', 'skill', '🗣️', 'Practicar un idioma', { xp: 20, gold: 5, stats: { int: 5, car: 2 } }),

  // 💼 TRABAJO
  m('cliente', 'work', '🤝', 'Conseguir un cliente nuevo', { xp: 200, gold: 100, aura: 1000, stats: { car: 15, dis: 5 }, energy: 3, daily: 5 }),
  m('entregar', 'work', '🌐', 'Entregar una página web', { xp: 150, gold: 80, aura: 800, stats: { int: 10, dis: 10 }, energy: 3, daily: 5 }),
  m('cobrar', 'work', '💵', 'Cobrar un trabajo', { xp: 120, gold: 150, aura: 700, stats: { dis: 5, car: 5 }, energy: 2, daily: 5 }),
  m('avanzar', 'work', '⌨️', 'Avanzar en un proyecto (1-2 h)', { xp: 35, gold: 12, aura: 30, stats: { int: 5, dis: 5 }, daily: 4 }),
  m('propuesta', 'work', '📨', 'Mandar una propuesta / presupuesto', { xp: 30, gold: 8, aura: 50, stats: { car: 6 }, daily: 3 }),
  m('portfolio', 'work', '🎨', 'Mejorar mi portfolio / redes', { xp: 25, gold: 6, stats: { car: 4, int: 2 } }),

  // 💰 FINANZAS
  m('ahorrar', 'money', '🐷', 'Ahorrar plata', { xp: 40, gold: 30, aura: 150, stats: { dis: 8 } }),
  m('nogastar', 'money', '🧾', 'Día sin gastos innecesarios', { xp: 20, gold: 10, aura: 50, stats: { dis: 6 }, energy: 0 }),
  m('pagar', 'money', '📅', 'Pagar una cuenta a tiempo', { xp: 20, gold: 5, stats: { dis: 5 }, energy: 0, daily: 3 }),
  m('anotar', 'money', '✏️', 'Anotar mis gastos', { xp: 10, gold: 3, stats: { dis: 3 }, energy: 0 }),

  // 🏠 HOGAR
  m('platos', 'home', '🍽️', 'Lavar los platos', { xp: 12, gold: 4, stats: { dis: 3 }, daily: 3, energy: 0 }),
  m('cama', 'home', '🛏️', 'Tender la cama', { xp: 8, gold: 2, stats: { dis: 3 }, energy: 0 }),
  m('pasto', 'home', '🌱', 'Cortar el pasto', { xp: 40, gold: 15, aura: 50, stats: { fue: 4, dis: 5 }, energy: 2 }),
  m('auto', 'home', '🚗', 'Lavar el auto', { xp: 35, gold: 15, aura: 40, stats: { dis: 5, fue: 2 }, energy: 1 }),
  m('piti', 'home', '🌭', 'Pasear a Piti', { xp: 15, gold: 4, aura: 20, stats: { res: 3, esp: 3 }, daily: 2 }),
  m('catalina', 'home', '🐕', 'Pasear a Catalina', { xp: 15, gold: 4, aura: 20, stats: { res: 3, esp: 3 }, daily: 2 }),
  m('perros', 'home', '🦴', 'Darle de comer a Piti y Catalina', { xp: 6, gold: 2, stats: { dis: 2 }, daily: 2, energy: 0 }),
  m('ordenar', 'home', '🧹', 'Ordenar el cuarto', { xp: 15, gold: 4, stats: { dis: 4 }, energy: 0 }),

  // 👥 SOCIAL
  m('amigos', 'social', '🍕', 'Ver a mis amigos', { xp: 25, gold: 5, aura: 80, stats: { car: 6, esp: 3 } }),
  m('joda', 'social', '🎉', 'Salir de joda', { xp: 25, gold: 0, aura: 150, stats: { car: 8 }, energy: 0 }),
  m('conocer', 'social', '👋', 'Conocer a alguien nuevo', { xp: 30, gold: 5, aura: 200, stats: { car: 10 } }),
  m('reencuentro', 'social', '🫂', 'Juntarme con alguien que no veía hace mucho', { xp: 35, gold: 5, aura: 150, stats: { car: 8, esp: 4 } }),
  m('abuelos', 'social', '👵', 'Visitar a los abuelos', { xp: 40, gold: 10, aura: 300, stats: { esp: 8, car: 4 }, energy: 2 }),
  m('familia', 'social', '🏡', 'Tiempo con la familia', { xp: 20, gold: 4, aura: 50, stats: { esp: 5, car: 2 } }),
  m('mama', 'social', '👩', 'Ayudar o charlar con mamá', { xp: 20, gold: 4, aura: 80, stats: { esp: 4, dis: 2 } }),
  m('papa', 'social', '👨', 'Charla o plan con papá', { xp: 20, gold: 4, aura: 80, stats: { esp: 3, car: 3 } }),
  m('feli', 'social', '🧒', 'Jugar o compartir con Feli', { xp: 20, gold: 4, aura: 100, stats: { car: 4, esp: 3 } }),
  m('tercertiempo', 'social', '🍻', 'Tercer tiempo con el equipo', { xp: 20, gold: 0, aura: 100, stats: { car: 8 }, energy: 0, season: 'temporada' }),
];

// 🚫 HÁBITOS MALOS: "Caí" te saca vida y aura. "Resistí" te da aura y disciplina.
export const BAD_HABITS = [
  { id: 'fumar', icon: '🚬', name: 'Fumar', hp: 15, aura: 300 },
  { id: 'alcohol', icon: '🍺', name: 'Tomar alcohol de más', hp: 15, aura: 200 },
  { id: 'paja', icon: '🙈', name: 'Masturbarse', hp: 5, aura: 150 },
  { id: 'procrastinar', icon: '🦥', name: 'Procrastinar', hp: 10, aura: 200 },
  { id: 'unas', icon: '💅', name: 'Comerme las uñas', hp: 3, aura: 50 },
  { id: 'celunoche', icon: '📱', name: 'Celular de noche', hp: 8, aura: 100 },
  { id: 'chatarra', icon: '🍔', name: 'Comida chatarra de más', hp: 8, aura: 80 },
];

// Misiones personalizadas: dificultad → recompensa
export const CUSTOM_DIFF = {
  facil: { name: 'Fácil', xp: 15, gold: 5, aura: 30, stat: 4, energy: 0 },
  media: { name: 'Media', xp: 35, gold: 12, aura: 120, stat: 8, energy: 1 },
  dificil: { name: 'Difícil', xp: 80, gold: 35, aura: 500, stat: 15, energy: 2 },
  epica: { name: 'Épica', xp: 200, gold: 100, aura: 1500, stat: 30, energy: 3 },
};
export const CAT_STAT = { rugby: 'fue', salud: 'res', int: 'int', skill: 'int', work: 'car', money: 'dis', home: 'dis', social: 'car' };

// ---------------- AURA ----------------
export const AURA_RANKS = [
  { min: -Infinity, name: 'NPC 💀', color: '#6c757d' },
  { min: 0, name: 'Normal', color: '#adb5bd' },
  { min: 1000, name: 'Con flow', color: '#4cc9f0' },
  { min: 5000, name: 'Aura farmer', color: '#06d6a0' },
  { min: 15000, name: 'Main character', color: '#ffd166' },
  { min: 40000, name: 'Sigma 🗿', color: '#f78c6b' },
  { min: 100000, name: 'Leyenda del club', color: '#e63946' },
  { min: 250000, name: 'Aura infinita ♾️', color: '#c77dff' },
];

// ---------------- TEMPORADAS ----------------
// Noviembre a enero: vacaciones (sin partidos). Febrero a octubre: temporada de rugby.
export function seasonFor(date = new Date()) {
  const y = date.getFullYear();
  const mo = date.getMonth(); // 0 = enero
  if (mo >= 10 || mo === 0) {
    const sy = mo === 0 ? y - 1 : y;
    return {
      id: `vac-${sy}`, type: 'vacaciones',
      name: `Temporada de Verano ${sy}/${String(sy + 1).slice(2)}`,
      short: 'Vacaciones 🏖️',
      desc: 'Sin partidos. Pretemporada, gym, estudio y laburo. Llegá a febrero en tu mejor versión.',
      start: new Date(sy, 10, 1), end: new Date(sy + 1, 1, 1),
    };
  }
  return {
    id: `temp-${y}`, type: 'temporada',
    name: `Temporada de Rugby ${y}`,
    short: 'Temporada 🏉',
    desc: 'Partidos, tries, tackles y convocatorias. A dejar todo en la cancha.',
    start: new Date(y, 1, 1), end: new Date(y, 10, 1),
  };
}

// Desafíos de temporada (progreso contando misiones dentro de la temporada)
export const SEASON_CHALLENGES = {
  vacaciones: [
    { id: 'v_gym', name: 'Pretemporada de acero', desc: 'Ir 40 veces al gym', ids: ['gym'], target: 40, reward: { gold: 300, aura: 3000 } },
    { id: 'v_correr', name: 'Pulmones de wing', desc: 'Salir a correr 20 veces', ids: ['correr', 'pretemporada'], target: 20, reward: { gold: 200, aura: 2000 } },
    { id: 'v_perros', name: 'Paseador oficial', desc: 'Pasear a Piti o Catalina 40 veces', ids: ['piti', 'catalina'], target: 40, reward: { gold: 150, aura: 1500 } },
    { id: 'v_claude', name: 'Ingeniero de prompts', desc: 'Hacer 25 clases de cursos de Claude', ids: ['curso'], target: 25, reward: { gold: 250, aura: 2500 } },
    { id: 'v_clientes', name: 'Verano facturador', desc: 'Conseguir 3 clientes nuevos', ids: ['cliente'], target: 3, reward: { gold: 400, aura: 4000 } },
    { id: 'v_abuelos', name: 'Nieto del verano', desc: 'Visitar a los abuelos 6 veces', ids: ['abuelos'], target: 6, reward: { gold: 150, aura: 2000 } },
  ],
  temporada: [
    { id: 't_tries', name: 'Máquina de tries', desc: 'Apoyar 10 tries', ids: ['try'], target: 10, reward: { gold: 500, aura: 5000 } },
    { id: 't_tackles', name: 'Muralla roja', desc: 'Hacer 150 tackles', ids: ['tackle'], target: 150, reward: { gold: 400, aura: 4000 } },
    { id: 't_partidos', name: 'Siempre presente', desc: 'Jugar 15 partidos', ids: ['partido'], target: 15, reward: { gold: 400, aura: 3000 } },
    { id: 't_entreno', name: 'Nunca falta', desc: 'Ir a 60 entrenamientos', ids: ['entreno'], target: 60, reward: { gold: 400, aura: 3000 } },
    { id: 't_convo', name: 'Fijo en la lista', desc: 'Ser convocado 10 veces', ids: ['convocatoria'], target: 10, reward: { gold: 300, aura: 3000 } },
    { id: 't_buenos', name: 'Figura', desc: 'Tener 8 buenos partidos', ids: ['buenpartido'], target: 8, reward: { gold: 300, aura: 4000 } },
  ],
};

// Misiones semanales (lunes a domingo)
export const WEEKLY = [
  { id: 'w_gym', name: 'Gym 4 veces', ids: ['gym'], target: 4, reward: { gold: 60, xp: 100, aura: 400 } },
  { id: 'w_rugby', name: 'Entrenar rugby 2 veces', ids: ['entreno', 'pretemporada', 'pases'], target: 2, reward: { gold: 40, xp: 80, aura: 300 } },
  { id: 'w_perros', name: 'Pasear a los perros 5 veces', ids: ['piti', 'catalina'], target: 5, reward: { gold: 30, xp: 60, aura: 200 } },
  { id: 'w_estudio', name: '5 sesiones de estudio o curso', ids: ['estudiar', 'curso', 'facu', 'leer'], target: 5, reward: { gold: 50, xp: 100, aura: 300 } },
  { id: 'w_hogar', name: '10 tareas de la casa', cat: 'home', target: 10, reward: { gold: 40, xp: 80, aura: 200 } },
  { id: 'w_social', name: '2 planes sociales', cat: 'social', target: 2, reward: { gold: 30, xp: 60, aura: 300 } },
  { id: 'w_trabajo', name: '4 avances de trabajo', cat: 'work', target: 4, reward: { gold: 80, xp: 120, aura: 400 } },
  { id: 'w_limpio', name: 'Resistir 5 malos hábitos', ids: ['resist'], target: 5, reward: { gold: 50, xp: 80, aura: 500 } },
  { id: 'w_monstruos', name: 'Derrotar 5 monstruos', ids: ['battle'], target: 5, reward: { gold: 50, xp: 80, aura: 200 } },
];

// ---------------- MONSTRUOS ----------------
// tpl = plantilla de pixel art (ver pixel.js). pal = colores.
export const MONSTERS = {
  procrastinacion: { name: 'Procrastinación', tpl: 'slime', pal: { G: '#7fb069', g: '#4f7942', E: '#1b1b1b', W: '#fff' }, hp: 40, atk: 7, def: 2, xp: 25, gold: 10, desc: '"Lo hago mañana..."', moves: ['Te tira un "después lo hago"', 'Bostezo contagioso'] },
  excusa: { name: 'La Excusa', tpl: 'slime', pal: { G: '#ff8fab', g: '#c9184a', E: '#1b1b1b', W: '#fff' }, hp: 45, atk: 8, def: 3, xp: 28, gold: 12, desc: '"Hoy llueve, no voy al gym."', moves: ['"Estoy cansado"', '"Mañana arranco"'] },
  celular: { name: 'Celular Zombi', tpl: 'phone', pal: { K: '#1b1b1b', B: '#3a86ff', R: '#ff006e', W: '#fff', g: '#8ac926' }, hp: 50, atk: 9, def: 3, xp: 32, gold: 14, desc: 'Scrollea tu alma a las 3 AM.', moves: ['Notificación infinita', 'Scroll hipnótico'] },
  sillon: { name: 'El Sillón Devorador', tpl: 'couch', pal: { R: '#9d4edd', r: '#5a189a', Y: '#ffd60a', E: '#1b1b1b', W: '#fff' }, hp: 65, atk: 8, def: 5, xp: 36, gold: 16, desc: 'Cinco minutitos más... ', moves: ['Abrazo acolchado', 'Maratón de series'] },
  chatarra: { name: 'Hamburguesa Chatarra', tpl: 'burger', pal: { T: '#e09f3e', t: '#9e6a2b', L: '#70e000', Y: '#ffd60a', M: '#6f1d1b', E: '#1b1b1b', W: '#fff' }, hp: 55, atk: 10, def: 3, xp: 34, gold: 15, desc: 'Triple cheddar a las 2 AM.', moves: ['Grasa saturada', 'Combo agrandado'] },
  ansiedad: { name: 'Ansiedad', tpl: 'ghost', pal: { V: '#9d4edd', v: '#5a189a', W: '#fff', E: '#10002b' }, hp: 60, atk: 11, def: 3, xp: 40, gold: 18, desc: '¿Y si sale todo mal? (no va a salir mal)', moves: ['Pensamiento en loop', 'Nudo en la panza'] },
  miedo: { name: 'Miedo', tpl: 'ghost', pal: { V: '#2b2d42', v: '#111122', W: '#ef233c', E: '#ffffff' }, hp: 70, atk: 12, def: 4, xp: 45, gold: 20, desc: 'Te susurra que no podés.', moves: ['Susurro oscuro', 'Parálisis'] },
  duda: { name: 'La Duda', tpl: 'question', pal: { Q: '#fb8500', W: '#fff', E: '#1b1b1b' }, hp: 48, atk: 10, def: 2, xp: 30, gold: 13, desc: '¿Seguro que sabés lo que hacés?', moves: ['¿Y si...?', 'Signo de pregunta'] },
  parcial: { name: 'El Parcial', tpl: 'book', pal: { B: '#3a86ff', b: '#1d3557', W: '#fff', E: '#1b1b1b', R: '#e63946' }, hp: 75, atk: 12, def: 5, xp: 50, gold: 22, desc: 'Viene con temas que no estudiaste.', moves: ['Pregunta trampa', 'Tiempo agotado'] },
  cliente: { name: 'El Cliente que No Paga', tpl: 'suit', pal: { K: '#212529', S: '#e9c46a', W: '#fff', R: '#e63946', E: '#1b1b1b', M: '#6d2e2e' }, hp: 70, atk: 11, def: 6, xp: 48, gold: 30, desc: '"¿Me hacés un cambio más? Te pago el mes que viene."', moves: ['"Un cambio chiquito"', 'Pago en 90 días'] },
  // Jefes
  pilar: { name: 'El Pilar Rival', tpl: 'player', rival: true, boss: true, hp: 160, atk: 16, def: 8, xp: 150, gold: 80, aura: 1000, desc: '130 kilos de pura maldad. Jefe del Club.', moves: ['Empujón de scrum', 'Tackle alto', 'Carga al ruck'] },
  final: { name: 'El Final de Análisis', tpl: 'book', boss: true, pal: { B: '#e63946', b: '#6a040f', W: '#fff', E: '#1b1b1b', R: '#ffd60a' }, hp: 170, atk: 17, def: 7, xp: 160, gold: 90, aura: 1000, desc: 'Jefe de la Facultad. 4 horas, 10 temas.', moves: ['Integral triple', 'Demostración por absurdo', 'Tema que no entraba'] },
  sombra: { name: 'El Giuli de Ayer', tpl: 'player', shadow: true, boss: true, final: true, hp: 260, atk: 20, def: 9, xp: 400, gold: 250, aura: 5000, desc: 'JEFE FINAL. Tu versión que no hacía nada. Hoy sos mejor que él.', moves: ['"No tenés ganas"', 'Excusa perfecta', 'Volvé a la cama'] },
};

// Zonas del mapa y sus monstruos
export const ZONES = {
  casa: { name: 'Casa de Giuli', monsters: ['sillon', 'celular', 'procrastinacion'] },
  barrio: { name: 'El Barrio', monsters: ['duda', 'excusa', 'chatarra', 'procrastinacion'] },
  plaza: { name: 'La Plaza', monsters: ['ansiedad', 'duda'] },
  gym: { name: 'El Gym', monsters: ['chatarra', 'excusa', 'sillon'] },
  club: { name: 'Club Universitario', monsters: ['miedo', 'ansiedad', 'excusa'] },
  facu: { name: 'La Facultad', monsters: ['parcial', 'duda', 'procrastinacion', 'cliente'] },
  cole: { name: 'Colegio Fátima', monsters: [] },
};

export const SKILLS = [
  { id: 'tackle', name: 'Tackle', icon: '🛡️', lvl: 1, desc: 'Golpe de fuerza. Confiable.' },
  { id: 'pase', name: 'Pase rápido', icon: '🏉', lvl: 1, desc: 'Dos golpes rápidos.' },
  { id: 'patada', name: 'Box kick', icon: '🦶', lvl: 3, desc: 'Daño por inteligencia.' },
  { id: 'scrum', name: 'Salida de scrum', icon: '⚡', lvl: 6, desc: 'Muy fuerte, puede fallar.' },
  { id: 'aura', name: 'Ataque de Aura', icon: '🗿', lvl: 1, desc: '1 vez por pelea. Escala con tu aura.' },
  { id: 'defender', name: 'Defender', icon: '🧱', lvl: 1, desc: 'Reduce el daño y curás un poco.' },
];

// ---------------- TIENDA (Kiosco) ----------------
export const CONSUMABLES = [
  { id: 'mate', name: 'Mate', icon: '🧉', price: 30, heal: 40, desc: 'Recupera 40 de vida.' },
  { id: 'alfajor', name: 'Alfajor', icon: '🍫', price: 15, heal: 20, desc: 'Recupera 20 de vida.' },
  { id: 'isotonica', name: 'Bebida isotónica', icon: '🧃', price: 55, heal: 80, desc: 'Recupera 80 de vida.' },
  { id: 'asado', name: 'Asado completo', icon: '🥩', price: 140, heal: 9999, desc: 'Vida al máximo.' },
];

// Cosméticos (skins). slot: jersey | head | hair | boots | pet
export const COSMETICS = [
  // Camisetas
  { id: 'club', slot: 'jersey', name: 'Universitario (cuartos rojo y blanco)', price: 0, look: { pattern: 'quarters', a: '#e53935', b: '#ffffff', n: '#1b1b1b' } },
  { id: 'club2', slot: 'jersey', name: 'Aros rojo y blanco', price: 0, look: { pattern: 'hoops', a: '#e53935', b: '#ffffff', n: '#1b1b1b' } },
  { id: 'club3', slot: 'jersey', name: 'Bastones rojo y blanco', price: 60, look: { pattern: 'vstripes', a: '#e53935', b: '#ffffff', n: '#1b1b1b' } },
  { id: 'clubalt', slot: 'jersey', name: 'Alternativa blanca', price: 150, look: { pattern: 'solid', a: '#f8f9fa', b: '#d62828', n: '#d62828' } },
  { id: 'entreno', slot: 'jersey', name: 'Remera de entreno', price: 80, look: { pattern: 'solid', a: '#6c757d', b: '#495057', n: '#fff' } },
  { id: 'albiceleste', slot: 'jersey', name: 'Albiceleste', price: 300, look: { pattern: 'vstripes', a: '#74c0fc', b: '#ffffff', n: '#1d3557' } },
  { id: 'negra', slot: 'jersey', name: 'Toda negra', price: 400, look: { pattern: 'solid', a: '#1b1b1b', b: '#333', n: '#fff' } },
  { id: 'rosa', slot: 'jersey', name: 'Rosa (octubre rosa)', price: 250, look: { pattern: 'solid', a: '#ff8fab', b: '#fb6f92', n: '#fff' } },
  { id: 'dorada', slot: 'jersey', name: 'Camiseta Dorada', price: 0, unlock: 'jefe_final', look: { pattern: 'halves', a: '#ffd60a', b: '#e9c46a', n: '#1b1b1b' } },
  // Cabeza
  { id: 'none', slot: 'head', name: 'Nada', price: 0 },
  { id: 'casco', slot: 'head', name: 'Casco de scrum', price: 120 },
  { id: 'vincha', slot: 'head', name: 'Vincha', price: 60 },
  { id: 'gorra', slot: 'head', name: 'Gorra', price: 100 },
  { id: 'lentes', slot: 'head', name: 'Lentes de sol', price: 150 },
  { id: 'auris', slot: 'head', name: 'Auriculares', price: 200 },
  { id: 'corona', slot: 'head', name: 'Corona de Aura', price: 0, unlock: 'aura_100k' },
  // Peinados
  { id: 'giuli', slot: 'hair', name: 'El de Giuli (ondulado)', price: 0, look: { style: 'giuli', c: '#7a5638', d: '#4e3524', l: '#b08a5e' } },
  { id: 'corto', slot: 'hair', name: 'Corto castaño', price: 0, look: { style: 'corto', c: '#6b4226', d: '#4a2c17' } },
  { id: 'flequillo', slot: 'hair', name: 'Flequillo', price: 100, look: { style: 'flequillo', c: '#6b4226', d: '#4a2c17' } },
  { id: 'largo', slot: 'hair', name: 'Pelo largo', price: 120, look: { style: 'largo', c: '#6b4226', d: '#4a2c17' } },
  { id: 'rapado', slot: 'hair', name: 'Rapado', price: 80, look: { style: 'rapado', c: '#7d5a3c', d: '#5c4030' } },
  { id: 'platinado', slot: 'hair', name: 'Platinado', price: 350, look: { style: 'corto', c: '#f2e6b8', d: '#cbb98a' } },
  { id: 'mohicano', slot: 'hair', name: 'Mohicano', price: 250, look: { style: 'mohicano', c: '#6b4226', d: '#4a2c17' } },
  // Botines
  { id: 'negros', slot: 'boots', name: 'Botines negros', price: 0, look: { c: '#1b1b1b' } },
  { id: 'blancos', slot: 'boots', name: 'Botines blancos', price: 50, look: { c: '#f1f3f5' } },
  { id: 'rojos', slot: 'boots', name: 'Botines rojos', price: 80, look: { c: '#e63946' } },
  { id: 'fluor', slot: 'boots', name: 'Botines flúor', price: 150, look: { c: '#b5e48c' } },
  { id: 'dorados', slot: 'boots', name: 'Botines dorados', price: 0, unlock: 'try10', look: { c: '#ffd60a' } },
  // Mascotas que te siguen en el mapa
  { id: 'ambos', slot: 'pet', name: 'Piti y Catalina', price: 0 },
  { id: 'piti', slot: 'pet', name: 'Solo Piti', price: 0 },
  { id: 'catalina', slot: 'pet', name: 'Solo Catalina', price: 0 },
  { id: 'ninguno', slot: 'pet', name: 'Sin mascota', price: 0 },
];
export const SLOT_NAMES = { jersey: 'Camisetas', head: 'Cabeza', hair: 'Peinados', boots: 'Botines', pet: 'Mascotas' };

// ---------------- LOGROS ----------------
// check(S, H): S = estado, H = ayudantes (level, count, cat, maxStreak...)
export const ACHIEVEMENTS = [
  { id: 'primera', icon: '👣', name: 'Primer paso', desc: 'Completá tu primera misión', check: (S, H) => H.totalMissions() >= 1, reward: { gold: 20, aura: 100 } },
  { id: 'lvl5', icon: '⬆️', name: 'Nivel 5', desc: 'Llegá a nivel 5', check: (S, H) => H.level() >= 5, reward: { gold: 100, aura: 500 } },
  { id: 'lvl10', icon: '🔟', name: 'Nivel 10', desc: 'Llegá a nivel 10', check: (S, H) => H.level() >= 10, reward: { gold: 250, aura: 1000 } },
  { id: 'lvl20', icon: '🌟', name: 'Nivel 20', desc: 'Llegá a nivel 20', check: (S, H) => H.level() >= 20, reward: { gold: 500, aura: 3000 } },
  { id: 'lvl30', icon: '👑', name: 'Nivel 30', desc: 'Llegá a nivel 30', check: (S, H) => H.level() >= 30, reward: { gold: 1000, aura: 10000 } },
  { id: 'aura_1k', icon: '🗿', name: '+1000 de aura', desc: 'Juntá 1.000 de aura', check: (S) => S.aura >= 1000, reward: { gold: 50 } },
  { id: 'aura_10k', icon: '✨', name: 'Aura farmer', desc: 'Juntá 10.000 de aura', check: (S) => S.aura >= 10000, reward: { gold: 200 } },
  { id: 'aura_100k', icon: '👑', name: 'Aura infinita', desc: 'Juntá 100.000 de aura (desbloquea la Corona)', check: (S) => S.aura >= 100000, reward: { gold: 1000 } },
  { id: 'npc', icon: '💀', name: 'Modo NPC', desc: 'Tener aura negativa (pasa en las mejores familias)', check: (S) => S.aura < 0, reward: {} },
  { id: 'gym10', icon: '🏋️', name: 'Rata de gimnasio', desc: 'Ir 10 veces al gym', check: (S, H) => H.count('gym') >= 10, reward: { gold: 80, aura: 500 } },
  { id: 'gym50', icon: '🦍', name: 'Bestia del gym', desc: 'Ir 50 veces al gym', check: (S, H) => H.count('gym') >= 50, reward: { gold: 300, aura: 3000 } },
  { id: 'racha7', icon: '🔥', name: 'Constancia', desc: 'Racha de 7 días en cualquier misión', check: (S, H) => H.maxStreak() >= 7, reward: { gold: 100, aura: 700 } },
  { id: 'racha30', icon: '☄️', name: 'Imparable', desc: 'Racha de 30 días en cualquier misión', check: (S, H) => H.maxStreak() >= 30, reward: { gold: 500, aura: 5000 } },
  { id: 'try1', icon: '🙌', name: 'Primer try', desc: 'Apoyá tu primer try', check: (S, H) => H.count('try') >= 1, reward: { gold: 50 } },
  { id: 'try10', icon: '🥇', name: 'Tryman', desc: '10 tries (desbloquea botines dorados)', check: (S, H) => H.count('try') >= 10, reward: { gold: 300 } },
  { id: 'tackle100', icon: '🧱', name: 'Muralla', desc: '100 tackles', check: (S, H) => H.count('tackle') >= 100, reward: { gold: 300, aura: 2000 } },
  { id: 'convocado', icon: '📣', name: 'Convocado', desc: 'Primera convocatoria', check: (S, H) => H.count('convocatoria') >= 1, reward: { gold: 100 } },
  { id: 'perros', icon: '🐾', name: 'Mejor amigo', desc: 'Pasear a Piti o Catalina 20 veces', check: (S, H) => H.count('piti') + H.count('catalina') >= 20, reward: { gold: 100, aura: 500 } },
  { id: 'abuelos', icon: '👵', name: 'Nieto del año', desc: 'Visitar a los abuelos 5 veces', check: (S, H) => H.count('abuelos') >= 5, reward: { gold: 100, aura: 1000 } },
  { id: 'cliente1', icon: '🤝', name: 'Emprendedor', desc: 'Conseguir tu primer cliente', check: (S, H) => H.count('cliente') >= 1, reward: { gold: 100 } },
  { id: 'cliente5', icon: '🏢', name: 'Agencia', desc: 'Conseguir 5 clientes', check: (S, H) => H.count('cliente') >= 5, reward: { gold: 500, aura: 3000 } },
  { id: 'cobrar', icon: '💵', name: 'Primera guita', desc: 'Cobrar un trabajo', check: (S, H) => H.count('cobrar') >= 1, reward: { gold: 50 } },
  { id: 'web5', icon: '🌐', name: 'Web master', desc: 'Entregar 5 páginas web', check: (S, H) => H.count('entregar') >= 5, reward: { gold: 300, aura: 2000 } },
  { id: 'certificado', icon: '🎓', name: 'Certificado', desc: 'Terminar un curso completo', check: (S, H) => H.count('terminarcurso') >= 1, reward: { gold: 200 } },
  { id: 'estudio20', icon: '🤓', name: 'Cerebrito', desc: '20 sesiones de estudio o curso', check: (S, H) => H.count('estudiar') + H.count('curso') >= 20, reward: { gold: 150, aura: 800 } },
  { id: 'hogar50', icon: '🧽', name: 'Amo de casa', desc: '50 tareas del hogar', check: (S, H) => H.cat('home') >= 50, reward: { gold: 150, aura: 800 } },
  { id: 'social10', icon: '🥳', name: 'Sociable', desc: '10 planes sociales', check: (S, H) => H.cat('social') >= 10, reward: { gold: 100, aura: 800 } },
  { id: 'ahorro10', icon: '🐷', name: 'Ahorrista', desc: 'Ahorrar 10 veces', check: (S, H) => H.count('ahorrar') >= 10, reward: { gold: 200, aura: 1000 } },
  { id: 'limpio7', icon: '🧼', name: '7 días limpio', desc: 'Resistir un mal hábito 7 días seguidos', check: (S, H) => H.maxResistStreak() >= 7, reward: { gold: 150, aura: 1500 } },
  { id: 'equilibrio', icon: '☯️', name: 'Equilibrio', desc: 'En un mismo día: salud, inteligencia, trabajo, hogar y social', check: (S, H) => H.balancedToday(), reward: { gold: 150, aura: 1000 } },
  { id: 'win1', icon: '⚔️', name: 'Primera victoria', desc: 'Ganá tu primera pelea', check: (S) => S.wins >= 1, reward: { gold: 30 } },
  { id: 'win25', icon: '🗡️', name: 'Cazamonstruos', desc: 'Ganá 25 peleas', check: (S) => S.wins >= 25, reward: { gold: 250, aura: 1500 } },
  { id: 'pilar', icon: '🐂', name: 'Derribaste al pilar', desc: 'Vencé al Pilar Rival', check: (S) => (S.defeated.pilar || 0) >= 1, reward: { gold: 150, aura: 1000 } },
  { id: 'final', icon: '📕', name: 'Aprobaste el final', desc: 'Vencé al Final de Análisis', check: (S) => (S.defeated.final || 0) >= 1, reward: { gold: 150, aura: 1000 } },
  { id: 'jefe_final', icon: '🏆', name: 'Mejor que ayer', desc: 'Vencé al Giuli de Ayer (desbloquea la Camiseta Dorada)', check: (S) => (S.defeated.sombra || 0) >= 1, reward: { gold: 500, aura: 10000 } },
  { id: 'pie_oro', icon: '🦶', name: 'Pie de oro', desc: '5 de 5 en Patadas a los palos', check: (S) => S.best.kicks >= 5, reward: { gold: 100, aura: 1000 } },
  { id: 'corredor', icon: '💨', name: 'Inatrapable', desc: '3 de 3 tries en Corrida al try', check: (S) => S.best.tries >= 3, reward: { gold: 100, aura: 1000 } },
  { id: 'sabelotodo', icon: '🧠', name: 'Sabelotodo', desc: '5 de 5 en la Trivia de la facu', check: (S) => S.best.trivia >= 5, reward: { gold: 100, aura: 800 } },
  { id: 'scrum', icon: '🐃', name: 'Scrum dominante', desc: 'Ganá el minijuego de Scrum', check: (S) => S.best.scrum >= 1, reward: { gold: 80, aura: 500 } },
  { id: 'fashion', icon: '🧢', name: 'Facha', desc: 'Comprá 5 cosméticos', check: (S, H) => H.boughtCosmetics() >= 5, reward: { gold: 100, aura: 1000 } },
];

// ---------------- TRIVIA (Facultad) ----------------
export const TRIVIA = [
  { q: '¿Cuántos jugadores tiene en cancha un equipo de rugby XV?', a: ['15', '13', '11', '7'] },
  { q: '¿Cuántos puntos vale un try?', a: ['5', '3', '4', '7'] },
  { q: '¿Cuántos puntos vale una conversión?', a: ['2', '1', '3', '5'] },
  { q: '¿Cuántos puntos vale un penal a los palos?', a: ['3', '2', '5', '1'] },
  { q: '¿Cuántos puntos vale un drop?', a: ['3', '2', '1', '5'] },
  { q: '¿Qué número usa normalmente el medio scrum?', a: ['9', '10', '7', '12'] },
  { q: '¿Qué número usa normalmente el apertura?', a: ['10', '9', '15', '8'] },
  { q: '¿Cómo tiene que ser el pase en rugby?', a: ['Hacia atrás o lateral', 'Hacia adelante', 'Solo con el pie', 'Por arriba de la cabeza'] },
  { q: '¿Cuántos jugadores forman el scrum de cada equipo (rugby XV)?', a: ['8', '6', '5', '10'] },
  { q: '¿Cuánto dura un partido de rugby XV de mayores?', a: ['80 minutos', '90 minutos', '70 minutos', '60 minutos'] },
  { q: '¿Cómo se llama la jugada para reanudar cuando la pelota sale por el costado?', a: ['Line-out', 'Scrum', 'Maul', 'Drop'] },
  { q: '¿Cuántos jugadores por equipo hay en rugby seven?', a: ['7', '5', '9', '10'] },
  { q: '¿Qué país ganó más Mundiales de rugby hasta 2023?', a: ['Sudáfrica', 'Nueva Zelanda', 'Inglaterra', 'Australia'] },
  { q: '¿Qué significa HTML?', a: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Machine Language'] },
  { q: '¿Qué lenguaje se usa para darle estilos a una página web?', a: ['CSS', 'SQL', 'Python', 'XML'] },
  { q: '¿Qué etiqueta HTML crea un enlace?', a: ['<a>', '<link>', '<href>', '<url>'] },
  { q: 'En JavaScript, ¿qué método agrega un elemento al final de un array?', a: ['push()', 'pop()', 'shift()', 'add()'] },
  { q: '¿Qué código HTTP significa "no encontrado"?', a: ['404', '200', '500', '301'] },
  { q: '¿Qué significa que una web sea "responsive"?', a: ['Se adapta a cualquier pantalla', 'Responde mensajes sola', 'Carga sin internet', 'Tiene animaciones'] },
  { q: '¿Qué propiedad CSS convierte un contenedor en flexible?', a: ['display: flex', 'position: flex', 'float: flex', 'flex: on'] },
  { q: '¿Qué empresa creó a Claude?', a: ['Anthropic', 'Google', 'Microsoft', 'Meta'] },
  { q: '¿Cuál es el planeta más grande del sistema solar?', a: ['Júpiter', 'Saturno', 'Neptuno', 'La Tierra'] },
  { q: '¿Cuál es la capital de Australia?', a: ['Canberra', 'Sídney', 'Melbourne', 'Perth'] },
  { q: '¿Cuántos huesos tiene el cuerpo humano adulto?', a: ['206', '186', '226', '306'] },
  { q: '¿Qué gas absorben las plantas para la fotosíntesis?', a: ['Dióxido de carbono', 'Oxígeno', 'Nitrógeno', 'Helio'] },
  { q: '¿Cuánto es el 15% de 200?', a: ['30', '15', '20', '35'] },
  { q: '¿Cuál es el río más largo de Sudamérica?', a: ['Amazonas', 'Paraná', 'Orinoco', 'Río de la Plata'] },
  { q: '¿En qué año llegó el ser humano a la Luna?', a: ['1969', '1959', '1975', '1982'] },
  { q: '¿Cuál es el músculo más grande del cuerpo?', a: ['Glúteo mayor', 'Bíceps', 'Cuádriceps', 'Pectoral'] },
  { q: '¿Cuántas horas de sueño se recomiendan para un adulto joven?', a: ['7 a 9', '4 a 5', '10 a 12', '5 a 6'] },
  { q: '¿Qué nutriente es clave para reparar el músculo?', a: ['Proteínas', 'Azúcares', 'Sal', 'Cafeína'] },
  { q: '¿En qué año se declaró la independencia argentina?', a: ['1816', '1810', '1853', '1806'] },
];

// ---------------- NPCs / frases ----------------
export const COACH_TIPS = [
  'Entrenador: "El medio scrum es el cerebro del equipo. Pensá rápido, pasá más rápido."',
  'Entrenador: "En vacaciones se ganan los partidos de febrero. Gym y correr, Giuli."',
  'Entrenador: "Un tackle bien hecho vale más que mil palabras."',
  'Entrenador: "Dormí bien. El descanso también es entrenamiento."',
  'Entrenador: "Si fallás un pase, el próximo lo das el doble de rápido."',
  'Entrenador: "Hablá con tus forwards. Que te escuchen desde la otra punta."',
  'Entrenador: "El aura no se compra. Se gana en la cancha y en la vida."',
  'Entrenador: "Todo rojo y blanco, Giuli. La U se defiende en cada tackle."',
  'Entrenador: "Desde 1907 este club se banca todo. Vos también."',
];
export const DOG_LINES = {
  piti: ['Piti mueve la colita a mil 🌭', 'Piti te mira con ojitos de "¿salimos?"', 'Piti se tira panza arriba. Pedido de mimos.'],
  catalina: ['Catalina salta como loca 🐕', 'Catalina te trae una pelota toda babeada', 'Catalina te apoya la cabeza en la pierna.'],
};

// ---------------- FAMILIA ----------------
// look = cómo se ven (podés cambiar colores: pelo c/d/l, ropa a/b)
const shirt = (a, b = a) => ({ pattern: 'solid', a, b, n: a });
export const FAMILY = [
  {
    id: 'mama', name: 'Cecilia', role: 'Mamá', age: 49, icon: '👩',
    look: { jersey: { pattern: 'vneck', a: '#f8f9fa', b: '#f8f9fa', n: '#f8f9fa' }, hair: { style: 'coleta', c: '#e6e2d8', d: '#b9b2a4', l: '#ffffff' }, shorts: '#8d8d8d', socks: '#f4cdb0', boots: { c: '#e9ecef' }, eye: '#4a7c8c', chain: true, head: 'none' },
    action: 'Charlar con mamá', actionDesc: 'Un rato con Cecilia te cura el alma', tag: '+vida · +espíritu',
    reward: { aura: 80, hp: 40, stats: { esp: 4 } }, gift: 'mate',
    lines: ['¿Comiste algo, Giuli?', '¿Cómo te fue hoy, mi amor?', 'Estoy muy orgullosa de vos.', 'Ordená el cuarto, ¿sí? 😅', 'Abrigate que a la noche refresca.', 'Acordate de tomar agua.', 'Te hice algo rico, está en la heladera.'],
  },
  {
    id: 'papa', name: 'Marco', role: 'Papá', age: 48, icon: '👨',
    look: { jersey: { pattern: 'rose', a: '#55575c', b: '#c1121f', n: '#55575c', c: '#e9ecef' }, hair: { style: 'corto', c: '#7a5a3c', d: '#5a412b' }, shorts: '#2b2d33', socks: '#2b2d33', boots: { c: '#e9ecef' }, eye: '#5d8aa8', beard: '#b08a6a', chain: true, head: 'gorraVerde' },
    action: 'Café con papá', actionDesc: 'Un café y una charla con Marco', tag: '+vida · +oro',
    reward: { aura: 80, gold: 20, hp: 25, stats: { dis: 4, car: 2 } },
    lines: ['¿Cómo viene el físico? En febrero arranca todo.', 'Un medio scrum piensa antes que nadie.', 'Los laburos se cobran a tiempo, eh.', 'La constancia le gana al talento.', 'Cuando quieras vamos a ver un partido.', 'Si te comprometés con algo, cumplilo.', 'Bien ahí, Giuli. Seguí así.'],
  },
  {
    id: 'tomi', name: 'Tomi', role: 'Hermano', age: 27, icon: '🤍',
    look: { jersey: { pattern: 'print', a: '#f8f9fa', b: '#2f6690', n: '#f8f9fa', c: '#9fb3c8' }, hair: { style: 'corto', c: '#1f1712', d: '#0d0907', l: '#2e231b' }, shorts: '#3a3f4b', socks: '#f4cdb0', boots: { c: '#e9ecef' }, eye: '#6fb3d9', beard: '#2b211a', head: 'none', big: true, tall: 1.25 },
  },
  {
    id: 'feli', name: 'Feli', role: 'Hermano', age: 11, icon: '🧒', small: true,
    look: { jersey: { pattern: 'solid', a: '#e9ecef', b: '#ced4da', n: '#e9ecef' }, hair: { style: 'flequillo', c: '#3b2a1e', d: '#241a12' }, shorts: '#6c757d', socks: '#f4cdb0', boots: { c: '#3a86ff' }, eye: '#4a5a6c', head: 'none' },
    action: 'Jugar con Feli', actionDesc: 'Pelota en el patio con tu hermanito', tag: '+vida · +aura',
    reward: { aura: 150, hp: 25, stats: { car: 4, esp: 2 } }, gift: 'alfajor',
    lines: ['¡Giuli! ¿Me enseñás a patear a los palos?', 'Te gané a la play, admitilo.', '¿Jugamos un rato en el patio?', 'Cuando sea grande voy a ser medio scrum como vos.', '¿Me llevás al club el sábado?', '¿Me pasás un tackle? Despacito.'],
  },
];

// ---------------- COMPAÑEROS DEL CLUB ----------------
// Ropa de entrenamiento: algunos con la camiseta de la U, otros con otras.
const U = { pattern: 'quarters', a: '#e53935', b: '#ffffff', n: '#1b1b1b' };
const tee = (a, b = a) => ({ pattern: 'solid', a, b, n: a });
const hoops = (a, b) => ({ pattern: 'hoops', a, b, n: '#ffffff' });
const hair = (style, c, d) => ({ style, c, d });
export const TEAMMATES = [
  { id: 'tizot', name: 'Mateo Tizot', look: { jersey: U, hair: hair('corto', '#3b2a1e', '#241a12'), shorts: '#1b1b1b', socks: '#e53935', boots: { c: '#1b1b1b' } } },
  { id: 'mano', name: 'Mano', look: { jersey: tee('#2b2d42'), hair: hair('rapado', '#1b1b1b', '#000'), shorts: '#1b1b1b', socks: '#2b2d42', boots: { c: '#e9ecef' }, skin: '#e0b090', skinD: '#b8866a' } },
  { id: 'ponce', name: 'Jero Ponce', look: { jersey: U, hair: hair('flequillo', '#6b4226', '#4a2c17'), shorts: '#f1f3f5', socks: '#e53935', boots: { c: '#e63946' } } },
  { id: 'canolo', name: 'Genaro Cañolo', look: { jersey: tee('#6c757d'), hair: hair('largo', '#3b2a1e', '#241a12'), shorts: '#1b1b1b', socks: '#6c757d', boots: { c: '#1b1b1b' } } },
  { id: 'valendepa', name: 'Valendepa', look: { jersey: hoops('#2d6a4f', '#ffffff'), hair: hair('corto', '#8a6a3c', '#5e4527'), shorts: '#1b1b1b', socks: '#2d6a4f', boots: { c: '#b5e48c' } } },
  { id: 'mosquito', name: 'Mosquito', look: { jersey: U, hair: hair('mohicano', '#1b1b1b', '#000'), shorts: '#1b1b1b', socks: '#e53935', boots: { c: '#ffd60a' } } },
  { id: 'cava', name: 'Gordo Cava', look: { jersey: tee('#1b1b1b'), hair: hair('rapado', '#3b2a1e', '#241a12'), shorts: '#1b1b1b', socks: '#1b1b1b', boots: { c: '#1b1b1b' }, beard: '#3b2a1e' } },
  { id: 'augusto', name: 'Augusto', look: { jersey: hoops('#1d3557', '#a8dadc'), hair: hair('corto', '#c9a227', '#9e7e1c'), shorts: '#f1f3f5', socks: '#1d3557', boots: { c: '#1b1b1b' } } },
  { id: 'molina', name: 'Molina', look: { jersey: U, hair: hair('corto', '#1b1b1b', '#000'), shorts: '#f1f3f5', socks: '#e53935', boots: { c: '#1b1b1b' }, skin: '#d9a87e', skinD: '#b8866a' } },
  { id: 'rocha', name: 'Rocha', look: { jersey: tee('#e9ecef', '#ced4da'), hair: hair('flequillo', '#3b2a1e', '#241a12'), shorts: '#1b1b1b', socks: '#e9ecef', boots: { c: '#3a86ff' } } },
  { id: 'calvo', name: 'Calvo', look: { jersey: hoops('#6a040f', '#ffba08'), hair: hair('rapado', '#6b4226', '#4a2c17'), shorts: '#1b1b1b', socks: '#6a040f', boots: { c: '#1b1b1b' } } },
  { id: 'justo', name: 'Justo', look: { jersey: U, hair: hair('largo', '#8a6a3c', '#5e4527'), shorts: '#1b1b1b', socks: '#e53935', boots: { c: '#e9ecef' } } },
];

// Temas de charla con los chicos del club
export const TALK_TOPICS = [
  { id: 'egresados', icon: '🎓', name: 'Egresados', lines: ['¿Ya tenés el buzo de egresados? El mío llega la semana que viene.', 'El viaje de egresados va a ser una locura, hermano.', '¿Quién arma la previa para la fiesta de egresados?', 'Hay que juntar plata para el viaje, ¿vendemos algo?', 'Último mes de cole, a disfrutarlo a full.'] },
  { id: 'partido', icon: '🏉', name: 'El próximo partido', lines: ['Este año la rompemos, la U vuelve a lo más alto.', 'Hay que trabajar las salidas del ruck, Giuli. Vos sos clave.', 'El line nos viene costando, hay que practicar las llamadas.', 'Si llegamos bien físicamente en febrero, no nos para nadie.', 'Vos pasala rápido que yo la rompo por afuera.'] },
  { id: 'entreno', icon: '💪', name: 'Entrenamiento', lines: ['¿Vamos al gym después del entreno?', 'Hoy hay pasadas, prepará los pulmones.', 'Me duele todo de las sentadillas de ayer.', 'Hay que meterle a la pretemporada, nada de aflojar en vacaciones.', '¿Hacemos patadas a los palos después?'] },
  { id: 'tercer', icon: '🍻', name: 'Tercer tiempo / joda', lines: ['¿Qué onda el finde? ¿Salimos?', 'El tercer tiempo del sábado fue épico.', 'Hay asado en lo de alguno el viernes, sumate.', '¿Vas a la fiesta del club?', 'Esta vez la previa en tu casa, Giuli 😂'] },
  { id: 'vida', icon: '💬', name: 'Cómo andás', lines: ['Todo bien, hermano. ¿Vos cómo andás?', 'Bien, metiéndole al estudio y al laburo.', 'Cualquier cosa que necesites, avisá. Para eso estamos.', 'Che, me alegra verte con tanta energía.', 'Se te ve más fuerte, eh. Se nota el gym.'] },
];

// Rivales (nombres inventados)
export const RIVALS = [
  { name: 'Halcones RC', short: 'HAL', a: '#1d3557', b: '#ffd60a', shorts: '#1d3557' },
  { name: 'Toros del Norte', short: 'TOR', a: '#2d6a4f', b: '#ffffff', shorts: '#1b1b1b' },
  { name: 'Cóndores', short: 'CON', a: '#3a0ca3', b: '#f72585', shorts: '#14213d' },
  { name: 'Pumas de la Sierra', short: 'PUM', a: '#0077b6', b: '#caf0f8', shorts: '#023e8a' },
  { name: 'Lobos RC', short: 'LOB', a: '#212529', b: '#adb5bd', shorts: '#212529' },
];
