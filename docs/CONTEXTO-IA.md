# Lumemon — contexto de continuidad

Actualizado: 2026-10-12 (cambio de nombre a Lumemon). Es un resumen del estado del repositorio, no una autorización para desarrollar todas las fases. No contiene el historial completo del chat ni datos de otros proyectos.

## Base que debe conservarse

- Repositorio: https://github.com/CACHUMBAS/Proyecto-Pokemon.git
- Carpeta usada en este ordenador: `C:\Users\ffran\OneDrive\Datos adjuntos\Desktop\PokePrisma`. En otro equipo, utiliza la raíz real del checkout.
- Base de este cambio: `3f78710`, rama `feat/team-type-filter`, con el filtro de tipos añadido por Antigravity y el constructor de equipos de `ac75b2f`.
- Cambio de nombre a Lumemon en `chore/rename-lumemon`, creada desde `3f78710`. Incluye el paquete de continuidad original de `9128d2f` (`docs/contexto-antigravity`). Un agente nuevo debe conservar el cambio de nombre y el filtro de tipos; no cambiar a `main` ni a ramas antiguas sin comprobar la ascendencia.
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

## Pendiente: no anunciar como disponible

Motor de combate, tabla de tipos integrada, daño, estadísticas propias por variante, movimientos, estados, apoyos, tutorial, IA de rivales, campaña, autenticación, inventario, sobres, monedas, fragmentos, recompensas, salas, reconexión, música y publicación de Lumemon.

React/Vite/TypeScript ya están elegidos. Supabase Auth/Postgres/Realtime y Vercel figuran como arquitectura propuesta para fases posteriores; no están configurados en este proyecto. No crear recursos, sustituir tecnología ni instalar SDKs por leer esta propuesta. Para el motor, se prevé TypeScript separado de React, reglas versionadas y azar inyectado/reproducible. Las futuras monedas, aperturas, recompensas y propiedad deben validarse en servidor; nunca confiar en `localStorage` para ellas.

Siguiente candidato, pendiente de la instrucción concreta del usuario: acordar un bloque pequeño del motor (contratos de combate, datos y reglas), antes de intentar un tutorial completo. Este archivo no ordena comenzarlo.

## Mapa de código y comandos

| Ruta | Responsabilidad |
| --- | --- |
| `src/app/router.tsx` | Rutas; catálogo y equipo se cargan de forma diferida |
| `src/components` | Tarjetas, botones, idioma, layout; reutilizar |
| `src/features/catalog` | Pantallas, conversión de cartas a vista, orden de variantes |
| `src/features/team` | Constructor, selector y hook de borrador |
| `src/catalog` | Tipos, normalización, repositorio, cliente, fuentes suplementarias y pruebas |
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
5. [README](../README.md), [revisión de catálogo](revision-fase-2.md) y [revisión de equipos](revision-equipo.md): uso y evidencia.

Al cerrar una tarea, modifica solo las secciones que cambian: fecha, entrega realizada, evidencia y pendientes. No borres requisitos futuros ni marques una fase completa por terminar uno de sus componentes. Si documentación y código discrepan, señala la diferencia y corrige el estado tras comprobarlo.
