# Plan y registro — combates online
Spec: ../specs/2026-10-20-online-battles.md
Base: 462b5c9. Rama: feat/online-battles-rewards. Ejecución en esta sesión.

1. Contrato y persistencia: pruebas PostgreSQL de permisos, propiedad, revisiones, recompensa e idempotencia; migración privada y RPC exclusivas de service_role.
2. Servicio: acciones estrictas, motor existente, autenticar bearer, devolver vista sin botAction; pruebas de partidas completas y HTTP.
3. Cliente: gateway con identidad, recuperación de UUID pendiente, UI /combate reutilizando tablero/audio; ES/EN.
4. Verificar tests/lint/build e interfaz; revisión independiente del bloque; contexto, commit y push. Activar SQL/clave y publicar únicamente con los permisos correspondientes.

Pre-flight: SQL devuelve contexto privado al servicio; servicio publica vista sin botAction; cliente consume esa vista con revisión y recibo. La revisión SQL es distinta de battle.version.
Ruling: ejecutar lo ya autorizado sin nuevas aprobaciones de documentos — las instrucciones del desarrollador priorizan completar el trabajo concreto antes de pedir permisos externos.
Ruling: usar el checkout existente en rama nueva — usuario quiere la misma carpeta visible en VS Code; no hay otros escritores.
Ruling: registro aquí en lugar de scripts shell de planificación — Windows y tarea acotada; se conserva evidencia en Git.
Ruling: ambos equipos sin apoyos en este modo inicial — la colección todavía solo permite Pokémon; la práctica conserva apoyos.
Ruling: PvE sin reloj — retomar al recargar es útil en la entrega; reloj de 45 segundos queda pendiente junto a PvP.
Pendiente: tareas 1–4. Publicación de colección confirmada READY en 462b5c9, alias lumemon.vercel.app; prueba pública como invitado.

Tareas 1–3 completas. SQL 7 pruebas, servicio/HTTP 7, cliente/presentación 7: RED→GREEN observado. Integración real motor+PGlite: dos victorias, 100 monedas, sobre de tres cartas; órdenes finales competidoras dan un éxito y un conflicto. Suite 236/236, lint, typecheck/build correctos. UI con fixture identificada: equipo/primer Pokémon, turno animado, recarga PS/turno, diálogo/Escape, ES/EN 320/390/1440 sin desbordamiento observado. Cuenta real muestra indisponibilidad esperada sin clave. Pendiente revisión única, activación SQL/clave y Vercel real.

Revisión única gpt-6-astra: sin Critical/Important; un Minor de mensajes de práctica que negaban premios online. Corregidos ambos usos con la prop finishedNote existente; cambio de texto reversible sin test que replique implementación, según instrucciones del desarrollador. Sin otras observaciones pendientes.
Final: Ruling: Vercel real, Supabase real y concurrencia de conexiones independientes requieren activación externa; quedan explícitamente pendientes, sin afirmar pruebas que no existen. Balance, reloj y PvP conservan su alcance aplazado.

Cierre local: corrección de textos verificada con lint y build/typecheck; punto de entrada Node real devuelve 503 sin configurar y 405 para GET. No se repite la suite tras ajustes exclusivos de texto. Flujo Git ya autorizado: commit/push de rama de funcionalidad; no merge ni promoción a producción.

Entrega: rama subida y limpia, sincronización 0/0 en 5df789e. Vista previa automática READY para ese SHA, sin promover producción. Usuario confirmó migración aplicada y prueba SQL real pasada; pendiente su respuesta sobre clave local.

Activación local confirmada: usuario guardó la clave privada personalmente. .env.local sigue ignorado. API sin bearer 401; cuenta real carga colección, inicia partida y resuelve Hoja Afilada. Recarga conserva turno 2, PS 153/226 frente a 156/242, recarga del movimiento y registro. Partida activa para continuar, saldo cero. Pendientes victoria real y entorno Vercel. Solicitado permiso para configurar clave solo en Preview para esta rama y generar una vista previa; producción no autorizada en este bloque.

Usuario autorizó configurar el secreto en Vercel Preview para feat/online-battles-rewards y generar la vista previa. CLI oficial confirmó proyecto cachumbas1/lumemon, tipo Secret, entorno y rama exactos. Transferencia desde .env.local mediante stdin sin exponer valores. Se conservan las variables publicables ya presentes en Preview. Publicación en producción sigue pendiente de autorización.

Preview e994d17 reveló FUNCTION_INVOCATION_FAILED: ERR_MODULE_NOT_FOUND server/runtime.ts desde api/battle.js. Causa contrastada con el compilador Vercel: salida JavaScript conserva importaciones TypeScript. Prueba nueva server/compiled-api.test.ts reproduce el fallo compilando/arrancando el grafo real sin fuentes .ts. Única corrección: rewriteRelativeImportExtensions=true; prueba pasa. Suite 237/237, lint y build correctos. Sin dependencias nuevas. Commit bece304 subido, despliegue dpl_G9uqbDV4SGccNSQUytpLucEw3Q3m READY y API real POST sin sesión 401 / GET 405. Interfaz de alias de rama comprobada como invitado. Pendiente confirmación del usuario sobre jugada y recarga autenticadas en Vercel. Producción sin cambios. La petición explícita de probar Preview justifica comprobar la API con la CLI oficial además del estado de despliegue.
