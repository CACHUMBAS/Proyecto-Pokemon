# Cuentas online de Lumemon
Fecha: 2026-10-19. Base: 64b3cee. Rama: feat/online-accounts.

El usuario pide avanzar con un plazo de dos días, elige cuentas/progreso online y autoriza instalar @supabase/supabase-js. Este bloque entrega la base de identidad y un perfil privado; colección, moneda, sobres y partidas guardadas serán el siguiente bloque. No sustituirlo por una demo local.

## Diseño
- Ruta diferida /cuenta y /cuenta/recuperar, formularios ES/EN de acceso, registro y recuperación. Confirmación por correo gestionada por Supabase; nunca guardar contraseñas en la aplicación ni simular cuentas.
- Cliente oficial con PKCE, sesión persistente del SDK y renovación. Variables locales VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY; rechazar claves secretas/service_role. Sin configuración, estado explícito y formulario desactivado; el resto de la web funciona.
- Verificar el usuario contra Auth antes de cargar perfil. Cancelar resultados obsoletos al cambiar/cerrar sesión. No mostrar datos de otra cuenta durante cargas, errores o cambios.
- Tabla player_profiles: id UUID referencia auth.users, display_name de 3–24 caracteres sin controles, created_at de servidor. RLS de lectura/actualización propia; cliente solo puede actualizar display_name. Sin datos de correo públicos.
- RPC ensure_player_profile sin parámetros crea una única fila para auth.uid(), con búsqueda de esquema fijada y ejecución solo authenticated. No usa un trigger que pueda bloquear el alta. Reintentar no crea perfiles duplicados.
- Alias editable y persistido. No hay campos de monedas/inventario escribibles por cliente. La práctica y el borrador siguen siendo herramientas locales sin recompensas.
- La creación del proyecto y SMTP requieren pasos del usuario; el código no afirma conexión ni pruebas reales mientras falten. Conservar confirmación de email. Google OAuth y progreso económico quedan fuera de este bloque.

## Aceptación
Configuración ausente/incorrecta no rompe navegación. Formulario con validación y estados de red, confirmación, sesión y recuperación. Perfil privado y alias persistente. Pruebas de carreras de sesión, errores y validación. SQL de comprobación de aislamiento A/B y permisos, sin ejecutarlo sobre cuentas reales. Navegador ES/EN, móvil/escritorio. Suite, lint y build; revisión independiente. Rama y push, sin fusión/despliegue.

## Fuentes
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/managing-user-data
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/auth-smtp

El envío de correos integrado se limita a destinatarios del equipo y pruebas. Para registros públicos y recuperación hace falta configurar SMTP. No desactivar confirmación para ocultar esta dependencia.
