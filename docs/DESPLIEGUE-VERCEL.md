# Despliegue de Lumemon en Vercel

Proyecto: cachumbas1/lumemon (plan Hobby). Repositorio conectado: CACHUMBAS/Proyecto-Pokemon. La rama chore/vercel-lumemon parte de a1c35e9 e incluye las cuentas online.

## Configuración versionada

vercel.json fija Vite, npm ci, npm run build, salida dist y la reescritura a /index.html para que las rutas de React funcionen al abrir enlaces o recargar. No requiere nuevas dependencias. Ver [Vite en Vercel](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

Las variables VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY están configuradas en Vercel para Preview y Production. No publicar sus valores en Git. .vercel y .env.local permanecen ignorados; Vercel CLI puede añadir un token OIDC local que nunca debe versionarse ni llevar prefijo VITE_.

## Flujo Git

Los push al repositorio conectado generan despliegues. Trabajar en ramas; esta entrega usa Preview, sin fusionar main ni promover a Production. Cada rama tiene su propio enlace estable, que Vercel muestra entre los aliases de su despliegue. Una URL de despliegue individual está vinculada a una versión concreta y no sigue los futuros commits.

Verificar READY y el SHA exacto antes de afirmar que la versión está publicada. Cambiar de rama de trabajo crea otro preview; para actualizar el mismo enlace, integrar los cambios en su rama con autorización. La rama de producción es una configuración separada y no debe cambiarse automáticamente.

La protección de previews puede pedir iniciar sesión en Vercel. Eso no es la cuenta de jugador de Lumemon. No desactivar protección ni promover a producción sin concretar que se quiere acceso público.

## Supabase con dominio remoto

Después de obtener el alias estable real de Vercel:

1. En Authentication → URL Configuration, poner como Site URL ese dominio HTTPS con /cuenta.
2. Añadir como Redirect URLs exactas el mismo dominio con /cuenta y con /cuenta/recuperar.
3. Conservar las URLs locales de docs/CUENTAS-ONLINE.md solo si se probará en local.
4. Registrarse y abrir los correos en el mismo navegador/origen. No usar una URL diferente por cada compilación para el flujo de acceso.
5. Comprobar registro, confirmación, alias persistido, cierre de sesión y recuperación. SMTP propio sigue siendo necesario para correo a personas ajenas al equipo.

No usar la URL de la API de Supabase como Site URL. El proyecto de base de datos se mantiene al actualizar el frontend: un push no debe ejecutar migraciones ni reiniciar datos automáticamente.
