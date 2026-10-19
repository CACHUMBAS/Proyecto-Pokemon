# Online accounts Implementation Plan
> **For agentic workers:** Use executing-plans inline; one independent review at the end.

**Goal:** Entregar registro/acceso/recuperación y perfil privado con Supabase, sin simular progreso.
**Architecture:** Cliente y adaptador Auth/Postgres diferidos con la ruta; controlador independiente de React para cargas y cambios de identidad; RLS y permisos en SQL versionado.
**Tech Stack:** React 19, TypeScript, Vite, Supabase JS 2.118.0, PostgreSQL.
**Spec:** ../specs/2026-10-19-online-accounts-design.md

## Global Constraints
ES/EN, móvil/escritorio, sin modificar claves de borrador ni reglas de combate. Solo nueva dependencia autorizada. Nunca incluir secretos. No desplegar ni crear cuentas externas automáticamente.

## Review Focus
Sesión cambiada mientras carga/guarda perfil; enlace caducado; SMTP sin configurar; clave secreta en variables públicas; permisos de otra cuenta.

## Task 1 — Identidad y contrato privado
Files: src/account/{config,validation,store,gateway,client}.ts, src/account/*.test.ts, supabase/migrations/202610190001_player_profiles.sql.
- [x] Pruebas RED de configuración/validación, fallo de sesión, resultado obsoleto y perfil de otra identidad.
- [x] Implementar contrato y controlador; pasar pruebas dirigidas.
- [x] Preparar SQL con RLS y pruebas transaccionales de permisos.

## Task 2 — Cuenta en la web
Files: src/features/account/*, src/app/router.tsx, src/components/layout/AppShell.tsx, src/i18n/{es,en}.json, .env.example.
- [x] Formularios de sesión/registro/reset y perfil editable, estados de carga/error/configuración.
- [x] Mantener confirmación, callback local seguro y aislamiento al salir.
- [x] Navegador ES/EN, 320/390/1440, teclado y validación sin enviar correos.
- [ ] Cuenta real, confirmación, guardado de alias y recuperación (requiere acción del usuario y URLs/correo).

## Task 3 — Verificación y entrega
- [x] Suite, lint, build y revisión independiente.
- [x] Documentar qué se comprobó realmente y pasos pendientes de proyecto/SMTP.
- [x] Contexto Antigravity actualizado.
- [ ] Commit/push y sincronización.

## Ledger
- Usuario seleccionó online y autorizó instalar SDK. Instalado 2.118.0; npm informó cero vulnerabilidades.
- Ruling: trabajo inline y una rama nueva en la carpeta habitual para conservar VS Code; no implementadores paralelos.
- Ruling: desarrollar lo autorizado sin nuevas rondas de aprobación de documentos; las decisiones externas y los permisos de instalación sí se consultan.

- Verificado: 192 pruebas, lint y build/typecheck correctos. Revisión independiente con tres P2 corregidos y regresiones RED → GREEN.
- Usuario confirmó migración y prueba SQL con rollback correctas. Comprobaciones directas: Auth HTTP 200, confirmación activa y lectura anónima de perfiles rechazada HTTP 401/42501. SMTP público y prueba de cuenta real pendientes.

- El usuario dirigió el siguiente paso hacia Vercel conectado a GitHub. Configurar URLs definitivas después del despliegue; prueba de cuenta real pendiente.
