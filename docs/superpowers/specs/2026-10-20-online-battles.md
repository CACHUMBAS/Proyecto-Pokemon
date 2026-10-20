# Combates online contra la máquina
Fecha: 2026-10-20. Base: 462b5c9. Usuario autoriza continuar y elige 50 monedas por victoria.

## Contrato
/combate requiere cuenta y seis cartas poseídas de especies distintas. Rival iniciación; ambos sin apoyos en este primer modo porque todavía no hay apoyos en la colección. La práctica libre conserva sus reglas. Partida persistida sin reloj, una activa por cuenta. PvP, reloj, campaña y ampliar especies quedan fuera de este bloque.

Vercel Node ejecuta el motor TypeScript ya probado, verifica el token con Supabase y recibe únicamente acciones. El servidor decide estados, rival, desempates y resultado. PostgreSQL guarda cada cambio con revisión esperada y UUID idempotente. Premia exactamente 50 monedas al ganar; cero al perder, empatar o abandonar. Premio y final se escriben en una transacción que bloquea primero la cartera. El cliente no puede ejecutar RPC privilegiadas. No hay premios por práctica.

El cliente conserva la orden pendiente antes de enviarla y repite el mismo UUID si desconoce el resultado. Otra pestaña puede causar conflicto de revisión: se carga el estado actual. Se oculta la próxima acción del bot. Al cerrar sesión se descartan respuestas anteriores.

## Operación
Reutilizar Vercel y Supabase, SDK y PGlite existentes, sin dependencias nuevas. Una clave Supabase secreta exclusivamente de servidor será necesaria al activar el bloque; el usuario la introduce en configuración, nunca en el chat ni con prefijo VITE_. Preparar y verificar antes de solicitar ese paso o publicar.

## Aceptación
Inicio con propiedad comprobada; acciones ilegales rechazadas; reanudación; aislamiento entre usuarios; victoria real a 50 monedas una sola vez; dos victorias permiten comprar sobre de 100 monedas; derrota/empate/abandono a cero; reintento y conflicto; ES/EN y móvil. Pruebas locales no equivalen a activación real.
