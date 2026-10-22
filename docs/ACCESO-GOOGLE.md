# Acceso con Google

## Estado — 2026-10-22

Implementado en la rama `feat/google-signin`, desde `8bc85ba`. Pendiente de configurar el proveedor y probar una cuenta real. No está publicado: producción continúa en `d2eec67`. El usuario eligió mantener coste cero y no dispone de dominio propio. No se instalaron dependencias ni se modificaron tablas, cuentas, saldos o colecciones.

El botón «Continuar con Google» aparece en inicio de sesión y registro cuando `VITE_GOOGLE_AUTH_ENABLED=true`. La variable es pública, no es una credencial, y está desactivada por defecto en `.env.example`. El acceso por correo y contraseña y la recuperación se conservan. Habilitar Google no soluciona el envío SMTP para nuevos destinatarios externos; esa limitación del registro por correo sigue pendiente.

## Configuración guiada, sin facturación

1. En [Google Cloud Console](https://console.cloud.google.com/), crear o seleccionar el proyecto Lumemon. No activar facturación ni servicios de pago. Se pidió al usuario avisar cuando estuviera creado; aún falta su respuesta.
2. Abrir Google Auth Platform. Completar la información de la aplicación y el contacto con los datos del titular. Elegir audiencia externa; empezar en modo de prueba con las cuentas que vayan a probar el acceso. El titular completa cualquier aceptación o creación de credenciales. No compartir contraseñas ni secretos por el chat.
3. Solicitar únicamente identidad básica: openid, correo (userinfo.email) y perfil (userinfo.profile). No pedir acceso a Gmail, Drive ni otros datos.
4. Crear un cliente OAuth de tipo «Aplicación web». Origen de producción: `https://lumemon.vercel.app`. Para pruebas locales, añadir solo los orígenes usados: `http://localhost:5174` y/o `http://127.0.0.1:5174`.
5. En Supabase → Authentication → Sign In / Providers → Google, copiar la URL de callback que muestra el proyecto. Esa dirección `https://<project-ref>.supabase.co/auth/v1/callback` es la URI de redirección autorizada que se registra en Google. No sustituirla por /cuenta de Vercel.
6. El titular copia el Client ID y Client Secret de Google únicamente al proveedor Google de Supabase y guarda su configuración. El secreto nunca va en variables VITE_, Git, documentación ni capturas.
7. En Supabase → Authentication → URL Configuration, conservar la Site URL `https://lumemon.vercel.app/cuenta` y la recuperación ya configurada. Añadir, cuando se pruebe en local, los retornos exactos `http://localhost:5174/cuenta` y/o `http://127.0.0.1:5174/cuenta`. Una vista previa necesita su propio retorno autorizado.
8. Tras configurar el proveedor, activar el indicador público en el entorno que se vaya a probar y reiniciar Vite o recompilar. Para la comprobación visual se activó solo en el proceso local; no se cambió .env.local ni Vercel.
9. Probar el recorrido real antes de publicar. La audiencia pública de Google y la publicación en Vercel son pasos separados, pendientes de autorización. No prometer que modo de prueba permite acceder a todo el mundo. La configuración básica no necesita comprar un dominio; Google puede mostrar el dominio del proyecto Supabase y solicitar requisitos adicionales para una marca personalizada o verificación.

## Comprobaciones pendientes con el titular

- Cuenta nueva: Google → /cuenta → alias → colección inicial; recargar y volver a entrar conserva el perfil y el progreso.
- Cuenta existente: comprobar con su correo verificado que se recupera el mismo perfil y colección. No asumir que el emparejamiento funciona hasta comprobarlo; no crear ni fusionar usuarios manualmente para disimular un fallo.
- Cancelar en Google, volver desde el navegador, cerrar sesión y repetir el acceso. Comprobar también móvil.
- Verificar que una segunda cuenta no ve el progreso de la primera y que no recibe premios de bienvenida duplicados.
- Autorizar después la publicación y la configuración de la variable en Vercel. No fusionar por leer esta guía.

## Implementación y evidencia local

Se usa signInWithOAuth de la librería existente de Supabase y su flujo PKCE. La vuelta espera a initialize(), retira code, sb_flow_id y errores del enlace y presenta avisos traducidos. Los errores originales del proveedor no se muestran. Esta ayuda de presentación no acredita identidad: el almacén existente sigue verificando auth.getUser() antes de cargar el perfil privado. No cambia RLS ni las reglas de inventario.

La suite completa pasó con 247 pruebas, incluidas 10 nuevas de OAuth. Cubren retorno correcto, cancelación, sesión ausente, errores de intercambio y red, limpieza del identificador PKCE y construcción real del enlace con la librería instalada. Lint y build con TypeScript pasaron tras los últimos ajustes de interfaz.

En el navegador local se comprobó la pantalla real de cuenta en ES/EN, escritorio de 1440 px y móvil de 390/320 px sin desbordamiento horizontal. El teclado pasa del botón Google al correo. Cancelación y código inválido de prueba mostraron avisos y limpiaron la URL. No se inició sesión con Google.

La página de desarrollo `/scripts/qa/google-auth.html` monta el formulario real con respuestas simuladas: doble pulsación produce un intento, ambos accesos se bloquean durante la espera, un fallo permite reintentar, un evento pageshow persistido restaura controles, la bandera oculta Google y recuperación no muestra el botón. Estas simulaciones no demuestran un recorrido OAuth real. La página no se incluye en el build de producción.

## Referencias

- [Google en Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Límites y SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
- [Identidad visual de Google](https://developers.google.com/identity/branding-guidelines)
- Icono original sin modificar: [g-logo.png](https://developers.google.com/static/identity/images/g-logo.png), guardado en src/assets/auth/google-g.png para el botón de acceso.
