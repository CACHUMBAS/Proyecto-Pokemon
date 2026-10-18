# Cartas jugables

Revisión ampliada (15 de octubre): **18 especies y 36 cartas** del catálogo `523febef1a683029`. Las formas predeterminadas, tipos, estadísticas base, nombres y compatibilidad de movimientos proceden de la revisión de PokéAPI fijada en `sources/manifest.json`. El conjunto del juego sigue siendo una selección inicial, no todas las cartas del catálogo.

| Especie | Cartas habilitadas |
| --- | --- |
| Bulbasaur | base1-44, sv03.5-166 |
| Charmander | base1-46, sv03.5-168 |
| Squirtle | base1-63, sv03.5-170 |
| Pikachu | base1-58, sv03.5-173 |
| Vulpix | base1-68, sv03.5-037 |
| Jigglypuff | base2-54, sv03.5-039 |
| Abra | base1-43, sv03.5-063 |
| Machop | base1-52, sv03.5-066 |
| Gastly | base1-50, sv03.5-092 |
| Onix | base1-56, sv03.5-095 |
| Lapras | sv03.5-131, base3-10 |
| Eevee | base2-51, sv03.5-133 |
| Venusaur | base1-15, sv03.5-198 |
| Charizard | base1-4, sv03.5-199 |
| Blastoise | base1-2, sv03.5-200 |
| Gengar | base3-5, sv03.5-094 |
| Snorlax | base2-11, sv03.5-143 |
| Dragonite | base3-4, sv03.5-149 |

## Qué es de PokéAPI y qué es de Lumemon

Cada especie usa su forma predeterminada; Vulpix no recibe atributos de la forma de Alola. Todos los movimientos tienen compatibilidad comprobada en **Ultrasol/Ultraluna**, version_group_id 18. Se conserva el ID, nombre ES/EN, tipo y método/nivel de aprendizaje. Las estadísticas base y metadatos son los de la revisión fijada de los CSV; la versión de aprendizaje no pretende reconstruir todos los valores históricos del videojuego.

Las estadísticas finales de cada carta son propias de Lumemon: presupuestos por rareza 240/252/264/276/288, pesos normalizados, mayores restos y perfil de variante ±8 con suma cero. Los perfiles se asignan determinísticamente por ID, evitando tuplas repetidas por especie, y se **guardan en el snapshot**. No se regeneran al cambiar idioma, recargar o abrir un sobre. Una rareza nueva requiere clasificación explícita.

Los movimientos son adaptaciones declaradas: básico40/recarga0, potente60/recarga1 o estado0/recarga2. Se conserva la potencia original en los metadatos para distinguirla. No se trasladan críticos, probabilidades, prioridades, golpes múltiples o efectos secundarios: por ejemplo, Ataque Rápido no adelanta el turno, Rayo Hielo y Golpe Cuerpo solo causan daño, Ciclón/Carga Dragón no provocan retroceso y Demolición no elimina Barrera. Los estados puros sí deben corresponder al estado oficial del movimiento elegido. Congelación está en el motor, pero no se inventa un movimiento puro para aplicarla en este conjunto.

Las dos ilustraciones por especie son registros concretos y distintos del catálogo. No se habilitan otras variantes por parecido de nombre, rareza o especie. Tener un ID válido aquí tampoco demuestra propiedad.

## Fuentes y reproducibilidad

- [Documentación oficial de PokéAPI](https://pokeapi.co/docs/v2).
- [Revisión fijada del repositorio de datos](https://github.com/PokeAPI/pokeapi/tree/2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72/data/v2/csv).
- [Manifiesto de fuentes](sources/manifest.json): URL y SHA256 del CSV completo, SHA256/cabecera/filas del subconjunto incluido.
- [Selección explícita](../../../scripts/battle/selection.json): cartas y perfiles de movimiento; no selección automática por nombres.
- [Snapshot generado](starter-roster.json): datos, perfiles y versiones; su versión deriva del hash del contenido.

Los 13 CSV incluidos conservan cabecera y filas originales, normalizando CRLF a LF. Se extraen las formas predeterminadas de las especies seleccionadas; sus seis estadísticas y tipos; los nombres ES/EN (idiomas7/9); los movimientos seleccionados y sus metadatos/nombres; todas las filas de aprendizaje de esos movimientos para esas formas en versión18; los diccionarios de tipos ordinarios, estadísticas, métodos y estados necesarios. El CSV de métodos se conserva completo.

`npm run battle:check` verifica hashes, fuentes, catálogo, compatibilidad, cálculo y coincidencia exacta del snapshot **sin red ni escritura**. `npm run battle:generate` regenera explícitamente el archivo; una revisión de fuentes o selección puede cambiar su versión y sus perfiles. Cualquier ampliación debe revisar el diff y mantener las partidas existentes en su propia revisión. Estos comandos no descargan fuentes ni reimportan el catálogo.

## Conexión al motor

`listPlayableCards()` y `getPlayableCard(id)` devuelven copias de los datos. `createPlayableBattle(battleId, [ids0, ids1])` exige seis cartas habilitadas de especies distintas por equipo y llama al motor existente, guardando la versión del conjunto en la partida.

Las pruebas incluyen un combate completo y reproducible con estas cartas. La pantalla `/practica` utiliza este adaptador con un bot básico, tutorial opcional, audio y animaciones. Sigue pendiente el mapeo de cartas de apoyo: el adaptador crea equipos sin apoyos. La [API del motor](../README.md) conserva los límites de confianza, tiempo y propiedad.

La ampliación conserva exactamente las 24 cartas y las 12 especies del conjunto anterior (estadísticas, perfiles, tipos, movimientos y aprendizaje). Añade cuatro IDs de movimiento: 17 (Ataque Ala), 34 (Golpe Cuerpo), 239 (Ciclón) y 407 (Carga Dragón), con compatibilidad USUM verificada. La nueva versión del conjunto es `lumemon-roster-65c806dfd1ce7612`; no cambia la versión de las reglas. Las evoluciones se seleccionan directamente como especies; no hay evolución durante la partida.

## Apoyos de práctica (18 de octubre de 2026)

Mapeo explícito de Lumemon en `src/battle/supports.ts`, versión `lumemon-supports-v1`. No se interpreta el texto TCG como reglas del motor.

| ID TCGdex | Nombre original | Efecto existente de Lumemon |
| --- | --- | --- |
| base1-90 | Super Potion | heal: recuperar 30 % de PS máximos, limitado por vida faltante |
| base1-82 | Full Heal | cleanse: eliminar el estado |
| base1-80 | Defender | barrier: daño de movimientos ×0,7 en t y t+1 |
| base1-96 | Double Colorless Energy | boost: dos movimientos de daño ×1,5 hasta cierre de t+2 |

El arte y sus metadatos se copian sin cambios desde `public/catalog/snapshots/523febef1a683029/support.json` a `src/features/practice/support-artwork.json`. Las pruebas contrastan cada registro y mantienen su localización EN; los nombres visibles ES son etiquetas traducidas de la interfaz, no una ilustración española. Se conservan los enlaces de procedencia TCGdex. No se descargan nuevas imágenes ni se atribuyen licencias comerciales. Hasta tres cartas sin repetir efecto, un uso y acción completa por carta, solo sobre el activo. El motor original valida los estados y rechaza usos sin efecto; cambiar o caer elimina las mejoras.
