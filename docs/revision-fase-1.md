# Revisión de PokePrisma — Fase 1

Fecha: 8 de octubre de 2026. Rama: `feat/base-pokeprisma`. Base: `b6cb0f2`.

## Alcance entregado

Portada original de estética tecnológica, vitrina holográfica, selector ES/EN persistente, navegación, filtros de muestras, fichas accesibles y recuperación de rutas desconocidas. Tres cartas verificadas de TCGdex y una muestra explícita sin imagen. Fuentes e imágenes locales. React 19.3, Vite 8.3 y TypeScript 6.0.

No hay cuentas, saldo, aperturas, colección personal ni combates implementados todavía. Los elementos que presentan esas funciones están marcados como en preparación. Esta fase no se ha publicado.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| Instalación y auditoría npm | 172 paquetes auditados; cero vulnerabilidades comunicadas |
| `npm run typecheck` | Sin errores |
| `npm run lint` | Sin errores ni advertencias |
| `npm run build` | Compilación de producción correcta |
| `git diff --check` | Sin errores |
| Rutas `/`, `/diseno` y desconocida | Correctas en ES y EN; recarga directa comprobada |
| Anchos 320, 390, 768 y 1440 px | Sin desbordamiento horizontal en las tres rutas y ambos idiomas |
| Idioma y documento | Texto, título, descripción y `html.lang` sincronizados; preferencia conservada al recargar |
| Almacenamiento bloqueado o idioma inválido | Español de respaldo; selector funcional sin almacenamiento |
| Filtros | Todas: 4 muestras; especiales: 2; sin imagen: 1 |
| Ficha mediante teclado | Enter abre, Escape cierra y devuelve el foco a la carta |
| Navegación con teclado | Enlace para saltar al contenido y foco visible |
| Enlaces internos | Desplazamiento a universo desde portada y desde la vitrina |
| Carrusel | Avance y retroceso actualizan la carta y su leyenda |
| Ratón y táctil | Reflejo al mover ratón; presentación estática táctil y ficha abrible con toque |
| Movimiento reducido | Sin transformaciones dinámicas ni transiciones en las tarjetas |
| Imagen bloqueada por red | Aparece alternativa legible conservando el espacio de la carta |
| Errores de ejecución | Ninguno durante el recorrido de interfaz |

Navegador usado: Microsoft Edge automatizado con Playwright, instalado temporalmente fuera de las dependencias del proyecto. La herramienta de navegador integrada no pudo iniciarse por un fallo de su entorno; las pruebas se realizaron con Edge local. Los tamaños móviles son emulación de pantalla y entrada táctil, no una prueba en un teléfono físico ni en Safari.

Se inspeccionaron capturas completas de escritorio y móvil. Copias disponibles junto a la entrega de esta conversación; no se añaden capturas extensas a los recursos de producción.

Compilación revisada: JavaScript 387,78 kB (122,18 kB gzip), CSS 22,84 kB (6,16 kB gzip), dos fuentes latinas (47,11 kB en total) y tres imágenes WebP (363.622 bytes en total). La implementación no necesita llamadas a una API para mostrar estas muestras.

## Decisiones de implementación

- Se conserva la carpeta de escritorio indicada por el usuario, en una rama exclusiva; no se ha creado otra copia de trabajo.
- TypeScript 6.0.3 se fija por compatibilidad con la versión instalada del analizador. La versión 7 disponible en el registro no era compatible con ese analizador.
- Se aplica el plan aprobado de comprobaciones visuales y de interacción. No se añaden pruebas unitarias que dupliquen el marcado del prototipo; las pruebas de motor y economía llegarán con esas reglas.
- Las tres imágenes se guardan como muestras locales, con sus fuentes registradas, para mantener estable la primera presentación. El catálogo normalizado será independiente del tipo visual `CardPreview`.
- No se han creado servicios externos, contratado planes ni pedido credenciales.

## Revisión independiente

Un revisor independiente examinó la diferencia `b6cb0f2..ac284d7`, el plan y los casos de revisión. No encontró problemas críticos. Identificó dos problemas de interacción y una omisión de idioma:

1. Volver al inicio desde un fragmento o desde el pie podía dejar la pantalla desplazada. Se usa ahora la identidad de navegación para volver arriba también en la misma ruta.
2. Inicio/Home y el filtro All tenían menos de 44 px de anchura. Se amplió el mínimo y se comprobó a 320 y 390 px en ambos idiomas.
3. La portada no indicaba que las cartas eran inglesas. Se añadió el aviso localizado a la vitrina inicial, por ser un requisito de idioma/procedencia.

La comprobación que reproducía los tres problemas falló antes de las correcciones y pasó después. Volvieron a pasar los recorridos completos de rutas/idiomas, interfaz y acciones, además de análisis de código y compilación. Correcciones guardadas en `7b9e1fe`. No se aplazan observaciones de esta revisión.

El revisor dejó fuera cuentas, economía, combates, multijugador y despliegue porque aún no forman parte de esta fase. Esas funciones siguen pendientes y no se anuncian como operativas. La documentación se completó después de la revisión de código.
