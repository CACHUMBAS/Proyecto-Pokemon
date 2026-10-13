# Lumemon — resolución local de turnos

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Ejecución directa autorizada por «Vale sigue, tenemos que avanzar», continuando el bloque anunciado de turnos.

**Goal:** resolver partidas locales reproducibles con seis miembros por equipo, acciones simultáneas, estados, apoyos y sustituciones.
**Architecture:** datos explícitos de combate separados del catálogo; funciones puras que clonan su entrada, reutilizan calculateDamage y devuelven estado + eventos. Sin reloj, React, almacenamiento, red ni premios.
**Tech Stack:** TypeScript y node:test existentes, sin dependencias.
**Spec:** [Reglas aceptadas](../specs/2026-10-12-lumemon-battle-rules-design.md), secciones 3–8.

## Global Constraints
- Base 991b30c, rama feat/battle-turns, mismo checkout solicitado para VS Code; un solo editor.
- El diseño arquitectónico existente y la continuación autorizan este bloque. No repetir la consulta sobre reglas ya aceptadas.
- Seis especies distintas, un activo, hasta tres apoyos sin repetir efecto.
- Cambios → apoyos → movimientos por velocidad efectiva fijada → daño residual simultáneo → sustituciones.
- Cinco estados, cuatro apoyos y recargas exactas de la especificación. Victoria por daño directo termina inmediatamente. Turno 60 sin vencedor: empate.
- No inventar datos oficiales: las pruebas usan fichas sintéticas identificadas; perfiles, movimientos de cartas reales y tutorial se entregarán después.
- El servicio futuro confirma acciones privadas, aplica 45 segundos, reconexión, autenticación, propiedad e idempotencia transaccional. Aquí se recibe una pareja de acciones ya reunidas; null en sustitución significa selección automática solicitada por el llamador, no que haya vencido un reloj.

## Review Focus
- Acciones de una reserva/otro turno, movimiento no permitido o en recarga y apoyo inválido: rechazar antes de producir efectos.
- Empate de velocidad: bit explícito solo si hace falta, evento reproducible; nunca Math.random. Orden fijo aunque cambie un estado.
- KO con acción pendiente, doble KO residual, turno 60 y sustituciones: no atacar desde un debilitado ni iniciar turnos extra.
- Inmunidades de estado, descongelación, paso/sueño y cargas/caducidad: aplicar una sola vez y en el momento documentado.
- Inmutabilidad, serialización, números inseguros y referencias compartidas: entradas intactas y salida independiente, porcentajes exactos.

## Task 1: ciclo completo local
**Files:** crear engine-types.ts (contratos), battle-state.ts (creación/validación de datos), battle-effects.ts (efectos), turn-engine.ts (resolución), turn-engine.test.ts y fixtures/battle-test-data.ts (solo pruebas), README de módulo. Actualizar README y contexto/guía.

**Interfaces:**
- createBattle(setup: BattleSetup): BattleState. Exige 6 fichas por lado, IDs/especies únicos por equipo, estadísticas enteras positivas seguras, tipos válidos, 1–4 movimientos (incluido básico 40/0) con perfiles de daño 40/0 o 60/1, estado 0/2 y efectos conocidos; apoyos ≤3 con ID y efecto únicos. Inicializa turno/version 1, todos vivos, activo 0.
- validateAction(state, side: 0|1, action: BattleAction): void. Lanza Error ante fase/actor/movimiento/apoyo/cambio inválido; no muta. Paso es acción explícita asignada por el llamador.
- resolveTurn(state, actions: readonly [BattleAction, BattleAction], expectedVersion: number, tieBreak?: 0|1): BattleTransition. Rechaza versión obsoleta y empate sin bit; devuelve {state, events}. Bit 0 prioriza lado 0; 1 lado 1.
- resolveReplacements(state, choices: readonly [string|null,string|null], expectedVersion): BattleTransition. ID de reserva viva para afectados; null elige la primera viva, y es obligatorio para no afectados. Completa sustituciones y abre turno siguiente.
- Estado lleva battleId, dataVersion, rulesetVersion, damageRulesetVersion, version, turn, phase, sides y result. Es un estado interno generado por este motor; no se ofrece hidratación de snapshots externos/no fiables.
- Eventos discriminados de cambio, apoyo, orden/sorteo, ejecución/recarga, daño, estados, impedimento, KO, caducidad y resultado. Textos traducibles se construirán en la futura interfaz; sin mensajes ingleses incrustados como copy.

- [x] Escribir pruebas con cifras literales: prioridad/inmunidad al cambio, daño 60, orden, cancelación KO, recarga t+2/t+3, veneno 16 y quemadura 10 para HP204, curación hasta204, estados y apoyos, sustitución sin turno residual extra, empate/límite60 y validación.
- [x] Ejecutar node --test src/battle/turn-engine.test.ts. Expected: fallos por funciones stub sin implementar.
- [x] Implementar contratos y ciclo local, validar entradas antes de clonar/resolver, porcentajes con BigInt.
- [x] Ejecutar prueba dirigida. Expected: todos los casos correctos.
- [x] Ejecutar npm test, npm run lint, npm run build. Expected: suite, lint, typecheck y compilación correctos.
- [x] Revisión independiente final exigida por executing-plans; corregir hallazgos relevantes con RED→GREEN.
- [x] Actualizar contexto y comprobar diff. Evidencia: 91/91 pruebas, lint y build con typecheck correctos; revisión independiente sin hallazgos.

Cierre de entrega: guardar commit y push en feat/battle-turns y comprobar después coincidencia local/remota mediante Git.

## Límites de esta entrega
Sin UI ni datos de combate del catálogo. No habilita cuentas, partidas online, temporizadores, recompensas, abandono por red ni garantiza balance. Las reglas puras quedan comprobables antes de integrar esos sistemas.
