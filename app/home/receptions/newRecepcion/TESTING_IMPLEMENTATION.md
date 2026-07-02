# Estado actual de tests · Nueva recepción

Este documento resume **los test automatizados que ya están activos** para el flujo `app/home/receptions/newRecepcion`. No describe planes, sino la implementación real disponible hoy.

---

## 1. Pruebas de integración sobre `processReception`

- **Runner**: `tests/scripts/run-reception-tests.ts`
- **Ejecución recomendada**:
  ```bash
  NODE_ENV=test CONFIG_PATH=$(pwd)/app.config.test.json \
  npx ts-node tests/scripts/run-reception-tests.ts
  ```
- **Qué hace**:
  1. Establece el entorno (`NODE_ENV=test`, `CONFIG_PATH`).
  2. Abre una conexión TypeORM contra la base indicada en `app.config.test.json`.
  3. Para cada escenario ejecuta:
     - `resetReceptionDatabase` → `TRUNCATE` coordinado de todas las tablas relevantes (`transactions`, `reception_packs`, `pallets`, etc.).
     - `seedReceptionBaseData` → Inserta los fixtures mínimos (usuario operador, temporada activa, productor, variedades CLP/USD, bandeja base, pallets disponibles, etc.).
     - Llama al escenario (`scenarioReception*.test.ts`) que invoca `processReception` y valida el estado resultante directamente en MySQL mediante los helpers de `tests/helpers/reception-assertions.ts`.
  4. Muestra un resumen en consola y cierra la conexión.

- **Cobertura por escenario** (todos en `tests/scenarios/`):
  | Archivo | Descripción | Validaciones clave |
  | --- | --- | --- |
  | `reception-basic.test.ts` | Recepción simple en CLP con asignación completa a un pallet. | `transactions.amount`, metadata `totals`, relaciones `RECEPTION_PACK`, `TRAY_RECEPTION`, `PALLET_ASSIGNMENT`, estado final del pallet. |
  | `reception-multi-currency.test.ts` | Packs CLP + USD aplicando tipo de cambio. | `totalCLPToPay`, `payableCLP`, `payableUSD`, acumulación de bandejas, ausencia de pallets asignados. |
  | `reception-tray-return.test.ts` | Devolución parcial de bandejas. | Notas en metadata (`trayReturns`), relación `TRAY_DEVOLUTION`, transacción hija `TRAY_OUT_TO_PRODUCER`. |
  | `reception-multi-pallet.test.ts` | Distribución de un pack entre dos pallets. | Dos relaciones `PALLET_ASSIGNMENT`, actualización de ambas entidades `pallets` y sus metadata. |
  | `reception-error.test.ts` | Pallet inexistente. | Verifica que `processReception` responde con error y que no quedan filas en `transactions`, `reception_packs` ni `transaction_relations` (rollback completo). |

- **Helpers reutilizados**:
  - `tests/helpers/reception-db.ts`: prepara fixtures persistentes y normaliza la enumeración `transactions.type` para incluir los valores usados por el flujo.
  - `tests/helpers/reception-assertions.ts`: agrupa queries y asserts reutilizables (transacción principal, packs, relaciones, estado de pallets, etc.).

---

## 2. Pruebas E2E Playwright (interfaz)

- **Ubicación**: `tests/e2e/receptions/reception-basic.spec.ts`
- **Proyectos Playwright**: usa el proyecto `electron` definido en `playwright.config.ts` (un solo worker, reporter HTML/JSON/JUnit).
- **Datos de prueba**:
  - `resetReceptionUiState` y `seedReceptionUiData` (`tests/e2e/receptions/helpers/reception-fixtures.ts`) hacen TRUNCATE + insertan usuarios (`test_admin`), temporada 2025, un productor, bandeja de 0.5 kg, tres pallets vacíos, variedad CLP y USD.
  - Contraseña del usuario UI: `test123456`.
- **Page object**: `ReceptionsPage` encapsula interacciones (seleccionar productor, agregar pack, asignar pallet, abrir resumen, enviar la recepción, etc.).
- **Escenarios cubiertos**:
  1. **Recepción CLP simple**: arma un pack, asigna un pallet, confirma la recepción y valida que, tras el disparo del flujo de impresión silenciosa, la pantalla vuelve a su estado inicial (sin packs y con el botón “Procesar recepción” deshabilitado). Después consulta MySQL reutilizando las mismas assertions que los tests de integración.
  2. **Recepción CLP + USD sin tipo de cambio**: agrega dos packs (uno CLP y otro USD), verifica indicadores UI (“Total a pagar usd”, “Cambio pendiente”), comprueba el reseteo del formulario y valida la persistencia en base de datos.
- **Cómo ejecutar**:
  1. Compilar la capa Electron (`npm run build:electron`) para garantizar que `dist/src/main.dev.js` esté disponible.
  2. Levantar la app (`npm run dev`) si se desea observar el flujo manualmente; los tests E2E también pueden lanzar su propia instancia a través de `AppHelper`.
  3. En otra terminal ejecutar Playwright:
     ```bash
     npm run test:e2e -- tests/e2e/receptions/reception-basic.spec.ts
     ```
     (Opcional) `npm run test:e2e:headed` para ver la ejecución o `npm run test:e2e -- --ui` para inspeccionar paso a paso. Durante los tests, `electronAPI.printHtml` se stubbea para devolver `{ success: true }`, de modo que no se requiere impresora configurada.
- **Artefactos**: reportes HTML (`playwright-report/`), JSON y JUnit en `test-results/`, además de screenshots/videos/trace cuando hay fallos.

---

## 3. ¿Qué queda cubierto?

- Toda la lógica de `processReception` (happy paths + rollback) se ejercita contra MySQL real, verificando metadata, relaciones y actualizaciones colaterales.
- La interfaz permite validar que el formulario arma correctamente el snapshot, abre el resumen y envía los datos esperados.
- La misma librería de assertions comparte lógica entre pruebas de backend y UI, asegurando criterios consistentes.

Para ampliar la cobertura solo hay que añadir nuevos escenarios en `tests/scenarios/` (backend) o specs adicionales en `tests/e2e/receptions/`, reutilizando los helpers existentes.
