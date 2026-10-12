---
name: cambio-verificado
description: Use when implementing or debugging a scoped change in an existing web repository, especially after another agent worked on it. Not for general questions or documentation-only edits.
---

# Cambio verificado en un proyecto existente

## Antes de editar

Lee las instrucciones del repositorio. En Lumemon están en `AGENTS.md`, con el estado en `docs/CONTEXTO-IA.md`, ambos relativos a la raíz del proyecto. No supongas que conoces la rama, herramientas o pruebas de otra sesión.

Define un resultado observable y limita los archivos afectados. Consulta el código actual y sus llamadores antes de proponer interfaces. Continúa dentro de lo autorizado; pregunta solo por ambigüedades que cambien el resultado o por operaciones que requieran permiso. Detente si el alcance crece y explica qué nueva decisión hace falta.

## Implementación o depuración

- Funcionalidad: fija primero sus casos de aceptación y entradas/salidas. Separa reglas de negocio de componentes. Reutiliza convenciones y dependencias existentes.
- Error: reproduce, recoge evidencia y distingue causa de síntoma. Comprueba red, datos, estado y presentación según el problema. No pruebes arreglos aleatorios ni ocultes errores con datos inventados.
- Para lógica o regresiones relevantes, crea una prueba que falle por el comportamiento esperado, aplica el cambio mínimo y comprueba que pasa. No añadas pruebas triviales de texto o estructura solo para aumentar contadores.
- Interfaz: conserva idiomas, teclado, foco, estados vacíos/error/carga y movimiento reducido. Comprueba móvil y escritorio; no des por válida la apariencia solo porque compile.
- Persistencia: comprueba restauración, datos inválidos, fallos de escritura y reintentos. Si varias sesiones comparten datos, considera conflictos. Un dato de cliente nunca prueba propiedad o saldo autorizado.

## Verificación y entrega

Ejecuta las pruebas y comandos pertinentes que existan realmente en el proyecto. Si un comando falla por falta de herramienta o permisos, informa de ello; no lo presentes como prueba superada ni instales sin autorización. No repitas comprobaciones exitosas salvo cambios o dudas nuevas.

Revisa el diff: alcance, datos reales, secretos, archivos generados y regresiones. Una revisión independiente puede ayudar en cambios complejos cuando esté autorizada; no es obligatoria para cada ajuste.

Actualiza la documentación afectada y el traspaso. Guarda solo cambios propios en la rama acordada y sigue las autorizaciones de Git del repositorio. Comunica resultado, evidencia, límites y siguiente decisión pendiente. No despliegues ni inicies otro bloque por terminar este.
