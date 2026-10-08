# PokePrisma

Un universo web de cartas Pokémon y combates por turnos, para móvil y ordenador.

**Estado: fase 1, base visual funcional.** Esta entrega permite explorar la portada, cambiar entre español e inglés, navegar por las muestras, filtrar cartas y abrir sus fichas. El catálogo completo, las cuentas, los sobres, la economía y los combates pertenecen a las siguientes fases.

## Abrir en VS Code

Abre esta carpeta en VS Code y su terminal integrada. Necesitas Node.js 24 o superior y npm.

```sh
npm ci
npm start
```

`npm start` y `npm run dev` hacen lo mismo. Abre [PokePrisma local](http://127.0.0.1:5174/). El puerto 5174 es fijo para evitar confundir este proyecto con otras webs locales. Para detenerlo, pulsa Ctrl+C en la terminal que lo inició.

## Comprobar y compilar

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

La compilación queda en `dist/`. La vista previa de esa compilación se abre en [localhost:4174](http://127.0.0.1:4174/). No es un despliegue público.

Para formatear archivos editados: `npx prettier --write src`. Las versiones están fijadas en `package-lock.json`.

## Qué se puede probar

- `/`: portada, carrusel manual de tres cartas, presentación y recorrido del proyecto.
- `/diseno`: tres cartas verificadas de TCGdex y una muestra propia sin imagen; filtros y fichas de procedencia.
- Cualquier ruta desconocida: pantalla de recuperación con enlace al inicio.
- Selector ES/EN: guarda solo el idioma; sigue funcionando si el navegador bloquea almacenamiento.
- Teclado: enlace para saltar al contenido, filtros, selección de carta, Escape para cerrar ficha y foco restaurado.
- Reflejos holográficos con ratón; acabado estático en táctil y con movimiento reducido.

Las ilustraciones de las tres cartas están en inglés y así se identifican en sus fichas. Sus tipos y rarezas son del TCG impreso; todavía no son estadísticas del combate de PokePrisma. No existe un inventario, sesión o saldo simulado.

## Estructura

- `src/app`: rutas y contenedor de la aplicación.
- `src/components`: tarjetas, idioma, botones y estructura compartida.
- `src/features`: portada, vista de muestras y ruta no encontrada.
- `src/i18n`: diccionarios y sincronización de idioma.
- `src/styles`: fuentes locales, tokens y estilos comunes.
- `public/assets/cards`: tres ilustraciones de muestra, sin dependencia de la API al navegar.

## Documentación

- [Diseño del juego](docs/superpowers/specs/2026-10-08-pokeprisma-design.md).
- [Plan y progreso de la fase 1](docs/superpowers/plans/2026-10-08-pokeprisma-fase-1.md).
- [Revisión de la fase 1](docs/revision-fase-1.md).
- [Plan inicial de catálogo, fase 2](docs/superpowers/plans/2026-10-08-pokeprisma-fase-2.md).
- [Procedencia de imágenes y tipografías](public/_sources.md).

## Desarrollo

Repositorio: https://github.com/CACHUMBAS/Proyecto-Pokemon. Cada fase se desarrolla en su rama con comprobaciones y commits. La base visual está en `feat/base-pokeprisma`, a partir de `docs/plan-inicial`.

No requiere claves ni cuentas de servicios para ejecutarse. No se han creado recursos de Supabase ni publicado esta web. Las funciones persistentes y multijugador se construirán en sus fases, manteniendo presupuesto inicial de cero euros. Las credenciales locales están excluidas de Git.
