# Colección y sobres online

## Estado — 2026-10-20

Implementados en la rama `feat/online-collection-packs`, desde `969d8b4`; implementación inicial `10f1f32`. El usuario confirmó el 2026-10-20 «collection: isolation, atomicity and idempotency passed» en el proyecto Supabase real. Antes informó consulta vacía y después collection_cards ya existente; se le indicó ROLLBACK y la prueba transaccional. No se borraron tablas ni se cambió la migración para omitir errores. Recorrido autenticado comprobado en local: el usuario eligió el inicial y abrió la bienvenida; se observaron nueve copias, su persistencia al recargar, la bienvenida consumida y la recuperación del mismo resultado desde el historial. Publicación autorizada y completada: Production READY en 462b5c9, alias https://lumemon.vercel.app. /coleccion verificada públicamente como invitado.

La colección es independiente del catálogo público y del equipo local de prueba. No concede monedas por victorias de práctica, no importa el borrador local ni habilita PvP.

## Activación en el proyecto existente

El perfil y las cuentas ya funcionan. Conservar sus datos, variables públicas y URLs de retorno. En este proyecto los pasos SQL 1–4 ya están completados según la prueba confirmada: no repetir la migración. El recorrido de inicial/bienvenida de los pasos 5–7 también está comprobado en local. La publicación ya está completada; no reclamar de nuevo la bienvenida. Los pasos iniciales se conservan como referencia para un proyecto nuevo.

1. Abrir [la migración de colección](../supabase/migrations/202610200001_collection.sql) en VS Code. Copiar todo el contenido, no el nombre ni la ruta.
2. En Supabase → SQL Editor → nueva consulta, pegarlo. Debe empezar por `-- Lumemon economy v1` y terminar en `commit;`. Ejecutar una sola vez. Resultado esperado: Success, sin errores.
3. Si el editor informa consulta vacía, comprobar que el texto se ha pegado en el área de código. Si falla una sentencia SQL, ejecutar `ROLLBACK;` e investigar el error antes de repetir; no borrar tablas para evitar conflictos.
4. En otra consulta nueva ejecutar [la prueba transaccional](../supabase/tests/collection.sql). Resultado esperado: `collection: isolation, atomicity and idempotency passed`. Usa dos usuarios temporales y termina en ROLLBACK; no conserva esos datos de prueba.
5. Iniciar sesión con la cuenta existente en [la web local](http://127.0.0.1:5174/cuenta), después abrir /coleccion. Introducir personalmente la contraseña; no compartirla, ni enviar tokens al agente.
6. Escoger uno de los tres iniciales y confirmar. Debe guardar seis cartas, cero monedas, cero fragmentos y un sobre de bienvenida.
7. En /sobres abrir la bienvenida. El resultado de tres cartas se guarda antes de mostrarse. Al recargar debe haber nueve copias en total y la bienvenida consumida; puede haber variantes repetidas.
8. Reabrir el resultado desde el historial no concede más cartas. Cerrar sesión oculta el inventario. Probar también otra cuenta/dispositivo cuando estén disponibles.
9. Si hay duplicados, convertir voluntariamente una copia; debe quedar al menos una. Con saldo insuficiente no se puede comprar.
10. Integrar en la rama de publicación solo con autorización y verificar Vercel READY para el SHA exacto. Subir esta rama no modifica por sí solo la web pública.

No se necesitan nuevas claves ni un servicio adicional. PGlite es solo una dependencia local de desarrollo autorizada; no ejecuta ni reemplaza la base de datos real.

## Reglas iniciales de Lumemon

- Tres equipos iniciales de seis especies distintas, una elección por cuenta. Cada carta tiene presupuesto 240; esto no demuestra igualdad de victorias.
- Un sobre de bienvenida gratuito por cuenta, además del equipo inicial.
- Sobre `prisma-v1`: tres cartas con reemplazo de las 48 variantes jugables actuales.
- Precio: 100 monedas o 60 fragmentos. Las monedas comienzan en cero; cada victoria del modo Combate concede 50 monedas. Dos victorias permiten comprar un sobre. La práctica libre no da premios.
- Probabilidad por carta: presupuesto 240 → 60%; 252 → 25%; 264 → 10%; 276 → 4%; 288 → 1%. Dentro de cada grupo, las variantes tienen igual probabilidad. No hay rareza garantizada por sobre.
- Fragmentar una copia sobrante concede respectivamente 5/10/20/40/80 fragmentos. Siempre se conserva una copia; nunca se fragmenta automáticamente.
- La interfaz muestra los últimos veinte eventos y filtra sus aperturas en el historial. El servidor conserva todos los recibos.

Estos precios y probabilidades son decisiones del juego, no reglas oficiales del TCG. Entrenadores y energías aún no forman parte del inventario online.

## Persistencia y reintentos

Tablas de definición: `collection_cards`, `collection_starters`, `collection_packs`. Tablas privadas: `player_wallets`, `player_inventory`, `player_collection_events`. RLS limita lectura a la cuenta; las escrituras directas desde el cliente están revocadas.

Las RPC `get_player_collection`, `claim_collection_starter`, `open_collection_pack` y `fragment_collection_card` derivan identidad de Auth. Saldo, azar, propiedad y recibo se resuelven en una transacción bajo bloqueo de cartera. No aceptan premios o balances calculados por el navegador.

Una petición guarda su UUID en sessionStorage por usuario antes de enviarse. Ante una respuesta incierta, «Reintentar operación» usa ese mismo UUID. El servidor devuelve el recibo original si los parámetros coinciden y rechaza reutilizarlo para otra operación. Una recarga puede recuperar el recibo del historial; no debe crear otra compra para sustituir una petición incierta.

El cliente valida tipos exactos, identidad, versiones, cantidades, rarezas, probabilidades y recibos. Al salir o cambiar de cuenta elimina el estado privado en memoria y descarta respuestas tardías. No borrar claves de operaciones pendientes para ocultar errores.

## Evidencia y límites

- 215 pruebas correctas; lint y compilación con typecheck correctos.
- Nueve pruebas PostgreSQL en PGlite: permisos, aislamiento, inicial/bienvenida únicos, reintentos, pago, fragmentos, saldo insuficiente, última copia y rollback ante fallo.
- Catorce pruebas del cliente: datos corruptos, doble envío, respuesta incierta, recuperación de recibos, respuestas tardías y fallo de almacenamiento.
- Revisión independiente completada: ningún hallazgo crítico/importante; un hallazgo menor de coerción de tipos corregido con tres regresiones RED → GREEN.
- Navegador local, sesión invitada: /coleccion y /sobres, ES/EN, navegación con teclado, 320/390/1440 px sin desbordamiento horizontal. Menú móvil ajustado a dos filas. Se observó una advertencia de React Router sobre HydrateFallback; no se observó error JavaScript.
- Supabase real: el usuario confirmó la prueba transaccional de aislamiento, atomicidad e idempotencia.
- Navegador autenticado: nueve copias persistidas, historial recuperado, filtro de duplicados, última copia protegida y confirmación cancelada con Escape. ES/EN y 320/390/1440 sin desbordamiento observado. Se corrigieron tipos sin traducir y plural de copias; lint, build/typecheck y comprobación directa i18next correctos.
- Pendientes: dos cuentas/dispositivos, conexiones PostgreSQL independientes concurrentes y conversión/gasto real de fragmentos. La compra con monedas ya se verificó en Production, según el recorrido siguiente. No se convirtieron cartas del usuario. PGlite usa ejecución serial y no demuestra concurrencia entre conexiones independientes.

Las pruebas originales de colección no comprobaban el SMTP público ni las recompensas. La publicación y el ciclo de recompensa/compra se verificaron después; el SMTP público sigue pendiente.

## Ciclo verificado en producción — 2026-10-20

Recorrido autorizado con una cuenta real en https://lumemon.vercel.app, versión pública `d2eec67`. Se usó la interfaz normal; no se añadieron monedas ni cartas mediante herramientas de administración.

1. Estado inicial: 50 monedas, 0 fragmentos y 9 copias. La victoria anterior de Preview se recuperó en Production al iniciar sesión.
2. Nueva partida contra Iniciación, con Machop primero. Recarga en el turno 9: Squirtle conservó 179/226 PS, quemadura y Surf disponible en el turno 10; Charmander rival conservó 70/214 PS.
3. Victoria en 21 turnos, sin bajas propias: saldo 50 → 100. Recargar conservó resultado y 100 monedas, sin conceder otro premio.
4. Una única compra confirmada de `prisma-v1` por 100 monedas: saldo 100 → 0, colección 9 → 12 copias, fragmentos 0. Se revelaron Machop `sv03.5-066`, Onix `sv03.5-095` y Machop `sv03.5-066`, todas en español.
5. Recarga de Sobres y consulta de la apertura pagada en el historial: mismas tres cartas, 0 monedas y 12 copias. La colección mostró 9 variantes, con dos copias del nuevo Machop y una de Onix; no se duplicó el contenido por volver a verlo. La compra volvió a estar deshabilitada por saldo insuficiente.

No se observaron errores JavaScript en la consola de la pestaña. Esta prueba cubre una cuenta y una compra, no conexiones simultáneas ni dos cuentas/dispositivos. No se fragmentaron cartas ni se compró con fragmentos. Se detectó un aviso heredado al pie de Colección que negaba las recompensas; se corrige en ES/EN en `fix/production-economy-verification`, pendiente de autorización de publicación.

Comprobación de la corrección de texto: `npm run lint` y `npm run build` (incluye TypeScript) correctos. No se repitió la suite completa de reglas/SQL: este cambio solo afecta a dos traducciones y documentación; su evidencia anterior se conserva.
