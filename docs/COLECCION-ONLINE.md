# Colección y sobres online

## Estado — 2026-10-20

Implementados en la rama `feat/online-collection-packs`, desde `969d8b4`; implementación inicial `10f1f32`. Activación en Supabase y comprobación autenticada pendientes. El primer intento comunicado por el usuario devolvió «query: Too small: expected string to have >=1 characters», que indica consulta vacía; no confirma ejecución del SQL. Producción sigue en `chore/vercel-lumemon` y no incorpora este bloque.

La colección es independiente del catálogo público y del equipo local de prueba. No concede monedas por victorias de práctica, no importa el borrador local ni habilita PvP.

## Activación en el proyecto existente

El perfil y las cuentas ya funcionan. Conservar sus datos, variables públicas y URLs de retorno.

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
- Precio: 100 monedas o 60 fragmentos. Las monedas comienzan en cero; las recompensas verificadas de combate pertenecen al siguiente bloque.
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
- Pendientes: migración y prueba en Supabase real, pantallas autenticadas, elección/apertura reales, dos cuentas/dispositivos y conexiones independientes concurrentes. PGlite usa ejecución serial y no demuestra esta última propiedad.

No considerar la publicación, el SMTP público ni las recompensas de combate completados por estas pruebas.
