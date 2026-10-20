# Combates online y monedas
Estado: implementación en feat/online-battles-rewards, base 462b5c9. Migración y prueba SQL real confirmadas por el usuario; clave local, inicio y guardado de un turno con cuenta real verificados. Clave configurada en Vercel Preview para esta rama; API desplegada, victoria real con premio y publicación pendientes. No instalar dependencias nuevas.

## Qué cambia
/combate permite seis cartas poseídas de especies diferentes contra Iniciación. Ambos equipos sin apoyos en este primer modo. Partida guardada en cuenta, sin reloj; una activa por jugador. La práctica /practica continúa siendo libre y no concede monedas.

Victoria: 50 monedas; dos victorias compran un sobre de 100. Derrota, empate o abandono: cero. El resultado se calcula con el motor existente en Vercel, nunca a partir de un resultado enviado por el navegador.

## Seguridad y consistencia
POST /api/battle valida el bearer con Supabase Auth; la identidad no procede del cuerpo. Acepta load o una orden start/turn/replace/abandon, no estadísticas, saldo ni resultado. Límite de cuerpo 8192 bytes y respuestas sin caché. Se omite la próxima acción del bot.
Dos RPC públicas ejecutables exclusivamente por service_role leen/escriben tablas del esquema privado lumemon_internal. El navegador no puede ejecutarlas ni leer esas tablas. Las funciones usan search_path vacío.
Cada escritura bloquea primero player_wallets, compartiendo orden con compras/fragmentación. UUID por orden y revisión por partida: repetir la orden recupera el recibo; reutilizar UUID con otro contenido falla; dos versiones competidoras no avanzan ambas. Cierre y recompensa se guardan juntos. El cliente conserva una orden incierta en sessionStorage antes de enviarla.
El servidor requiere que las versiones del motor/datos coincidan para avanzar partidas antiguas. Abandonarlas sigue permitido. La cartera conserva su límite de mil millones; cerca del límite se debe gastar monedas antes de reintentar una victoria, sin perder el recibo por escrituras parciales.

## Activación: solo cuando el código esté revisado
1. En VS Code abrir supabase/migrations/202610200002_online_battles.sql. Copiar TODO su contenido y ejecutar una vez en una consulta nueva del SQL Editor del proyecto Supabase Lumemon existente. No repetir las migraciones de perfiles ni colección. Si hay error: ROLLBACK; e investigar, sin borrar tablas.
2. Ejecutar supabase/tests/online_battles.sql en otra consulta. Debe terminar mostrando online battles: permissions and exactly-once rewards passed. Sus usuarios y monedas de prueba se revierten.
3. En Supabase → Settings → API Keys, localizar una clave secreta sb_secret_. El usuario la introduce personalmente en Vercel → proyecto lumemon → Settings → Environment Variables, nombre SUPABASE_SECRET_KEY. Solo servidor; JAMÁS VITE_SUPABASE_SECRET_KEY, chat, commits o capturas con su valor. Para pruebas locales, guardar esa misma variable en .env.local. No hace falta cambiar las variables publicables actuales. SUPABASE_URL es opcional: se usa VITE_SUPABASE_URL si no existe.
4. Añadirla al entorno Preview para comprobar esta rama; Production al publicar. Las variables nuevas necesitan un nuevo despliegue. La rama de producción sigue chore/vercel-lumemon y requiere autorización para integrar este bloque.
5. Verificar la ruta /api/battle en Vercel, inicio real con cuenta, un turno, recarga y reanudación; después una victoria y saldo en /sobres. Confirmar que reintentar/recargar no suma 50 otra vez. Una cuenta diferente no ve esa partida. Compras adicionales son decisiones del usuario, no pruebas automáticas sobre su colección.

El usuario ejecutó la migración y confirmó el mensaje de éxito de la prueba SQL real el 2026-10-20. No repetir pasos 1–2. El usuario introdujo SUPABASE_SECRET_KEY personalmente en .env.local, ignorado por Git. La API local configurada devuelve 401 sin identidad y carga correctamente la partida con sesión. El usuario autorizó copiar la clave a Vercel como secreto exclusivo de Preview en feat/online-battles-rewards y generar la vista previa. CLI oficial confirmó tipo Secret, entorno Preview y rama exacta. La transferencia utilizó stdin y el valor no se mostró. No se ha configurado ni publicado producción.

## Verificación local
Tests de protocolo, acciones falsas, reintentos, cierre de sesión, cuerpos HTTP, identidad, SQL y motor completo. Integración PGlite: dos victorias con jugadas calculadas por el motor → 100 monedas → sobre de tres cartas. Dos comandos finales simultáneos dejan un éxito y un conflicto. PGlite serializa en una instancia: no sustituye un ensayo de conexiones PostgreSQL independientes.
Interfaz con scripts/qa/online-battle.html (solo desarrollo, excluida de dist): equipo, primer Pokémon, jugada animada, recarga con mismos PS/turno, diálogo de abandono/Escape, ES/EN y 320/390/1440. Esta fixture simula el progreso y lo rotula; no accede a cuentas ni monedas reales. No prueba autenticación ni la API desplegada.
Cuenta real local: /combate carga las cartas poseídas, crea partida y guarda el primer ataque. Tras recargar mantiene turno 2, Bulbasaur 153/226 PS, Eevee 156/242 PS, Hoja Afilada disponible en turno 3 y registro íntegro. Se deja la partida activa y saldo cero. No se ha completado una victoria real ni otorgado premios a esta cuenta.

Fuentes de contrato: [Vercel Web Handlers](https://vercel.com/docs/functions/functions-api-reference), [rewrites](https://vercel.com/docs/routing/rewrites), [claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys).
