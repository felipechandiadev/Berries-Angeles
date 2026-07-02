# Guía de implementación · Recepciones

Este documento describe el flujo completo para registrar una recepción, las entidades involucradas y los vínculos que deben crearse entre transacciones y pallets.

---

## 1. Estructuras de datos clave

```ts
export interface ReceptionPack {
   id: number;
   varietyId: number;
   varietyName: string;
   formatId: number;
   formatName: string;
   trayId: number | null;
   trayLabel: string | null;
   traysQuantity: number;
   unitTrayWeight: number;
   traysTotalWeight: number;
   grossWeight: number;
   netWeightBeforeImpurities: number;
   impurityPercent: number;
   netWeight: number;
   pricePerKg: number;
   currency: 'CLP' | 'USD';
   totalToPay: number;
   palletAssignments: Array<{ palletId: number; traysAssigned: number }>;
   createdAt: string;
   updatedAt: string;
}

export interface TransactionRelation {
   id: number;
   parentTransactionId: number;
   childTransactionId: number;
   relationType: 'RECEPTION_PACK' | 'TRAY_RECEPTION' | 'TRAY_DEVOLUTION' | 'PALLET_ASSIGNMENT';
   context?: string | null;
   createdAt: string;
   updatedAt: string;
}

export interface ReceptionChangeLogEntry {
   changedAt: string;
   changedBy: number;
   changedByName: string;
   summary: string;
   details?: Array<{
      field: string;
      previousValue: unknown;
      newValue: unknown;
   }>;
}
```

La metadata del pallet (`PalletMetadata`) está definida como un arreglo de asignaciones:

```ts
export interface PalletTrayAssignment {
   receptionPackId: string;
   trayId: string;
   quantity: number;
}

export type PalletMetadata = PalletTrayAssignment[] | null;
```

---

## 2. Flujo de recepción

### 2.1 Creación de packs
- En la UI se construyen los `ReceptionPack` con cantidades, pesos y moneda.
- Persistir cada pack asociado a la transacción principal (ver seguimiento con `RECEPTION_PACK`).

### 2.2 Transacción principal `RECEPTION`
- Crear una transacción `RECEPTION` (`direction: OUT`, `unit: 'CLP'`, `amount` igual a `totalCLPToPay`).
- Metadata recomendada:
   - Identificación del productor (`producerId`, `producerName`).
   - Número de guía (`guideNumber`).
   - Listas de variedades, formatos y tipos de bandeja presentes.
   - Packs completos (estructura `ReceptionPack`).
   - Totales consolidados (conteo de packs, pesos brutos/netos, montos a pagar por moneda, etc.).
   - `exchangeRate` (cambio aplicado; iniciar en `0` cuando aún no se ha definido un valor).
   - `totalCLPToPay` (suma de `payableCLP` más `payableUSD * exchangeRate`).
   - `changesHistory`: historial de modificaciones a la recepción.

Toda modificación relevante (por ejemplo: actualización del tipo de cambio, ajustes en `totalCLPToPay` o packs) debe agregar una entrada a `changesHistory` utilizando la estructura `ReceptionChangeLogEntry`, detallando el usuario, momento del cambio y los campos afectados.

### 2.3 `TRAY_IN_FROM_PRODUCER`
- Por cada tipo de bandeja entregada en la recepción:
   - Crear una transacción `TRAY_IN_FROM_PRODUCER` (`direction: IN`, `unit: 'TRAY'`).
   - `amount` = bandejas recibidas de ese tipo.
   - Metadata mínima: `receptionId`, `trayId`, `trayLabel`, `quantity`, opcionalmente `packIds` que consumen la bandeja.

### 2.4 `TRAY_OUT_TO_PRODUCER`
- Por cada tipo de bandeja devuelta al productor:
   - Crear transacción `TRAY_OUT_TO_PRODUCER` (`direction: OUT`, `unit: 'TRAY'`).
   - `amount` = bandejas devueltas.
   - Metadata sugerida: `receptionId`, `trayId`, `trayLabel`, `quantityReturned`, `notes` opcionales.

### 2.5 `PALLET_TRAY_ASSIGNMENT`
- Para cada asignación de bandejas a un pallet proveniente de un pack:
   - Crear transacción `PALLET_TRAY_ASSIGNMENT` (`direction: IN`, `unit: 'TRAY'`, `amount` = bandejas asignadas).
   - Metadata: `receptionId`, `packId`, `palletId`, `trayId`, `traysAssigned`, `performedBy` y `timestamp`.
   - Actualizar entidad `Pallet`:
      - Incrementar `traysQuantity` y ajustar pesos si aplica.
      - Recalcular `metadata` con la colección `PalletTrayAssignment[]`. Cada elemento debe reflejar `receptionPackId`, `trayId` y `quantity` asignada acumulada.

### 2.6 Relaciones entre transacciones
Crear registros `TransactionRelation` para encadenar la recepción con el resto de eventos:

| Relación | Parent | Child | ¿Cuándo usarla? | Contexto recomendado |
| --- | --- | --- | --- | --- |
| `RECEPTION_PACK` | `RECEPTION` | Transacción que representa el pack (si existe) o identificador del pack persistido | Para enlazar cada pack recibido con la transacción principal. | `pack {packNumber}` |
| `TRAY_RECEPTION` | `RECEPTION` | `TRAY_IN_FROM_PRODUCER` | Para amarrar el ingreso de bandejas que llegaron cargadas con fruta (las mismas que luego se asignan a pallets). | `tray {trayLabel} · pack {packId}` |
| `TRAY_DEVOLUTION` | `RECEPTION` | `TRAY_OUT_TO_PRODUCER` | Para registrar bandejas vacías que se devuelven al productor (no necesariamente coinciden en cantidad con las recibidas). | `tray {trayLabel} · qty {quantity}` |
| `PALLET_ASSIGNMENT` | `RECEPTION` | `PALLET_TRAY_ASSIGNMENT` | Para rastrear cada traspaso de bandejas del pack al pallet correspondiente. | `pack {packId} → pallet {palletId}` |

Además:
- Los movimientos de entrada (`TRAY_IN_FROM_PRODUCER`) siempre representan las bandejas que llegan cargadas; deben vincularse al pack correspondiente porque luego esas mismas unidades se asignan a pallets.
- Las devoluciones (`TRAY_OUT_TO_PRODUCER`) pueden ser parciales o totales respecto de lo recibido. Usa un contexto descriptivo con la cantidad devuelta.

---

## 3. Ejemplos

### 3.1 Transacción `RECEPTION`

```json
{
   "id": 7125,
   "type": "RECEPTION",
   "status": "PROCESSED",
   "createdAt": "2025-12-10T14:22:31.840Z",
   "metadata": {
      "producerId": 48,
      "producerName": "Agrícola Andes SpA",
      "guideNumber": "G-2025-00451",
      "varietyIds": [1001, 1002, 1003],
      "formatIds": [1001, 1003],
      "trayTypeIds": [1003, 1004],
      "exchangeRate": 0,
      "packs": [
         {
            "packId": 201,
            "varietyId": 3,
            "varietyName": "Blueberry Premium",
            "formatId": 5,
            "formatName": "Box 5kg",
            "trayId": 12,
            "trayLabel": "Bandeja Básica C",
            "traysQuantity": 4,
            "unitTrayWeightKg": 0.35,
            "traysTotalWeightKg": 1.4,
            "grossWeightKg": 8.9,
            "impurityPercent": 0,
            "netWeightKg": 8.9,
            "currency": "CLP",
            "pricePerKg": 8500,
            "totalToPay": 75638100,
            "palletAssignments": [
               { "palletId": 1005, "traysAssigned": 2 },
               { "palletId": 1007, "traysAssigned": 2 }
            ]
         }
      ],
      "trayReturns": [
         {
            "transactionId": 9120,
            "trayId": 12,
            "trayLabel": "Bandeja Básica C",
            "quantityReturned": 3
         }
      ],
      "totals": {
         "packsCount": 1,
         "traysInPacks": 4,
         "trayReturns": 3,
         "grossWeightKg": 8.9,
         "netWeightKg": 8.9,
         "trayWeightKg": 1.4,
         "payableCLP": 75638100,
         "payableUSD": 0,
         "totalCLPToPay": 75638100
      },
      "totalCLPToPay": 75638100,
      "changesHistory": [
         {
            "changedAt": "2025-12-10T14:22:31.840Z",
            "changedBy": 31,
            "changedByName": "María Pérez",
            "summary": "Registro inicial de la recepción",
            "details": [
               { "field": "exchangeRate", "previousValue": null, "newValue": 0 },
               { "field": "totalCLPToPay", "previousValue": null, "newValue": 75638100 }
            ]
         }
      ]
   }
}
```

### 3.2 `TRAY_IN_FROM_PRODUCER`

```json
{
   "type": "TRAY_IN_FROM_PRODUCER",
   "direction": "IN",
   "amount": 4,
   "unit": "TRAY",
   "metadata": {
      "receptionTransactionId": 7125,
      "trayId": 12,
      "trayLabel": "Bandeja Básica C",
      "packsUsingTray": [201],
      "quantity": 4
   }
}
```

### 3.3 Metadata de pallet tras asignación

```json
{
   "id": 1005,
   "traysQuantity": 40,
   "capacity": 60,
   "metadata": [
      { "receptionPackId": "201", "trayId": "12", "quantity": 2 },
      { "receptionPackId": "198", "trayId": "12", "quantity": 6 }
   ]
}
```

### 3.4 Relaciones registradas

```json
[
   {
      "parentTransactionId": 7125,
      "childTransactionId": 8201,
      "relationType": "RECEPTION_PACK",
      "context": "pack 201"
   },
   {
      "parentTransactionId": 7125,
      "childTransactionId": 8307,
      "relationType": "TRAY_DEVOLUTION",
      "context": "tray Bandeja Básica C"
   },
   {
      "parentTransactionId": 7125,
      "childTransactionId": 8450,
      "relationType": "PALLET_ASSIGNMENT",
      "context": "pack 201 → pallet 1005"
   }
]
```

---

## 4. Validaciones y mejores prácticas

- **Consistencia de bandejas**: la suma de `traysAssigned` por pack debe igualar `traysQuantity`. Las transacciones `TRAY_IN_FROM_PRODUCER` y `TRAY_OUT_TO_PRODUCER` deben cuadrar con saldos históricos.
- **Actualización de pallets**: tras cada asignación recalcular disponibilidad (`capacity - traysQuantity`) y reflejarla en UI/exports.
- **Auditoría**: registrar usuario ejecutor y timestamps en cada transacción; mantener snapshots de etiquetas (variedad, formato, bandeja) dentro de la metadata.
- **Relaciones**: no crear duplicados para la misma pareja parent/child; incluir `context` legible para facilitar debugging.
- **Bitácora de cambios**: cada vez que se alteren datos claves (ej. `exchangeRate`, montos, packs) recalcular `totalCLPToPay` y registrar una entrada en `changesHistory` con los valores previos y actuales.

---

## 5. Checklist de desarrollo

- Servicio para crear recepción debe envolver todo el proceso en una transacción DB.
- Implementar utilidades para:
   - Generar transacciones satélite (`TRAY_IN_FROM_PRODUCER`, `TRAY_OUT_TO_PRODUCER`, `PALLET_TRAY_ASSIGNMENT`).
   - Registrar `TransactionRelation` según el mapa anterior.
   - Actualizar `Pallet` (`status`, `traysQuantity`, `metadata`).
- Añadir pruebas que verifiquen:
   - Totales y montos de la recepción.
   - Integridad de relaciones (`count` esperado por tipo).
   - Persistencia correcta de `PalletMetadata` tras asignaciones múltiples.

Esta guía debe revisarse cuando se agreguen nuevos tipos de transacción o variaciones en el flujo operativo.
