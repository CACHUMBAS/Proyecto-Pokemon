# PokePrisma — Diseño del juego

Fecha: 8 de octubre de 2026.
Estado: documento inicial para revisión. Recoge decisiones acordadas y propuestas de implementación; aún no hay producto implementado.

## 1. Objetivo y alcance acordado

Crear un juego web personal que pueda abrirse posteriormente a más jugadores. Debe funcionar en navegador tanto en móvil como en ordenador, en español e inglés, con una identidad visual de Pokédex tecnológica y cartas holográficas. Presupuesto inicial: cero euros. Sin fecha de entrega impuesta.

El recorrido principal es crear cuenta, elegir un equipo inicial equilibrado, aprender en el tutorial, ganar combates, obtener monedas, abrir sobres, ampliar la colección y preparar nuevos equipos. Los duplicados se pueden convertir voluntariamente en fragmentos, que también sirven para obtener sobres.

Se incluyen todas las generaciones, sin limitar la colección a los primeros 151 Pokémon. Se utilizarán cartas de TCGdex y datos de Pokémon de PokéAPI. Cuando no exista una carta disponible para una especie, habrá una carta propia claramente identificada, con su imagen de PokéAPI. No se presentará como una carta oficial del TCG.

El juego usa reglas propias simplificadas. No reproduce el reglamento del TCG físico ni pretende ejecutar automáticamente todos los textos impresos de las cartas.

### Requisitos fijados por el usuario

| Área | Decisión |
| --- | --- |
| Nombre | PokePrisma |
| Plataforma | Página web para móvil y ordenador |
| Idiomas | Español e inglés |
| Identidad | Pokédex tecnológica con cartas holográficas |
| Cuenta | Obligatoria; Google y correo/contraseña |
| Catálogo | Todas las generaciones |
| Cartas Pokémon | Variantes con diferentes estadísticas; mayor poder para cartas raras |
| Apoyos | Cartas de Entrenador y Energía con mejoras temporales |
| Equipo | Seis Pokémon y hasta tres apoyos |
| Inicio | Equipo equilibrado y minitutorial contra la máquina |
| Economía | Monedas por victorias; fragmentos de duplicados; ambos canjeables por sobres |
| Máquina | Partidas rápidas y campaña de entrenadores |
| Multijugador | Salas privadas mediante código |
| Combate | Turnos, tipos y estados alterados |
| Tiempos | 45 segundos por turno; 60 segundos de margen de reconexión |
| Audio | Música, efectos y gritos de Pokémon |
| Trabajo | VS Code, ramas y commits; repositorio proporcionado por el usuario |
| Coste | Sin servicios de pago autorizados |

## 2. Decisiones propuestas para la primera versión

Estas concreciones hacen implementable la base acordada. Los valores de equilibrio se revisarán con pruebas antes de publicarlos como reglas definitivas.

- El jugador elige uno de tres equipos iniciales de seis especies distintas, diseñados con poder similar y variedad de tipos. Se concede una única vez por cuenta.
- Un equipo de combate contiene seis especies diferentes y variantes que el jugador posee. Se permite guardar varios equipos y marcar uno como activo.
- La colección conserva cantidades por variante. Se fragmentan solo copias sobrantes y mediante una acción explícita; nunca se elimina automáticamente la última copia o una carta seleccionada sin avisar de las consecuencias.
- La rareza aumenta el presupuesto de estadísticas; cada variante también tendrá una distribución propia. Los valores serán estables por identificador de carta y versión de equilibrio, nunca sorteados de nuevo al abrir la ficha.
- Un sobre se paga íntegramente con monedas o con fragmentos. La composición, las probabilidades y el precio se muestran antes de abrirlo. Serán sobres propios del juego, no reproducciones de probabilidades comerciales.
- Las victorias válidas contra la máquina y otros jugadores conceden monedas según una tabla versionada. Una partida solo puede conceder su recompensa una vez. El tutorial entrega su recompensa una sola vez.
- El progreso competitivo se basa inicialmente en la colección y los equipos. No se añade un sistema de crianza, IV/EV o entrenamiento de niveles en esta versión.

## 3. Pantallas y navegación

1. **Acceso:** registro, acceso con Google/correo, verificación de correo y recuperación de contraseña. La portada puede explicar el juego; jugar y guardar progreso requiere cuenta.
2. **Inicio:** perfil, monedas, fragmentos, equipo activo y accesos a jugar, sobres y colección.
3. **Tutorial:** partida preparada que enseña ataque, ventaja de tipo, cambio, apoyo y un estado alterado. Se puede repetir o saltar; la recompensa no se duplica.
4. **Sobres:** catálogo de sobres, precio y probabilidades; confirmación del canje, animación y resultado recuperable.
5. **Colección:** cartas, cantidades y filtros por especie, tipo, generación, rareza y expansión; detalle y fragmentación de duplicados.
6. **Equipos:** seis plazas de Pokémon, tres de apoyos, variantes poseídas y validación del equipo.
7. **Jugar:** partidas rápidas contra la máquina, selección de campaña y salas privadas.
8. **Sala:** crear/unirse mediante código, mostrar rival y equipo listo; no mostrar las decisiones privadas de combate.
9. **Combate:** Pokémon activos, reservas, salud, estados, movimientos, apoyos, reloj y registro de acciones.
10. **Resultado:** victoria/derrota, recompensa concedida y siguiente acción.
11. **Ajustes:** idioma, música, efectos, movimiento reducido y sesión.

En móvil, el tablero prioriza rival, Pokémon activo y controles inferiores accesibles. Las reservas tienen un panel propio; no se reduce un tablero de escritorio hasta hacerlo ilegible.

## 4. Identidad visual y accesibilidad

Dirección propuesta: fondo azul tinta, paneles de instrumentación claros, acentos cian y violeta y reflejos prismáticos ligados a la rareza. La carta y sus ilustraciones son protagonistas; los controles conservan contraste y jerarquía visual.

El efecto holográfico se activa con puntero donde exista y dispone de una presentación estática en táctil. Movimiento reducido elimina inclinaciones, destellos y entradas innecesarias. La apertura de sobres siempre permite saltar la animación sin cambiar el resultado.

Se usan nombres de tipos e iconos además del color, botones reales para acciones, foco visible, navegación por teclado y mensajes de estado comprensibles. Los avisos importantes no dependen exclusivamente del sonido. Los controles táctiles tendrán un área objetivo de al menos 44 × 44 px.

La interfaz es bilingüe desde el inicio. Se conserva el idioma elegido. Si un texto o imagen de carta no está disponible en español, se usa una alternativa disponible y se identifica su idioma; no se inventan traducciones oficiales.

## 5. Combate simplificado

### Equipo y turnos

- Un Pokémon activo y cinco reservas por jugador. Los seis empiezan con salud completa.
- Ambos jugadores eligen su acción dentro del mismo plazo de 45 segundos. Las elecciones permanecen privadas hasta resolver el turno.
- Acciones: usar uno de hasta cuatro movimientos, cambiar a una reserva disponible o activar un apoyo aún no usado.
- Cambios primero, apoyos después y ataques por velocidad. Los empates usan azar generado en el servidor y registrado para poder reproducir el resultado.
- Un Pokémon debilitado no ejecuta un ataque pendiente. Si el rival cambió, el ataque se dirige al Pokémon que haya quedado activo.
- Salud cero implica debilitamiento. Se elige sustituto sin consumir el siguiente ataque; esa elección también tiene límite de tiempo. Pierde quien no conserva Pokémon disponibles; si ambos equipos quedan sin Pokémon por el mismo efecto de fin de turno, hay empate.

### Estadísticas, movimientos y tipos

Salud, ataque, defensa y velocidad son las estadísticas principales del reglamento inicial. La rareza y la variante modifican su distribución dentro de límites definidos en la configuración de equilibrio.

PokéAPI aporta las relaciones de tipos de Pokémon y movimientos. Se aplican inmunidad, resistencia, neutralidad y debilidad, combinando los tipos defensivos cuando existan dos. Los tipos impresos del TCG no sustituyen esta tabla.

Se define una selección de movimientos implementados, con daño directo o efectos de estado conocidos. Cada especie recibe hasta cuatro movimientos compatibles. Mostrar una descripción en una API no significa que su efecto se pueda ejecutar: movimientos o habilidades que el motor no implemente no aparecerán como opciones jugables.

Las estadísticas de combate se identifican como reglas de PokePrisma, diferenciadas del texto impreso de las cartas físicas. La fórmula de daño, los multiplicadores de rareza y el mapeo de movimientos se concretan en una configuración versionada en la fase del motor y se prueban antes de integrarse en partidas con recompensas.

### Estados propuestos

| Estado | Efecto simplificado inicial para probar |
| --- | --- |
| Veneno | Resta el 8 % de la salud máxima al final del turno, redondeado hacia abajo con mínimo 1 |
| Quemadura | Resta el 5 % al final del turno y reduce el daño de ataques al 80 % |
| Parálisis | Reduce la velocidad al 50 %; no añade pérdida aleatoria de acciones |
| Sueño | Impide el siguiente intento de ataque y después termina; se puede cambiar o usar apoyo |
| Congelación | Impide el siguiente intento de ataque y después termina; recibir un ataque de Fuego también la elimina |

Máximo un estado principal por Pokémon. Los estados pueden aplicarse únicamente mediante movimientos o apoyos definidos por el motor. Los Pokémon de tipo Veneno o Acero no reciben veneno; Fuego no recibe quemadura; Eléctrico no recibe parálisis; Hielo no recibe congelación. Estas son reglas simplificadas del proyecto, no una implementación completa de las excepciones oficiales.

Veneno, quemadura y parálisis persisten al cambiar. El daño de fin de turno se aplica solo al Pokémon activo. Sueño y congelación se eliminan al pasar a la reserva para evitar bloqueos prolongados. Un efecto que intenta imponer un segundo estado principal no reemplaza el existente. Curar estados no revive a un debilitado.

### Apoyos

Hasta tres cartas de Entrenador/Energía seleccionadas antes de la partida. Activar una ocupa la acción de ese turno. Cada apoyo se usa una vez por combate y permanece en la colección al terminar.

Las cartas se asocian a efectos propios explícitos: curación, limpieza de estado, protección o mejora temporal de daño. Se publica su duración y alcance. No se ejecutan automáticamente los textos del TCG ni se habilita un apoyo sin mapeo. Las reglas de acumulación y los valores numéricos se prueban en la fase del motor.

### Plazos y reconexión

El servidor establece el vencimiento del turno. Si no llega una acción, se registra pasar y se continúa cuando corresponda; el navegador no puede prorrogar el tiempo ni retroceder el estado.

Reconexión: margen máximo de 60 segundos desde la desconexión registrada. Reconectar devuelve la última versión confirmada de la partida y no reinicia los 45 segundos. El jugador puede perder una acción durante su ausencia, pero recuperar la partida dentro del margen. La implementación debe distinguir desconexión, abandono y fallo de servicio antes de conceder una victoria.

Las salas sin actividad se cierran sin conceder recompensas artificiales. Las reglas de vencimiento se resuelven usando tiempos de servidor incluso si ningún navegador estuvo abierto cuando pasó el plazo; no dependen de mantener una función durmiendo 45 segundos.

## 6. Colección y catálogo

PokéAPI identifica especies, formas, tipos, estadísticas base, movimientos y gritos. TCGdex aporta cartas, imágenes, expansión, rareza y datos disponibles por idioma.

Se usan identificadores estables, no coincidencias por nombre traducido. Una variante se enlaza a su especie/forma cuando el dato permita hacerlo con fiabilidad; los casos ambiguos van a revisión del catálogo antes de ser jugables. Cartas con varios Pokémon requieren una regla explícita de asignación, no elegir el primero de manera silenciosa.

Todas las especies deben estar representadas, mediante carta disponible o propia. Las formas con datos pueden representarse como variantes; incorporar una forma no implica implementar automáticamente megaevolución, teracristalización u otras mecánicas de transformación.

El catálogo se importa y normaliza por lotes, se pagina y se almacena en caché. Una partida usa una instantánea de datos y reglas; no consulta las API externas para calcular cada ataque. Un fallo de las API no invalida la colección guardada ni modifica una partida iniciada.

Las imágenes ausentes tienen alternativa visible. En el registro de recursos se conservarán procedencia, idioma y condiciones de uso conocidas. La disponibilidad técnica de una imagen o un audio no se presentará como una licencia comercial.

## 7. Arquitectura propuesta

- **Cliente:** React, Vite y TypeScript; enrutado por pantallas e internacionalización español/inglés. Lógica visual separada del motor.
- **Motor:** módulo TypeScript independiente de React, con entradas/salidas tipadas, azar inyectado y reglas versionadas. Compartible entre pruebas y lógica de servidor.
- **Servidor y datos:** Supabase Auth, Postgres, funciones de servidor y Realtime. El servidor autentica, valida propiedad de cartas, acciones, turnos, azar, resultados y recompensas.
- **Tiempo real:** canales privados con permisos por participante; sus mensajes anuncian estados confirmados. El canal no permite escribir directamente salud, monedas o resultados.
- **Publicación:** Vercel para la web. Supabase aloja los servicios de cuenta/datos; no se intenta alojar un servidor WebSocket permanente en una función de Vercel.

Flujo de una acción: petición autenticada con identificador único y versión esperada → lectura del estado autorizado → validación y cálculo → confirmación atómica solo si la versión sigue vigente → notificación a participantes. Un conflicto devuelve el estado actual sin aplicar dos veces la acción.

El motor calcula sobre datos de servidor y confirma mediante una transacción o control de versión en Postgres. Abrir un sobre descuenta el saldo y concede todas sus cartas en una única operación atómica e idempotente. Cerrar una partida concede su recompensa una sola vez. La animación del navegador representa un resultado ya registrado.

## 8. Datos y controles esenciales

Entidades: perfiles, especies/formas, definiciones de cartas, variantes jugables, inventarios con cantidades, equipos y plazas, definiciones de sobres, aperturas, movimientos de monedas/fragmentos, salas, participantes, partidas, elecciones privadas de turno, eventos y recompensas.

El progreso pertenece al usuario autenticado. Las políticas de acceso impiden leer inventarios privados ajenos o modificar directamente saldos. Se distinguen datos públicos de perfil y datos privados de cuenta. Las credenciales administrativas solo existen en el entorno del servidor.

Las elecciones pendientes del adversario no aparecen en el estado público ni en las notificaciones. Se validan los dos jugadores listos, sus equipos y la propiedad de cartas al empezar. Los equipos y reglas quedan fijados para esa partida.

Se limita la creación/join de salas, las acciones repetidas y la concesión de recompensas. Monedas y fragmentos son enteros no negativos. Fragmentar una copia y gastar saldo exige comprobar la cantidad dentro de la misma operación que la modifica.

## 9. Máquina, tutorial y campaña

La máquina usa decisiones programadas, con dificultad basada en selección de movimientos y cambios; no requiere contratar un modelo de IA.

El tutorial usa situaciones preparadas y textos localizados para enseñar las reglas, sin depender de recibir cartas raras. La campaña desbloquea entrenadores progresivamente. Las partidas rápidas permiten elegir dificultad. Ambos modos comparten el motor de combate y validación de recompensas del multijugador.

## 10. Audio

Gritos disponibles a través de PokéAPI; efectos para apertura, daño, estados y resultados. Música de fondo seleccionada o creada con procedencia documentada. No se presupone una banda sonora comercial disponible para redistribuir.

El audio comienza después de una interacción permitida por el navegador, con manejo de errores y controles separados de música y efectos. La falta de un grito o el bloqueo de audio no interrumpe una partida.

## 11. Servicios gratuitos y dependencias externas

La propuesta comienza en planes gratuitos. No se activan pruebas con cobro posterior, mejoras de plan ni servicios de pago sin autorización. Las cuotas reales se comprueban al configurar y antes de abrir el juego a más jugadores.

Supabase Free puede pausar proyectos inactivos y limita almacenamiento, transferencia y conexiones. Su correo integrado no es un proveedor de envío de producción: el acceso público mediante correo/contraseña requiere un SMTP con emisor verificable, recuperación y confirmación probadas. Debe resolverse con una opción gratuita compatible antes de anunciar ese acceso como listo; no se eliminará la verificación para ocultar la limitación.

Google necesita configurar OAuth en una cuenta del usuario. Supabase, Google y publicación se vincularán cuando corresponda; no se han creado cuentas ni recursos externos durante esta planificación.

## 12. Fases y criterios de aceptación

| Fase | Entrega verificable |
| --- | --- |
| 1. Base y dirección visual | React/Vite/TypeScript, navegación, español/inglés, interfaz adaptable y tarjeta holográfica accesible; sin fingir cuentas o partidas funcionales |
| 2. Catálogo | Importación normalizada, cobertura de especies, cartas propias de respaldo, filtros, paginación, caché e idioma alternativo |
| 3. Motor y tutorial | Equipos de seis, ataques, tipos, estados, apoyos, azar reproducible y tutorial completo con pruebas de reglas |
| 4. Cuentas y persistencia | Google y correo, recuperación, políticas de acceso, colección y equipo inicial concedido una sola vez |
| 5. Economía y máquina | Sobres atómicos, monedas/fragmentos, duplicados, campaña y partidas rápidas con recompensas validadas |
| 6. Salas privadas | Dos cuentas reales, acciones privadas, sincronización, 45 segundos, reconexión, conflictos y abandonos |
| 7. Acabado y publicación | Audio, animaciones, comprobación móvil/ordenador, permisos de recursos, cuotas y despliegue de prueba |

La primera fase tiene un plan propio. Las fases siguientes tendrán planes concretos al fijar sus interfaces y datos; no se sustituye la entrega completa por el prototipo de la primera fase.

## 13. Verificación necesaria

- Motor: tabla completa de tipos, dobles tipos, inmunidades, turnos, empates, estados, apoyos y debilitamientos simultáneos.
- Economía: concurrencia al gastar, peticiones repetidas, saldo insuficiente, duplicados y recuperación de una apertura tras recargar.
- Acceso: usuarios distintos, sesión caducada, recuperación y ausencia de permisos administrativos en el cliente.
- Multijugador: dos sesiones separadas, elecciones ocultas, cambios de versión, reloj de servidor, pérdida de conexión y reconexión.
- Interfaz: tamaños móvil/escritorio, teclado, movimiento reducido, errores de red, idiomas y audio bloqueado.
- Catálogo: traducciones e imágenes ausentes, rarezas desconocidas, especies nuevas y mapeos ambiguos sin inventar datos oficiales.

## 14. Referencias consultadas

- https://pokeapi.co/docs/v2 — catálogo de Pokémon y relaciones de tipos.
- https://tcgdex.dev/es — catálogo multilingüe; cobertura variable según idioma.
- https://tcgdex.dev/rest/card — información de cartas.
- https://github.com/PokeAPI/cries — sonidos disponibles.
- https://supabase.com/pricing — plan gratuito y límites.
- https://supabase.com/docs/guides/auth/auth-smtp — requisitos de correo.
- https://supabase.com/docs/guides/auth/social-login/auth-google — acceso con Google.
- https://vercel.com/docs/plans/hobby — alojamiento para uso personal.

Las cuotas y los servicios se verificarán nuevamente al configurarlos. Los detalles de equilibrio de este documento son propuestas propias para PokePrisma, no reglas atribuidas a Pokémon ni funcionalidades garantizadas por sus API.
