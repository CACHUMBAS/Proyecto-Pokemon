# Motor local de Lumemon

Este módulo resuelve reglas de combate con datos explícitos y sin interfaz. El adaptador de [datos jugables](data/README.md) conecta ahora una selección de 36 cartas del catálogo con estadísticas propias y movimientos verificables. El mapeo real de apoyos permanece pendiente.

## API pública

- `createBattle(setup)`, en `battle-state.ts`: valida dos equipos de seis especies distintas, estadísticas, tipos, movimientos y apoyos. Devuelve turno 1, versión 1, activos iniciales y vida completa. Los perfiles admitidos son básico 40/0, potente 60/1 y estado 0/2; cada miembro necesita un básico.
- `validateAction(state, side, action)`: comprueba fase, actor activo, movimiento/recarga, reserva viva o apoyo disponible. Lanza error sin modificar entradas.
- `resolveTurn(state, [action0, action1], expectedVersion, tieBreak?)`, en `turn-engine.ts`: resuelve cambios, apoyos y movimientos por velocidad efectiva; después daño residual, caducidades y resultado/sustitución. Devuelve `{ state, events }`.
- `resolveReplacements(state, [choice0, choice1], expectedVersion)`: elige los nuevos activos tras KO. ID para una reserva viva; `null` selecciona la primera viva en el orden del equipo. El lado no afectado debe enviar `null`. Abre el turno siguiente sin daño residual adicional.

Los lados son 0 y 1. Las acciones son `pass`, `move` con actorId/moveId, `switch` con actorId/targetId, o `support` con actorId/supportId. Si empatan dos movimientos en velocidad, el llamador debe entregar un bit uniforme 0/1: indica el lado que actúa primero. Solo se registra como consumido cuando hace falta; el motor no genera azar.

## Reglas implementadas

Los cinco estados, cuatro apoyos, recargas y orden están en la [especificación](../../docs/superpowers/specs/2026-10-12-lumemon-battle-rules-design.md). Cada estado tiene su efecto e inmunidades. Quemadura y veneno solo dañan al activo vivo; el daño residual de ambos se calcula antes de evaluar el resultado. La victoria directa termina antes del cierre. El turno 60 sin vencedor acaba en empate.

Las salidas incluyen versiones `lumemon-turns-v1` y `lumemon-damage-v1`, identidad y versión de datos recibida. Las entradas no se modifican; el siguiente estado está separado mediante clonación. Los eventos son datos discriminados para una futura interfaz ES/EN: orden/sorteo, cambios, apoyos, movimientos/recargas, daños, estados, impedimentos, KO, caducidad y resultado. Toda la salida se puede serializar como JSON.

## Contrato de confianza e integración pendiente

El estado debe ser una salida válida de este motor. Este bloque no ofrece un decodificador de snapshots externos ni garantiza que unas estadísticas o un identificador sean oficiales. `dataVersion` identifica la revisión suministrada; el futuro adaptador de datos deberá comprobar también procedencia, hashes, compatibilidades y propiedad.

El adaptador `createPlayableBattle` verifica que los IDs estén en el conjunto y crea equipos sin apoyos. No sustituye la comprobación de propiedad.

El servicio futuro recogerá las elecciones en secreto, confirmará solo la primera válida, asignará `pass` al vencer los 45 segundos y llamará a la resolución una sola vez en una transacción. La comparación de versión detecta solicitudes obsoletas respecto al snapshot recibido; por sí sola no impide que dos procesos resuelvan el mismo snapshot. Repetir las mismas entradas aquí reproduce el mismo resultado sin guardar ni conceder nada.

`null` en sustituciones no significa que haya vencido un plazo: el llamador decide cuándo solicitar la alternativa automática. No hay relojes, reconexión, cuentas, abandono por red, inventario o recompensas. Tampoco está conectado a `/equipo`; el validador de composición conserva su contrato.

## Comprobaciones

`node --test src/battle/turn-engine.test.ts` prueba el ciclo con fichas **sintéticas** de `fixtures/battle-test-data.ts`; esos datos no se importan en el producto ni representan movimientos o estadísticas oficiales de especies reales. Incluye una partida pasiva de 60 turnos, además de casos de combate, invalidación, sustitución y reproducción. El [plan](../../docs/superpowers/plans/2026-10-13-lumemon-battle-turns.md) registra el alcance y la verificación.
