# Lumemon — audio y animaciones de combate

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Implementación directa del bloque pedido por el usuario.

**Goal:** música Pokémon elegible, gritos reales y presentación animada de los turnos existentes.
**Architecture:** proyección visual de eventos sobre snapshots; control de reproducción independiente de las reglas; audio activado por gesto y aislado de errores de red.
**Tech Stack:** React/TypeScript, CSS, HTMLAudio/Web Audio; sin instalaciones.
**Spec:** petición del usuario y diseño en chat del 13/10: música famosa como Cobblemon; temas HGSS/DPP/BW/ORAS, volúmenes separados, animaciones por tipo y saltar animación.

## Global Constraints
- Rama feat/battle-audio-motion desde e0570ef. Mismo checkout; un escritor.
- Mantener reglas, datos, IDs, guardado del equipo y resultados del motor.
- Alcance /practica, ES/EN y móvil. Sin cuentas, costes, despliegue o merge.
- Música: archivos MP3 del índice público de Pokémon Showdown reproducidos de su origen, con atribución; no se afirma licencia comercial.
- Gritos de 12 especies: copia local (11 OGG y 1 MP3) fijada a revisión de PokeAPI/cries con hashes/procedencia.
- Nada suena sin activación; pausa al ocultar pestaña y limpieza al salir; volúmenes persistidos con validación.
- Animaciones breves secuenciadas: ataque, daño real, estado, cambio, KO. No simular impacto ante daño cero o ataque bloqueado.
- Bloquear acciones durante secuencia; salto y reduced-motion llegan exactamente al mismo resultado.

## Review Focus
- Un timer antiguo, salto, doble clic, salida o revancha no modifica otra partida ni repite audio.
- HP y carta mostrados corresponden al evento actual, especialmente KO con cambio automático de rival.
- Red fallida/autoplay bloqueado/preferencias inválidas nunca bloquean combate; silencio detiene sonidos existentes.
- Música/gritos se detienen al desmontar/ocultar; controles permanecen accesibles durante reproducción.
- Reduced-motion funciona sin destellos/traslaciones obligatorios; botones móviles y ES/EN.

## Task 1: presentación y audio verificados
**Files:** src/battle/playback.ts/tests; src/audio/*; src/features/practice/*; traducciones, package test glob, fuentes y continuidad.
**Interfaces:**
- buildPlaybackFrames(before, after, events): PlaybackFrame[]; clones visuales, siempre último snapshot igual a after.
- presentationReducer(state, command): comando de práctica o avance/salto asociado a battleId/version; ignora acciones durante reproducción y callbacks obsoletos.
- BattleAudio: activar por gesto, configurar preferencias, música contextual, señales, pausa/limpieza. Adaptadores de media/contexto inyectados para comprobar fallos/carreras.
- [x] RED: orden/HP/KO/sustitución/inmunidad, stale timers y salto, preferencias corruptas y ciclos de audio.
- [x] GREEN: módulos puros y UI con audio/animaciones por tipo.
- [x] npm test, lint, build, battle:check. Expected: correctos.
- [x] Navegador: activar/mutar música, gritos, controles, móvil, secuencia, salida y final sin bloquear.
- [x] Documentar verificación, commit, revisión independiente y push.

## Cierre de revisión

Revisión independiente e0570ef..9bb4478: dos P2 corregidos en un pase. Los gritos sobreviven a los frames ordinarios; cancelación explícita conservada. Movimiento reducido/checkbox solo suprimen movimiento, conservando mensajes, duración y audio; Saltar omite el resto. Regresión de controlador RED→GREEN y regresión de navegador RED→GREEN, 123 pruebas correctas, lint/build y battle:check correctos. No hay menores pendientes.

Límites revisados: música solo en /practica; FX propios; reglas/campaña/apoyos nuevos fuera; streaming dependiente de red/proveedor; procedencia sin dictamen de licencia comercial; mezcla subjetiva pendiente de escucha; caída real del proveedor, otros navegadores y preferencia OS no simulados. Son límites de la entrega, no funciones terminadas.
