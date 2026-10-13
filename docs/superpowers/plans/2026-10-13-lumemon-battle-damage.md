# Lumemon — tipos y daño: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Ejecución directa del bloque solicitado por el usuario; no iniciar turnos, interfaz o backend.

**Goal:** calcular efectividad y pérdida de vida de un movimiento con las reglas acordadas, sin mutar las entradas.
**Architecture:** funciones puras TypeScript en `src/battle`, tabla local con fuente fijada y fracciones enteras mediante BigInt. Sin React, red, reloj o almacenamiento.
**Tech Stack:** TypeScript estricto, Node 24 y `node:test` existentes.
**Spec:** [Reglas de combate](../specs/2026-10-12-lumemon-battle-rules-design.md), apartados 3 y 8.

## Global Constraints

- Base `afc4b10`; rama `feat/battle-damage`; conservar claves, catálogo y equipo existentes.
- El usuario aceptó la explicación y pidió continuar el 13 de octubre. Este bloque concreta contratos mínimos y daño; no implementa el motor completo.
- Sin dependencias nuevas, despliegue o migraciones. Mismas reglas para el futuro cliente y servidor; aquí no se valida propiedad ni se aceptan solicitudes de juego.
- ×1,25 afinidad; ×0,8 quemadura; ×1,5 impulso; ×0,7 barrera. Un solo redondeo; inmunidad 0; mínimo 1 si no inmune. Pérdida limitada a vida disponible.

## Review Focus

- Tipos TCG/desconocidos, repetidos, listas vacías/largas o huecas: rechazo explícito, pruebas en types.test.ts.
- Combinar inmunidad y debilidad en ambos órdenes: siempre 0, pruebas de dobles tipos.
- Redondeo de factores combinados: un único truncamiento exacto, pruebas con resultado 100 y frontera entera.
- Valores NaN, infinitos, fraccionarios, negativos o inseguros y banderas no booleanas: rechazo incluso contra inmunidad.
- Sobre-daño, producto superior al entero seguro y entradas congeladas: limitar antes de convertir a number, sin mutaciones ni pérdida de precisión.

## Task 1: cálculo puro de tipos y daño

**Files:** crear `src/battle/types.ts`, `src/battle/type-chart.ts`, `src/battle/damage.ts`, `src/battle/types.test.ts`, `src/battle/damage.test.ts` y fuentes de referencia en `src/battle/fixtures/`. Actualizar README, spec y contexto/guía de Antigravity.

**Interfaces:**
- `PokemonType`: unión de los 18 identificadores de PokéAPI. `TypeEffectiveness`: 0 | 0.25 | 0.5 | 1 | 2 | 4.
- `assertPokemonTypes(types: readonly PokemonType[]): void`: valida uno/dos tipos diferentes; TypeError para datos inválidos.
- `getTypeEffectiveness(moveType: PokemonType, defenderTypes: readonly PokemonType[]): TypeEffectiveness`: multiplicación de ambos tipos defensivos.
- `DamageInput`: moveType, power, attack, defense, attackerTypes, defenderTypes, defenderHp y banderas opcionales burned, boosted, shielded.
- Números positivos y enteros seguros; potencia 0 no pertenece a esta función, los estados puros vendrán después. Vida 0 tampoco es un objetivo vivo. Banderas omitidas/undefined equivalen a false; otros tipos se rechazan.
- `calculateDamage(input: DamageInput): DamageResult`: devuelve damage (vida realmente perdida, no daño teórico), remainingHp, effectiveness, sameTypeBonus y rulesetVersion (`lumemon-damage-v1`). Todos serializables como JSON.
- El llamador futuro valida especie, perfil, elegibilidad del movimiento y si el atacante puede actuar; aquí se validan las entradas matemáticas y los tipos.

- [x] RED: escribir pruebas de tabla completa contra los CSV originales y sus hashes; duplicados, inmunidades y dobles tipos. Escribir pruebas de daño con esperados literales: 60 neutral, 120 débil, 240 doble débil, 15 doble resistente y 100 combinando quemadura/impulso/barrera; redondeo exacto, mínimo, sobre-daño, validación y ausencia de mutaciones.
- [x] Ejecutar `node --test src/battle/types.test.ts src/battle/damage.test.ts`; comprobar que fallan por funciones todavía sin implementar, con módulos mínimos que lanzan error.
- [x] GREEN: implementar tabla privada local y cálculo con productos BigInt/fracciones, truncar solo al final y limitar por defenderHp antes de convertir a number.
- [x] Ejecutar pruebas dirigidas y después `npm test`, `npm run lint`, `npm run build`. No comprobar interfaz porque no cambia ni utiliza todavía estas funciones.
- [x] Revisión final independiente del bloque: sin problemas que corregir; diez pruebas dirigidas y fuentes comprobadas por el revisor.
- [x] Registrar evidencia en contexto/guía y comprobar diff y fuentes. Resultado: 69 pruebas, lint, typecheck y build correctos.

Cierre de entrega: commit y push en `feat/battle-damage`; verificar después que HEAD coincide con la rama remota mediante Git.

## Decisiones de ejecución

Se reutiliza el checkout solicitado por el usuario en una rama nueva y limpia; solo este agente edita. La petición «continúa» se aplica al bloque ya explicado y aceptado; no se pide otra autorización rutinaria. El revisor tendrá acceso de lectura al diff. Este plan no extiende el permiso a nuevas funciones de producto.
