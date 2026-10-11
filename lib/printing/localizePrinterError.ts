/**
 * Maps common Chromium WebUSB / Web Bluetooth / Web Serial English
 * messages to Spanish for UI display.
 */
export function localizePrinterError(
  error: unknown,
  fallback: string
): string {
  const raw =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : typeof error === 'string'
          ? error
          : '';

  const name =
    error && typeof error === 'object' && 'name' in error
      ? String((error as { name: unknown }).name)
      : '';

  const text = raw.trim();
  const lower = text.toLowerCase();

  if (
    /unsupported\s*device/i.test(text) ||
    lower === 'unsupported device' ||
    lower === 'unsupported device.'
  ) {
    return 'Dispositivo no soportado. En USB elegí el dispositivo en el selector de Chrome (el emparejado del sistema no alcanza). Si sigue fallando, probá Bluetooth o Serial desde el menú.';
  }

  if (/not\s*found/i.test(text) || name === 'NotFoundError') {
    return 'No se encontró o no se seleccionó ningún dispositivo.';
  }

  if (name === 'AbortError' || /user cancelled|user canceled|the user cancelled/i.test(text)) {
    return 'Selección cancelada.';
  }

  if (name === 'SecurityError' || /must be handling a user gesture|user activation/i.test(text)) {
    return 'Se necesita un nuevo toque para abrir el selector de dispositivos.';
  }

  if (/access\s*denied|claim(?:ing)?\s*(?:the\s*)?interface|unable to claim/i.test(text)) {
    return 'No se pudo acceder a la impresora USB. En Windows puede hacer falta WinUSB (Zadig); en macOS quitá la impresora de “Impresoras y escáneres”.';
  }

  if (/network\s*error|gatt/i.test(text) && /fail/i.test(text)) {
    return 'Falló la conexión Bluetooth (GATT). Acercá la impresora, asegurate de que esté encendida y reintentá.';
  }

  if (/no\s*device\s*selected/i.test(text)) {
    return 'No se seleccionó ningún dispositivo.';
  }

  // Already Spanish (our own errors) or unknown — keep text if present.
  if (text) return text;
  return fallback;
}
