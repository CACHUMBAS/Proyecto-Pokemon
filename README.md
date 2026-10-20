# Lumemon

Un universo web de cartas Pokémon y combates por turnos, para móvil y ordenador.

**Web:** [lumemon.vercel.app](https://lumemon.vercel.app). Los push a chore/vercel-lumemon actualizan producción; las demás ramas generan vistas previas.

Desde el 12 de octubre de 2026, el proyecto se llama **Lumemon** (antes PokePrisma). El repositorio sigue siendo `CACHUMBAS/Proyecto-Pokemon` y la carpeta local conserva su nombre. Las claves `pokeprisma.locale.v1` y `pokeprisma.team-draft.v1`, los IDs y el origen interno `pokeprisma` se mantienen para conservar los datos existentes. Las rutas, ramas y documentos históricos pueden contener el nombre anterior.

**Estado: catálogo, constructor de prueba, práctica local y cuentas con perfil online.** Incluye 1.025 especies de PokéAPI y 20.132 cartas Pokémon de TCGdex, con búsqueda, filtros, variantes y fichas en español e inglés. Registro, acceso, recuperación y alias privado usan Supabase; requieren la [configuración online](docs/CUENTAS-ONLINE.md). La rama feat/online-collection-packs añade colección, sobres y economía transaccional; la [prueba SQL de colección](docs/COLECCION-ONLINE.md) fue confirmada por el usuario en Supabase. Su comprobación autenticada en la web y publicación siguen pendientes, al igual que recompensas y combates online.

## Abrir en VS Code

Abre esta carpeta en VS Code y su terminal integrada. Necesitas Node.js 24 o superior y npm.

```sh
npm ci
npm start
```

`npm start` y `npm run dev` hacen lo mismo. Abre [Lumemon local](http://127.0.0.1:5174/). El puerto 5174 es fijo para evitar confundir este proyecto con otras webs locales. Para detenerlo, pulsa Ctrl+C en la terminal que lo inició.

## Comprobar y compilar

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run preview
```

La compilación queda en `dist/`. La vista previa de esa compilación se abre en [localhost:4174](http://127.0.0.1:4174/). No es un despliegue público.

Para formatear archivos editados: `npx prettier --write src`. Las versiones están fijadas en `package-lock.json`.

## Qué se puede probar

- `/`: portada, carrusel manual de tres cartas, presentación y recorrido del proyecto.
- `/coleccion` y `/sobres`: inventario por cuenta, inicial único, bienvenida gratuita, aperturas y fragmentos. SQL de colección probado en Supabase; recorrido autenticado pendiente de comprobar.
- `/catalogo`: las 1.025 especies, búsqueda por nombre o número nacional y filtros combinables por generación, tipo de Pokémon, rareza y expansión. Los filtros se guardan en la URL.
- `/catalogo/25`: ejemplo de ficha de especie con todas sus variantes, paginación e idioma real de cada ilustración. Enter abre una carta y Escape cierra su ficha.
- `/equipo`: constructor de un equipo de prueba de seis especies, selección de ilustraciones, cambio de primer Pokémon y guardado local.
- `/practica`: combate local de seis contra un bot con tres equipos rivales seleccionables y 48 cartas habilitadas, ES/EN, variantes, registro, revancha, música seleccionable, gritos y animaciones por tipo.
- `/cuenta`: acceso/registro por correo y contraseña, recuperación y alias privado; requiere Supabase configurado. `/cuenta/recuperar` procesa la recuperación autorizada por el SDK.
- `/diseno`: tres cartas verificadas de TCGdex y una muestra propia sin imagen; filtros y fichas de procedencia.
- Cualquier ruta desconocida: pantalla de recuperación con enlace al inicio.
- Selector ES/EN: guarda solo el idioma; sigue funcionando si el navegador bloquea almacenamiento.
- Teclado: enlace para saltar al contenido, filtros, selección de carta, Escape para cerrar ficha y foco restaurado.
- Reflejos holográficos con ratón; acabado estático en táctil y con movimiento reducido.

Las ilustraciones de las tres cartas están en inglés y así se identifican en sus fichas. Sus tipos y rarezas son del TCG impreso; todavía no son estadísticas del combate de Lumemon. No existe un inventario, sesión o saldo simulado.

En /practica puedes elegir **Iniciación**, **Versátil** o **Élite** y ver sus seis cartas antes de entrar. El nivel depende de las cartas y la estrategia: Élite puede cambiar a una reserva más segura ante peligro o un enfrentamiento sin efecto, dejando dos turnos entre cambios. Iniciación y Versátil conservan el bot sencillo. Todos deciden antes de tu elección y usan sus estadísticas originales. La revancha conserva el rival. **Aprender a combatir** usa siempre el equipo fijo del tutorial y conserva tu selección al volver.

En la práctica, pulsa **Activar audio**. En sus ajustes puedes elegir entre cuatro temas Pokémon, regular música y gritos por separado o desactivar las animaciones. La música requiere conexión; los dieciocho gritos están incluidos localmente. Puedes saltar cada secuencia; el resultado del combate es el mismo. Salir de la ruta detiene el audio.

## Estructura

- `src/app`: rutas y contenedor de la aplicación.
- `src/components`: tarjetas, idioma, botones y estructura compartida.
- `src/features`: portada, catálogo, fichas de especie, muestras y ruta no encontrada.
- `src/catalog`: contratos, normalización, consulta y pruebas del catálogo.
- `src/account`: configuración, validación, sesión y adaptador Supabase.
- `src/collection`: contratos, validación, cliente y controlador de inventario.
- `supabase`: migraciones de perfil y colección con pruebas SQL de permisos y transacciones.
- `src/battle`: composición de equipos, cálculo de daño y motor local de turnos con sus pruebas.
- `scripts/catalog`: importación, caché y validación de cobertura.
- `public/catalog`: manifiesto e instantáneas versionadas; índice y un archivo de variantes por especie.
- `src/i18n`: diccionarios y sincronización de idioma.
- `src/styles`: fuentes locales, tokens y estilos comunes.
- `public/assets/cards`: tres ilustraciones de muestra, sin dependencia de la API al navegar.

## Actualizar el catálogo

El catálogo importado está incluido: **no necesitas ejecutar la importación para abrir la web**.

```sh
npm run catalog:import
npm run catalog:import -- --refresh
```

El primer comando reutiliza respuestas válidas durante siete días en `.cache/catalog`; el segundo vuelve a descargarlas. Ambos requieren conexión a Internet y no requieren claves. Un fallo de validación conserva el manifiesto anterior. Las revisiones de las tablas oficiales de PokéAPI y del árbol de ilustraciones están fijadas en `scripts/catalog/import.ts`: `--refresh` no cambia esas revisiones. Si PokéAPI añade especies, hay que actualizar y comprobar esas revisiones antes de publicar un catálogo nuevo. No se elimina automáticamente ninguna instantánea antigua.

El índice EN y las traducciones ES se concilian por identificador, nunca por nombre. Hay 129 asociaciones ambiguas y 1.357 registros sin imagen en la fuente; se identifican o se muestran con alternativa. El catálogo comprende los registros EN/ES disponibles en TCGdex, no una afirmación de contener todas las ediciones japonesas ni todas las cartas históricas. Las imágenes del catálogo se solicitan a sus proveedores conforme se necesitan. Las fichas cargan variantes por especie; la portada no descarga los 9,54 MB de metadatos.

## Documentación

- [Contexto para agentes](docs/CONTEXTO-IA.md).
- [Empezar con Antigravity](docs/GUIA-ANTIGRAVITY.md).
- [Configurar y comprobar cuentas online](docs/CUENTAS-ONLINE.md).
- [Activar y comprobar colección y sobres](docs/COLECCION-ONLINE.md).
- [Despliegue conectado a GitHub en Vercel](docs/DESPLIEGUE-VERCEL.md).

- [Diseño del juego](docs/superpowers/specs/2026-10-08-pokeprisma-design.md).
- [Reglas propuestas de combate v0.1](docs/superpowers/specs/2026-10-12-lumemon-battle-rules-design.md): cifras, turnos, estados, apoyos y ejemplos; cálculo de tipos/daño y turnos locales implementados; conjunto de 48 cartas y práctica local disponibles; tutorial opcional disponible y servicio online pendiente.
- [Plan y progreso de la fase 1](docs/superpowers/plans/2026-10-08-pokeprisma-fase-1.md).
- [Revisión de la fase 1](docs/revision-fase-1.md).
- [Plan de catálogo, fase 2](docs/superpowers/plans/2026-10-08-pokeprisma-fase-2.md).
- [Revisión de la fase 2](docs/revision-fase-2.md).
- [Procedencia de imágenes y tipografías](public/_sources.md).

## Desarrollo

Repositorio: https://github.com/CACHUMBAS/Proyecto-Pokemon. Cada fase se desarrolla en su rama con comprobaciones y commits. La base visual está en `feat/base-pokeprisma`, a partir de `docs/plan-inicial`. El catálogo se desarrolla en `feat/catalogo-pokeprisma`, desde `d216ebc`.

El catálogo y la práctica funcionan sin servicios. Las cuentas requieren un proyecto Supabase y las variables públicas de .env.example en .env.local, excluido de Git. El usuario ya creó el proyecto Free; la guía distingue conexión, permisos, URLs y correo. El envío público necesita SMTP configurado: no se afirma que el registro público esté listo por compilar. La web está en Vercel Hobby y el presupuesto sigue siendo cero. URLs de retorno guardadas. El 2026-10-20 el usuario confirmó registro, confirmación de correo, alias conservado al recargar y recuperación de contraseña con nuevo acceso y el mismo alias en la web pública; véase la guía de cuentas.

### Corrección de ilustraciones de McDonald’s

Se han recuperado 87 imágenes mediante un archivo histórico verificado, incluidas las doce cartas de 2011. Las copias locales en `public/assets/cards/supplements` permiten mostrarlas sin depender de la disponibilidad del proveedor. El idioma y la procedencia aparecen en la ficha. El índice de respaldo está en `src/catalog/artwork-supplements.json`; una importación del catálogo no lo reemplaza. Los casos sin fuente fiable siguen identificados como imagen no disponible. Véanse el apartado McDonald’s de [fuentes](public/_sources.md) y su registro por carta `public/assets/cards/supplements/_sources.json`.

### Validación de equipos

`validatePokemonTeam` recibe los identificadores de las cartas elegidas, un catálogo de confianza y el índice de especies. Exige seis Pokémon de especies distintas; rechaza cartas repetidas o desconocidas, cartas de apoyo y asociaciones de especie ambiguas o inexistentes. Devuelve el equipo en el orden elegido o errores estructurados con posiciones desde cero, sin equipos parciales ni cambios en los datos de entrada.

El validador comprueba la composición: todavía no comprueba propiedad de las cartas, estadísticas, movimientos ni apoyos, y no habilita combates. La propiedad deberá validarse con el inventario autorizado del jugador al incorporar cuentas y persistencia. Los datos externos deben validarse antes de llamar a esta función tipada.

### Constructor de equipo de prueba

En `/equipo` puedes buscar las 1.025 especies, filtrarlas por tipo de Pokémon, elegir ilustraciones, completar seis plazas, sustituir una variante en su misma plaza, quitar miembros y elegir quién va primero. Está disponible en ES/EN y se adapta a móvil y escritorio.

Se guarda un único borrador en `pokeprisma.team-draft.v1`, solo con identificadores de cartas y especies. Al recuperarlo se contrasta con el catálogo. Los errores de red conservan el borrador para reintentar; un borrador inválido requiere descartarlo explícitamente. Las pestañas escuchan cambios de almacenamiento y comparan la selección guardada antes de escribir. Si el almacenamiento está bloqueado o lleno, se permite editar en memoria con un aviso de que no se ha guardado. No es un inventario ni concede propiedad de cartas, no sincroniza entre dispositivos.

**Solo cartas jugables** limita el selector a especies e ilustraciones habilitadas en Práctica (actualmente 24 especies y 48 cartas). Funciona junto con la búsqueda y el tipo; se mantiene al entrar en las ilustraciones y volver. No modifica el borrador. Puedes desactivarlo para explorar todo el catálogo; vuelve a estar desactivado al recargar o salir de la ruta.

Cada variante habilitada muestra sus **datos de combate de Lumemon**: PS máximos, ataque, defensa, velocidad y tipos. Abre **Movimientos** para consultar nombres ES/EN, potencia adaptada, recarga y estados. Los valores impresos de las cartas siguen siendo del TCG; el daño final depende del rival y los efectos. Las variantes no habilitadas muestran un aviso, sin estadísticas de combate.

**Probar este equipo** lleva una copia de las seis cartas a la preparación de `/practica`, conservando IDs, ilustraciones y primer Pokémon. Solo se habilita con seis especies distintas y cartas incluidas en el conjunto jugable; los avisos indican las plazas incompatibles. Puedes elegir rival y apoyos antes de combatir. Los ajustes, el tutorial y la partida no escriben sobre el borrador. Si recargas la preparación importada, se recupera la copia enviada en esa entrada del historial, no los cambios posteriores de práctica; la partida en curso sigue sin guardarse.

Comprobaciones originales del constructor: [revisión del constructor](docs/revision-equipo.md).

### Primer cálculo de combate

`src/battle/type-chart.ts` calcula ventajas, resistencias e inmunidades de los 18 tipos de Pokémon, incluyendo dobles tipos. `src/battle/damage.ts` aplica las reglas `lumemon-damage-v1`: afinidad, quemadura, impulso y barrera, con un único redondeo exacto y vida mínima cero. `damage` devuelve la vida realmente perdida, limitada por la disponible; no el daño teórico de un golpe que exceda esa vida.

Estas dos funciones son puras y se reutilizan desde el motor de turnos descrito abajo. Por sí solas no aplican estados ni crean partidas. El llamador debe validar especie, movimiento y permiso para actuar. No emplean estadísticas del TCG ni consultan APIs en cada ataque. Las fuentes fijadas y sus hashes están en [fixtures de combate](src/battle/fixtures/README.md); el alcance está en el [plan del cálculo](docs/superpowers/plans/2026-10-13-lumemon-battle-damage.md).

### Motor local de turnos

Ya se pueden resolver partidas completas en código con dos equipos de seis miembros: movimientos, cambios, apoyos, cinco estados, recargas, sustituciones, victorias y empates. Se conserva la versión de estado y se registra el desempate de velocidad para reproducir resultados. Consulta la [API y sus límites](src/battle/README.md).

El motor tiene pruebas sintéticas y ahora también un adaptador con 48 cartas reales seleccionadas, descrito abajo. La selección privada en servidor, los 45 segundos, las cuentas y las recompensas corresponden a siguientes bloques.

### Cartas de combate habilitadas

Hay 48 cartas habilitadas de 24 especies (incluidos Chikorita, Cyndaquil, Totodile, Espeon, Umbreon y Scizor), con estadísticas propias según rareza/perfil y movimientos reales de PokéAPI adaptados a Lumemon. Las asignaciones están guardadas en una instantánea versionada, con nombres ES/EN, compatibilidad de una sola versión y hashes de fuentes. `createPlayableBattle` conecta seis IDs conocidos por equipo con el motor; rechaza otras cartas y especies repetidas.

Consulta [cartas, fuentes y límites](src/battle/data/README.md). `npm run battle:check` verifica la reproducción sin conexión; `npm run battle:generate` regenera explícitamente tras revisar cambios. Las 1.025 especies del catálogo no quedan automáticamente habilitadas. Estas cartas ya se pueden probar en `/practica`.

### Práctica local

En `/practica` empieza con seis cartas o personaliza especies, ilustraciones e inicial. Selecciona un movimiento o una reserva y confirma el turno. El bot elige antes de tu confirmación; el motor resuelve tipos, velocidad, estados, recargas y KO. Tras una baja elige un relevo; al terminar puedes jugar de nuevo. El registro explica cada turno. Al terminar la última animación aparece un resumen que compara los dos equipos: turnos resueltos, daño causado por ataques, daño recibido por estados, PS recuperados, apoyos usados y Pokémon debilitados. Usa los eventos reales de la partida; la revancha empieza con el registro vacío.

Puedes elegir hasta tres de cuatro apoyos verificados: Superpoción (recuperación del 30 % de PS máximos), Cura Total (limpieza), Defensor (barrera) y Doble Energía Incolora (impulso). Son adaptaciones de Lumemon y cada apoyo consume un turno y un uso por combate. Los rivales también usan apoyos con los mismos efectos y límites: Iniciación lleva Superpoción; Versátil añade Cura Total; Élite lleva Superpoción, Defensor y Doble Energía Incolora. Puedes consultar sus cartas antes del combate y ver cuáles ha gastado en la arena. El tutorial empieza sin apoyos en ambos equipos y la revancha restaura los usos de las cartas de esa partida.

Es una práctica sin reloj, cuenta ni recompensas. Al salir de la ruta o recargar se pierde la partida. Su selección no modifica el borrador guardado en `/equipo`; tampoco convierte las cartas en una colección propia. Los valores del combate son los de Lumemon, no los impresos del TCG. El balance más amplio sigue pendiente.

Desde el selector, **Aprender a combatir** abre una guía opcional en cinco pasos: tablero, Rayo con Pikachu, tipos y recarga, cambio a Jigglypuff y Canto para aplicar sueño. Usa el motor y el bot reales. Puedes omitirla entre secuencias o seguir el mismo combate al terminar; no guarda progreso ni sustituye tu selección de equipo. Disponible en español e inglés.
