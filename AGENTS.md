# PokePrisma — instrucciones para agentes

Estas reglas son específicas de este repositorio y sirven para Antigravity, Codex y otros agentes compatibles. Las instrucciones actuales del usuario y las políticas del entorno tienen prioridad. No transfieren permisos ni acceso a herramientas entre aplicaciones.

## Al comenzar

- Trabaja en español con el usuario. Justifica brevemente cada bloque y comunica resultados verificables.
- En una sesión nueva, lee [el contexto](docs/CONTEXTO-IA.md) y consulta `git status --short --branch`, `git log -5 --oneline` y `package.json`. Lee solo los archivos relevantes después. No releas todo en cada mensaje.
- Distingue petición de explicación, planificación e implementación. Una pregunta sobre el proyecto no autoriza cambios. Para una tarea ya autorizada, completa su alcance sin pedir confirmación por cada edición rutinaria.
- Resume el siguiente bloque y su criterio de terminado. Si «continúa» no permite deducir un bloque concreto, pregunta antes de ampliar funcionalidad.
- Para cambios de código, consulta la habilidad [cambio-verificado](.agents/skills/cambio-verificado/SKILL.md). No presupongas que están instaladas las skills, herramientas, sesiones o credenciales de otro agente.

## Alcance y permisos

- Haz un bloque acotado por vez. No conviertas una mejora en un rediseño, migración o fase completa no solicitada. Respeta «solo analiza» y «haz esto y paramos».
- Pide autorización antes de instalar nuevas dependencias, contratar servicios, introducir costes, configurar cuentas externas, desplegar, borrar trabajo o fusionar con la rama principal. Prepara antes lo que pueda revisarse localmente.
- El flujo acordado incluye ramas, commits y push del trabajo solicitado. Esto no autoriza force-push, reescribir historial, publicar secretos ni operaciones ajenas a la tarea. No envíes mensajes a terceros.
- No inventes APIs, datos oficiales, estadísticas, precios, resultados de pruebas ni funcionalidades terminadas. Investiga lo desconocido o señala la decisión pendiente.

## Git y coordinación

- Comprueba el árbol antes de editar. Conserva cambios ajenos y separa los propios. No uses `reset --hard`, `clean` ni descartes automáticos.
- Usa una rama nueva por bloque desde la base correcta. No asumas que `main` contiene el trabajo más reciente; verifica la ascendencia y el contexto.
- Un solo agente escribe en la misma carpeta a la vez. Una rama distinta no aísla dos agentes dentro del mismo checkout. Para trabajo simultáneo se necesitan carpetas/worktrees separados y alcance independiente.
- Revisa el diff y añade únicamente archivos propios. Después de push verifica la sincronización y declara cualquier cambio pendiente.

## Invariantes del producto

- Web React/Vite/TypeScript, móvil y escritorio, ES/EN; reutiliza componentes y estilo existentes.
- Catálogo no equivale a colección. `/equipo` es un borrador local de prueba, no propiedad de cartas ni persistencia de cuenta.
- Seis especies distintas; IDs del catálogo, nunca nombres para enlazar variantes. No habilites asociaciones ambiguas ni interpretes tipos/textos del TCG como reglas de combate.
- Presupuesto inicial cero. No publiques claves, `.env`, tokens ni datos personales en commits, documentación o respuestas.
- Conserva idioma real, procedencia y alternativas de imágenes; no conviertas disponibilidad de un recurso en licencia comercial.

## Calidad y consumo

- Prueba riesgos reales: reglas, persistencia, errores y regresiones. Para cambios de código ejecuta los comandos pertinentes de `package.json`; verifica interfaz cuando cambie. Documentación sola no exige recompilar todo.
- No afirmes éxito sin observar los resultados. Indica qué comprobaste y qué queda sin comprobar.
- Lee por partes con búsquedas dirigidas; no vuelques el catálogo ni el historial entero. No lances agentes, auditorías, importaciones o pruebas repetidas sin necesidad. Usa ayuda adicional solo si el usuario lo autoriza o una instrucción aplicable la exige.
- Al cerrar un bloque, actualiza el estado de `docs/CONTEXTO-IA.md` si cambió, con fecha, alcance y evidencia. Mantén propuestas separadas de lo implementado. Termina con resultado, comprobaciones, rama/commit y límites relevantes.
