# Sobres: Perla y Noche

Primer bloque visual aprobado: dos acabados intercambiables inspirados en la presentación de cartas de TCG Pocket, con identidad propia de Lumemon. Se desarrolla sobre el flujo de colección y sobres existente.

## Qué cambia

- Selector Perla / Noche en Colección y Sobres. Recuerda la elección en este navegador, sincroniza pestañas y permite seguir usando el selector si el almacenamiento está bloqueado (avisa que durará solo esa visita). No se guarda en Supabase ni se sincroniza entre dispositivos.
- Paleta blanca perlada con acentos lavanda o azul profundo con violeta. Cabecera y pie acompañan esas dos rutas; el cambio se retira al salir. No es todavía un rediseño de Inicio, Cuenta, Catálogo, Equipo o Combate.
- Sobre Prisma metalizado construido con CSS y el símbolo SVG existente. No se añadieron imágenes generadas, modelos 3D ni paquetes. Las cartas decorativas proceden del catálogo real del sobre; el texto aclara que no son contenido garantizado.
- Apertura modal al recibir o consultar un recibo: rasgar horizontalmente o pulsar Abrir; avanzar carta a carta; destacar la rareza de Lumemon; ver resumen con todas las copias, incluidos duplicados. Saltar muestra todo sin animación. Escape/cerrar vuelve al botón para repetir el visionado.
- Los controles de monedas, fragmentos, bienvenida y confirmación reutilizan los mismos comandos. Precios, tamaño, probabilidades y contenido llegan del servidor. El recibo ya confirmado es la fuente del revelado. Repetirlo no compra ni sortea de nuevo.
- Accesibilidad: alternativa de botón al gesto, diálogo nativo, foco restaurado, contador anunciado, ES/EN y respeto de prefers-reduced-motion. El gesto vertical se reserva para desplazamiento.

## Verificación

La suite terminó con 252 pruebas correctas; cinco casos nuevos cubren preferencia válida/inválida, almacenamiento bloqueado, secuencia del revelado, salto y umbral del gesto. Se observó el fallo inicial de los cinco casos y después su éxito. Lint y build con TypeScript pasaron tras los últimos ajustes.

Comprobación visual local en 1440 px, 390 px y 320 px. Temas conservados al recargar; apertura por arrastre y por teclado; avance hasta tercera carta; salto con duplicados; Escape y foco en Volver a ver. En la sesión real se abrió solo el historial: Machop, Onix, Machop; saldo 0 monedas/0 fragmentos y 12 copias permanecieron. No se gastaron recursos. La salida hacia Catálogo retira el tema de colección.

Demo local: http://localhost:5174/scripts/qa/pack-gallery.html. Usa componentes reales con saldo y recibo simulados, lo indica en pantalla y no llama a Supabase. Solo se monta en desarrollo y no está incluida en el build público. El ajuste de movimiento reducido se revisó en CSS; no se emuló el sistema ni se probó un teléfono físico. No se repitió una compra real porque no cambió su lógica.

## Entrega y siguiente fase

Rama original `feat/pearl-violet-packs`. Publicación autorizada el 2026-10-27 junto con el álbum de `feat/collection-album`, desde `feat/publish-collection-experience` hacia `chore/vercel-lumemon`. Consultar [CONTEXTO-IA.md](CONTEXTO-IA.md) para el resultado verificado. Mantener las referencias a esta evidencia y las claves anteriores del juego. Extender el tema al resto de pantallas, añadir sonidos a los sobres o introducir otras expansiones son fases posteriores, no funciones incluidas aquí.
