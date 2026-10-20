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

## Colección preparada en rama — 2026-10-20

feat/online-collection-packs incorpora colección y sobres, con migración independiente. La web pública no se ha actualizado con este bloque. La prueba SQL de colección fue confirmada por el usuario. El [inicial, la bienvenida y la persistencia](COLECCION-ONLINE.md) se comprobaron en local con una cuenta real. Falta obtener autorización para integrar en chore/vercel-lumemon. Un push a la rama de funcionalidad puede generar Preview, pero no aplica SQL ni autoriza cambiar producción.
