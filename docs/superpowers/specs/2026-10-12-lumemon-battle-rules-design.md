# Lumemon — reglas propuestas de combate v0.1

Fecha: 12 de octubre de 2026. Base: `bc5be88`. Rama: `docs/reglas-combate-lumemon`.

**Estado a 13 de octubre: base de reglas aceptada para continuar; cálculo de tipos/daño y resolución local de turnos implementados; datos reales e integración pendientes.** Este bloque concreta el [diseño del juego](2026-10-08-pokeprisma-design.md). Las cifras son reglas propias de Lumemon, no estadísticas oficiales de las cartas ni un equilibrio demostrado. El usuario autorizó el documento y, tras la explicación del combate, continuar con el primer bloque el 13 de octubre. El [plan de tipos y daño](../plans/2026-10-13-lumemon-battle-damage.md) registra ese alcance. Esto no implica que exista ya una partida jugable.

## 1. Decisión de diseño

Objetivo: batallas comprensibles con seis especies distintas, tipos relevantes, estados, apoyos y variantes raras con mayor presupuesto de estadísticas. Deben servir al tutorial, a la máquina y al futuro PvP privado, en ES/EN y móvil/escritorio, sin servicios de pago.

| Enfoque considerado | Consecuencia |
| --- | --- |
| Usar valores y texto del TCG | Exige otro reglamento, costes de energía y muchos efectos; no encaja con el combate acordado |
| Copiar el combate completo de los videojuegos | Añade habilidades, niveles y excepciones fuera de alcance |
| **Reglas propias basadas en especies y tipos** | Conserva identidad Pokémon, permite variantes y un motor pequeño y comprobable; opción recomendada |

Se mantienen: un activo y cinco reservas, elecciones simultáneas, 45 segundos, hasta tres apoyos y los cinco estados del diseño inicial. Se propone empezar sin críticos, fallos aleatorios, daño aleatorio, IV/EV, habilidades, evoluciones durante la partida o transformaciones. La única aleatoriedad del turno será desempatar velocidades.

## 2. Estadísticas y rarezas

Cada carta jugable tiene vida máxima, ataque, defensa y velocidad. Se parte de la forma predeterminada verificada de su especie. Una ilustración no demuestra que deba usar estadísticas de otra forma. Las asociaciones ambiguas siguen sin ser jugables.

**Presupuesto B:** puntos para distribuir; no equivale a un porcentaje de victorias o de daño.

| Nivel Lumemon | B | Diferencia de presupuesto frente al básico |
| --- | ---: | ---: |
| Básico | 240 | 0 % |
| Infrecuente | 252 | +5 % |
| Raro | 264 | +10 % |
| Especial | 276 | +15 % |
| Extraordinario | 288 | +20 % |

Para evitar que el total oficial de una especie determine toda la partida, se conserva su perfil relativo y se normaliza su presupuesto. La evolución o condición legendaria no añaden otro multiplicador.

1. Obtener los pesos, en orden vida/ataque/defensa/velocidad: HP base, media entera inferior de ataque y ataque especial, media entera inferior de defensa y defensa especial, velocidad base. Limitar cada peso a 40–160.
2. Repartir B proporcionalmente: `q[i] = floor(B × peso[i] / sumaPesos)`. Asignar los puntos restantes a las fracciones mayores; empate en el orden vida, ataque, defensa, velocidad.
3. Aplicar el perfil de variante: desplazamientos enteros de −8 a +8 puntos por atributo, con suma cero. Nunca producir puntos negativos ni modificar B.
4. Obtener los valores: `vida = 120 + 2 × qVida`; `ataque = 30 + qAtaque`; `defensa = 30 + qDefensa`; `velocidad = 30 + qVelocidad`.

Cada ID de carta recibe un perfil persistido en una versión de datos. Dos variantes de la misma especie deben producir tuplas diferentes. El generador detectará colisiones y asignará otro perfil válido; si no hay uno disponible, rechazará la publicación. No se sortean estadísticas al abrir un sobre, recargar o cambiar de idioma. Los acabados que el catálogo no distinga por ID todavía no son variantes independientes.

Ejemplo de cálculo, **sin atribuir estos valores a ninguna carta concreta**: el fixture de Pikachu contiene bases 35/55/40/50/50/90 y produce pesos 40/52/45/90. Con B=240, el reparto es 42/55/48/95 y los valores son **204/85/78/125**. Los perfiles `(0,+5,−5,0)` y `(0,−5,+5,0)` dan **204/90/73/125** y **204/80/83/125**. Con B=288 y perfil neutro: **222/96/87/144**. Más rareza aumenta el presupuesto, pero otra distribución o una desventaja de tipo puede decidir el combate.

### Mapeo inicial explícito de rarezas

Estas agrupaciones propias cubren las 42 etiquetas de la instantánea actual; no afirman equivalencia comercial entre expansiones. El origen propio `pokeprisma` usa nivel Básico. Los apoyos no reciben estadísticas por rareza.

| Nivel | Etiquetas exactas de la fuente |
| --- | --- |
| Básico | `Common`, `One Diamond`, `Promo`, `None`, `Classic Collection` |
| Infrecuente | `Uncommon`, `Two Diamond` |
| Raro | `Rare`, `Holo Rare`, `Rare Holo`, `Three Diamond`, `Double rare`, `Shiny rare` |
| Especial | `Holo Rare V`, `Holo Rare VMAX`, `Holo Rare VSTAR`, `Rare Holo LV.X`, `Rare PRIME`, `LEGEND`, `Ultra Rare`, `Illustration rare`, `Amazing Rare`, `Radiant Rare`, `Shiny rare V`, `Shiny rare VMAX`, `One Star`, `Four Diamond`, `One Shiny`, `Pikachu Rare`, `Mega Attack Rare`, `Futuristic Rare`, `RGB Rare` |
| Extraordinario | `Secret Rare`, `Special illustration rare`, `Hyper rare`, `Shiny Ultra Rare`, `Crown`, `Two Star`, `Three Star`, `Two Shiny`, `Black White Rare`, `Mega Hyper Rare` |

Una etiqueta nueva queda pendiente de clasificación y no entra en partidas; no obtiene una potencia inventada por coincidencia de palabras. `Promo`, `None` y `Classic Collection` no forman una escala de rareza fiable y usan el presupuesto básico expresamente. Cualquier excepción por carta exige un mapeo versionado y visible.

## 3. Movimientos, tipos y daño

Hasta cuatro movimientos por especie, iguales entre sus ilustraciones en esta versión. Cada asignación enlazará un ID real de movimiento, el Pokémon predeterminado y una compatibilidad documentada por PokéAPI con su grupo de versiones. No se elegirán movimientos por parecido de nombres ni se interpretará texto libre como código. El conjunto inicial será una lista explícita de movimientos cuyo efecto esté implementado; no se mezclan compatibilidades de versiones distintas para justificar un mismo conjunto.

| Perfil propio de movimiento | Potencia | Recarga |
| --- | ---: | ---: |
| Ataque básico | 40 | 0 |
| Ataque potente | 60 | 1 turno completo |
| Estado puro | 0; aplica un estado concreto | 2 turnos completos |

Como mínimo habrá un básico sin recarga. Un cuarto movimiento puede dar otro tipo de ataque o estado si está verificado. La potencia, recarga y efecto mostrados se identificarán como adaptación de Lumemon. En esta versión un movimiento hace daño **o** aplica estado; no ambos.

Si se ejecuta en el turno t con recarga C, vuelve a estar disponible en `t + C + 1`. La recarga pertenece al Pokémon y al movimiento, avanza también en reserva y comienza aunque el objetivo sea inmune o ya tenga estado. No comienza cuando sueño, congelación o debilitamiento impiden ejecutar la acción. No hay PP ni consumo de cartas de Energía para atacar.

Los 18 tipos y sus relaciones se toman de la revisión fijada de PokéAPI del apéndice. No se utilizan los tipos impresos del TCG. Para dos tipos defensivos se multiplican ambos factores: 0, ¼, ½, 1, 2 o 4. No se repite un tipo defensivo y no se admiten tipos sin mapeo.

`daño = floor(potencia × ataque/defensa × afinidad × efectividad × quemadura × impulso × barrera)`

- Afinidad: ×1,25 si el tipo del movimiento coincide con alguno del atacante; en otro caso ×1. Se aplica una sola vez.
- Quemadura: ×0,8 si el atacante está quemado; en otro caso ×1.
- Impulso: ×1,5 mientras esté activo. Barrera: ×0,7 mientras esté activa en el defensor.
- Efectividad cero produce exactamente 0. En otro caso, mínimo 1 de daño. Vida resultante limitada a cero; no hay daño negativo.
- Usar fracciones/aritmética entera y redondear una sola vez al final. Vida, ataque y defensa inválidos se rechazan antes de resolver.
- Un estado puro exige efectividad distinta de cero y respetar la inmunidad específica al estado; el factor ½/2 no cambia su duración. Barrera no bloquea estados.

## 4. Secuencia de cada turno

1. Abrir la selección con versión de estado y vencimiento. Ambos jugadores eligen en secreto un movimiento disponible, cambio a una reserva viva o apoyo disponible. La primera elección válida queda confirmada e inmutable. Una inválida devuelve error y permite corregir dentro del plazo.
2. Resolver cuando ambos hayan confirmado o venza el plazo. A quien no haya enviado acción válida se le asigna pasar. Una petición recibida exactamente al vencer ya llega tarde. Pasar por tiempo no elimina sueño o congelación.
3. Ejecutar cambios. Retirar al activo elimina sueño/congelación y mejoras temporales; mantiene veneno/quemadura/parálisis y recargas. Los cambios de ambos bandos son independientes.
4. Ejecutar apoyos sobre el activo propio. Los efectos de ambos bandos son independientes.
5. Fijar el orden de movimientos con la velocidad efectiva de los activos después de cambios/apoyos; parálisis usa `max(1, floor(velocidad / 2))`. Igualdad: un bit uniforme del azar inyectado, registrado para repetir el turno. No recalcular ese orden si un ataque aplica parálisis.
6. Ejecutar movimientos en ese orden. El actor es el Pokémon que eligió esa acción. Si está debilitado, se cancela; sueño/congelación siguen la tabla. El objetivo es el activo rival que haya quedado después de cambiar. Un debilitado no puede recibir más efectos.
7. Si un ataque elimina el último Pokémon rival, terminar inmediatamente: victoria y sin efectos posteriores. Si aún quedan reservas, la sustitución espera al cierre del turno.
8. Calcular veneno/quemadura para ambos activos vivos desde el mismo estado previo y aplicar ambos daños antes de evaluar el resultado. Así puede haber empate por debilitamiento simultáneo. Expirar las mejoras que terminen en este turno. Si no hay vencedor y es el turno 60, declarar el empate antes de abrir sustituciones.
9. Si falta un activo, abrir sustitución obligatoria: solo el jugador afectado elige reserva, ambos en secreto si procede, con 45 segundos. Al vencer, elegir la primera reserva viva según el orden del equipo. No consume la siguiente acción ni aplica otro daño residual. Después abrir el siguiente turno.

El primer Pokémon del equipo es el activo inicial y todos comienzan con vida completa, sin estados, recargas ni mejoras. Se gana al dejar al rival sin Pokémon vivos o por abandono válido. Como límite de seguridad, después de cerrar el turno 60 sin vencedor hay empate, sin iniciar sustituciones ni otro turno. Un empate no concede monedas por victoria. Este límite también es una propuesta de balance.

## 5. Estados principales

Máximo uno por Pokémon. Intentar aplicar otro, incluido el mismo, falla sin reemplazarlo. Al debilitarse se limpian estados y mejoras; nunca se revive mediante estas reglas.

| Estado | Efecto propio | Inmunidad por tipo | Al cambiar |
| --- | --- | --- | --- |
| Veneno | Al cierre: `max(1, floor(vidaMáxima × 8/100))` al activo vivo | Veneno, Acero | Persiste; no daña en reserva |
| Quemadura | Al cierre: `max(1, floor(vidaMáxima × 5/100))`; daño saliente ×0,8 | Fuego | Persiste; no daña en reserva |
| Parálisis | Velocidad efectiva al 50 %; nunca pierde acciones al azar | Eléctrico | Persiste |
| Sueño | Bloquea el siguiente intento de movimiento, también uno de estado; después termina | Ninguna adicional | Se elimina |
| Congelación | Como sueño; recibir daño positivo de Fuego también la elimina inmediatamente | Hielo | Se elimina |

Se puede cambiar o usar apoyo bajo sueño/congelación. Pasar o usar apoyo no cuenta como intento de movimiento. Si Fuego descongela al receptor antes de su acción pendiente, podrá actuar. Si cura o cambia antes de actuar, tampoco pierde la siguiente acción. Un estado recién aplicado puede afectar al movimiento pendiente y al daño de cierre de ese mismo turno.

## 6. Apoyos de Entrenador/Energía

De cero a tres apoyos por equipo, con IDs distintos y sin repetir efecto. Cada uno se usa una vez por combate; no se destruye en la colección. Ocupa toda la acción y exige un mapeo explícito `cardId → efecto`; pertenecer a la categoría Trainer/Energy no basta.

| Efecto propio | Regla |
| --- | --- |
| Recuperación | Curar al activo vivo `max(1, floor(vidaMáxima × 30/100))`, sin superar su máximo |
| Limpieza | Eliminar el estado principal del activo; no cura vida ni revive |
| Barrera | Reducir al 70 % el daño de movimientos recibido en el turno de activación t y en t+1; no reduce daño residual |
| Impulso | Multiplicar por 1,5 los dos siguientes movimientos de daño ejecutados por ese activo, como máximo hasta el cierre de t+2 |

Impulso consume una carga al ejecutar un movimiento de daño, aunque encuentre inmunidad; no por sueño, congelación, un movimiento de estado o una acción cancelada. Barrera e Impulso pueden coexistir, pero no sumarse consigo mismos; cambiar o debilitarse los elimina. Recuperación a vida completa, Limpieza sin estado o una mejora igual todavía activa se rechazan antes de confirmar, sin gastar el apoyo.

Estos cuatro efectos no habilitan automáticamente ninguna de las cartas actuales. El mapeo de cartas concretas se incorporará en el bloque de datos, y la interfaz mostrará el efecto de Lumemon junto con la procedencia del TCG.

## 7. Tiempo, datos y responsabilidades

El motor será TypeScript independiente de React, red y reloj real: estado válido + acciones confirmadas + reglas/datos fijados + azar inyectado → nuevo estado y eventos. No debe leer `localStorage`, consultar API ni conceder recompensas.

| Contrato conceptual | Contenido mínimo |
| --- | --- |
| Datos de combate | Versiones y hashes; `cardId`, `speciesId`, Pokémon predeterminado, nivel, perfil y estadísticas; tipos, movimientos permitidos y apoyos mapeados |
| Estado | ID/versión de partida, turno, fase, dos equipos, activos, vida, estados, recargas, mejoras, apoyos usados y resultado |
| Acción | ID de petición, partida, versión/turno esperado, actor y selección por IDs; nunca daño, salud o estadísticas calculados por el cliente |
| Eventos | Orden y motivo de cambios, apoyos, impedimentos, daño, estados, recargas y final; sorteo consumido y versiones para reproducir |
| Servicio futuro | Autenticación/propiedad, elecciones privadas, tiempo, transacciones, concurrencia, reconexión y recompensa única |

El servidor valida y confirma una sola vez; solicitudes repetidas no repiten efectos, y versiones antiguas se rechazan. Las elecciones y datos del azar aún no consumido no se publican al rival. Reconectar dentro de los 60 segundos desde la desconexión confirmada recupera el estado y los plazos originales, sin reiniciarlos. Un abandono por tiempo requiere evidencias del servicio; un fallo general no concede una victoria. La resolución detallada de incidentes de red pertenece al bloque de salas, no a este motor local.

**Falta de datos actual:** `SpeciesRecord` no contiene estadísticas base ni movimientos; `CardRecord` tampoco contiene los del combate. El catálogo seguirá separado de una instantánea de datos de batalla. `validatePokemonTeam` valida composición, no propiedad ni aptitud para combatir; no se cambiará silenciosamente ese contrato. Una especie sin movimientos verificados o una carta sin perfil no puede iniciar una partida, aunque continúe visible en el catálogo.

La primera implementación posterior deberá ser un núcleo local con datos de prueba explícitos y sin cuentas, recompensas o PvP simulado. Ninguna partida comenzada cambia de reglas por una actualización del catálogo. Se conservarán las claves e IDs históricos documentados en [CONTEXTO-IA.md](../../CONTEXTO-IA.md).

## 8. Ejemplos y criterios de comprobación

Ejemplos didácticos de Lumemon, no valores oficiales de cartas:

| Caso | Resultado esperado |
| --- | --- |
| Potencia 40, ataque 90, defensa 75, afinidad y neutralidad | `floor(40 × 90/75 × 1,25) = 60` |
| Lo anterior con debilidad simple / doble / resistencia doble | 120 / 240 / 15 de daño |
| Debilidad simple, atacante quemado y con Impulso, defensor con Barrera | `floor(120 × 0,8 × 1,5 × 0,7) = 100` |
| Eléctrico dirigido a Agua; el rival cambia primero a Tierra | El ataque encuentra Tierra y causa 0; la inmunidad nunca se eleva a 1 |
| Veneno en activo con máximo 204 y vida actual 16 | Pierde 16 al cierre y queda debilitado |
| Ambos últimos activos tienen máximo 204, vida 16 y veneno; ambos pasan | Se aplican ambos daños de 16 y resulta empate |
| Apoyo Recuperación: máximo 204, vida 180 | Intenta curar 61; queda en 204, no en 241 |
| Movimiento potente ejecutado en turno 3 | No disponible en 4; disponible en 5 |
| Movimiento de estado ejecutado en turno 3 | No disponible en 4 o 5; disponible en 6 |
| Sueño antes del movimiento rival; después ambos siguen vivos | Ese movimiento se cancela, sueño termina y su recarga no empieza |

Antes de considerar listo el núcleo: comprobar reparto exacto de B y perfiles distintos; las 324 relaciones de tipos; dobles tipos e inmunidades; prioridad de cambios/apoyos; orden congelado tras velocidad; cancelación por KO; estados y sus excepciones; recargas y caducidad de mejoras; sustituciones, empates y límite de turnos. Con las mismas entradas y sorteos debe obtenerse exactamente el mismo estado y registro, sin mutar los originales. Los criterios de turnos, estados, apoyos y finales ya se ejercitan en el bloque local del 13 de octubre. El reparto de estadísticas y perfiles sigue pendiente del bloque de datos; estas pruebas no demuestran equilibrio.

**Primer bloque entregado el 13 de octubre:** tipos de datos mínimos y cálculo puro de efectividad/daño con pruebas. No implementa estados puros, aplicación/caducidad de mejoras o el orden del turno; recibe los factores ya validados por el llamador. La continuación del 13 de octubre implementa también turnos, estados/apoyos y sustituciones: [plan de turnos](../plans/2026-10-13-lumemon-battle-turns.md). Siguiente candidato: datos jugables verificados y luego pantalla/tutorial. Este documento no ordena implementar todo ese recorrido de una vez.

## Apéndice: tabla de tipos y fuentes

Cada fila indica el **tipo del movimiento** y las columnas los **tipos del defensor**. Lo no listado es ×1. Para dobles tipos se multiplican los factores, preservando el cero. Se excluyen tipos especiales fuera de los 18 ordinarios.

| Ataque | ×2 | ×½ | ×0 |
| --- | --- | --- | --- |
| Normal | — | Roca, Acero | Fantasma |
| Lucha | Normal, Roca, Acero, Hielo, Siniestro | Volador, Veneno, Bicho, Psíquico, Hada | Fantasma |
| Volador | Lucha, Bicho, Planta | Roca, Acero, Eléctrico | — |
| Veneno | Planta, Hada | Veneno, Tierra, Roca, Fantasma | Acero |
| Tierra | Veneno, Roca, Acero, Fuego, Eléctrico | Bicho, Planta | Volador |
| Roca | Volador, Bicho, Fuego, Hielo | Lucha, Tierra, Acero | — |
| Bicho | Planta, Psíquico, Siniestro | Lucha, Volador, Veneno, Fantasma, Acero, Fuego, Hada | — |
| Fantasma | Fantasma, Psíquico | Siniestro | Normal |
| Acero | Roca, Hielo, Hada | Acero, Fuego, Agua, Eléctrico | — |
| Fuego | Bicho, Acero, Planta, Hielo | Roca, Fuego, Agua, Dragón | — |
| Agua | Tierra, Roca, Fuego | Agua, Planta, Dragón | — |
| Planta | Tierra, Roca, Agua | Volador, Veneno, Bicho, Acero, Fuego, Planta, Dragón | — |
| Eléctrico | Volador, Agua | Planta, Eléctrico, Dragón | Tierra |
| Psíquico | Lucha, Veneno | Acero, Psíquico | Siniestro |
| Hielo | Volador, Tierra, Planta, Dragón | Acero, Fuego, Agua, Hielo | — |
| Dragón | Dragón | Acero | Hada |
| Siniestro | Fantasma, Psíquico | Lucha, Siniestro, Hada | — |
| Hada | Lucha, Dragón, Siniestro | Veneno, Acero, Fuego | — |

Tabla contrastada el 12 de octubre con 324 pares de la revisión `2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72`, ya fijada por el importador del proyecto: [tipos](https://raw.githubusercontent.com/PokeAPI/pokeapi/2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72/data/v2/csv/types.csv) y [efectividad](https://raw.githubusercontent.com/PokeAPI/pokeapi/2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72/data/v2/csv/type_efficacy.csv). SHA-256 de efectividad: `cdd7de4066680414d0a2433af805f139f425d6350cbf998ecab559a0fe8ff587`.

PokéAPI documenta estadísticas base, movimientos aprendibles por versión y relaciones actuales/históricas de tipos: [documentación v2](https://pokeapi.co/docs/v2). TCGdex documenta identidad, rareza y campos del TCG, que no constituyen reglas de Lumemon: [respuesta de una carta](https://tcgdex.dev/rest/card).

Las fórmulas, niveles, recargas y adaptaciones de estados de este documento son propuestas propias. Verificación documental del 12 de octubre: las 42 etiquetas actuales aparecen exactamente una vez; la tabla reproduce los 324 pares de la fuente; se han comprobado los cinco presupuestos, los dos perfiles de ejemplo y las cuentas de daño, curación, veneno y recargas. También se han revisado enlaces locales, consistencia del texto y alcance limitado a cinco archivos Markdown. No se han ejecutado pruebas de aplicación por este cambio documental; estas comprobaciones no sustituyen pruebas del motor ni demuestran equilibrio entre equipos.
