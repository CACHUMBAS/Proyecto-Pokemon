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
