# Despliegue de Lumemon en Vercel

Proyecto: cachumbas1/lumemon (plan Hobby). Repositorio conectado: CACHUMBAS/Proyecto-Pokemon. La rama chore/vercel-lumemon parte de a1c35e9 e incluye las cuentas online. Web pública: https://lumemon.vercel.app. Primer despliegue Git f5fe452 confirmado READY por Vercel y /cuenta comprobada en navegador.

## Configuración versionada

vercel.json fija Vite, npm ci, npm run build, salida dist y la reescritura a /index.html para que las rutas de React funcionen al abrir enlaces o recargar. No requiere nuevas dependencias. Ver [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

Las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY están configuradas en Vercel para Preview y Production. No publicar sus valores en Git. .vercel y .env.local permanecen ignorados; Vercel CLI puede añadir un token OIDC local que nunca debe versionarse ni llevar prefijo VITE_.

## Flujo Git

Los push a chore/vercel-lumemon generan Production y actualizan https://lumemon.vercel.app. El usuario confirmó mantener esta web pública. Branch Tracking se guardó y verificó en Vercel; antes apuntaba a docs/plan-inicial. Las demás ramas generan Preview. Cada bloque de código debe seguir en su rama y la integración en la rama de publicación debe ser deliberada y estar autorizada. No se fusionó main.

Verificar READY y el SHA exacto antes de afirmar que la versión está publicada. Una URL de despliegue individual queda vinculada a una versión; la dirección lumemon.vercel.app sigue el último despliegue de producción aprobado. No cambiar la rama de publicación para cada bloque.

La protección de previews puede pedir iniciar sesión en Vercel. Eso no es la cuenta de jugador de Lumemon. No desactivar protección ni promover a producción sin concretar que se quiere acceso público.

## Supabase con dominio remoto

Dominio estable confirmado: https://lumemon.vercel.app.

1. En Authentication → URL Configuration, poner como Site URL https://lumemon.vercel.app/cuenta.
2. Añadir como Redirect URLs exactas https://lumemon.vercel.app/cuenta y https://lumemon.vercel.app/cuenta/recuperar.
3. Conservar las URLs locales de docs/CUENTAS-ONLINE.md solo si se probará en local.
4. Registrarse y abrir los correos en el mismo navegador/origen. No usar una URL diferente por cada compilación para el flujo de acceso.
5. Comprobar registro, confirmación, alias persistido, cierre de sesión y recuperación. SMTP propio sigue siendo necesario para correo a personas ajenas al equipo.

No usar la URL de la API de Supabase como Site URL. El proyecto de base de datos se mantiene al actualizar el frontend: un push no debe ejecutar migraciones ni reiniciar datos automáticamente.

## Bloque activo: combates online y recompensas — 2026-10-20

Rama feat/online-battles-rewards desde 462b5c9. Usuario autoriza continuar y fija 50 monedas por victoria; derrota/empate/abandono cero. /combate usa seis cartas poseídas, rival Iniciación sin apoyos para ambos, servidor Vercel con motor existente, persistencia en Supabase y UUID/revisiones. La práctica sigue libre y sin premios. No añade dependencias. PvP, reloj y campaña quedan pendientes.

Migración SQL y prueba de permisos confirmadas por el usuario; cuenta real validada en Vercel Preview hasta una victoria en 24 turnos. El saldo pasó de 0 a 50 y se mantuvo al recargar y actualizar; Sobres conserva 50 monedas y 9 cartas. Secreto de servidor configurado en Preview y Production con autorización explícita. Los combates ya están publicados en https://lumemon.vercel.app desde d2eec67. Guía: [Combates online](COMBATES-ONLINE.md). No repetir migraciones ni reiniciar el inventario.

Publicación autorizada y completada el 2026-10-20: SUPABASE_SECRET_KEY copiada desde .env.local por stdin de la CLI oficial como Secret (sensitive), solo servidor, en Production de cachumbas1/lumemon. Se verificaron los metadatos sin mostrar el valor. Integración fast-forward de feat/online-battles-rewards en chore/vercel-lumemon y push del SHA d2eec67071da036b1db7b9404f42e07bb4f1afb3. Vercel confirmó Production READY, despliegue dpl_6G6o4TVYYnWYqbbMiZnDU6tV8wpx, URL https://lumemon-frnyramk4-cachumbas1.vercel.app y alias https://lumemon.vercel.app.

Comprobación pública: /combate carga el modo con premio de 50 monedas y solicita cuenta al visitante; /api/battle responde a GET con invalid_request. No se observaron errores JavaScript en la página de combate. La sesión de Preview no se comparte con el dominio público: la victoria, el guardado y el premio único se verificaron autenticados en Preview con el mismo código y Supabase; no se repitió una partida autenticada en Production. SMTP para destinatarios externos, PvP y reloj siguen fuera de esta publicación.

## Colección publicada — evidencia del bloque anterior

El usuario autorizó integrar feat/online-collection-packs en chore/vercel-lumemon. Ambas ramas llegaron a 462b5c9. Vercel confirmó Production READY, dpl_C7Ve8QPSidi9mzqhoiiQVkYR5f3b, alias https://lumemon.vercel.app, SHA exacto 462b5c9ffd7f3d0b2398b4d6129fdeb247d013c1. /coleccion pública comprobada como invitado. La prueba SQL real y el inicial/bienvenida (nueve copias tras recarga) se habían comprobado con la cuenta real en local. No repetir migraciones antiguas ni reclamar otra bienvenida.


La reescritura SPA excluye /api para conservar la función Node /api/battle. Su ejecución real quedó comprobada en Preview; en Production se observó invalid_request al abrirla por GET.
