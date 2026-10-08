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
- El emblema geométrico de PokePrisma, la carta sin imagen y las figuras de sobres/equipo/combate son gráficos SVG/CSS creados para esta interfaz. No se presentan como productos o cartas oficiales.
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
