# Variedades y Calidades

**Rutas:**
- `/home/varieties` — menú de primer nivel con tabs
  - `?tab=varieties` — Variedades
  - `?tab=qualities` — Calidades (tipos)
- Redirects legacy: `/home/products/varieties`, `/home/products/formats`

**Server actions:** `app/actions/varieties.ts`, `app/actions/formats.ts`

## Modelo

- **Calidad** (`formats`): solo tipo (nombre, descripción, activo). Sin precio.
- **Variedad**: columna JSON `qualityPrices` — por cada tipo de calidad: `{ qualityId, qualityName, priceCLP, priceUSD, currency }`.
- **Historial**: tabla `variety_price_history` (cambios de precio en el tiempo).

Al crear un tipo de calidad se agrega la entrada (precio 0) a todas las variedades. Al crear una variedad se inicializan todas las calidades activas. Los precios se editan en la UI de la variedad (uno o todas).

## Recepción

Al elegir variedad + calidad, el precio default sale de `qualityPrices` del par. El operador puede overridear en el pack.
