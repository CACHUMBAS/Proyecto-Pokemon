# Álbum de Lumemon

Implementación del 2026-10-22, rama `feat/collection-album` sobre `3d8d6e1`. Continúa el diseño aprobado de Colección/Sobres, con temas Perla y Noche. Publicación autorizada el 2026-10-27 en `feat/publish-collection-experience`; el estado verificado se registra en [CONTEXTO-IA.md](CONTEXTO-IA.md).

## Comportamiento

- Álbum de cartas poseídas, con ilustración, rareza de Lumemon, copias y sobrantes. El progreso cuenta variantes distintas sobre las definiciones de la economía Prisma, no todo el catálogo de Pokémon.
- Los filtros existentes se conservan; el botón de restablecimiento borra búsqueda, rareza, tipo y duplicados. Los contadores de progreso muestran el inventario completo y el contador de resultados refleja los filtros.
- Pulsar una ilustración abre una ficha nativa modal. Solo la carta seleccionada solicita la imagen de alta resolución; el álbum mantiene imágenes pequeñas con carga diferida.
- La ficha muestra expansión, ilustrador si existe, idioma real, rareza TCG, rareza independiente de Lumemon y fuente. No interpreta el texto impreso del TCG como reglas de combate.
- Flechas de pantalla o teclado recorren las cartas filtradas. Los límites se desactivan. Escape/cierre devuelve el foco al botón que abrió la ficha.
- La conversión se inicia en la ficha y cierra esta antes de abrir la confirmación existente. Cancelar devuelve el foco al álbum; el cambio usa el mismo comando y cantidad de una copia. La última copia y las operaciones pendientes siguen bloqueadas. El estado de operación del servidor queda visible en la página.
- Entrada breve de la ilustración y reflejos existentes. prefers-reduced-motion desactiva el movimiento. El diseño fluye a una columna en el visor móvil.

## Verificación acotada

19 pruebas existentes de colección/presentación correctas, lint y build/typecheck correctos. No se añaden pruebas de estructura ni se repite el motor/SQL por una mejora visual. La demo de desarrollo en http://localhost:5174/scripts/qa/collection-album.html usa el componente real con inventario simulado y no ejecuta operaciones de Supabase; queda fuera del bundle de producción.

Revisión visual en Perla y Noche, ES/EN, 1440/390/320 px: sin desbordamiento horizontal en página ni visor; búsqueda sin resultados, restablecimiento, filtros de tipo/rareza/duplicados, navegación y límites del conjunto filtrado, imagen de alta resolución, última copia bloqueada y cancelación con retorno del foco. La demo usa StrictMode. No se ha probado en móvil físico ni se ha emulado movimiento reducido. No se han gastado cartas ni monedas reales.

## Alcance pendiente

La publicación de este bloque ya está autorizada. No incorpora favoritos, clasificación nueva, logros, nuevas cartas, sonidos ni cambios de probabilidades. El resto de pantallas sigue pendiente de una decisión de diseño propia. Preservar claves, IDs y estado de cuenta.
