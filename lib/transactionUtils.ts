export function translateTransactionType(type: string): string {
  const translations: Record<string, string> = {
    TRAY_ADJUSTMENT: 'Ajuste de Bandejas',
    TRAY_IN_FROM_PRODUCER: 'Entrada desde Productor - Recepción',
    TRAY_OUT_TO_PRODUCER: 'Salida a Productor - Recepción',
    TRAY_OUT_TO_CLIENT: 'Salida a Cliente',
    TRAY_IN_FROM_CLIENT: 'Entrada desde Cliente',
    TRAY_RECEPTION_FROM_PRODUCER: 'Recepción desde Productor',
    TRAY_RECEPTION_FROM_CLIENT: 'Recepción desde Cliente',
    TRAY_DELIVERY_TO_PRODUCER: 'Entrega a Productor',
    TRAY_DELIVERY_TO_CLIENT: 'Entrega a Cliente',
    RECEPTION: 'Recepción',
    PALLET_TRAY_ASSIGNMENT: 'Asignación Bandeja-Pallet',
    PALLET_TRAY_RELEASE: 'Liberación Bandeja-Pallet',
    ADVANCE: 'Anticipo',
    SETTLEMENT: 'Liquidación',
    DISPATCH: 'Despacho',
  };

  return translations[type] || type;
}
