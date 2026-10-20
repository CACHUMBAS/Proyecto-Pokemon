# Lumemon — contexto de continuidad

Actualizado: 2026-10-20 (colección implementada en rama; activación real pendiente). Es un resumen del estado del repositorio, no una autorización para desarrollar todas las fases. No contiene el historial completo del chat ni datos de otros proyectos.

## Bloque activo: colección y sobres — 2026-10-20

Rama `feat/online-collection-packs` desde `969d8b4`; implementación inicial `10f1f32`. Añade /coleccion y /sobres, tres iniciales de seis especies, inventario privado, sobre gratuito único, sobres pagados y fragmentación voluntaria. Usa las 48 variantes jugables actuales y el Supabase existente. PGlite 0.5.10, dependencia de desarrollo, fue autorizado por el usuario.

La base de datos decide identidad, saldo, azar y propiedad. Cuatro RPC, RLS, bloqueo de cartera y recibos por UUID evitan dobles concesiones/cobros; el cliente conserva el UUID ante incertidumbre y descarta respuestas de sesiones anteriores. Bienvenida de tres cartas; precio normal 100 monedas o 60 fragmentos. Monedas iniciales cero. No conectar victorias de práctica a premios: el cliente todavía controla esas partidas.

Estado externo: migración real, prueba de permisos y UI autenticada pendientes. El primer intento del usuario informó consulta vacía; se le indicó copiar el contenido completo del archivo. La rama pública sigue en `chore/vercel-lumemon`; no integrar ni cambiar Branch Tracking sin autorización. /equipo sigue siendo borrador local; las cartas poseídas todavía no limitan la práctica.

Evidencia local: 215 pruebas, lint y build/typecheck correctos. Revisión independiente sin hallazgos críticos/importantes; se corrigió coerción de tipos con tres regresiones. Navegador invitado ES/EN, 320/390/1440, rutas y teclado sin desbordamiento observado; menú móvil corregido. Advertencia de React Router HydrateFallback observada, sin error JavaScript. Falta comprobar pantallas autenticadas y Supabase real; PGlite no prueba concurrencia de conexiones independientes.

Instrucciones exactas y límites: [Colección online](COLECCION-ONLINE.md). Siguiente paso dentro de este bloque: completar SQL y prueba transaccional, probar inicial/bienvenida con el usuario y preparar integración pública revisable. Las recompensas de combate en servidor son otro bloque.

## Base que debe conservarse

- Repositorio: https://github.com/CACHUMBAS/Proyecto-Pokemon.git
- Carpeta usada en este ordenador: `C:\Users\ffran\OneDrive\Datos adjuntos\Desktop\PokePrisma`. En otro equipo, utiliza la raíz real del checkout.
- Cuentas entregadas en `a1c35e9` (`feat/online-accounts`); rama actual de publicación `chore/vercel-lumemon`, con configuración Vercel en `f5fe452`. Incluye Lumemon (`bc5be88`), el filtro de tipos de Antigravity (`3f78710`) y el constructor de equipos (`ac75b2f`).
- Cambio de nombre a Lumemon en `chore/rename-lumemon`, creada desde `3f78710`. Incluye el paquete de continuidad original de `9128d2f` (`docs/contexto-antigravity`). Un agente nuevo debe conservar el cambio de nombre y el filtro de tipos; no cambiar a `main` ni a ramas antiguas sin comprobar la ascendencia.
- Propuesta de reglas en `docs/reglas-combate-lumemon`, desde `bc5be88`; este bloque solo modifica documentación.
- Primer módulo de efectividad y daño en `feat/battle-damage`, desde `afc4b10`. Conserva la documentación de reglas y todas las entregas anteriores.
- Motor local de turnos en `feat/battle-turns`, desde `991b30c`; conserva todas las entregas anteriores.
- Datos iniciales de combate en `feat/battle-data`, desde `f32d9fd`: 12 especies y 24 cartas del catálogo conectadas al motor.
- Práctica local en `feat/practice-battle`, desde `b118a54`: ruta `/practica`, equipo inicial editable, bot y tablero ES/EN.
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

Proyecto personal con posible lanzamiento posterior, sin enunciado académico y sin presupuesto para servicios de pago. El 2026-10-19 el usuario fijó una entrega en dos días y eligió cuentas y progreso online. Priorizar colección, sobres y recompensas verificadas en servidor sobre PvP, más especies o campaña. El usuario quiere una web cuidada, funcional y profesional; prefiere ver el código en VS Code, cambios paso a paso y ramas por bloque. Le preocupa el consumo compartido de sus herramientas de IA: prioriza lecturas selectivas, entregas concretas y explicaciones concisas. No prometas porcentajes de ahorro ni equivalencias entre tokens y cuota.

El proyecto anterior de Procurador Tomás está fuera de alcance. No reutilices decisiones visuales, archivos, repositorio ni despliegue de esa web.

## Qué funciona hoy

| Área | Implementado | Límite actual |
| --- | --- | --- |
| Base visual | Portada `/`, muestras `/diseno`, rutas, ES/EN, tarjetas holográficas, teclado y movimiento reducido | Los anuncios de futuras funciones no significan que estén implementadas |
| Catálogo | `/catalogo`, filtros, búsqueda, paginación, fichas `/catalogo/:id`, variantes e idioma real de ilustraciones | Catálogo público, sin propiedad o inventario de usuario |
| Datos | Instantánea normalizada de PokéAPI y TCGdex, carga de fichas bajo demanda y caché | No se consultan las API para cada interacción ni se necesita reimportar para arrancar |
| Imágenes McDonald’s | 87 ilustraciones recuperadas localmente, incluidas las 12 de 2011; procedencia y hashes registrados | Algunas ediciones siguen sin imagen fiable; no inventar URLs o correspondencias |
| Composición | Validador de seis especies distintas; rechaza IDs desconocidos, duplicados, apoyos en plazas Pokémon y asociaciones ambiguas | No comprueba propiedad, estadísticas, movimientos ni aptitud real para combatir |
| Equipo de prueba | `/equipo`: elegir variantes, sustituir ilustración en la misma plaza, quitar, poner primero, filtrar especies por tipo de Pokémon (PokéAPI), mostrar solo cartas jugables, consultar sus estadísticas/movimientos de Lumemon y enviar seis cartas habilitadas a práctica; ES/EN y móvil | Borrador local sin cuenta ni propiedad; los apoyos se eligen en la práctica |
| Cálculo de combate | Tipos de datos mínimos, 18 tipos, dobles tipos e inmunidades, afinidad y modificadores de daño con aritmética exacta | Funciones puras sin conectar a la interfaz; no resuelven turnos, estados, duración de mejoras ni propiedad |
| Turnos locales | Creación de estado, acciones validadas, prioridad, velocidad/desempate, cinco estados, cuatro apoyos, recargas, KO, sustituciones y final | Núcleo puro conectado a la práctica con 48 cartas verificadas; sin reloj o servicio de elecciones privadas |
| Cartas habilitadas para el motor | 48 cartas de 24 especies; perfiles propios persistidos, rarezas explícitas, nombres ES/EN y movimientos con compatibilidad USUM verificada; adaptador por IDs | Disponible en la práctica local junto a cuatro apoyos mapeados; sin propiedad; las demás cartas del catálogo todavía no son jugables |
| Práctica local | `/practica`: selección de seis, variantes, hasta tres apoyos opcionales, kits de apoyo visibles del rival, tablero, bot, estados, recargas, cambios, KO, registro, resultado, resumen comparativo final y revancha; ES/EN y móvil | Sin reloj, cuenta, recompensas ni guardado de partida; recibe una copia opcional de `/equipo` sin modificar el borrador |
| Tutorial guiado | Entrada opcional en `/practica`, equipo preparado, cinco pasos, Rayo, tipos/recarga, cambio a Jigglypuff, sueño y continuación libre; ES/EN | Sin guardar progreso; conserva la selección normal y permite omitir la guía entre secuencias |
| Cuenta online | /cuenta: registro, acceso, salida, recuperación y alias privado con Supabase; ES/EN | Registro, confirmación, alias y recuperación comprobados por el usuario en producción; SMTP para destinatarios externos pendiente; todavía no guarda inventario, equipo ni recompensas |
| Colección y sobres | /coleccion y /sobres: inicial único, bienvenida, inventario, probabilidades, historial y fragmentación; economía transaccional en SQL | Implementado en rama; activación y UI autenticada pendientes; sin recompensas de combate |
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

## Práctica contra la máquina — 13 de octubre

El usuario autorizó el siguiente bloque con «Continua». `/practica` carga de forma diferida el motor y las 24 cartas. Ofrece seis iniciales listos para jugar, selector de 12 especies/dos variantes, estadísticas propias, cambio de inicial, tablero, reservas, movimientos, recargas, estados, vida, registro y revancha. Reutiliza PokemonCard y el mapeo de procedencia/idioma; los 24 registros de arte son copias exactas del catálogo verificadas por prueba.

`src/battle/practice.ts` mantiene la sesión en memoria. El bot básico puntúa movimientos legales con el propio motor (daño real o 45 puntos por estado aplicado); no cambia voluntariamente, no recibe la elección pendiente del jugador y deja su acción fijada al abrir el turno. No se afirma que sea una IA avanzada ni equilibrio probado. Las sustituciones solo del bot son automáticas; si cae el jugador, espera su reserva. Los comandos incluyen ID de partida y versión para ignorar dobles clics y acciones antiguas. El bit de desempate se obtiene fuera del reducer.

La práctica no usa el borrador de /equipo, cuentas, cartas poseídas, apoyos, tiempo de 45 segundos ni premios. Recargar o salir de la ruta descarta la partida; volver al selector pide confirmación dentro de la pantalla. En esta entrega había instrucciones desplegables; el tutorial guiado se añadió el 15 de octubre (ver abajo).

Verificación: ocho pruebas nuevas fallaron primero con stubs y pasaron después; 110 pruebas totales, lint, build/typecheck y battle:check correctos. Navegador real: ES/EN, 320/390/768/1440 sin desbordamiento observado; cambiar variante/estadísticas, seis plazas, bloqueo de inicio incompleto, promoción, acción con teclado, recarga, sueño/recuperación, parálisis, empate de velocidad, cambio, KO/sustitución, partida completa hasta derrota, revancha limpia, cancelar/salir y recargar. El borrador existente de /equipo siguió accesible. Imágenes iniciales y variantes activas cargaron; no se simuló caída de red ni se verificó manualmente cada una de las 24 imágenes. Revisión final independiente completada sin hallazgos: 8/8 pruebas de práctica correctas y revisión estática de sesión, UI, ES/EN, arte y accesibilidad; el revisor no repitió el navegador compartido.

Se corrigió una expectativa de prueba: la versión inicial del motor ya era 1, no 0; el contrato de producción se conserva. No se añadieron dependencias. [Plan](superpowers/plans/2026-10-13-lumemon-practice.md).


## Audio y animaciones de práctica — 13 de octubre

El usuario pidió música Pokémon conocida, como la empleada en packs de Cobblemon, gritos y animaciones. Rama `feat/battle-audio-motion`, desde `e0570ef`. En `/practica` hay cuatro temas de combate seleccionables (HGSS, DPP, BW, ORAS) reproducidos desde Pokémon Showdown; requieren conexión y su disponibilidad depende del proveedor. Los 12 gritos del conjunto jugable son copias de PokéAPI/cries fijadas a revisión, con hashes y procedencia en `public/assets/audio/cries/_sources.json`. Pikachu llega como MPEG bajo extensión .ogg en origen: conserva bytes/hash, servido correctamente como .mp3. Los otros once son OGG. Los impactos y señales breves se sintetizan; no se presentan como efectos oficiales.

Audio apagado al entrar, activación voluntaria, silencio, volúmenes independientes y prueba del grito. Tema/volúmenes se validan y guardan en `lumemon.audio.v1`; esa clave no sustituye las anteriores. Pausa en pestaña oculta, música detenida al finalizar, reanudada en revancha y limpieza al salir. Fallos de reproducción muestran aviso sin bloquear el motor.

`src/battle/playback.ts` proyecta eventos en snapshots visuales sin alimentar estados intermedios al motor. Ordena movimiento, daño real, estados, KO y sustitución automática; no dibuja impacto para daño cero ni movimiento bloqueado. Acciones bloqueadas durante la secuencia, salto asociado a partida/versión/cursor y cancelación de timers antiguos. Hay efectos CSS por tipo, opción para desactivar movimiento y respeto al movimiento reducido del dispositivo. Sin movimiento, la secuencia conserva su duración, mensajes y audio; el botón Saltar sí cancela la secuencia y sus sonidos. Los gritos continúan completos al avanzar de frame; otro grito, salto, silencio, ocultación o salida los cancela.

Verificación: 11 casos de lógica se observaron fallar antes de implementar; 13 pruebas nuevas en total. 123 pruebas, lint, typecheck/build y battle:check correctos. Navegador: cuatro temas cargados y reproducción observada de HGSS/DPP/BW/ORAS, volumen cero, gritos MP3 de Pikachu y OGG de Bulbasaur, entrada/sustitución, mute, preferencias al volver sin autoplay, secuencia con HP previo al golpe, salto, KO/cambio del bot, partida hasta derrota, parada final, revancha y salida. ES/EN y 390/1440 sin desbordamiento observado; capturas de ambos tamaños revisadas. La pausa por visibilidad y errores de autoplay se verifican con adaptadores en pruebas; no se simuló la preferencia de movimiento reducido del sistema ni una caída real del proveedor. No se afirma una escucha humana de la mezcla. Revisión independiente de e0570ef..9bb4478: dos hallazgos P2, corregidos en un pase. Prueba de regresión RED→GREEN para conservar gritos entre cues; regresión de navegador RED→GREEN para sustitución sin movimiento pero con sonido. Vulpix completa 1,255439 s tras avanzar los frames, sin nodos de animación; Saltar cancela el grito. Suite final 123/123 y lint/build correctos. Sin hallazgos menores pendientes.

Reglas, conjunto de cartas, guardado de equipo y alcance local permanecen como antes. No hay dependencias nuevas, cuentas, premios, publicación ni derechos comerciales inferidos. [Plan](superpowers/plans/2026-10-13-lumemon-battle-audio-motion.md); [fuentes](../public/_sources.md).

## Tutorial guiado opcional — 15 de octubre

El usuario pidió continuar. Rama `feat/guided-battle-tutorial` desde `78c01c5`. En el selector de `/practica`, **Aprender a combatir** funciona incluso con una selección incompleta y prepara seis cartas con Pikachu inicial. No modifica la selección normal ni el borrador de `/equipo`.

La guía recorre tablero, Rayo, efectividad/recarga, cambio a Jigglypuff y Canto. `src/battle/tutorial.ts` limita acciones y avanza a partir de eventos reales; el motor, los datos y la decisión previa del bot se conservan. Los pasos de lectura no consumen turno. Los comandos de guía comprueban partida, versión y paso esperado; la presentación bloquea comandos durante la secuencia. Al terminar la guía se continúa la misma partida; no anuncia victoria, concede premios ni guarda progreso. Puede omitirse entre secuencias.

Verificación: seis casos nuevos, con fallo previo y corrección; 129 pruebas, lint, build/typecheck y battle:check correctos. Navegador: recorrido completo, Rayo y recarga, cambio, sueño, salto de secuencia, continuidad libre y bloqueo real del rival dormido; guía omitida al inicio, selección incompleta preservada al salir y partida normal posterior sin restricciones. Teclado e interfaz ES/EN comprobados; capturas revisadas en 390/1440 px sin desbordamiento observado. En móvil de 390 px se reprodujo y corrigió un foco fuera de pantalla al elegir reserva: ahora el botón Confirmar queda centrado. La revisión independiente de lógica/UI encontró un P2: la revancha fallaba al conservar una selección incompleta. Reproducido en navegador tras una derrota real, corregido usando los IDs de la partida terminada y repetido hasta revancha correcta, con selección de cinco cartas intacta en el menú. Sin otros hallazgos; el revisor no repitió navegador ni revisó documentación en edición. No se amplió esta comprobación a lector de pantalla u otros navegadores. No se añadió persistencia ni se cambiaron las fuentes de audio.

## Ampliación del conjunto — 15 de octubre

Rama `feat/expanded-battle-roster` desde `b115ca0`. Añade Venusaur, Charizard, Blastoise, Gengar, Snorlax y Dragonite con dos ilustraciones reales del catálogo por especie: 18 especies y 36 cartas jugables. Los contadores de práctica se calculan del conjunto cargado. Las estadísticas de las variantes usan la fórmula y clasificación de rareza existentes; las 24 cartas y 12 especies anteriores resultaron idénticas al comparar los datos completos antes/después.

Se reutilizaron los 13 CSV completos de la caché local tras comprobar cada SHA-256 contra el manifiesto fijado. Los subconjuntos y su manifiesto se ampliaron con las filas originales; no se reimportó el catálogo. Nuevo snapshot `lumemon-roster-65c806dfd1ce7612`; versión USUM18 y motor sin cambios. El arte de práctica es copia exacta de los registros seleccionados. Se añadieron seis gritos OGG de la misma revisión de PokéAPI/cries, con bytes/hashes/fuentes registrados. No se añadieron dependencias.

Verificación automatizada: tres casos fallaron primero por la ausencia de la ampliación; después, 131 pruebas correctas, lint, build/typecheck y battle:check. Las dos combinaciones de variantes nuevas completan combates deterministas con el motor; el tutorial mantiene sus seis pruebas. No se afirma equilibrio competitivo ni habilitación de todas las cartas del catálogo. No hay evolución durante el combate: son especies seleccionables directamente.

Navegador: doce ilustraciones nuevas cargadas (clásicas EN y alternativas ES), selección de las seis especies y cambio de variantes sin perder plazas; interfaz ES/EN, Ataque Ala de Charizard, Ciclón de Dragonite, recarga, daño, KO y sustitución obligatoria por Blastoise. Capturas de 390/1440 revisadas sin desbordamiento observado. Gritos de Charizard y Dragonite decodificados y reproducción observada en el elemento de audio; los seis nuevos tienen formato, bytes y hash verificados. No se afirma escucha humana ni prueba visual de todos los movimientos. Sin errores de consola observados; audio silenciado y pestaña de prueba cerrada al terminar. Revisión independiente sin hallazgos funcionales: corroboró compatibilidad anterior, 503 filas originales de los 13 CSV, 36 artes y 18 gritos. Único detalle P3 corregido: el mapa de código aún decía 24 cartas. La revisión no repitió el navegador ni evaluó equilibrio competitivo.

## Rivales de práctica — 2026-10-15

Selector ES/EN de tres rivales en /practica: Iniciación (seis comunes, abre Eevee), Versátil (el equipo anterior: cinco comunes y Lapras poco común, abre Abra) y Élite (tres ilustraciones especiales raras y tres raras, abre Charizard). La vista previa muestra los seis, orden, tipos, rarezas e IDs de variantes. Niveles orientativos por composición y rareza: misma lógica del bot, estadísticas originales del conjunto, sin multiplicadores ocultos. No se ha medido equilibrio competitivo ni se garantiza que cada enfrentamiento siga ese orden de dificultad.

La sesión guarda opponentId y lo conserva al resolver turnos/sustituciones. La revancha usa el rival y el equipo de esa partida, con estado nuevo. El tutorial fuerza Versátil y su equipo fijo, incluso con selección incompleta; al volver a la preparación se conservan el rival y equipo elegidos antes del tutorial. Sin persistencia nueva, cuenta o recompensas. El conjunto sigue en 18 especies/36 cartas.

Verificación: 134 pruebas correctas, lint y build con typecheck. Las pruebas nuevas cubren equipos válidos, presupuestos crecientes sin alterar estadísticas, IDs desconocidos, copias independientes, partidas completas, sustituciones, revancha y aislamiento del tutorial. Navegador: selección por flechas con foco visible; Élite real, derrota tras 20 turnos pasivos y revancha en turno 1 con el mismo rival; tutorial fijo al seleccionar Élite con cinco cartas; vuelta conserva esa selección incompleta. Capturas de escritorio 1440 y móvil 390 sin desbordamiento observado, textos ES/EN; Iniciación abre con Eevee en la interfaz móvil EN. Sin errores de consola observados; idioma ES y animaciones restaurados, audio silenciado, tamaño restaurado y pestaña temporal cerrada. Revisión independiente sin hallazgos: confirmó las tres pruebas nuevas, traducciones, política común y sustitución automática del rival en los tres equipos. No repitió el navegador (comprobado por el ejecutor) ni evaluó equilibrio competitivo (fuera de este bloque, dificultad expresamente orientativa). No se han instalado dependencias ni publicado la web.

## Estrategia de Élite — 2026-10-18

Nueva política en src/battle/bot.ts: Élite puede cambiar voluntariamente cuando su activo arriesga al menos la mitad de sus PS actuales o su mejor acción disponible no causa daño ni aplica estado. Evalúa los movimientos disponibles del jugador y pasar con el motor real, ambos desempates y daño residual. Rechaza reservas que caigan en cualquiera de esos escenarios; exige reducir el riesgo al menos 25 puntos porcentuales, o entrar con menos del 50% de riesgo si la acción actual no aporta nada. Compara posible respuesta del siguiente turno y riesgo de entrada. Entre entradas del bot (voluntarias o forzadas) deja dos turnos sin retirada voluntaria; en turno 60 actúa. No abandona un KO seguro de su acción prevista.

Es una heurística limitada: la respuesta futura se estima con el jugador pasivo, no explora sus cambios/apoyos ni garantiza la mejor jugada o mayor tasa de victorias. Su decisión sigue guardada antes de elegir la del jugador. El motor y las estadísticas no cambian. Iniciación y Versátil mantienen la política original; el tutorial fuerza Versátil incluso después de omitir/terminar la guía y en su revancha. Las sustituciones obligatorias mantienen el primer reserva vivo. Historial de entradas solo en la sesión, sin almacenamiento nuevo.

Verificación automatizada: cuatro casos fallaron por la ausencia de cambios tácticos antes de implementarlos; ocho pruebas nuevas, 142 correctas en total, lint y build/typecheck correctos. Incluye peligro eléctrico, inmunidad, recarga, reservas condenadas/dormidas, KO seguro, margen entre cambios, entrada por eventos antes del daño, decisión preconfirmada aunque el jugador pase/ataque/cambie, tutorial y partidas reproducibles hasta resultado con revancha. Se corrigió findLast para respetar la biblioteca TypeScript existente sin cambiar la configuración. Navegador: Pikachu frente a Élite, retirada voluntaria Charizard→Snorlax antes de Rayo, PS iniciales antes del golpe y 78 PS de daño después; Charizard conserva sus PS. En turno 2 Snorlax usa Terremoto y el registro refleja correctamente ambas acciones. Textos ES/EN, selector y tablero a 1440/390 px sin desbordamiento observado; capturas revisadas. Tutorial iniciado con Élite seleccionado entra con Versátil/Abra como antes. Sin errores de consola observados; idioma ES, audio desactivado, tamaño restaurado y pestaña temporal cerrada. Las partidas completas, revancha y todos los pasos del tutorial se verificaron en pruebas automáticas, no se repitieron completos en navegador en este bloque. No se ha evaluado equilibrio competitivo ni escucha de audio. Revisión independiente sin hallazgos: corroboró la política anterior, decisión previa al input, historial de entradas forzadas, margen de retirada, tutorial/revancha y las ocho pruebas nuevas. No repitió la suite general ni el navegador, cubiertos por el ejecutor. Optimalidad, equilibrio, respuestas a cambios/apoyos y búsqueda profunda siguen fuera del alcance, expresamente documentados.

## Cartas de apoyo en práctica — 2026-10-18

Bloque autorizado al continuar. Rama `feat/practice-support-cards` desde `d4732d4`. Selección opcional de cero a tres apoyos entre cuatro IDs del catálogo fijado: base1-90 Superpoción→heal, base1-82 Cura Total→cleanse, base1-80 Defensor→barrier y base1-96 Doble Energía Incolora→boost. Mapeo explícito y versionado; no se infieren efectos a partir de categoría, nombre o texto TCG. El arte es una copia exacta de los cuatro registros de support.json, mantiene idioma EN y enlaces TCGdex; etiquetas de la interfaz ES/EN.

Se reutilizan los cuatro efectos del motor sin cambiar sus cifras: curar el 30 % del máximo, eliminar estado, reducir daño de ataques al 70 % durante t/t+1, y potenciar dos ataques de daño ×1,5 como máximo hasta cierre de t+2. Cada carta ocupa toda la acción y tiene un uso por partida; usos inválidos no la gastan. El panel explica disponibilidad, consumo y motivos de bloqueo; el activo muestra cargas/turno de fin. La proyección de eventos actualiza curación, uso, mejoras, cargas, expiración, cambio y KO. No modifica el estado del motor ni añade sonidos.

Apoyos solo para el jugador en esta práctica. Los rivales conservan sus políticas y no equipan apoyos; Élite sigue sin explorar apoyos pendientes del jugador. Tutorial sin apoyos, incluso tras omitirlo; la selección libre se conserva al volver. Revancha con el equipo, rival y apoyos de la partida terminada, usos restaurados. No se guardan apoyos ni partidas, no se toca /equipo, propiedad o economía. Con apoyos el adaptador añade :lumemon-supports-v1 a dataVersion; sin apoyos conserva la versión anterior.

Verificación: cinco casos de integración fallaron antes de conectar las cartas; 151 pruebas correctas, lint y compilación/typecheck correctos; nueve pruebas nuevas cubren límites/IDs, rechazo atómico, cura bajo sueño, consumo de turno y comando repetido, tutorial/revancha, arte exacto, disponibilidad conforme al motor, proyección de cargas/expiración/cambio/KO y partidas completas contra Versátil y Élite. Navegador: límite de tres, cuatro ilustraciones cargadas, Defensor antes del golpe, Superpoción recupera 67 PS, barrera expira en turno 2, energía aplicada a Jigglypuff y ataque potenciado con una carga restante. Abra recibió parálisis por Onda Trueno; Cura Total se habilitó, eliminó el estado y quedó gastada. Tutorial con Pikachu/Versátil sin apoyos y selección libre conservada. ES/EN, teclado, selector/tablero en 1440/390 px sin desbordamiento observado; capturas revisadas. Audio permaneció apagado. No se comprobó lector de pantalla ni todos los navegadores; las partidas completas/revancha se comprobaron automáticamente, no se repitieron completas en la web. Revisión independiente sin hallazgos funcionales; no repitió navegador, suite general ni documentación. No se afirma equilibrio competitivo.

## Apoyos del rival — 2026-10-18

Bloque autorizado al continuar. Rama `feat/opponent-support-strategy` desde `26b8bfa`. Iniciación equipa Superpoción (base1-90); Versátil añade Cura Total (base1-82); Élite lleva Superpoción, Defensor (base1-80) y Doble Energía Incolora (base1-96). Reutiliza el mapeo y reglas existentes, sin alterar estadísticas ni efectos. El selector y el tablero muestran el kit público y sus usos gastados; nunca muestran la acción pendiente. El consumo se presenta cuando llega su evento en la animación.

La política conserva retiradas tácticas y KO seguros de la acción prevista. Valora curación → limpieza → barrera → impulso. Simula todos los movimientos disponibles del jugador y pasar, con ambos desempates y daño residual; rechaza un apoyo si el activo cae en cualquiera de esos escenarios. Cura con PS al 50 % o menos solo si mejora la vida mínima resultante; limpia un estado válido si sobrevive; usa barrera con riesgo de al menos 25 % de los PS actuales y mejora de al menos 10 % de los máximos. Impulso exige al menos 25 % de PS máximos tras el peor golpe, no estar dormido/congelado, turno como máximo 58 y un ataque siguiente que cause daño en una simulación con jugador pasivo. No usa apoyos en turno 60. No explora cambios/apoyos futuros del jugador ni garantiza optimalidad o equilibrio. La acción sigue fijada antes de recibir la elección del jugador.

El tutorial fuerza ambos kits vacíos incluso al omitir/terminar la guía. La revancha reconstruye los apoyos reales de ambos lados, incluidos los vacíos del tutorial, y restaura sus usos. Sin persistencia, propiedad, premios, dependencias o servicios nuevos. Las secciones anteriores son evidencia histórica de sus respectivas entregas.

Verificación: cuatro de los cinco primeros casos fallaron antes de implementar la política; siete pruebas nuevas y 158 pruebas totales correctas, lint y build/typecheck correctos. Cubren kits, estados, umbrales, usos ilegales/gastados, supervivencia, KO seguro previsto, retirada de Élite, límite de turnos, decisión previa al input, proyección de eventos, entradas congeladas, partidas completas de los tres rivales y revancha. Navegador real: Versátil usa Cura Total para despertar a Abra y Superpoción para recuperar 61 PS; ambas consumen su acción, aparecen en el registro y se marcan gastadas. Kits 1/2/3 visibles, tutorial sin apoyos tras omitir la guía, selección Élite conservada al volver. Escritorio 1440 y móvil 390, ES/EN, sin desbordamiento observado; capturas inspeccionadas, sin errores de consola observados. Idioma ES y tamaño restaurados; audio apagado; pestaña temporal cerrada. Las partidas completas y revancha se probaron automáticamente; no se repitieron completas en navegador ni se ejecutaron visualmente los apoyos de Élite. Revisión independiente sin hallazgos funcionales, con las siete pruebas dirigidas correctas; no repitió suite general ni navegador. No se afirma equilibrio competitivo ni se despliega la web.

## Resumen final de combate — 2026-10-18

Bloque autorizado con «continua». Rama `feat/battle-summary` desde `61ff21a`. Añade un panel comparativo de ambos equipos al terminar la última animación: turnos resueltos, PS causados por ataques, daño recibido por veneno/quemadura, PS recuperados, apoyos utilizados y Pokémon debilitados del equipo de cada columna. Traducciones ES/EN, tabla semántica y diseño móvil/escritorio.

`summarizeBattle` lee únicamente el historial completo de eventos de la sesión terminada. No calcula daño teórico ni suma pérdidas y curación a partir de la vida final: conserva las cantidades efectivas del motor. Los eventos de daño señalan al receptor; solo el daño por ataque se atribuye al lado contrario. Los eventos order marcan los turnos resueltos; las sustituciones no cuentan como turnos nuevos. Devuelve objetos independientes y no modifica la sesión. La integración exige partida terminada y playback finalizado, de modo que no revela estadísticas del último turno mientras se anima. La revancha limpia el historial como antes. No cambia reglas, cuentas, economía, almacenamiento ni dependencias.

Verificación: cuatro pruebas fallaron ante la lógica ausente; cinco pruebas nuevas, 163 correctas en total, lint y build/typecheck correctos. Casos de atribución, inmunidad/acciones bloqueadas, sustituciones, entradas congeladas, independencia de salidas, daño/curación limitados a PS reales, empate pasivo de 60 turnos, partidas completas de los tres rivales con conservación de PS y revancha limpia. Se corrigió el valor esperado de un fixture tras contrastarlo con los porcentajes existentes (veneno 8 %, quemadura 5 %); no se alteraron las reglas. Navegador: derrota contra Élite en 18 turnos, 14 PS de daño causado por el jugador, 1.500 por el rival, 64 PS recuperados, un apoyo usado por cada lado y seis bajas del jugador; totales concordantes con la partida. Resumen ausente durante la animación final, visible después; revancha en turno 1 sin resumen anterior y registro vacío. Capturas inspeccionadas a 1440/390/320 px, ES/EN sin desbordamiento observado. Sin errores de consola observados; audio permaneció apagado, idioma ES y viewport restaurados, pestaña temporal cerrada. Victoria/empate y daño por estados se comprobaron en pruebas automáticas, no mediante partidas adicionales en el navegador; no se probó lector de pantalla. Revisión independiente sin hallazgos concretos, cinco pruebas dirigidas correctas; no repitió suite general, build ni navegador. No se ha desplegado.

## De Mi equipo a la práctica — 2026-10-19

Bloque autorizado tras explicar el siguiente paso y recibir «sigue». Rama `feat/team-to-practice` desde `bd4392d`. Añade «Probar este equipo» después de las seis plazas de /equipo. Comprueba que son seis cartas habilitadas de especies distintas; el botón queda deshabilitado con avisos de tamaño, posición e ID incompatibles. No cambia ilustraciones ni completa huecos automáticamente. Envía los IDs exactos, en el mismo orden, y permite elegir rival/apoyos antes de iniciar.

Estado de navegación versionado: kind lumemon-practice-team, version 1 y cardIds. La práctica vuelve a validar el dato desconocido y toma una copia al entrar en la ruta. Sin estado mantiene DEFAULT_PLAYER; con datos inválidos muestra aviso y un equipo vacío. El historial de esa entrada conserva la copia enviada, no cambios posteriores; recargar la preparación la revalida y restaura. No lee ni escribe el borrador desde práctica, ni sincroniza futuras ediciones en otras pestañas. La selección de variantes, apoyos, tutorial y combate siguen en memoria y no alteran el equipo guardado. No se cambia ninguna clave, contrato de composición, estadística, dependencia o servicio.

Verificación: cinco pruebas nuevas fallaron primero; 168 pruebas totales correctas, lint y build/typecheck correctos. Cubren IDs/orden/inicial, variantes de la misma especie, apoyos/IDs no habilitados, formato, longitud, listas dispersas, versión de transferencia, copias independientes, restauración del borrador y aislamiento al jugar, editar y abrir el tutorial. Navegador real en localhost:5174, origen separado del habitual 127.0.0.1:5174: equipo vacío bloqueado, carta 2021swsh-1 señalada tanto con equipo parcial como completo, corrección a base1-44, seis cartas transferidas con Pikachu sv03.5-173 primero, recarga de preparación conserva esa variante, enlace a apoyos conserva selección, cambio temporal a base1-58 y un turno real, tutorial omitido y vuelta al equipo guardado con sv03.5-173 intacta incluso al recargar. Entrada directa a práctica mantiene el equipo inicial por defecto. Botón activado con Enter; avisos y copia revisados en ES/EN a 1440/390 px sin desbordamiento observado; capturas inspeccionadas. Sin errores de consola observados; equipo creado solo para prueba retirado por interfaz, idioma ES, viewport restaurado y pestaña temporal cerrada. El origen habitual del usuario no se modificó. No se repitió una partida completa/revancha en navegador ni fallos de almacenamiento/red, cubiertos por pruebas existentes; el payload de navegación inválido se comprobó automáticamente. Revisión independiente sin hallazgos accionables y cinco pruebas dirigidas correctas; no repitió navegador, suite general, lint o build. No se ha desplegado.

## Filtro de cartas jugables — 2026-10-19

Continuación autorizada con «continua». Rama `feat/playable-team-filter` desde `bc2ccf5`. /equipo ofrece «Solo cartas jugables», desactivado por defecto y compartido al pasar de especies a ilustraciones y volver. Limita las especies al conjunto de combate y las variantes a IDs exactos con asociación válida; actualmente 18 especies y 36 cartas. Conserva búsqueda, tipo, orden, idioma real y cartas guardadas. Los filtros se combinan antes de paginar y al cambiarlos se vuelve a la primera página. Si no hay coincidencias, explica cómo ampliar la búsqueda. El filtro es temporal y no introduce claves ni escrituras al borrador.

Verificación: tres pruebas nuevas fallaron antes de implementar el filtro; 171 pruebas totales correctas, lint y build con typecheck correctos. Se verifica el catálogo real contra todo el roster, variantes de la misma especie no habilitadas, asociaciones inválidas, búsqueda por nombre/número/expansión/rareza y paginación. En navegador: ES/EN, teclado, 320/390/1440 px sin desbordamiento, dos páginas de especies, vuelta entre vistas, reinicio de paginación, especie sin variantes jugables, conservación de una carta no habilitada al filtrar y sustitución por una habilitada conservada al recargar. Pruebas en localhost con borrador temporal retirado al acabar, sin tocar el borrador de 127.0.0.1. Sin errores de consola. Revisión independiente de código sin hallazgos accionables. No amplía el roster ni crea colección, cuentas o recompensas.

## Detalles de combate en el selector — 2026-10-19

El usuario autorizó el siguiente bloque con «siguente». Rama `feat/team-battle-details` desde `4598d82`. Cada variante habilitada del selector de /equipo muestra los PS máximos, ataque, defensa, velocidad y tipos exactos del motor. Un desplegable nativo «Movimientos» muestra nombres ES/EN, potencia adaptada para ataques, estado para movimientos sin daño, recarga y explicación del estado. Los valores se identifican como propios de Lumemon y se distingue potencia de daño final. Las cartas no habilitadas muestran un aviso sin cifras de combate; no cambia el roster ni el equilibrio.

`getTeamBattleDetails` reutiliza con el filtro la validación por ID y asociación de especie, y entrega copias sin referencias mutables al roster. Los nombres proceden de la especie verificada; las reglas del movimiento proceden del perfil que usa el motor, no de sus datos fuente ni del texto TCG. La selección, borrador, transferencia y práctica no se modifican.

Verificación: tres pruebas nuevas RED → GREEN; 174 pruebas totales, lint, typecheck y build correctos. Se contrastan las 36 cartas con sus perfiles, ambas variantes de Bulbasaur con valores distintos, potencia adaptada 40 de Látigo Cepa, traducciones y movimientos de estado, rechazos por ID/asociación y copias independientes. Navegador: ES/EN, desplegables con Espacio/Intro, estadísticas y movimientos, carta no habilitada sin cifras, filtrado y selección de una variante; 320/390/1100/1440 px sin desbordamiento observado. La carta temporal se retiró en localhost; el borrador de 127.0.0.1 se conserva. Sin errores de consola. Revisión independiente de código sin hallazgos accionables. Sin instalaciones ni despliegue.

## Johto jugable — 2026-10-19

Continuación autorizada con «sigue». Rama `feat/johto-playable-roster` desde `346c8bf`. Añade Chikorita, Cyndaquil, Totodile, Espeon, Umbreon y Scizor, cada uno con dos IDs concretos del catálogo: 24 especies y 48 cartas en total. Los nuevos IDs, movimientos y límites están en `src/battle/data/README.md`. Se conservan exactamente las 18 especies y 36 cartas anteriores; las raras usan mayor presupuesto mediante la fórmula ya existente. No se cambia la versión de reglas ni se afirma equilibrio competitivo.

Snapshot `lumemon-roster-6eadbb59b4547ed1`, mismas fuentes fijadas y compatibilidad USUM18. Se verificaron los 13 CSV completos de la caché y se ampliaron sus subconjuntos preservando todas las filas anteriores. Los doce artes coinciden con el catálogo; las tres variantes Pocket solo tienen EN, sin inventar traducciones de imágenes. Se verificaron 21 URLs de imágenes con HTTP 200/image-webp. Se incorporaron seis gritos OGG desde la revisión de PokéAPI/cries ya usada, con longitud y hash documentados. Sin dependencias nuevas.

Movimientos propios de Lumemon, sin trasladar efectos del texto TCG: Tóxico usa el veneno fijo existente; Rayo Solar no carga antes; Corte Furia no acumula potencia; Puño Bala no tiene prioridad; Confusión no aplica confusión. Umbreon y Scizor reutilizan las inmunidades existentes. El tutorial, equipos iniciales, tres rivales, apoyos y política del bot no cambian.

Verificación: tres casos nuevos fallaron por la falta de datos antes de ampliar; después, 178 pruebas correctas, battle:check, lint y build/typecheck. Cuatro pruebas nuevas cubren los IDs exactos, presupuesto por rareza, compatibilidad anterior por hash, inmunidad psíquica de Umbreon, inmunidad a veneno de Scizor y combates completos reproducibles de ambas variantes contra los tres rivales. Revisión independiente sin hallazgos: 13 fuentes completas verificadas, 637 filas reducidas auténticas incluidas las 503 anteriores, 48 registros de arte iguales al catálogo y seis gritos con bytes/hash/formato coherentes.

Navegador en localhost:5174, separado del origen habitual 127.0.0.1: filtro con 24 especies, ambas ilustraciones de cada especie nueva, equipo de seis transferido a práctica, cambio de las seis variantes a raras manteniendo plazas y un turno real de Chikorita con Rayo Solar (daño y recarga). Se comprobó la reproducción del grito 152.ogg en el elemento de audio; no se afirma escucha humana. Interfaz ES/EN, detalle de movimientos de Espeon y capturas en 390/1440 px, sin desbordamiento observado. Al volver, el borrador conservaba las variantes originales; se retiró solo ese equipo temporal, se dejó ES, audio silenciado, tamaño restaurado y pestaña cerrada. Sin errores de consola; se observó un aviso de React Router sobre HydrateFallback durante la carga inicial. No se repitieron todas las partidas en navegador ni se probaron todos los movimientos visualmente. Sin despliegue.

## Pendiente: no anunciar como disponible

Ampliar estadísticas/movimientos a más cartas, ampliar el mapeo de apoyos, estrategia avanzada más allá de las heurísticas actuales, campaña, inventario, sobres, monedas, fragmentos, recompensas, salas y reconexión. La cuenta y la publicación en Vercel ya están disponibles; falta configurar SMTP y comprobar registros con correos externos al equipo.

React/Vite/TypeScript ya están elegidos. Supabase Auth/Postgres están configurados para cuentas y perfiles, y Vercel publica la web con integración GitHub. Realtime, inventario y economía siguen pendientes. No crear recursos, sustituir tecnología ni instalar SDKs por leer esta propuesta. Para el motor, se prevé TypeScript separado de React, reglas versionadas y azar inyectado/reproducible. Las futuras monedas, aperturas, recompensas y propiedad deben validarse en servidor; nunca confiar en `localStorage` para ellas.

Siguiente candidato actualizado para la entrega de dos días: colección online, sobres y recompensas validados en servidor. El rival temático de Johto queda pospuesto junto a nuevas especies y PvP. Requiere una nueva tarea; no iniciar otro bloque por leer este contexto. La cuenta y el alias ya funcionan; el progreso del juego online sigue pendiente.

## Mapa de código y comandos

| Ruta | Responsabilidad |
| --- | --- |
| `src/app/router.tsx` | Rutas; catálogo y equipo se cargan de forma diferida |
| `src/components` | Tarjetas, botones, idioma, layout; reutilizar |
| `src/features/catalog` | Pantallas, conversión de cartas a vista, orden de variantes |
| `src/features/practice`, `src/battle/practice.ts`, `src/battle/opponents.ts`, `src/battle/bot.ts` | Selector de equipo/rival y política táctica de Élite, tablero, registro y sesión local contra el bot; arte copiado del catálogo |
| `src/features/team` | Constructor, selector y hook de borrador |
| `src/catalog` | Tipos, normalización, repositorio, cliente, fuentes suplementarias y pruebas |
| `src/battle/types.ts`, `type-chart.ts`, `damage.ts` | Contratos mínimos, efectividad y pérdida de vida puras; sin interfaz ni turnos |
| `src/battle/engine-types.ts`, `battle-state.ts`, `battle-effects.ts`, `turn-engine.ts` | Contratos, creación/validación, efectos y resolución de turnos/sustituciones; API y límites en `src/battle/README.md` |
| `src/battle/supports.ts`, `src/features/practice/SupportPicker.tsx`, `SupportActions.tsx`, `OpponentSupports.tsx`, `support-artwork.json` | Mapeo explícito, selección opcional y uso de cuatro apoyos reales en la práctica; reglas existentes y arte del catálogo |
| `src/battle/profiles.ts`, `playable-roster.ts`, `data` | Estadísticas propias, conjunto versionado de 48 cartas y adaptador al motor; procedencia en `data/README.md` |
| `scripts/battle` | Selección explícita, carga verificada y generación/check offline de datos de combate |
| `src/battle/summary.ts`, `src/features/practice/BattleSummary.tsx` | Métricas de eventos al finalizar, comparación ES/EN de ambos equipos; sin estado ni guardado propio |
| `src/battle/practice-team.ts`, `src/features/practice/TeamTransfer.tsx` | Aptitud del equipo para práctica, avisos y transferencia versionada de IDs por navegación; no escribe en el borrador |
| `src/battle/team-catalog.ts`, `src/features/team/TeamBattleDetails.tsx` | Filtros de especies/variantes por IDs y detalles de estadísticas/movimientos del motor; validación compartida, sin modificar el catálogo |
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

## Cuentas y perfil online — 2026-10-19

Rama feat/online-accounts desde 64b3cee. Usuario eligió cuentas/progreso online y autorizó @supabase/supabase-js; instalada versión exacta 2.118.0 (npm informó cero vulnerabilidades). Creó el proyecto Free y rellenó personalmente .env.local; no registrar esos valores. La ruta diferida /cuenta permite registro/acceso por correo y contraseña, solicitud de recuperación, actualización desde /cuenta/recuperar y alias. Auth usa PKCE, getUser para comprobar identidad y sesión persistida por el SDK. La recuperación requiere PASSWORD_RECOVERY para esa identidad. La práctica y el equipo siguen locales, sin propiedad o recompensas.

SQL versionado: player_profiles con RLS, lectura de fila propia y UPDATE solo de display_name; ensure_player_profile inicializa solo auth.uid(), sin argumentos de identidad. No hay saldos ni inventario. El usuario informó éxito al aplicar la migración y al ejecutar la prueba SQL de dos identidades, permisos y rollback. Se observó directamente Auth settings HTTP 200, correo habilitado y confirmación activa; la tabla pasó de inexistente a rechazar lectura anónima HTTP 401/42501. No se usaron credenciales de administración.

Verificación local: 14 pruebas nuevas RED → GREEN, 192 totales correctas, lint y build/typecheck correctos. Revisión independiente detectó tres casos: recuperación invalidada por SIGNED_IN del mismo usuario, perfil previo conservado al desmontar y formularios desmontados en renovaciones normales. Corregidos con tres pruebas de regresión: se conserva recuperación con la misma identidad, se vacía el snapshot al detener y se revalida sin desmontar para eventos ordinarios de la misma cuenta. Cambios de identidad siguen invalidando inmediatamente y las respuestas tardías se descartan.

Navegador real en localhost:5174: acceso/registro/solicitud de recuperación ES/EN, cambio de idioma conserva modo, validación de correo por teclado y ruta de recuperación sin autorización rechazada; capturas a 1440, 390 y 320 px revisadas sin desbordamiento horizontal. Sin errores de consola observados. No se introdujeron contraseñas ni se enviaron correos desde la automatización. En ese momento quedaron pendientes las URLs y la prueba de cuenta real porque el usuario pidió desplegar primero en Vercel; ambas se completaron el 2026-10-20, según el cierre siguiente. SMTP propio pendiente para registros públicos: el correo predeterminado solo admite destinatarios del equipo y límites de prueba. Guía exacta en docs/CUENTAS-ONLINE.md. No desactivar confirmación.

Siguiente bloque propuesto: colección online, sobres y recompensas validados en servidor; mantener la separación entre práctica libre y progreso real. No ampliar roster o PvP para la entrega de dos días. El despliegue autorizado se describe a continuación; no se ha fusionado main.

## Preparación de Vercel — 2026-10-19

El usuario pidió acceder mediante Vercel y recibir cambios desde GitHub antes de configurar los retornos de Supabase. Rama chore/vercel-lumemon desde a1c35e9; cuentas subidas y sincronizadas en feat/online-accounts. Se reutilizó CLI oficial 63.1.0 ya instalada y la sesión existente. Proyecto nuevo cachumbas1/lumemon en Hobby, repositorio GitHub conectado y variables públicas de Supabase añadidas a Preview/Production sin exponer sus valores. vercel.json configura Vite y rutas SPA. El primer push f5fe452 creó automáticamente Production (no Preview). Se informó al usuario, que confirmó mantener https://lumemon.vercel.app como web pública. Vercel devolvió READY; /cuenta abrió sin barrera de Vercel en navegador y con campos de cuenta activos. No se fusionó main ni se desactivó protección. Guía: docs/DESPLIEGUE-VERCEL.md.

Vercel, 2026-10-20: Branch Tracking cambió de docs/plan-inicial a chore/vercel-lumemon, con confirmación visual del valor guardado. Los push a esta rama actualizan el dominio público; nuevas ramas deben seguir como Preview hasta integrar deliberadamente la entrega. Node remoto 24.x; el primer build de Git terminó correctamente. Variables de Supabase en Preview/Production; .env.local y .vercel ignorados. El usuario confirmó que guardó Site URL y Redirect URLs con https://lumemon.vercel.app. El 2026-10-20 también confirmó registro con correo, acceso y alias conservado tras recargar; después completó personalmente la recuperación de contraseña, volvió a entrar y conservó el alias. Esta evidencia procede de sus pruebas, sin compartir credenciales ni enlaces privados. SMTP para correos externos al equipo continúa pendiente; no afirmar registro público listo. Las pruebas con otro dispositivo y dos cuentas reales simultáneas no se han confirmado.
