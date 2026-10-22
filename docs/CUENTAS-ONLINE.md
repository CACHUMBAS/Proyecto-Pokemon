# Cuentas online de Lumemon

## Acceso con Google — 2026-10-22

Implementado en `feat/google-signin`; el usuario confirmó configurar el proveedor y acceder en local conservando alias y cartas. Queda pendiente comprobar producción y cuentas nuevas. Oculto salvo `VITE_GOOGLE_AUTH_ENABLED=true`; no publicado. Conserva cuentas por contraseña y no elimina la limitación SMTP externa. Véase [la guía de Google](ACCESO-GOOGLE.md).

## Alcance de esta entrega

Registro, acceso, cierre de sesión local, recuperación de contraseña y perfil privado con alias en /cuenta. La práctica y el borrador de equipo siguen siendo locales y públicos. La rama feat/online-collection-packs implementa colección, saldos, fragmentos y sobres; su activación real se detalla en [Colección online](COLECCION-ONLINE.md). Las recompensas de combate ya están publicadas; PvP sigue pendiente. El borrador local y la práctica no prueban propiedad.

El cliente oficial de Supabase se carga con la ruta de cuenta. Verifica la identidad con Auth antes de leer el perfil y descarta respuestas de sesiones anteriores. La recuperación necesita un evento PASSWORD_RECOVERY del SDK para el usuario verificado; visitar la ruta por sí solo no habilita cambiar la contraseña. Volver a enfocar la pestaña o renovar el token de la misma cuenta conserva el formulario.

## Estado verificado — 2026-10-20

El usuario confirmó que guardó las URLs de producción en Supabase y comprobó personalmente en https://lumemon.vercel.app el registro, la confirmación de correo, el acceso y el alias conservado al recargar. También completó la recuperación de contraseña, volvió a entrar y confirmó que conservaba el alias. No se compartieron contraseñas ni enlaces privados con el agente.

Site URL actual: https://lumemon.vercel.app/cuenta. Redirect URLs confirmadas: esa misma dirección y https://lumemon.vercel.app/cuenta/recuperar. Las URLs locales del apartado siguiente son opcionales para desarrollo; no sustituir la Site URL pública al añadirlas.

El usuario también confirmó éxito en la migración y la prueba SQL de aislamiento/permisos con rollback. La verificación local de la entrega anterior terminó con 192 pruebas, lint y build/typecheck correctos. Quedan pendientes SMTP para destinatarios externos al equipo y las comprobaciones manuales con otro dispositivo y dos cuentas reales simultáneas.

## Conexión local

1. Copiar .env.example a .env.local sin sobrescribir una configuración existente.
2. En Supabase, abrir Connect. Copiar Project URL y Publishable key (sb_publishable_...). Si el ejemplo es Next.js, copiar solo los valores y mantener los nombres VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.
3. Guardar .env.local y reiniciar npm run dev si Vite no se reinicia solo.

Estas variables son públicas en la aplicación compilada. Nunca usar sb_secret_, service_role, contraseñas de base de datos ni tokens de administración. .env.local está excluido de Git; no copiar sus valores a documentación o capturas.

Sin configuración válida, la página explica que la conexión no está preparada y deshabilita los envíos; el resto de la aplicación sigue funcionando.

## Base de datos y permisos

En el SQL Editor del proyecto nuevo de desarrollo:

1. Revisar y ejecutar una sola vez [la migración](../supabase/migrations/202610190001_player_profiles.sql). No volver a ejecutar si la tabla ya existe ni borrarla para evitar un error.
2. Ejecutar [la prueba transaccional](../supabase/tests/player_profiles.sql) en una consulta nueva. Resultado esperado: player_profiles: isolation and permissions passed. Si falla, ejecutar ROLLBACK; antes de reintentar e investigar el error.

La tabla player_profiles contiene id, display_name y created_at. El alias admite de 3 a 24 caracteres, sin espacios exteriores ni controles. Solo el propio usuario autenticado puede leer su fila y actualizar el alias. La función ensure_player_profile crea únicamente el perfil de auth.uid(); no acepta un ID del navegador. Las inserciones y borrados directos, y cambiar identidad o fecha desde el cliente, están prohibidos. Las pruebas usan dos usuarios temporales y revierten todos sus cambios.

RLS y permisos de columnas son la frontera de autorización; el filtro del navegador es una ayuda adicional. No añadir aquí saldos, inventario ni recompensas editables desde el cliente.

## Enlaces de correo

En Authentication → URL Configuration del proyecto:

- Site URL para desarrollo: http://127.0.0.1:5174/cuenta
- Redirect URLs:
  - http://127.0.0.1:5174/cuenta
  - http://127.0.0.1:5174/cuenta/recuperar
  - http://localhost:5174/cuenta
  - http://localhost:5174/cuenta/recuperar

Guardar. Mantener la confirmación de correo activada. Usar las plantillas predeterminadas con ConfirmationURL; si se personalizan, comprobar el flujo completo. Al desplegar, sustituir Site URL por el dominio HTTPS real y añadir sus dos rutas exactas. No autorizar dominios amplios innecesarios.

El flujo PKCE requiere abrir el enlace en el mismo navegador y origen desde el que se solicitó. 127.0.0.1 y localhost tienen almacenamiento distinto. Si el enlace se abre en otro navegador, está caducado o se recarga la pantalla de recuperación perdiendo su autorización en memoria, solicitar otro enlace.

## Correo de prueba y lanzamiento público

El servicio de correo predeterminado de Supabase solo admite destinatarios del equipo del proyecto y tiene límites de prueba (dos correos por hora según la documentación consultada). No equivale a tener registro público operativo. Para probar inicialmente, el propietario puede usar el correo con el que pertenece al proyecto. Para abrir registros al público hay que configurar un proveedor SMTP y comprobar entrega y recuperación con correos externos.

No desactivar la confirmación para esconder un problema de entrega. No contratar proveedores, dominios ni introducir costes sin autorización. Las credenciales SMTP se introducen en Supabase, nunca en variables VITE_ ni en Git.

## Comprobación manual con una cuenta real

Una vez aplicados SQL, permisos, URLs y correo:

1. El usuario crea su cuenta desde /cuenta e introduce personalmente la contraseña.
2. Abre la confirmación en el mismo navegador/origen. Debe aparecer el perfil Trainer.
3. Guarda un alias válido, recarga y comprueba que sigue guardado.
4. Sale y vuelve a entrar. Comprueba el alias en otro navegador/dispositivo.
5. Solicita recuperación y completa personalmente la contraseña nueva; el enlace usado o inválido no debe permitir repetir el cambio.
6. Con dos cuentas de prueba, comprobar que cambiar de cuenta o salir en otra pestaña retira el perfil anterior. Volver a enfocar la misma cuenta debe conservar los campos aún no guardados.

No pedir contraseñas, enlaces de recuperación ni tokens en el chat. No registrar correos reales en capturas o resultados públicos. La suite local prueba validación, aislamiento de estados, respuestas tardías, remontajes y eventos de recuperación; no demuestra por sí sola entrega de correos ni RLS en un proyecto real.

## Fuentes oficiales

- [Auth para React](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Contraseñas y recuperación](https://supabase.com/docs/guides/auth/passwords)
- [URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls)
- [Seguridad por filas](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [SMTP y límites del correo predeterminado](https://supabase.com/docs/guides/auth/auth-smtp)
