# 🏉 Giuli RPG

Tu vida real convertida en un RPG de rugby. Giuli (medio scrum, #9) sube de nivel con lo que hacés en la vida real: gym, estudio, laburo, pasear a Piti y Catalina, visitar a los abuelos... y con eso pelea contra monstruos en su barrio.

Es una **app web instalable (PWA)**: anda en el celular y en la compu, funciona sin internet y no hay que publicarla en ninguna tienda de apps.

## Cómo se juega

| Pantalla | Qué hacés |
|---|---|
| 🏠 **Inicio** | Ves a Giuli con su aura, nivel, stats, misiones semanales, stats de rugby e historial (con botón Deshacer). |
| 📋 **Misiones** | Cargás lo que hiciste en la vida real, separado por categoría: Rugby, Salud y físico, Inteligencia, Nueva habilidad, Trabajo, Finanzas, Hogar, Social y Hábitos malos. También podés crear misiones propias. |
| 🗺️ **Mundo** | Recorrés el barrio: tu casa (con Piti y Catalina), la plaza, el gym, el kiosco, la casa de los abuelos, la facultad, el club y el Colegio Fátima (bloqueado por ahora). |
| 🛒 **Tienda** | Comprás camisetas, peinados, botines y accesorios, y comida para recuperar vida (mate, alfajor, asado...). |
| 🏆 **Logros** | 40 logros. Algunos desbloquean skins especiales. |

### El ciclo
1. Hacés algo en la vida real y lo cargás → ganás **XP, oro, aura y energía ⚡**.
2. La **energía** sirve para pelear contra monstruos y jugar minijuegos. Para jugar más, primero hay que cumplir en la vida real.
3. Los **hábitos malos** (fumar, alcohol, procrastinar, celular de noche...) te sacan vida y aura si caés, y te dan aura si resistís.

### 🗿 Aura
Se acumula y tiene rangos: NPC 💀 → Normal → Con flow → Aura farmer → Main character → Sigma 🗿 → Leyenda del club → Aura infinita. Un try en la vida real da **+1000 de aura**.

### 📅 Temporadas
- **Noviembre a enero: Vacaciones 🏖️.** No hay partidos y los desafíos son de pretemporada, gym, cursos y clientes.
- **Febrero a octubre: Temporada de rugby 🏉.** Se cargan partidos, tries, tackles, buenos y malos partidos y convocatorias.

### ⚔️ Combate y minijuegos
- Las peleas son por turnos: Tackle, Pase rápido, Box kick, Salida de scrum, **Ataque de Aura** y Defender. Tus stats reales definen cuánto pegás.
- Los monstruos son de la vida real: Procrastinación, La Excusa, Celular Zombi, El Sillón Devorador, Ansiedad, Miedo, El Parcial, El Cliente que No Paga...
- Hay tres jefes: **El Pilar Rival** (en el club), **El Final de Análisis** (en la facu) y el jefe final, **El Giuli de Ayer** (en la plaza).
- Minijuegos: Patadas a los palos, Corrida al try y Scrum (en el club), Press de banca (en el gym) y Trivia (en la facu).

## Controles
- **Celular:** joystick abajo a la izquierda y botón **A** para hablar o entrar.
- **Compu:** flechas o WASD, y Espacio o E.
- Para entrar a un lugar, pisá su puerta. Para pelear, tocá a un monstruo.

## Publicarla gratis (GitHub Pages)
1. En GitHub, andá a **Settings → Pages**.
2. En **Source** elegí **GitHub Actions**.
3. Cada vez que se sube un cambio, el workflow `.github/workflows/pages.yml` la publica en `https://giuliano8199.github.io/Proyecto-Grego/`.
4. Abrí ese link en el celular → **Instalar app** / **Agregar a pantalla de inicio**.

## Probarla en la compu
```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Tu progreso
Se guarda en el navegador de cada dispositivo. En **Inicio → Ajustes** podés descargar una copia de seguridad y cargarla en otro dispositivo.

## Cómo cambiar cosas
Todo el contenido (misiones, valores de XP y aura, monstruos, tienda, logros, trivia) está en `js/data.js`.

| Archivo | Qué tiene |
|---|---|
| `js/data.js` | Contenido del juego |
| `js/state.js` | Lógica: niveles, aura, rachas, desafíos, guardado |
| `js/world.js` | Mapa del barrio |
| `js/battle.js` | Combate por turnos |
| `js/minigames.js` | Minijuegos |
| `js/pixel.js` | Pixel art de los personajes (dibujado en código) |
| `js/audio.js` | Música chiptune y efectos (generados, sin archivos) |
| `js/ui.js` | Pantallas |

## Ideas para más adelante
- Mapa basado en tu barrio real.
- Habilitar el Colegio Fátima.
- Login y amigos: rankings, modo club y jefes en equipo (con Supabase o Firebase).
- Notificaciones de recordatorio.
- Usar tus fotos para afinar el sprite (pelo y camiseta real del club).
