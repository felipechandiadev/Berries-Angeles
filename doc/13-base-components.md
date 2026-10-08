# Componentes base (`baseComponents/`)

**Ubicación:** `app/baseComponents/`

## Descripción

Librería de componentes UI interna de Berries Angeles. Proporciona un sistema de diseño consistente sin depender de librerías externas como MUI o shadcn. Todos los módulos de la aplicación usan estos componentes.

## Componentes disponibles

### Formularios

| Componente | Descripción |
|------------|-------------|
| `CreateBaseForm` | Formulario base para creación de entidades. Layout estándar con campos, validación y botones de acción |
| `UpdateBaseForm` | Formulario base para edición. Carga datos existentes y permite modificación |
| `DeleteBaseForm` | Formulario de confirmación de eliminación con mensaje de advertencia |
| `TextField` | Campo de texto con label, error y estilos consistentes |
| `Select` | Selector dropdown con opciones |
| `AutoComplete` | Campo con autocompletado y búsqueda |
| `Switch` | Toggle on/off |
| `NumberStepper` | Input numérico con botones +/- |
| `RangeSlider` | Slider de rango |
| `DropdownList` | Lista desplegable de opciones |

### Datos y tablas

| Componente | Descripción |
|------------|-------------|
| `DataGrid` | Tabla de datos completa con sorting, paginación, filtros y toolbar |
| `DataGrid/Header` | Cabecera de columnas con sorting |
| `DataGrid/Body` | Cuerpo de la tabla con filas |
| `DataGrid/Footer` | Pie con información de registros |
| `DataGrid/Pagination` | Control de paginación |
| `DataGrid/Toolbar` | Barra de herramientas (búsqueda, filtros, exportar) |
| `DataGrid/ColHeader` | Header individual de columna |

### Navegación y layout

| Componente | Descripción |
|------------|-------------|
| `TopBar` | Barra superior con título, menú hamburguesa y botón de usuario |
| `SideBar` | Menú lateral con navegación por módulos |

### Diálogos y feedback

| Componente | Descripción |
|------------|-------------|
| `Dialog` | Modal genérico con título, contenido y acciones |
| `DialogToPrint` | Diálogo optimizado para impresión |
| `Alert` | Notificación/alerta (usa `AlertContext`) |
| `Badge` | Etiqueta de estado o categoría |
| `DotProgress` | Indicador de progreso con puntos |

### Acciones

| Componente | Descripción |
|------------|-------------|
| `Button` | Botón estándar con variantes |
| `ButtonPill` | Botón con estilo pill/redondeado |
| `IconButton` | Botón solo con ícono |

### Archivos y ubicación

| Componente | Descripción |
|------------|-------------|
| `MultimediaUploader` | Subida de archivos multimedia |
| `MultimediaUpdater` | Actualización de archivos existentes |
| `LocationPicker` | Selector de ubicación con mapa Leaflet |
| `LocationPickerWrapper` | Wrapper SSR-safe para LocationPicker |

## Sistema de diseño

### Estilos

- **Tailwind CSS** con variables CSS definidas en `app/global.css`
- Tema basado en variables: `--foreground`, `--background`, `--primary`, etc.
- Configuración en `tailwind.config.js`

### Íconos

- **Material Symbols** via `@fontsource-variable/material-symbols-outlined`
- Se usan como font icons en toda la aplicación

### Theming

Los colores se definen como variables CSS, lo que permite cambiar el tema sin modificar componentes individuales.

## DataGrid — componente central

El `DataGrid` es el componente más utilizado. Lo usan casi todos los módulos para mostrar listas de datos:

- Recepciones (`ReceptionsGrid`)
- Productores (`ProductiveUnitsGrid`)
- Pallets, anticipos, auditoría, usuarios

Características:
- Columnas configurables con sorting
- Paginación server-side
- Toolbar con búsqueda y filtros
- Exportación a Excel integrada
- Estilos de columna personalizables (`columnStyles.ts`)

## Patrón de uso

```tsx
// Ejemplo típico en un módulo
import DataGrid from '@/app/baseComponents/DataGrid/DataGrid';
import CreateBaseForm from '@/app/baseComponents/BaseForm/CreateBaseForm';
import Dialog from '@/app/baseComponents/Dialog/Dialog';
import Button from '@/app/baseComponents/Button/Button';
```

Los formularios base (`CreateBaseForm`, `UpdateBaseForm`) proveen layout consistente; cada módulo define sus campos específicos como children.
