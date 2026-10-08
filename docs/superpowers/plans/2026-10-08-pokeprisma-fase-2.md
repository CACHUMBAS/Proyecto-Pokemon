# PokePrisma — Plan inicial de la fase 2: catálogo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la selección limitada de muestra por un catálogo navegable, con cobertura verificable de todas las especies disponibles, datos de PokéAPI y variantes de TCGdex.

**Architecture:** Modelos normalizados separados de la interfaz. Importación por lotes con caché local y manifiesto verificable, sin descargar miles de registros al abrir la portada. El catálogo se pagina y sus detalles se cargan cuando se necesitan. Los datos de combate, propiedad e inventario seguirán perteneciendo a fases posteriores.

**Tech Stack:** Base React/Vite/TypeScript existente; scripts Node para importar datos; pruebas de normalización y de cobertura antes de conectar la interfaz. Confirmar respuestas y capacidades actuales de las API antes de fijar el importador.

**Spec:** [Diseño acordado](../specs/2026-10-08-pokeprisma-design.md).

**Estado:** preparado a partir de las interfaces de la fase 1. No iniciado. Las estrategias de descarga se concretan tras medir las respuestas reales, sin asumir cobertura completa por idioma.

## Global Constraints

- Todas las generaciones; no limitar el catálogo a las muestras o a 151 especies.
- Interfaz ES/EN; conservar la procedencia y el idioma real de las ilustraciones.
- No asociar una carta a una especie únicamente por coincidencia de nombre traducido.
- Sin claves, servicios de pago, cuentas ficticias o recompensas durante esta fase.
- Caché de los datos solicitados, concurrencia acotada, reintentos limitados y respeto al uso compartido de las API.
- Una carta propia de respaldo se distingue de una carta oficial. Los casos ambiguos no se vuelven jugables automáticamente.

## Interfaces que ya existen

- `src/types/card-preview.ts`: `CardPreview` es un modelo de presentación, no el modelo de dominio. Tiene identificador, nombre, imagen opcional, origen, idioma, rareza, tipos y fuente.
- `src/components/cards/PokemonCard.tsx`: recibe una carta y opcionalmente `onSelect(id)`; conserva imagen alternativa y movimiento reducido.
- `src/i18n/index.ts`: `Locale = 'es' | 'en'` y textos centralizados.
- `src/app/router.tsx`: añadir `/catalogo`; conservar `/diseno` como muestra independiente.

## Review Focus

1. Especies sin cartas, datos parciales, variantes con varios Pokémon y formas sin identificador fiable.
2. Datos en inglés con interfaz en español; nombres, tipos del TCG y tipos de Pokémon claramente diferenciados.
3. API temporalmente caída, descarga interrumpida, datos corruptos y caché antigua.
4. Búsqueda y filtros sobre el catálogo completo, no solo sobre la página visible; recarga de filtros y detalles.
5. Imágenes pesadas o ausentes en móvil y navegación por teclado.

## Task 1: Contratos y muestras verificadas

**Files:** crear `src/catalog/types.ts`, `src/catalog/normalize.ts`, `src/catalog/normalize.test.ts` y muestras pequeñas en `src/catalog/fixtures/`; registrar fuentes en `public/_sources.md`.

**Interfaces propuestas:** `SpeciesRecord` con identificador de especie, nombres localizados, generación y formas; `CardRecord` con identificador de proveedor, referencias a especies, idioma, rareza original, origen y estado del mapeo; `CatalogManifest` con versión, procedencia, fecha y cobertura.

- [ ] Crear `feat/catalogo-pokeprisma` desde la base revisada.
- [ ] Consultar documentación y respuestas actuales de ambas API: listas, paginación, búsquedas, detalles e imágenes. Guardar solo las muestras necesarias para comprobar el contrato.
- [ ] Probar primero normalización de tipos, campos opcionales, cartas sin imagen, idiomas ausentes, varios Pokémon y mapeo ambiguo. Implementar funciones puras que hagan pasar esos casos.
- [ ] Mantener explícita la diferencia entre tipos de especie y tipos del TCG. No ejecutar textos de movimientos ni deducir efectos de cartas.
- [ ] Ejecutar pruebas, tipos, análisis de código y compilación; commit `feat: definir contratos del catalogo Pokemon`.

## Task 2: Importación, caché y cobertura

**Files:** crear `scripts/catalog/import.ts`, `scripts/catalog/coverage.ts`, `src/catalog/repository.ts` y sus pruebas; añadir exclusiones para caché temporal. El lugar definitivo del catálogo generado se decide según el tamaño medido y queda documentado.

**Interfaces propuestas:** importación reanudable que produce un manifiesto; repositorio con `listSpecies(query)`, `getSpecies(id)` y `listVariants(speciesId, locale)`, independiente del componente React.

- [ ] Usar el recuento y la paginación reales de PokéAPI para obtener el índice completo de especies, evitando un límite numérico fijo.
- [ ] Medir el tamaño y la cobertura del índice de TCGdex. Elegir importación por lotes o detalle bajo demanda según esos datos; guardar respuestas y no repetir descargas correctas.
- [ ] Probar errores de respuesta, peticiones repetidas, reanudación y validación antes de reemplazar un manifiesto válido.
- [ ] Generar una carta propia marcada para cada especie sin variante disponible; usar imagen de PokéAPI solo cuando esté proporcionada, con alternativa si falta.
- [ ] Generar informe de especies cubiertas, cartas reales, respaldos y casos por revisar. Una importación incompleta no declara cobertura total.
- [ ] Ejecutar comprobaciones; commit `feat: importar y verificar cobertura del catalogo`.

## Task 3: Catálogo navegable

**Files:** crear `src/features/catalog/CatalogPage.tsx`, `CatalogPage.css`, `CatalogFilters.tsx`, `SpeciesDetails.tsx` y `to-card-preview.ts`; modificar rutas, navegación y diccionarios.

**Interfaces:** adaptar `CardRecord` a `CardPreview` sin confundir etiquetas localizadas con identificadores. La URL conserva búsqueda, filtros y página. El detalle enseña especie, variantes y procedencia; no muestra propiedad de usuario.

- [ ] Añadir búsqueda por nombre/identificador, filtros disponibles por generación/tipo/rareza/expansión y paginación coherente.
- [ ] Probar que cambiar de filtro reinicia la página y que búsqueda/filtros se aplican al conjunto indexado, no solo a los elementos visibles.
- [ ] Implementar estados de carga, error con reintento, resultados vacíos y traducción o imagen ausente.
- [ ] Comprobar ES/EN, teléfono/escritorio, teclado, recarga de URL, interrupción de red y volumen real de datos.
- [ ] Ejecutar pruebas, tipos, análisis de código y compilación; commit `feat: explorar especies y variantes en PokePrisma`.

## Task 4: Revisión de catálogo

**Files:** actualizar README y fuentes; crear `docs/revision-fase-2.md`.

- [ ] Revisar informe de cobertura contra el índice importado y documentar exclusiones o datos ambiguos.
- [ ] Medir tiempos y peso de los recursos; evitar cargar todo el catálogo o sus imágenes al visitar la portada.
- [ ] Revisar permisos de recursos y confirmar que no se han añadido costes ni secretos.
- [ ] Guardar resultados, capturas y limitaciones; subir la rama con sus commits.

Referencias: https://pokeapi.co/docs/v2, https://tcgdex.dev/, https://tcgdex.dev/rest/card y https://tcgdex.dev/assets. Se comprobarán de nuevo al implementar.
