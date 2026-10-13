# Lumemon — práctica local contra la máquina

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Bloque anunciado y autorizado con «Continua».

**Goal:** primera partida visible de seis cartas contra un bot con el roster verificado.
**Architecture:** sesión pura sobre el motor existente, bot precomprometido, ruta React diferida y metadatos de imágenes copiados del catálogo.
**Tech Stack:** React, TypeScript, Vite y node:test existentes.
**Spec:** [Reglas](../specs/2026-10-12-lumemon-battle-rules-design.md); alcance de este bloque: práctica local sin tiempo, cuenta, premios o persistencia.

## Global Constraints
- Rama feat/practice-battle desde b118a54; checkout original, un escritor.
- 12 especies/24 cartas habilitadas, seis especies distintas por equipo, cero apoyos.
- Bot sencillo: puntúa sus movimientos legales con el motor, sin recibir la elección del jugador. Acción elegida al abrir cada turno.
- Vida, tipos, estados, recargas, cambios, sustituciones, registro y resultado observables en ES/EN.
- Empates de velocidad usan bit aleatorio inyectado desde la UI; funciones puras.
- /equipo sigue siendo borrador de catálogo separado; claves/contratos no cambian.
- No instalaciones, despliegue, merge a main ni servicios nuevos.

## Review Focus
- Clics repetidos, acción de una partida anterior y sustituciones simultáneas no duplican turnos ni daño residual.
- Bot no recibe ni cambia su acción por la elección del jugador; recargas e inmunidades respetadas.
- UI: selección de variante mantiene identidad, seis especies únicas, acción elegida se invalida al cambiar versión; reemplazos obligatorios y fin de partida accesibles.
- Imágenes y sus idiomas/procedencia coinciden con el catálogo; fallos visuales no bloquean combate.
- Móvil 320/390/768/1440, ES/EN, foco y teclado; ningún anuncio de recompensas o propiedad.

## Task 1: sesión y pantalla de práctica
**Files:** src/battle/practice.ts y practice.test.ts; accessor en playable-roster.ts; src/features/practice/*; router, navegación, CTA, traducciones; contexto y guía.
**Interfaces:**
- chooseBotAction(state): BattleAction; solo estado al abrir turno, sin acción rival.
- createPractice(battleId, playerIds): PracticeSession { battle, botAction, rounds }.
- practiceReducer(session|null, command): PracticeSession|null; start, turn, replace, exit. turn/replace/exit incluyen battleId y expectedVersion; mensajes obsoletos se ignoran.
- Sesión y bot se apoyan exclusivamente en resolveTurn/resolveReplacements; sustitución automática solo si el jugador sigue vivo.
- listBattleSpecies(): copias de metadatos verificados; card-artwork.json replica exactamente los 24 registros seleccionados del catálogo.
- [ ] RED: precompromiso, legalidad/recargas, inmutabilidad, mensaje duplicado/antiguo, KO de bot/jugador/ambos, final/reinicio, integridad de arte.
- [ ] Ejecutar pruebas nuevas con stubs. Expected: fallos por implementación ausente.
- [ ] GREEN: implementar sesión, metadatos y pantalla usando componentes existentes.
- [ ] Ejecutar npm test, npm run lint, npm run build y npm run battle:check. Expected: todos correctos.
- [ ] Verificar interfaz real y estados principales en navegador; corregir hallazgos.
- [ ] Actualizar continuidad, revisar diff, commit y revisión independiente final. Expected: sin hallazgos importantes pendientes.

Cierre: push en rama nueva y verificar sincronización. Tutorial guiado, más cartas y servicios quedan para otro bloque.
