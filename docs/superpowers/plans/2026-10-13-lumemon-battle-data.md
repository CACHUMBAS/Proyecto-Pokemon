# Lumemon — primeros datos jugables

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Implementación directa del siguiente bloque anunciado y autorizado por «continua».

**Goal:** conectar 24 cartas existentes de 12 especies al motor local con estadísticas propias y movimientos trazables.
**Architecture:** fuentes CSV reducidas y hashes fijados, selección explícita, generador offline determinista y snapshot JSON versionado; API pura para resolver IDs del roster y crear una partida.
**Tech Stack:** TypeScript, Node, csv-parse y node:test ya instalados.
**Spec:** [Reglas de combate](../specs/2026-10-12-lumemon-battle-rules-design.md), secciones 2, 3 y 7.

## Global Constraints
- Rama feat/battle-data desde f32d9fd, mismo checkout y un editor.
- Sin dependencias, backend, UI, cuentas, premios o despliegue.
- No cambiar catálogo ni su validador: catalogar no habilita para combatir ni prueba propiedad.
- CSV de PokéAPI en commit 2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72; compatibilidad de todos los movimientos solo en version_group_id 18 (ultra-sun-ultra-moon).
- Formas predeterminadas, tipos y estadísticas base comprobados; nombres de movimientos ES/EN de la fuente.
- Fórmula de pesos limitada 40–160; presupuestos 240/252/264/276/288; reparto por mayores restos (empate HP/Atk/Def/Speed), perfil ±8 suma0; HP120+2q, resto30+q.
- Las 42 etiquetas se mapean explícitamente; una desconocida no obtiene fuerza por heurística.
- Movimientos son adaptaciones explícitas: 40/0, 60/1, estado0/2; sin prioridad extra, secundarios, críticos, fallos ni efectos mixtos del original.
- Congelación permanece implementada en el motor, pero este roster no inventa un movimiento puro para aplicarla.
- Soportes de cartas reales quedan pendientes; los equipos creados aquí tienen cero apoyos.

## Review Focus
- Fuentes alteradas, forma alternativa, compatibilidad de otra versión, estado que no coincide con metadatos: rechazar, no generar parcialmente.
- Números inválidos y reparto: conservar exactamente B; aritmética segura; resultados literales del ejemplo Pikachu.
- Rarezas nuevas y cartas ambiguas/desconocidas: no habilitar ni asignar estadísticas silenciosamente.
- Colisiones entre variantes: tuplas únicas por especie; asignación estable por ID y salida persistida/versionada.
- Interoperabilidad: 6 IDs conocidos distintos por especie, copia independiente, API serializable, partidas resueltas con los datos reales del conjunto.

## Task 1: datos y adaptador comprobados
**Files:** profiles.ts y profiles.test.ts en src/battle; scripts/battle/{selection.json,sources.ts,build-roster.ts,generate.ts}; src/battle/data/{sources/*,starter-roster.json}; playable-roster.ts y battle-data.test.ts. Actualizar package/tsconfig para script y chequeo TS, README/contexto/guía.

**Interfaces:**
- getStatBudget(card: Pick<CardRecord,'category'|'origin'|'rarity'>): StatBudget. Pokémon propio usa240, Pokémon TCG usa mapa explícito; rechaza categorías y rarezas no admitidas.
- calculateCardStats(base: BaseStats, budget: StatBudget, profile: VariantProfile): { points: tuple4, maxHp, attack, defense, speed }. Validación de números y perfiles sin mutar.
- assignVariantProfiles(base, cards: readonly { id, budget }[]): { id, budget, profile, stats }[]. Orden lexicográfico por ID; intenta (0,+5,-5,0), (0,-5,+5,0), neutro y luego perfiles enteros válidos en orden determinista. Evita repetir tuplas y falla si se agotan. Datos resultantes persisten en snapshot.
- loadSources(root): tablas + manifiesto. Hashes de CSV reducidos y cabeceras verificadas antes de analizar; manifiesto registra URLs/revisión y SHA256 del archivo completo del que se extrajo cada subconjunto.
- buildRoster(selection, tables, catalog): BattleRoster. Exige forma predeterminada única, especies/nombres/tipos y seis estadísticas, movimientos/estado/compatibilidad corroborados y cartas inequívocas con imagen. Registra procedencia por movimiento (ID, perfil, nombres, versión, métodos/niveles).
- generate.ts construye offline; por defecto compara snapshot (--check); --write guarda un JSON determinista con versión derivada de SHA256 del contenido. No descarga ni reimporta catálogo.
- getPlayableCard(id): PlayableCard | undefined; listPlayableCards(): PlayableCard[]; createPlayableBattle(battleId, [ids0,ids1]): BattleState. Snapshot interno comprobado por las pruebas; IDs fuera de él se rechazan aunque estén en catálogo.

- [x] RED: estadísticas esperadas Pikachu204/85/78/125 y222/96/87/144, perfiles, invalidación, mapeo completo y colisiones. Generador: fallo por fuente/manifiesto/mapeo alterado, salida determinista, compatibilidad y adaptador.
- [x] Ejecutar nuevas pruebas con funciones stub. Expected: fallo por implementación ausente.
- [x] GREEN: implementar cálculo, generación y adaptador, escribir snapshot desde fuentes comprobadas.
- [x] Ejecutar nuevas pruebas, npm test, npm run lint, npm run build, npm run battle:check. Expected: correcto, salida reproducible, ninguna modificación al catálogo.
- [x] Revisión independiente final, documentación y diff. Sin hallazgos; 102 pruebas, lint, build/typecheck y battle:check correctos.

Cierre de entrega: commit/push en feat/battle-data y comprobar después la coincidencia remota mediante Git.

## Resultado previsto
12 especies (Bulbasaur, Charmander, Squirtle, Pikachu, Vulpix, Jigglypuff, Abra, Machop, Gastly, Onix, Lapras, Eevee), 24 cartas verificadas; base para pantalla/tutorial posteriores. No se afirma equilibrio probado ni cobertura de todas las cartas.
