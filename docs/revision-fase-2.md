# Revisión de PokePrisma — Fase 2

Fecha: 8 de octubre de 2026. Rama: `feat/catalogo-pokeprisma`. Base: `d216ebc`.

## Entrega

Catálogo de todas las especies del índice importado de PokéAPI, búsqueda por nombre/número nacional, filtros combinables de generación, tipo, rareza y expansión, paginación conservada en la URL y fichas con variantes de TCGdex. Interfaz ES/EN, ilustraciones con idioma real, ampliación mediante diálogo, procedencia y estados de error con reintento.

No se implementan todavía cuentas, inventario, sobres, economía o combates. Los tipos y rarezas de las cartas impresas no se convierten automáticamente en reglas propias del juego.

## Cobertura verificada

Instantánea `523febef1a683029`, generada a partir del índice completo paginado y respuestas contrastadas por identificador. Se releyeron todos los archivos publicados y se comprobaron su identidad y las cifras del manifiesto.

| Concepto | Cantidad |
| --- | ---: |
| Especies esperadas/importadas | 1.025 / 1.025 |
| Cartas Pokémon TCGdex | 20.132 |
| Entrenadores y energías reservados para fases posteriores | 3.638 |
| Registros TCGdex únicos | 23.770 |
| Registros con localización ES | 15.495 |
| Cartas ambiguas o incompletamente asociadas | 129 |
| Registros sin imagen en ninguna localización importada | 1.357 |
| Especies que necesitan carta propia de respaldo | 0 |

Los 129 casos ambiguos se conservan para revisión; no adquieren una asignación jugable. Las referencias a formas se muestran con sus identificadores originales. Ninguna carta se asocia por una coincidencia de nombre. El respaldo propio está implementado y probado aunque no se necesitó en esta importación. Los registros sin especie quedan en `unmapped.json`; los apoyos en `support.json`.

El alcance de TCGdex es su catálogo EN y las localizaciones ES disponibles. No se afirma que incluya todas las ediciones japonesas o cada carta histórica. Las denominaciones de expansiones y las rarezas sin traducción se conservan como las ofrece la fuente.

## Comprobaciones

- `npm test`: 35 pruebas, sin fallos. Normalización, identidad, tipos, imágenes e idiomas ausentes, cartas ambiguas y propias, filtros antes de paginar, combinación de rareza/expansión sobre una misma variante, consultas compartidas, caché válida/corrupta, reintento y conservación del manifiesto ante una publicación fallida.
- `npm run typecheck`, `npm run lint`, `npm run build`: correctos.
- Rutas de catálogo, detalle y especie inexistente en ES/EN a 320, 390, 768 y 1440 px: sin desbordamiento horizontal.
- Búsqueda `#1025` encuentra Pecharunt; filtros reinician la página. La recarga y la vuelta desde una ficha conservan búsqueda/filtros.
- Enter abre la carta, Escape cierra y restaura el foco. La búsqueda mantiene el foco; cambiar de página desplaza y enfoca el inicio de los resultados.
- Fallo simulado del manifiesto y del archivo de variantes: aviso y reintento recuperable. Sin errores de ejecución durante el recorrido.
- Ilustraciones cargadas y decodificadas antes de las capturas finales. Las cartas con ilustración aparecen primero; las ausentes siguen accesibles con alternativa.
- Regresiones de portada: vuelta al inicio desde fragmento y enlace repetido, idioma de ilustración y controles mínimos de 44 px en 320/390 px ES/EN, correctas.
- Revisión de archivos versionados: sin `.env`, claves privadas ni configuración autenticada de Vercel/Supabase. No se han creado servicios ni añadido costes.

Navegador: Edge local automatizado con Playwright temporal, fuera de las dependencias de producción. Los tamaños móviles son emulación; no se ha probado un teléfono físico ni Safari. La herramienta integrada de navegador no arrancó por su entorno; se utilizó el navegador local. Capturas y métricas se guardan en los archivos de esta conversación, fuera del paquete servido.

## Peso y carga

El catálogo completo ocupa 9.537.771 bytes repartidos en 1.029 archivos, incluyendo manifiesto. El navegador abre el manifiesto y el índice de especies al entrar al catálogo; después carga solo las variantes de la especie visitada. La portada no solicita ningún archivo del catálogo. La caché de detalles mantiene como máximo 20 especies.

| Recurso | Sin comprimir | gzip calculado |
| --- | ---: | ---: |
| Índice de 1.025 especies | 1.001.731 bytes | 81.424 bytes |
| Variantes de Pikachu (247 cartas) | 87.423 bytes | 7.059 bytes |

Compilación: 415,10 kB de JavaScript entre todos los fragmentos (132,90 kB gzip) y 33,99 kB de CSS (9,34 kB gzip), además de fuentes y tres imágenes locales ya existentes. Las rutas de catálogo se cargan bajo demanda. Las ilustraciones externas son diferidas; las tarjetas TCG usan WebP pequeño y el diálogo solicita la versión grande. Los tamaños gzip son cálculos de compilación, no una medición del servidor público.

Una pasada en `vite preview`, Edge sin limitación artificial y equipo local: 159 ms hasta el título de portada y 274 ms desde pulsar Catálogo hasta sus resultados. Son medidas locales orientativas, no una puntuación Lighthouse ni una garantía de velocidad en redes móviles.

## Decisiones

1. Se conserva la carpeta de escritorio del usuario y se crea una rama exclusiva. No se crea otra copia de trabajo; compartir esa carpeta exige no editar la misma fase simultáneamente desde otra tarea.
2. Se usan las tablas oficiales de PokéAPI en una revisión fija, un árbol de ilustraciones verificado y el índice REST completo. Evita unas 2.000 consultas individuales. Si aparecen especies nuevas, deben actualizarse esas revisiones y superar la validación; la importación falla antes de publicar una cobertura incompleta.
3. TCGdex se importa mediante una consulta GraphQL de lectura y se concilia con los índices REST EN/ES. El paginador GraphQL probado falló en el proveedor y no se dependió de él. La respuesta grande (5,50 MB) se guarda en la caché del importador; no la descarga cada visitante.
4. La subida final de la rama se realiza después de la revisión independiente. Se mantiene la autorización del usuario para ramas, commits y GitHub; no se mezcla con la rama principal ni se publica la web.

## Revisión independiente

Un revisor independiente examinó el rango `d216ebc..800e02f`, el plan, los contratos y los casos de revisión. No encontró problemas críticos. Se corrigieron los siguientes hallazgos en una pasada:

1. Repetir una importación podía truncar archivos publicados antes de sustituir el manifiesto. Ahora cada escritura usa un temporal y un renombrado atómico, y los archivos idénticos se reutilizan sin abrirlos para escritura. Una prueba simula una escritura interrumpida y comprueba que el archivo servido y el manifiesto conservan su contenido.
2. Un archivo podía contener cartas sin localización ES/EN utilizable y romper la ficha. Se rechaza antes de guardarlo en caché y se permite reintentar.
3. Un archivo vacío, parcial o con identificadores duplicados podía contradecir el recuento del índice. Ahora se concilian las cartas TCG y el respaldo propio esperado por separado.
4. Una imagen española mostrada en la interfaz inglesa podía llevar un aviso que decía «English». Aunque la revisión lo clasificó como menor, se trató como una corrección funcional de procedencia: el idioma indicado era falso. El aviso usa ahora el idioma efectivo. Se reprodujo con la carta real `sm3.5-1` y se comprobó en el navegador.

Las pruebas de estos errores fallaron antes de los cambios y pasaron después. Durante la importación real de comprobación, Windows bloqueó temporalmente el reemplazo de un archivo existente (EPERM). La auditoría confirmó que el catálogo seguía íntegro. Se añadió una regresión para reutilizar archivos idénticos; la importación repetida terminó correctamente y conservó la misma versión y los mismos recuentos.

Resultado final: 35 pruebas correctas, tipos y análisis de código sin errores, compilación correcta y recorrido de interfaz ES/EN repetido sin errores. Se pasaron los 1.025 archivos de variantes por la validación utilizada en el navegador. No se aplazan hallazgos menores de esta revisión.

Se mantiene fuera de esta entrega, de forma explícita: cuentas/economía/combates y asignaciones jugables de formas (requieren sus siguientes fases); ediciones ajenas al catálogo EN/ES (exigirían nuevas fuentes y conciliación); dispositivos físicos y Safari (necesitan una validación adicional antes de afirmar compatibilidad completa).

## Siguiente fase

Motor de combate simplificado: equipos de seis, tabla de tipos, turnos y estados. Después se conecta a un tutorial contra la máquina, antes de introducir persistencia, economía o salas privadas.
