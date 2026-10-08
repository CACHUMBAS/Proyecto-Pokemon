# PokePrisma — Plan de implementación de la fase 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Construir una base web local, adaptable y bilingüe que permita revisar la identidad visual de PokePrisma antes de implementar el juego.

**Architecture:** React y TypeScript sobre Vite. Componentes de presentación separados de las futuras reglas de combate y servicios; textos de interfaz centralizados por idioma. La primera entrega representa una propuesta visual y no simula cuentas autenticadas, saldos reales o partidas persistentes.

**Tech Stack:** React, Vite, TypeScript, React Router e i18next/react-i18next; CSS para diseño y efectos. Herramientas gratuitas. Versiones estables compatibles verificadas al iniciar la implementación y fijadas en el archivo de dependencias bloqueadas.

**Spec:** [Diseño de PokePrisma](../specs/2026-10-08-pokeprisma-design.md).

**Estado:** fase 1 implementada y verificada el 8 de octubre de 2026. Ejecución secuencial en este chat y revisión independiente del código. Véase [revisión de la fase](../../revision-fase-1.md). El juego completo sigue en desarrollo.

## Global Constraints

- Nombre: PokePrisma.
- Plataforma: página web para móvil y ordenador.
- Idiomas: español e inglés.
- Identidad: Pokédex tecnológica con cartas holográficas.
- Cuenta obligatoria para jugar y guardar progreso; la fase 1 no habilita acceso ficticio al juego.
- El alcance completo incluye todas las generaciones; las muestras de diseño no representan una restricción del catálogo final.
- Presupuesto inicial de cero euros y sin servicios de pago autorizados.
- Cada fase tendrá su rama, comprobaciones y commits descriptivos.
- No se altera el repositorio de la web anterior.
- Mantener el contenido accesible con teclado y con movimiento reducido.
- Área objetivo de controles táctiles: al menos 44 × 44 px.

## Review Focus

1. Pantallas de 320 y 390 px: controles legibles, sin desplazamiento horizontal y sin depender de hover.
2. Teclado y movimiento reducido: tarjetas y navegación funcionan sin inclinación ni animaciones obligatorias.
3. Cambio de idioma: etiquetas, nombres accesibles y atributo lang del documento cambian juntos; los datos oficiales de cartas no se traducen de forma inventada.
4. Recarga de una ruta: Vite sirve la aplicación local y React Router presenta la pantalla prevista, incluida la ruta desconocida.
5. API o imagen ausente: una muestra visual mantiene su tamaño y comunica la ausencia sin inventar cartas oficiales ni bloquear la navegación.

Estos casos se comprueban en las tareas que los introducen y en la revisión de integración. Las pruebas automatizadas de combate, economía y concurrencia pertenecen a sus fases; no se añaden pruebas que solo reproduzcan el marcado de este prototipo visual.

## Estructura prevista

```text
package.json
package-lock.json
index.html
vite.config.ts
tsconfig*.json
eslint.config.js
src/
  main.tsx
  app/
    App.tsx
    router.tsx
  i18n/
    index.ts
    es.json
    en.json
  styles/
    tokens.css
    global.css
  components/
    layout/AppShell.tsx
    layout/AppShell.css
    language/LanguageSwitcher.tsx
    cards/PokemonCard.tsx
    cards/PokemonCard.css
    ui/Button.tsx
    ui/Button.css
  features/
    landing/LandingPage.tsx
    landing/LandingPage.css
    preview/DesignPreviewPage.tsx
    preview/sample-cards.ts
    not-found/NotFoundPage.tsx
  types/
    card-preview.ts
public/
  favicon.svg
  assets/                 # Solo recursos cuya procedencia se haya registrado
  _sources.md
```

`/` presenta el concepto del juego. `/diseno` reúne componentes y muestras para revisar esta fase local. No sustituye a las futuras rutas autenticadas de colección, equipos o combate. Una ruta desconocida ofrece un enlace real al inicio.

## Task 1: Base navegable y bilingüe

**Files:** crear configuración de Vite/React/TypeScript, `src/main.tsx`, `src/app/App.tsx`, `src/app/router.tsx`, `src/i18n/index.ts`, `src/i18n/es.json`, `src/i18n/en.json`, `src/components/layout/AppShell.tsx`, `src/components/layout/AppShell.css`, `src/components/language/LanguageSwitcher.tsx`, `src/features/landing/LandingPage.tsx` y `src/features/not-found/NotFoundPage.tsx`.

**Interfaces:**
- `type Locale = 'es' | 'en'`.
- `AppShell` recibe `children: React.ReactNode` y muestra marca, navegación y selector de idioma.
- `LanguageSwitcher` usa el idioma de i18next y cambia `document.documentElement.lang`.
- `router` define `/`, `/diseno` y la ruta comodín. Las rutas de juego autenticadas se añadirán en su fase.

- [x] **Step 1:** Crear la rama `feat/base-pokeprisma` desde la documentación revisada; comprobar que no hay cambios ajenos pendientes.
- [x] **Step 2:** Verificar versiones estables compatibles y preparar React/Vite/TypeScript; conservar los documentos y fijar el archivo de dependencias bloqueadas. Añadir exclusiones de dependencias, compilación y credenciales locales.
- [x] **Step 3:** Crear los scripts `dev`, `build`, `preview`, `lint` y `typecheck`; `typecheck` debe ejecutar el compilador de TypeScript sin emitir archivos.
- [x] **Step 4:** Implementar el contenedor y las rutas con contenido mínimo suficiente para recorrerlas. El inicio explica sobres, colección y combates sin declarar funcionalidades aún inexistentes como listas para jugar.
- [x] **Step 5:** Configurar español por defecto e inglés seleccionable. Guardar únicamente la preferencia de idioma local; si el almacenamiento falla o contiene un idioma desconocido, usar español. Centralizar los textos y nombres accesibles en los dos diccionarios.
- [x] **Step 6:** Ejecutar `npm run typecheck`, `npm run lint` y `npm run build`; los tres deben terminar sin errores.
- [x] **Step 7:** Comprobar en navegador cambio de idioma, recarga y ruta desconocida. Confirmar el cambio de `lang`, foco visible y navegación por teclado. Registrar limitaciones reales si la herramienta de navegador no está disponible.
- [x] **Step 8:** Commit: `chore: crear base navegable y bilingue de PokePrisma`.

## Task 2: Identidad visual y tarjeta holográfica

**Files:** crear `src/styles/tokens.css`, `src/styles/global.css`, `src/types/card-preview.ts`, `src/components/cards/PokemonCard.tsx`, `src/components/cards/PokemonCard.css`, `src/components/ui/Button.tsx`, `src/components/ui/Button.css`, `src/features/preview/DesignPreviewPage.tsx`, `src/features/preview/sample-cards.ts` y `public/_sources.md`. Modificar portada y contenedor.

**Interfaces:**
- `CardPreview` contiene `id: string`, `name: string`, `imageUrl: string | null`, `rarityLabel: string`, `typeLabels: string[]`, `origin: 'tcgdex' | 'pokeprisma'`, `language: Locale | 'other'`.
- `PokemonCard` recibe `card: CardPreview` y `onSelect?: (id: string) => void`; si existe acción usa un control accesible y la comunica con un nombre localizado.
- `Button` admite las propiedades estándar de botón y `variant: 'primary' | 'secondary'`; el tipo predeterminado es `button`.
- Los objetos de muestra no se guardan como inventario de usuario ni contienen estadísticas atribuidas falsamente a una carta oficial.

- [x] **Step 1:** Definir tokens iniciales de fondo azul tinta, superficies, texto, acentos cian/violeta, espaciado y tipografía; comprobar contraste antes de reutilizarlos.
- [x] **Step 2:** Crear una pequeña selección de cartas de muestra con datos comprobados y procedencia registrada. Incluir un ejemplo sin imagen para comprobar la alternativa, identificado como muestra del diseño.
- [x] **Step 3:** Implementar la tarjeta con proporción estable, imagen alternativa y reflejo holográfico decorativo. En puntero preciso, limitar la inclinación; en táctil, presentar una variante estática. No iniciar movimientos si está activo `prefers-reduced-motion`.
- [x] **Step 4:** Componer la portada con marca PokePrisma, propuesta del juego y una composición visual de cartas; añadir `/diseno` para revisar estados de controles y tarjetas. No recoger contraseñas ni presentar un inicio de sesión que parezca operativo.
- [x] **Step 5:** Comprobar 320, 390, 768 y 1440 px; las cartas, textos y navegación no deben producir desbordamiento horizontal. Verificar selección por teclado, foco visible e imagen ausente.
- [x] **Step 6:** Comprobar ambos idiomas, texto largo y movimiento reducido. Los reflejos no cubren información necesaria y no se usan destellos rápidos.
- [x] **Step 7:** Ejecutar `npm run typecheck`, `npm run lint` y `npm run build`; commit: `feat: definir identidad visual y cartas de PokePrisma`.

## Task 3: Revisión y entrega de la fase

**Files:** modificar `README.md`; crear `docs/revision-fase-1.md` y actualizar `public/_sources.md` con los recursos efectivamente usados.

**Interfaces:** consume las rutas, idiomas y componentes de las tareas 1 y 2. Produce una base visual revisable y una lista explícita de funciones aún no implementadas.

- [x] **Step 1:** Recorrer `/`, `/diseno` y una ruta desconocida en ambos idiomas y comprobar consola, enlaces, imágenes y uso con teclado. Repetir tamaños únicamente si hubo cambios que afecten a su comportamiento.
- [x] **Step 2:** Ejecutar `npm run typecheck`, `npm run lint`, `npm run build` y `git diff --check`. Registrar los resultados obtenidos, sin convertir verificaciones pendientes en aprobadas.
- [x] **Step 3:** Actualizar README con instrucciones de ejecución y alcance real de la fase. Guardar capturas de la propuesta visual cuando el navegador esté disponible.
- [x] **Step 4:** Revisar el diff de la fase frente al plan; resolver defectos importantes antes de presentarla.
- [x] **Step 5:** Commit: `docs: registrar revision de la base PokePrisma`; subir `feat/base-pokeprisma` a GitHub.
- [x] **Step 6:** Presentar la base visual y preparar el plan de catálogo con las interfaces efectivamente construidas. No declarar completo el juego por terminar esta fase.

## Dependencias para fases posteriores

- Cuenta/proyecto de Supabase y configuración Google OAuth bajo control del usuario.
- Proveedor gratuito viable de correo para confirmar cuentas y recuperar contraseñas; requiere comprobar entrega real.
- Mapeo y cobertura de catálogo, configuración de rarezas y estadísticas propias aprobadas tras las pruebas del motor.
- Registro de música, imágenes y audio seleccionados.

Estas dependencias no bloquean la primera fase local. Se resolverán cuando se construya cada servicio, sin solicitar contraseñas o tokens en el chat ni habilitar planes de pago.
