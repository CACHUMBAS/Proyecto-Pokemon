# Procedencia de datos y recursos

Comprobados el 8 de octubre de 2026. Copias locales de tres imágenes para que la muestra no dependa de peticiones a las API durante la navegación. La procedencia del catálogo de la fase 2 se detalla al final; no se atribuye una licencia comercial a las ilustraciones.

| Recurso local | Datos originales | Imagen original | Ilustrador |
| --- | --- | --- | --- |
| assets/cards/swsh7-215.webp | https://api.tcgdex.net/v2/en/cards/swsh7-215 | https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp | KEIICHIRO ITO |
| assets/cards/sv03-199.webp | https://api.tcgdex.net/v2/en/cards/sv03-199 | https://assets.tcgdex.net/en/sv/sv03/199/high.webp | SIE NANAHARA |
| assets/cards/sv03-223.webp | https://api.tcgdex.net/v2/en/cards/sv03-223 | https://assets.tcgdex.net/en/sv/sv03/223/high.webp | AKIRA EGAWA |

Imágenes en inglés. La interfaz lo señala en la vitrina y en las fichas. Los nombres de cartas e ilustradores se conservan; las etiquetas de interfaz se traducen. Rareza y tipos mostrados son del TCG; no estadísticas propias de combate.

- API y documentación de imágenes: https://tcgdex.dev/assets
- Pokémon y sus ilustraciones pertenecen a sus respectivos titulares. La disponibilidad en una API no equivale a autorización para explotación comercial.
- El emblema geométrico de Lumemon, la carta sin imagen y las figuras de sobres/equipo/combate son gráficos SVG/CSS creados para esta interfaz. No se presentan como productos o cartas oficiales.
- Tipografías locales mediante Fontsource: Manrope y Space Grotesk, SIL Open Font License 1.1. Paquetes y licencias conservados en las dependencias: https://fontsource.org/fonts/manrope y https://fontsource.org/fonts/space-grotesk.
- No se han añadido música ni archivos de audio en esta fase.


## Catálogo de la fase 2

Importado el 8 de octubre de 2026. Manifiesto: `catalog/manifest.json`; versión `523febef1a683029`.

- Índice completo y paginado de especies: https://pokeapi.co/api/v2/pokemon-species?limit=500. Documentación y uso de caché: https://pokeapi.co/docs/v2.
- Datos oficiales de nombres, generaciones, formas y tipos: tablas de https://github.com/PokeAPI/pokeapi/tree/2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72/data/v2/csv, contrastadas con el índice REST de especies.
- Disponibilidad de ilustraciones comprobada mediante el árbol oficial https://api.github.com/repos/PokeAPI/sprites/git/trees/a8a8f6e6e36c83ca4538b5a95257ead5d02a7a8f. Imágenes servidas desde https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/official-artwork; los archivos remotos pueden cambiar.
- Índices de cartas: https://api.tcgdex.net/v2/en/cards y https://api.tcgdex.net/v2/es/cards.
- Metadatos completos EN mediante consulta de lectura en https://api.tcgdex.net/v2/graphql; documentación https://tcgdex.dev/graphql. Las traducciones e imágenes ES se enlazan por el mismo identificador de carta.
- Ilustraciones: URLs proporcionadas por TCGdex, resolución `low.webp` en las listas y `high.webp` al ampliar, según https://tcgdex.dev/assets. Cada ficha enlaza su registro de origen y muestra el ilustrador cuando está disponible.
- 23.770 registros TCGdex: 20.132 Pokémon y 3.638 apoyos. 15.495 tienen localización ES; 1.357 no proporcionan imagen. Se conserva la cobertura real EN/ES, sin atribuir cobertura de todos los idiomas o todas las ediciones históricas.
- Se distinguen los tipos del TCG de los tipos de especie. Las 129 asociaciones ambiguas se reservan para revisión antes de usarlas en combate. Las cartas propias de respaldo llevan una marca explícita; ninguna especie necesitó ese respaldo en esta instantánea.
- Se conservan los avisos de proyecto fan. Los datos de API no otorgan por sí solos derechos sobre las marcas o ilustraciones. No se han incorporado audio, servicios de pago ni claves.

## Ilustraciones recuperadas de McDonald’s

Corrección del 8 de octubre de 2026, rama `fix/imagenes-mcdonalds`.

TCGdex devuelve McDonald’s 2011 sin imágenes en sus doce registros EN y sin cartas ES. Se contrastó `https://api.tcgdex.net/v2/en/sets/2011bw` y se reprodujo la ausencia en la ficha de Snivy.

Se recuperaron **87 ilustraciones inglesas** de seis colecciones: 2011 (12), 2012 (12), 2016 (12), 2019 (12), 2021 (24) y 2022 (15). Fuente histórica: https://github.com/PokemonTCG/pokemon-tcg-data/tree/39a26a144c8b6ef6c2fb17b2c29d0bb7121e3a11/cards/en. Se concilió el nombre exacto de la expansión y, dentro de ella, identificador/número de carta y especie nacional; no se eligieron imágenes por semejanza de nombre.

- `assets/cards/supplements/_sources.json` registra cada URL original, revisión del archivo, identidad y hashes de las imágenes originales y servidas.
- Los 174 WebP (lista/ampliación) ocupan 19.283.498 bytes en total. Se conserva la proporción y el contenido de las imágenes PNG originales, con anchuras máximas 245/600 píxeles; no se ha regenerado arte ni texto. Se cargan individualmente conforme se necesitan.
- El archivo histórico anuncia el cierre de su API para marzo de 2027. La web usa copias locales de estas imágenes, sin llamadas a esa API ni nuevas claves/dependencias.
- Las imágenes originales de TCGdex conservan prioridad si están disponibles. El suplemento se mantiene separado de la instantánea importada; `catalog:import` no lo sobrescribe. Las fichas indican el idioma real y enlazan el origen de la ilustración por separado de los datos de TCGdex.
- Se preservan las referencias del catálogo sin imagen cuando no se ha podido recuperar una correspondencia fiable. Entre McDonald’s quedan 2014, 2015, 2017 y 2018 (ambos tamaños de las URLs del archivo fallan), 2023 y 2024 (sin edición en el archivo consultado), y `2021swsh-12` (TCGdex la asocia a 391 y el archivo a 390). No se le asigna una imagen contradictoria.
- El recuento original de 1.357 registros sin imagen en TCGdex sigue describiendo esa fuente; 87 cuentan ahora con respaldo visual local en la aplicación. No se afirma que estén recuperadas todas las ilustraciones ausentes del catálogo.

Comprobaciones: 39 pruebas automatizadas correctas; tipos, lint y compilación correctos. Los 174 archivos se decodificaron en el navegador. Las doce cartas de 2011 se abrieron y ampliaron en ES/EN, con proveedores externos bloqueados, comprobando imagen local, procedencia y cierre por teclado. Capturas de escritorio y móvil revisadas; no se añadieron cuentas ni costes.

Revisión independiente de `5b8f8ef..2d10947`: sin hallazgos críticos, importantes ni menores. Se verificaron identidad, idioma y procedencia de los 87 registros, junto con las cuatro pruebas específicas y los hashes de los 174 archivos. Los casos sin fuente fiable y la discrepancia de `2021swsh-12` permanecen documentados; no se sustituyen por arte de otra carta.
