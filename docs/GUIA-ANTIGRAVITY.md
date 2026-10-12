# Lumemon — empezar con Antigravity

## Abrir el proyecto

Abre como carpeta de trabajo la raíz del proyecto Lumemon, donde están `package.json` y `AGENTS.md`. En este ordenador es `C:\Users\ffran\OneDrive\Datos adjuntos\Desktop\PokePrisma`. Cierra o deja inactivo el agente de Codex antes de permitir que Antigravity edite esa misma carpeta.

La entrega documental más reciente es `docs/reglas-combate-lumemon`, creada desde `bc5be88` (`chore/rename-lumemon`). Incluye el nombre Lumemon, el constructor y el filtro de tipos de Antigravity. Usa esta rama o una posterior que contenga el trabajo; comprueba el estado y conserva cualquier cambio local antes de cambiar de rama.

Las [reglas de combate v0.1](superpowers/specs/2026-10-12-lumemon-battle-rules-design.md) son una propuesta para revisión: no son un motor implementado ni una orden de programarlo. Conserva esa distinción en los resúmenes y pide una tarea concreta antes de empezar otro bloque.

La marca visible es Lumemon; la carpeta local sigue llamándose `PokePrisma` y el repositorio `Proyecto-Pokemon`. Las claves de idioma/equipo y los identificadores internos conservan el nombre anterior por compatibilidad. No hagas un reemplazo global ni migres estos datos como parte de otra tarea.

Según la [documentación de reglas de Antigravity](https://antigravity.google/docs/rules), `AGENTS.md` en la raíz se carga como instrucción persistente del proyecto. La habilidad está en `.agents/skills/cambio-verificado/SKILL.md`, una ubicación compatible con el IDE, CLI y Antigravity 2.0 según la [documentación de skills](https://antigravity.google/docs/skills). El contexto largo se consulta al comenzar una sesión o cuando cambie; no se incluye entero en cada regla.

Los archivos están preparados, pero su carga en tu instalación no se ha comprobado. Abre un chat nuevo en Antigravity y usa este mensaje inicial:

```text
Estamos trabajando en Lumemon (antes PokePrisma). La carpeta local sigue llamándose PokePrisma; no la renombres ni cambies las claves de almacenamiento. Lee AGENTS.md y docs/CONTEXTO-IA.md desde la raíz del repositorio. Comprueba la rama, el último commit y los cambios pendientes. Confirma si detectas la skill cambio-verificado y lee su SKILL.md.

Por ahora no modifiques archivos ni hagas instalaciones. Resume en cinco puntos qué funciona, qué falta, las reglas de trabajo y cuál sería un siguiente bloque pequeño. Distingue el equipo local de prueba de un inventario con cuenta. Si consultas las reglas de combate v0.1, distínguelas de código implementado y de decisiones ya aprobadas. No empieces ese bloque hasta que te lo pida.
```

Si no detecta los archivos, comprueba la carpeta abierta y adjunta o menciona `AGENTS.md` explícitamente. Puedes revisar las skills activas en Customizations del panel de agente. No basta con que diga «he entendido»: su resumen debería mencionar Lumemon, el catálogo, `/equipo` con filtro de tipos, la compatibilidad del guardado local y que aún no existen combates ni cuentas.

## Para cada tarea posterior

```text
Tarea: [resultado concreto].
Alcance: [qué debe cambiar y qué queda fuera].
Terminado cuando: [comportamientos que debo poder comprobar].

Aplica AGENTS.md y la skill cambio-verificado. Conserva el diseño y ES/EN, usa una rama por bloque, verifica lo cambiado y actualiza docs/CONTEXTO-IA.md. Al completar esta tarea, para. No instales dependencias ni publiques la web sin mi permiso.
```

Ejemplo acotado de planificación: «Propón los contratos del motor de combate según la especificación. Entrega decisiones y casos de prueba; todavía no implementes el motor ni cambies la interfaz».

## Qué transfiere este paquete

Decisiones, estado, preferencias y un método verificable. No entrena el modelo, no copia toda la conversación ni instala las herramientas/skills globales de Codex. Antigravity conserva sus propias capacidades, límites y permisos. Las reglas reducen desviaciones, pero no garantizan resultados perfectos; Git, pruebas y revisión permiten detectar errores.

Actualiza el contexto tras cada bloque. Cuando vuelvas a Codex, pide que lea ese mismo archivo y revise los nuevos commits para recuperar la continuidad sin repetir el historial completo.
