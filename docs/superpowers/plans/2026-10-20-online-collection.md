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
- [ ] Escribir pruebas PostgreSQL y ejecutarlas antes de implementar; fallan por contrato ausente.
- [ ] Implementar definiciones verificadas, tablas privadas, RPC, bloqueo y recibos.
- [ ] Ejecutar node --test scripts/database/collection.test.ts; resultado esperado: todos correctos.
- [ ] Guardar prueba SQL transaccional para Supabase y documentar límites locales.
## Task 2 — Contrato y controlador
Files: src/collection/{types,validation,gateway,store}.ts y *.test.ts.
Interfaces: load(userId) -> CollectionSnapshot, execute(command,requestId) -> CollectionReceipt; store maneja load/submit/retry/stop y revisiones.
- [ ] Pruebas RED: respuesta de otra cuenta, inventario negativo, recibo inválido, doble clic, respuesta obsoleta y reintento con mismo UUID.
- [ ] Implementar validación, adaptador y controlador puro.
- [ ] Ejecutar node --test src/collection/*.test.ts; esperado todos correctos.
## Task 3 — Interfaz
Files: src/features/collection/*, router, navegación, perfil, ES/EN.
- [ ] Implementar inicio autenticado, tres kits, colección filtrable, saldos, confirmaciones y resultados recuperables.
- [ ] Integrar sobres con coste/odds/listado de variantes, animación omisible y fragmentación voluntaria.
- [ ] npm test, npm run lint, npm run build; esperado todo correcto.
- [ ] Navegador móvil/escritorio y ES/EN; verificar estados disponibles sin introducir credenciales del usuario.
## Task 4 — Revisión y entrega
- [ ] Una revisión independiente del diff, de permisos y de límites de validación.
- [ ] Corregir hallazgos importantes con regresiones.
- [ ] Actualizar contexto/guías, commit/push y sincronización.
- [ ] Guiar al usuario para ejecutar SQL y prueba en Supabase; publicar solo conforme autorización.
## Ledger
- Ruling: continuar con el alcance solicitado y las decisiones explícitas del usuario sin nuevas rondas de permiso para documentos; conservar una carpeta/una rama, como en los bloques anteriores, para que VS Code muestre el trabajo. No implementadores paralelos.
- Ruling: separar recompensas de combate porque la práctica local acepta estado del navegador; conceder monedas ahí permitiría falsificar victorias. Este bloque habilita la colección y el sobre de bienvenida, y deja clara esa limitación.
- Pre-flight: Task 1 RPC -> Task 2 validación -> Task 3 interfaz; nombres y campos deben mantenerse iguales.
