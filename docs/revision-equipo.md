# Revisión del constructor de equipo

Fecha: 2026-10-09. Rama: `feat/constructor-equipo`, desde `d9203d3`.

## Alcance

- Ruta `/equipo`, accesible desde la navegación, en español e inglés.
- Seis especies distintas seleccionadas del catálogo; una ilustración por especie.
- Sustitución de variantes sin cambiar la plaza, retirada de miembros y selección del primero.
- Borrador local versionado, validación contra catálogo al recuperar y control de escrituras obsoletas.
- Sin inventario, cuentas, estadísticas propias ni combates; se identifica como equipo de prueba.

## Verificación

- Pruebas unitarias de almacenamiento bloqueado/lleno, formato inválido, referencias falsas o antiguas, errores de red, selección y conflicto entre pestañas.
- Recorrido real con Edge: añadir seis, impedir una séptima especie, sustituir ilustración, cambiar el primero, recargar, navegar y retirar.
- ES/EN, foco tras retirar y ausencia de desbordamiento horizontal a 320, 390, 768 y 1440 px.
- Simulación de fallo al cargar variantes: el borrador permanece intacto y se recupera al reintentar.
- Borrador corrupto: no se sobrescribe antes de descartarlo explícitamente.
- Almacenamiento bloqueado: selección usable en memoria con aviso visible.
- Dos pestañas: sincronización y rechazo de una escritura sobre una copia obsoleta.
- Sin excepciones JavaScript en el recorrido principal. Inspección visual de escritorio y móvil.

## Revisión de código

Se detectó y corrigió la sobrescritura desde una segunda pestaña: el guardado compara el borrador esperado y el hook escucha cambios de almacenamiento. La revisión posterior no encontró más incidencias importantes. El guardado local no sustituye la futura persistencia de una cuenta ni la autoridad del servidor.
