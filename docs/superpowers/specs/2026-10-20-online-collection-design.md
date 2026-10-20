# Colección y sobres online — Lumemon
Fecha: 2026-10-20. Continuación autorizada del bloque de cuentas.
## Objetivo y límites
Guardar propiedad real de cartas por cuenta, escoger un equipo inicial una vez, abrir sobres recuperables y convertir duplicados voluntariamente. React/Vite/TypeScript, Supabase existente, ES/EN, móvil, presupuesto cero. La práctica sigue siendo libre y local; no concede monedas. Recompensas requieren posteriormente partidas verificadas en servidor. No migrar el borrador local ni publicar esta rama automáticamente en producción.
El usuario autorizó un sobre de bienvenida único por cuenta y @electric-sql/pglite como dependencia de desarrollo para probar PostgreSQL localmente.
## Diseño
Postgres controla inventario, saldos, azar y recibos. Se elige esta solución frente a escribir economía en el navegador (manipulable) o añadir un servidor nuevo (innecesario para estas operaciones).
/coleccion muestra acceso requerido, selección inicial o cartas poseídas con cantidades, búsqueda, filtros y saldos. /sobres muestra reglas, precio, confirmación y últimas aperturas. La presentación reutiliza las ilustraciones verificadas y tarjetas existentes. El resultado se guarda antes de animarlo; la animación es breve, omisible y respeta movimiento reducido.
Tres equipos de seis especies distintas con variantes de presupuesto 240 por carta (1440 por equipo); igualdad de presupuesto no demuestra igualdad de victorias:
- alba: base1-44, base1-46, base1-63, base1-58, base1-52, base2-51.
- brasa: xy9-1, swsh10-023, sv05-039, base1-43, base1-56, base2-54.
- niebla: base1-44, base1-63, base1-68, base1-50, base1-58, base2-51.
Se concede una copia de cada carta, cero monedas/fragmentos y el derecho a un sobre gratuito. No se permite cambiar o volver a reclamar el inicial.
## Economía v1
Sobre propio prisma-v1: tres cartas independientes con reemplazo, exclusivamente las 48 variantes jugables actuales. Precio: 100 monedas O 60 fragmentos; bienvenida usa su derecho gratuito. Probabilidades por carta y presupuesto: 240=60%, 252=25%, 264=10%, 276=4%, 288=1%. Dentro de cada grupo todas las variantes son equiprobables; se muestra también la lista de variantes y su probabilidad. No son probabilidades oficiales del TCG ni garantías de una rareza por sobre.
Fragmentar una copia sobrante concede 5/10/20/40/80 fragmentos respectivamente. Conservar siempre una copia; confirmación explícita, una copia por acción de interfaz. El servidor valida cantidad positiva y sobrante, y tiene límites de enteros para evitar desbordamientos. Valores iniciales de Lumemon, sujetos a equilibrio futuro mediante otra versión.
## Contrato y seguridad
Tablas: collection_cards, collection_starters, collection_packs (definiciones); player_wallets, player_inventory, player_collection_events (privadas).
RPC públicas sin parámetro de identidad: get_player_collection(), claim_collection_starter(p_starter_id,p_request_id), open_collection_pack(p_pack_id,p_currency,p_request_id), fragment_collection_card(p_card_id,p_quantity,p_request_id).
Solo authenticated puede invocar. auth.uid() fija identidad; RLS limita lectura; escrituras directas y definición de contenido revocadas. Funciones security definer con search_path vacío y nombres cualificados. Cada mutación bloquea primero la fila de cartera; autorización, saldo, cartas y recibo se confirman juntos.
Request UUID único por cuenta, compartido por todos los tipos de operación. Reintentar los mismos parámetros devuelve el mismo recibo; reutilizar UUID con otra petición falla. Bienvenida e inicial también tienen exclusión por cuenta aunque se usen UUID distintos. No aceptar importes, premios, cartas ganadas o azar del cliente.
La instantánea incluye user_id, version, wallet, inventory, definitions y últimos 20 recibos. Lectura bajo el mismo bloqueo de cartera evita mezclar saldos e inventario de operaciones concurrentes. No borrar historial persistido; la interfaz muestra los últimos 20.
Cliente valida respuestas y descarta resultados de otra identidad, de una sesión desmontada o peticiones antiguas. Si un envío queda incierto, mantiene su UUID y permite reintento; recargar muestra el resultado confirmado en historial sin volver a cobrar. Sin configuración o migración se muestra error accionable, nunca inventario o saldos ficticios.
## Verificación
Pruebas de PostgreSQL local con dos identidades y anon: permisos, aislamiento, inicial único, bienvenida única, idempotencia, cobro/recompensa atómicos, saldo insuficiente, última copia, rollback de fallo y recuperación de historial. PGlite no sustituye comprobar RLS en Supabase ni demuestra por sí solo concurrencia de conexiones independientes.
Pruebas TypeScript: contratos corruptos, usuario equivocado, orden de respuestas, doble clic y reintento con UUID estable. Suite, lint y build. Navegador ES/EN, 320/390/1440, teclado y movimiento reducido; flujos reales de cuenta ejecutados por el usuario.
Migración y prueba transaccional listas para revisar y ejecutar por el propietario; no pedir credenciales privadas. Preparar vista previa y pedir integración pública solo cuando sea revisable.
