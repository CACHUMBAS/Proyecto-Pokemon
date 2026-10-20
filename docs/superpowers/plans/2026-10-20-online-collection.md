# Online collection Implementation Plan
> **For agentic workers:** Ejecutar inline con executing-plans; una revisión independiente al terminar.
**Goal:** Colección privada, inicial único, sobres atómicos y fragmentos persistidos.
**Architecture:** RPC transaccionales de Postgres y cliente diferido que reutiliza Auth; componentes de colección/sobres comparten un controlador con aislamiento de identidad.
**Tech Stack:** React 19, TS, Vite, Supabase JS 2.118.0, PGlite 0.5.10 (solo desarrollo).
**Spec:** ../specs/2026-10-20-online-collection-design.md
## Global Constraints
ES/EN, móvil, presupuesto cero, identidad Lumemon y claves técnicas existentes intactas. No nuevos servicios ni secretos. Rama feat/online-collection-packs desde 969d8b4. Práctica sin recompensas.
## Review Focus
- Doble clic o reintento tras respuesta perdida: una operación, UUID estable.
- Cambio de sesión durante carga/mutación: ocultar inmediatamente datos anteriores.
- Dos operaciones compiten por última copia o saldo: bloqueo de cartera antes de validar.
- Petición con UUID repetido pero parámetros distintos: rechazo.
- Cambios de definición o respuesta corrupta: no habilitar gastos con datos inventados.
## Task 1 — Base de datos
Files: supabase/migrations/202610200001_collection.sql, supabase/tests/collection.sql, scripts/database/collection.test.ts, package.json.
Interfaces: cuatro RPC y snapshot/receipt del diseño.
- [x] Escribir pruebas PostgreSQL y ejecutarlas antes de implementar; fallan por contrato ausente.
- [x] Implementar definiciones verificadas, tablas privadas, RPC, bloqueo y recibos.
- [x] Ejecutar node --test scripts/database/collection.test.ts; resultado esperado: todos correctos.
- [x] Guardar prueba SQL transaccional para Supabase y documentar límites locales.
## Task 2 — Contrato y controlador
Files: src/collection/{types,validation,gateway,store}.ts y *.test.ts.
Interfaces: load(userId) -> CollectionSnapshot, execute(command,requestId) -> CollectionReceipt; store maneja load/submit/retry/stop y revisiones.
- [x] Pruebas RED: respuesta de otra cuenta, inventario negativo, recibo inválido, doble clic, respuesta obsoleta y reintento con mismo UUID.
- [x] Implementar validación, adaptador y controlador puro.
- [x] Ejecutar node --test src/collection/*.test.ts; esperado todos correctos.
## Task 3 — Interfaz
Files: src/features/collection/*, router, navegación, perfil, ES/EN.
- [x] Implementar inicio autenticado, tres kits, colección filtrable, saldos, confirmaciones y resultados recuperables.
- [x] Integrar sobres con coste/odds/listado de variantes, animación omisible y fragmentación voluntaria.
- [x] npm test, npm run lint, npm run build; esperado todo correcto.
- [ ] Navegador móvil/escritorio y ES/EN; verificar estados disponibles sin introducir credenciales del usuario.
## Task 4 — Revisión y entrega
- [x] Una revisión independiente del diff, de permisos y de límites de validación.
- [x] Corregir hallazgos importantes con regresiones.
- [x] Actualizar contexto/guías, commit/push y sincronización.
- [ ] Guiar al usuario para ejecutar SQL y prueba en Supabase; publicar solo conforme autorización.
## Ledger
- Ruling: continuar con el alcance solicitado y las decisiones explícitas del usuario sin nuevas rondas de permiso para documentos; conservar una carpeta/una rama, como en los bloques anteriores, para que VS Code muestre el trabajo. No implementadores paralelos.
- Ruling: separar recompensas de combate porque la práctica local acepta estado del navegador; conceder monedas ahí permitiría falsificar victorias. Este bloque habilita la colección y el sobre de bienvenida, y deja clara esa limitación.
- Pre-flight: Task 1 RPC -> Task 2 validación -> Task 3 interfaz; nombres y campos deben mantenerse iguales.

- Evidence: implementación 10f1f32; SQL 9 RED→GREEN, cliente 11 RED→GREEN. Revisión única: sin hallazgos Critical/Important, uno Minor reproducido y corregido con 3 nuevas regresiones. Suite final 215/215, lint y build/typecheck correctos.
- UI: invitado ES/EN, 320/390/1440 y teclado comprobados; navegación móvil corregida tras inspección. Flujos autenticados pendientes de activación por el usuario.
- Runtime: primer intento de SQL comunicado como consulta vacía, sin evidencia de ejecución. Instrucciones de copiado completas enviadas.

- Delivery: 10f1f32 y 231d7c6 subidos a origin/feat/online-collection-packs; árbol limpio y divergencia 0/0 verificados. Se conserva producción sin integrar; pendiente la respuesta del usuario al reintento de SQL.
- Ruling: seguir el permiso ya existente para commit/push sin repetir menú de integración. No fusionar ni publicar el bloque sin su autorización.
