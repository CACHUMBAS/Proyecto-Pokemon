# Lumemon — contexto de continuidad

Actualizado: 2026-10-13 (primer conjunto verificado de cartas de combate). Es un resumen del estado del repositorio, no una autorización para desarrollar todas las fases. No contiene el historial completo del chat ni datos de otros proyectos.

## Base que debe conservarse

- Repositorio: https://github.com/CACHUMBAS/Proyecto-Pokemon.git
- Carpeta usada en este ordenador: `C:\Users\ffran\OneDrive\Datos adjuntos\Desktop\PokePrisma`. En otro equipo, utiliza la raíz real del checkout.
- Base del bloque actual: `f32d9fd`, rama `feat/battle-turns`. Incluye Lumemon (`bc5be88`), el filtro de tipos de Antigravity (`3f78710`) y el constructor de equipos (`ac75b2f`).
- Cambio de nombre a Lumemon en `chore/rename-lumemon`, creada desde `3f78710`. Incluye el paquete de continuidad original de `9128d2f` (`docs/contexto-antigravity`). Un agente nuevo debe conservar el cambio de nombre y el filtro de tipos; no cambiar a `main` ni a ramas antiguas sin comprobar la ascendencia.
- Propuesta de reglas en `docs/reglas-combate-lumemon`, desde `bc5be88`; este bloque solo modifica documentación.
- Primer módulo de efectividad y daño en `feat/battle-damage`, desde `afc4b10`. Conserva la documentación de reglas y todas las entregas anteriores.
- Motor local de turnos en `feat/battle-turns`, desde `991b30c`; conserva todas las entregas anteriores.
- Datos iniciales de combate en `feat/battle-data`, desde `f32d9fd`: 12 especies y 24 cartas del catálogo conectadas al motor.
- La rama activa, cambios pendientes y ascendencia se consultan siempre en Git. Estos nombres son una referencia fechada, no una orden de cambiar de rama.

## Nombre actual y compatibilidad

El usuario ha elegido **Lumemon** y autorizado cambiar los archivos, actualizar este contexto y subir una rama nueva a GitHub. PokePrisma es el nombre anterior; PokéLume y otras propuestas no son nombres vigentes. Esta tarea no autoriza desplegar ni fusionar con la rama principal.

La interfaz ES/EN, el logotipo textual, títulos, metadatos, nombre del paquete npm y documentación activa usan Lumemon. Se mantienen por compatibilidad:

- Carpeta local `PokePrisma` y repositorio `CACHUMBAS/Proyecto-Pokemon`.
- Claves locales `pokeprisma.locale.v1` y `pokeprisma.team-draft.v1`, con su mismo formato y versión.
- Origen de cartas `pokeprisma`, IDs `prisma-*`, identificadores de expansión/rareza/presentación `prisma`, instantánea y rutas del catálogo. El nombre visible de la expansión propia pasa a Lumemon.
- Nombres de ramas, commits, rutas y documentos de revisiones/planes históricos. Son referencias del historial, no la marca actual.

No hagas un reemplazo global de estos identificadores ni borres almacenamiento para cambiar la marca. Una migración futura tendría que conservar los datos guardados.

Verificado el 2026-10-12: 59 pruebas correctas (`npm test`), lint y build con typecheck. En Edge, sobre la compilación local: marca, título y metadatos en ES/EN; inicio, catálogo, ficha de Pikachu, equipo, muestras y ruta inexistente; anchos 320/390/1440 px sin desbordamiento. Se restauraron un idioma EN y un equipo de Umbreon guardados con las claves anteriores, conservados al recargar y navegar; sin errores JavaScript. Revisadas capturas de cabecera, portada móvil y sobre. No se han añadido dependencias ni modificado las reglas del juego.

## Usuario y forma de trabajar

Proyecto personal con posible lanzamiento posterior, sin enunciado académico, fecha límite ni presupuesto para servicios de pago. El usuario quiere una web cuidada, funcional y profesional; prefiere ver el código en VS Code, cambios paso a paso y ramas por bloque. Le preocupa el consumo compartido de sus herramientas de IA: prioriza lecturas selectivas, entregas concretas y explicaciones concisas. No prometas porcentajes de ahorro ni equivalencias entre tokens y cuota.

El proyecto anterior de Procurador Tomás está fuera de alcance. No reutilices decisiones visuales, archivos, repositorio ni despliegue de esa web.

## Qué funciona hoy

| Área | Implementado | Límite actual |
| --- | --- | --- |
| Base visual | Portada `/`, muestras `/diseno`, rutas, ES/EN, tarjetas holográficas, teclado y movimiento reducido | Los anuncios de futuras funciones no significan que estén implementadas |
| Catálogo | `/catalogo`, filtros, búsqueda, paginación, fichas `/catalogo/:id`, variantes e idioma real de ilustraciones | Catálogo público, sin propiedad o inventario de usuario |
| Datos | Instantánea normalizada de PokéAPI y TCGdex, carga de fichas bajo demanda y caché | No se consultan las API para cada interacción ni se necesita reimportar para arrancar |
| Imágenes McDonald’s | 87 ilustraciones recuperadas localmente, incluidas las 12 de 2011; procedencia y hashes registrados | Algunas ediciones siguen sin imagen fiable; no inventar URLs o correspondencias |
| Composición | Validador de seis especies distintas; rechaza IDs desconocidos, duplicados, apoyos en plazas Pokémon y asociaciones ambiguas | No comprueba propiedad, estadísticas, movimientos ni aptitud real para combatir |
| Equipo de prueba | `/equipo`: elegir variantes, sustituir ilustración en la misma plaza, quitar, poner primero, filtrar especies por tipo de Pokémon (PokéAPI); ES/EN y móvil | Un borrador local, sin cuenta, apoyos seleccionables ni combate |
| Cálculo de combate | Tipos de datos mínimos, 18 tipos, dobles tipos e inmunidades, afinidad y modificadores de daño con aritmética exacta | Funciones puras sin conectar a la interfaz; no resuelven turnos, estados, duración de mejoras ni propiedad |
| Turnos locales | Creación de estado, acciones validadas, prioridad, velocidad/desempate, cinco estados, cuatro apoyos, recargas, KO, sustituciones y final | Núcleo puro con datos sintéticos de prueba; sin pantalla de combate, movimientos/perfiles reales, reloj o servicio de elecciones privadas |
| Cartas habilitadas para el motor | 24 cartas de 12 especies; perfiles propios persistidos, rarezas explícitas, nombres ES/EN y movimientos con compatibilidad USUM verificada; adaptador por IDs | Selección inicial sin UI, IA, apoyos mapeados o propiedad; las demás cartas del catálogo todavía no son jugables |
| Guardado local | IDs versionados, recuperación contra catálogo, avisos de almacenamiento, reintento de red, detección de escrituras obsoletas y escucha de cambios entre pestañas | No sincroniza dispositivos ni sustituye un servidor transaccional |

La instantánea `523febef1a683029` contiene 1.025 especies, 23.770 registros de cartas (20.132 Pokémon y 3.638 apoyos), 129 asociaciones ambiguas y 1.357 registros sin imagen en la fuente. Los respaldos locales de imágenes no modifican esos contadores originales. Verifica cifras futuras en `public/catalog/manifest.json`; no afirmes cobertura de todas las ediciones históricas o japonesas.

Última verificación de aplicación registrada para `ac75b2f`: 59 pruebas, lint, typecheck incluido en build y compilación correctos. Se comprobó Edge en 320/390/768/1440 px, ES/EN, añadir seis, impedir séptima especie, sustituir, promover, retirar, recargar, navegar, red fallida, borrador corrupto, almacenamiento bloqueado y dos pestañas. Es evidencia histórica; ejecuta lo pertinente después de cambiar código.

Verificación registrada por Antigravity para `3f78710` (`feat/team-type-filter`): 59 pruebas, lint, typecheck y build correctos. Filtro por tipo de Pokémon (PokéAPI) añadido al selector de `/equipo` con "Todos los tipos", combinación con búsqueda, paginación reseteada al cambiar filtro, mensaje de vacío, ES/EN y diseño responsive.

## Lo que el usuario quiere como producto final

- Todas las generaciones disponibles; estética de Pokédex tecnológica y cartas holográficas.
- Cuenta obligatoria para jugar/progreso real. Se contemplan Google y correo/contraseña.
- Abrir sobres y coleccionar. Monedas por victorias y fragmentos obtenidos de duplicados, ambos canjeables por sobres. No fragmentar copias automáticamente.
- Cada ilustración tendrá una distribución de estadísticas propia; las raras tendrán mayor poder dentro de un equilibrio probado. No hay números definitivos de balance implementados.
- Combates simplificados con seis especies distintas, un activo y cinco reservas, tipos y estados. Entrenador/Energía serán apoyos con mejoras explícitas; se proponen hasta tres.
- Tutorial contra la máquina, partidas rápidas, campaña y PvP en salas privadas.
- Plazo de 45 segundos por turno y margen de reconexión propuesto de 60 segundos. La especificación propone elección simultánea de acciones, resolución y relojes del servidor.
- Música, efectos y gritos, con controles y recursos cuya procedencia se conozca.

El documento de diseño distingue requisitos del usuario de propuestas iniciales. Sus valores de estados, reglas de desempate, rareza, movimientos y economía requieren concreción y pruebas. Léelo cuando una tarea toque esas reglas; no transformes una propuesta en un hecho implementado.

## Propuesta de reglas preparada el 12 de octubre

El usuario autorizó redactar el documento del siguiente bloque. Se preparó [Reglas de combate v0.1](superpowers/specs/2026-10-12-lumemon-battle-rules-design.md). El 13 de octubre, tras explicar el combate, el usuario aceptó continuar con el primer bloque. Primero se implementó el cálculo de tipos/daño; la continuación posterior autorizó el motor local de turnos. El equilibrio completo y su integración jugable siguen pendientes.

Propone cinco presupuestos por rareza (240/252/264/276/288), cuatro estadísticas normalizadas por especie y perfiles distintos por variante, movimientos con potencia/recarga propias, afinidad ×1,25, tabla de 18 tipos, orden de resolución, estados, cuatro efectos de apoyo y límite de 60 turnos. Incluye el mapeo explícito de las 42 etiquetas actuales y ejemplos calculables. Son decisiones de diseño propuestas, no cifras oficiales ni equilibrio demostrado.

El catálogo conserva su contrato sin estadísticas de combate. Ya hay una instantánea separada para 24 cartas, con perfiles y movimientos verificados; los apoyos reales y el resto de cartas siguen pendientes. No se puede empezar una partida usando solamente cualquier borrador local. No cambiar claves, IDs, el contrato del validador de composición o los datos publicados por leer esta propuesta.

Verificación documental del 2026-10-12: 42 etiquetas de rareza cubiertas sin duplicados; 324 relaciones de tipos contrastadas con la revisión fijada de PokéAPI; cinco presupuestos, dos perfiles y ejemplos de daño/curación/veneno/recargas comprobados; enlaces locales correctos, sin marcadores incompletos y solo cinco archivos Markdown modificados. No hay nuevos resultados de pruebas de aplicación: este bloque no toca código. El equilibrio sigue pendiente de partidas de prueba.

## Primer cálculo de combate — 13 de octubre

`src/battle/type-chart.ts` valida tipos de Pokémon y calcula `getTypeEffectiveness` para uno/dos tipos defensivos. `src/battle/damage.ts` calcula `calculateDamage` con reglas `lumemon-damage-v1`: afinidad 5/4, quemadura 4/5, impulso 3/2 y barrera 7/10, usando BigInt para truncar una sola vez. La salida es serializable: `damage` significa vida realmente perdida (limitada por la disponible), `remainingHp`, efectividad, afinidad y versión de reglas. No se modifican las entradas.

Se rechazan números no enteros seguros positivos, potencia cero, objetivos a vida cero, tipos desconocidos/repetidos o listas inválidas, y banderas no booleanas. La función espera un ataque de daño ya autorizado; no valida quién posee la carta, si el atacante puede actuar o si conoce ese movimiento. Quemadura/impulso/barrera son factores recibidos: todavía no se aplican estados ni se consumen cargas. La tabla procede de los CSV fijados de PokéAPI incluidos en `src/battle/fixtures`, con hashes y trazabilidad.

Verificación: 10 pruebas nuevas fallaron primero ante funciones sin implementar y pasaron después. Suite completa: 69 pruebas; lint, typecheck y build correctos. Se contrastan las 324 relaciones de tipos y se cubren dobles tipos, cero por inmunidad, redondeo, mínimo uno, sobre-daño, valores grandes/incorrectos y entradas congeladas. No cambió la interfaz y no se repitieron pruebas visuales. Revisión final independiente completada sin problemas que corregir en este bloque. El revisor comprobó las diez pruebas nuevas y las fuentes; turnos, balance e integración visual quedan fuera de este bloque.

## Resolución local de turnos — 13 de octubre

El usuario pidió continuar con el siguiente bloque anunciado. Se implementan createBattle, validateAction, resolveTurn y resolveReplacements en src/battle. Orden: cambios → apoyos → movimientos por velocidad fijada → daño residual simultáneo → resultado/sustituciones. Incluye cinco estados con sus inmunidades, cuatro apoyos de un solo uso, recargas, expiración de mejoras, KO, victoria inmediata y empate por doble KO o turno 60.

El motor clona las entradas, incrementa la versión por transición y registra eventos serializables junto con el bit de desempate utilizado. Exige datos explícitos de batalla; no inventa movimientos a partir del catálogo. Su estado es interno y válido, no un snapshot arbitrario recibido de un cliente. La confirmación inmutable de elecciones privadas, tiempo, transacciones e idempotencia global pertenecen al servicio futuro. null en sustituciones solicita alternativa automática; no comprueba ningún reloj.

Verificación: 22 casos nuevos en RED y luego GREEN; 91 pruebas totales, lint, typecheck y build correctos. Sin cambios de interfaz ni dependencias. Revisión independiente completada sin hallazgos que corregir: 22/22 casos y comprobaciones adicionales de aritmética con enteros grandes, acciones inválidas, desempates y mejoras duplicadas. El equilibrio, la integración y los servicios futuros quedan fuera de esta verificación. Contratos y alcance: [API local](../src/battle/README.md) y [plan de turnos](superpowers/plans/2026-10-13-lumemon-battle-turns.md).

## Primer conjunto jugable en código — 13 de octubre

El usuario autorizó continuar con los datos de combate anunciados. Se habilitan 24 IDs concretos de 12 especies en src/battle/data/starter-roster.json; versión lumemon-roster-d3979d52f16cbe7b. El catálogo, sus imágenes y el borrador local no cambian.

Las estadísticas aplican los presupuestos y fórmula acordados con perfiles únicos persistidos por especie. Las 42 rarezas actuales tienen mapeo explícito; una desconocida falla. Se conservan 13 CSV reducidos de la revisión fijada, hashes completos/reducidos y trazabilidad. Los 29 movimientos distintos (37 asignaciones a especies) tienen nombres ES/EN, tipo y compatibilidad comprobada solo en Ultrasol/Ultraluna, version_group_id18. Potencias, recargas y efectos son de Lumemon: no se heredan efectos secundarios ni prioridad. No hay movimiento puro de congelación inventado.

listPlayableCards/getPlayableCard devuelven copias; createPlayableBattle exige seis cartas habilitadas de especies distintas por equipo y registra la versión de datos. No prueba propiedad ni permite usar una carta ajena al conjunto. Crea equipos sin apoyos: su mapeo real queda pendiente. Scripts battle:check y battle:generate trabajan offline; el primero no escribe ni descarga.

Verificación: 11 pruebas nuevas en RED→GREEN; 102 pruebas totales, lint y compilación con TypeScript correctos, snapshot regenerado y comprobado exactamente. Incluye un combate completo con estas cartas, colisiones de 80 variantes, números grandes, alteración de fuentes y rechazo de asociaciones incompatibles. Revisión independiente completada sin hallazgos: 11/11 pruebas dirigidas correctas. El ejecutor verificó también los hashes oficiales completos de los cuatro CSV reutilizados de la caché; los otros nueve se descargaron de la revisión fijada durante esta tarea. Sin interfaz nueva ni prueba visual requerida. Detalle: [datos y procedencia](../src/battle/data/README.md), [plan](superpowers/plans/2026-10-13-lumemon-battle-data.md).

## Pendiente: no anunciar como disponible

Integración del motor en una pantalla de combate, ampliar estadísticas/movimientos a más cartas, mapeo real de apoyos, tutorial, IA de rivales, campaña, autenticación, inventario, sobres, monedas, fragmentos, recompensas, salas, reconexión, música y publicación de Lumemon.

React/Vite/TypeScript ya están elegidos. Supabase Auth/Postgres/Realtime y Vercel figuran como arquitectura propuesta para fases posteriores; no están configurados en este proyecto. No crear recursos, sustituir tecnología ni instalar SDKs por leer esta propuesta. Para el motor, se prevé TypeScript separado de React, reglas versionadas y azar inyectado/reproducible. Las futuras monedas, aperturas, recompensas y propiedad deben validarse en servidor; nunca confiar en `localStorage` para ellas.

Siguiente candidato, pendiente de una tarea concreta: primera pantalla de combate de práctica contra la máquina usando el conjunto de 24 cartas ya disponible; después tutorial y ampliación del conjunto. Mantenerlo explícitamente local, sin cuenta ni recompensas reales. Este archivo no autoriza implementar esos bloques automáticamente.

## Mapa de código y comandos

| Ruta | Responsabilidad |
| --- | --- |
| `src/app/router.tsx` | Rutas; catálogo y equipo se cargan de forma diferida |
| `src/components` | Tarjetas, botones, idioma, layout; reutilizar |
| `src/features/catalog` | Pantallas, conversión de cartas a vista, orden de variantes |
| `src/features/team` | Constructor, selector y hook de borrador |
| `src/catalog` | Tipos, normalización, repositorio, cliente, fuentes suplementarias y pruebas |
| `src/battle/types.ts`, `type-chart.ts`, `damage.ts` | Contratos mínimos, efectividad y pérdida de vida puras; sin interfaz ni turnos |
| `src/battle/engine-types.ts`, `battle-state.ts`, `battle-effects.ts`, `turn-engine.ts` | Contratos, creación/validación, efectos y resolución de turnos/sustituciones; API y límites en `src/battle/README.md` |
| `src/battle/profiles.ts`, `playable-roster.ts`, `data` | Estadísticas propias, conjunto versionado de 24 cartas y adaptador al motor; procedencia en `data/README.md` |
| `scripts/battle` | Selección explícita, carga verificada y generación/check offline de datos de combate |
| `src/battle/team.ts` | Validación estructural del equipo |
| `src/battle/team-draft.ts` | Formato, restauración, guardado y selección del borrador |
| `src/i18n/es.json`, `src/i18n/en.json` | Traducciones de interfaz |
| `src/styles` | Tokens, fuentes locales y estilos globales |
| `scripts/catalog` | Importación y validación de cobertura |
| `public/catalog` | Manifiesto e instantáneas versionadas |
| `public/_sources.md` | Procedencia de recursos |

Node >=24; scripts y versiones fijadas en `package.json`/lockfile. Pruebas con `node --test`, TypeScript nativo de Node y `node:assert/strict`; no instalar otro framework por defecto. Código TypeScript estricto, comillas simples, sin punto y coma, ancho de formato 100.

```sh
npm run dev       # 127.0.0.1:5174, puerto estricto
npm test
npm run lint
npm run battle:check # reproducción offline del conjunto jugable
npm run build     # incluye typecheck
npm run preview   # 127.0.0.1:4174
```

Comprueba primero si el servidor ya está activo; no termines procesos ajenos ni arranques duplicados. `npm ci` instala lo fijado en el lockfile: no es necesario si el entorno ya está listo; pide permiso si hace falta instalar. `catalog:import` y `--refresh` son operaciones explícitas de actualización, no pasos de arranque o validación rutinaria.

La clave local del equipo es `pokeprisma.team-draft.v1`. Un error de red no debe borrar datos ni sobrescribirlos por un equipo vacío; un borrador inválido requiere descarte explícito. Una carta válida del catálogo no implica que el jugador la posea. No aceptar formas por coincidencia de nombres ni tomar la primera especie de una carta múltiple.

## Fuentes de verdad y continuidad

1. Instrucciones actuales del usuario: alcance y autorizaciones.
2. Código, Git, manifiesto y comprobaciones actuales: estado real.
3. Este resumen: decisiones y mapa; actualizar si queda obsoleto.
4. [Diseño del juego](superpowers/specs/2026-10-08-pokeprisma-design.md): visión y reglas propuestas, no lista de funciones terminadas. La fecha inicial es histórica; el nombre se actualizó a Lumemon.
5. [Reglas de combate v0.1](superpowers/specs/2026-10-12-lumemon-battle-rules-design.md): guía de reglas iniciales; tipos/daño, turnos locales y primer conjunto de datos implementados; integración y cobertura completa pendientes. [Plan del cálculo](superpowers/plans/2026-10-13-lumemon-battle-damage.md): alcance y verificación de este bloque.
6. [README](../README.md), [revisión de catálogo](revision-fase-2.md) y [revisión de equipos](revision-equipo.md): uso y evidencia.

Al cerrar una tarea, modifica solo las secciones que cambian: fecha, entrega realizada, evidencia y pendientes. No borres requisitos futuros ni marques una fase completa por terminar uno de sus componentes. Si documentación y código discrepan, señala la diferencia y corrige el estado tras comprobarlo.
