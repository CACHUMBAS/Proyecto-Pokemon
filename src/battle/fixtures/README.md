# Fuentes de la tabla de tipos

Copias de referencia del repositorio de PokéAPI, revisión `2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72` (la misma fijada por el catálogo). Consultadas el 12 de octubre de 2026 y comprobadas de nuevo por hash al implementar el cálculo el 13 de octubre.

| Archivo | Fuente | SHA-256 con saltos LF |
| --- | --- | --- |
| `types.csv` | [PokéAPI: types.csv](https://raw.githubusercontent.com/PokeAPI/pokeapi/2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72/data/v2/csv/types.csv) | `37f039c8d722f47d51ba1c5c5ecf9b7007235b1a9a1af2827645c777b70307c8` |
| `type-efficacy.csv` | [PokéAPI: type_efficacy.csv](https://raw.githubusercontent.com/PokeAPI/pokeapi/2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72/data/v2/csv/type_efficacy.csv) | `cdd7de4066680414d0a2433af805f139f425d6350cbf998ecab559a0fe8ff587` |

Las pruebas contrastan los 324 pares de los tipos ordinarios (IDs 1–18) contra la tabla de producción en `../type-chart.ts`. Estos CSV no se cargan en una partida ni se consultan por red. No se incluyen tipos especiales, históricos ni los tipos impresos del TCG como tipos jugables.

La fórmula de daño, afinidad y mejoras pertenece a Lumemon: [reglas](../../../docs/superpowers/specs/2026-10-12-lumemon-battle-rules-design.md). Cambiar una fuente o regla exige revisar y versionar el cálculo; no actualizar ambas tablas silenciosamente para ocultar una discrepancia.
