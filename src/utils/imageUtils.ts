/**
 * Image Utilities for High-Quality 300 DPI Wedding Gate Photo Exports
 */

/**
 * Injects 300 DPI metadata into a JPEG Data URL header (JFIF APP0 marker).
 * When downloaded and opened in Photoshop, Illustrator, Windows Properties,
 * or print lab software, the image will immediately display with accurate
 * physical print dimensions (e.g., 22x30 cm, 60x90 cm) at 300 Pixels/Inch.
 */
export function setDpiInJpegDataUrl(dataUrl: string, dpi: number = 300): string {
  const header = 'data:image/jpeg;base64,';
  if (!dataUrl.startsWith(header)) return dataUrl;

  try {
    const base64Str = dataUrl.slice(header.length);
    const binStr = atob(base64Str);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }

    // Must begin with standard JPEG SOI marker (0xFF 0xD8)
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return dataUrl;

    // Search for existing JFIF APP0 marker (0xFF 0xE0)
    let app0Index = -1;
    for (let i = 2; i < Math.min(bytes.length - 14, 120); i++) {
      if (bytes[i] === 0xff && bytes[i + 1] === 0xe0) {
        // "JFIF\0" = 0x4A 0x46 0x49 0x46 0x00
        if (
          bytes[i + 4] === 0x4a &&
          bytes[i + 5] === 0x46 &&
          bytes[i + 6] === 0x49 &&
          bytes[i + 7] === 0x46 &&
          bytes[i + 8] === 0x00
        ) {
          app0Index = i;
          break;
        }
      }
    }

    let finalBytes: Uint8Array;
    if (app0Index !== -1) {
      finalBytes = bytes;
      // units: 1 = dots per inch (DPI)
      finalBytes[app0Index + 11] = 1;
      // Xdensity (high byte, low byte)
      finalBytes[app0Index + 12] = (dpi >> 8) & 0xff;
      finalBytes[app0Index + 13] = dpi & 0xff;
      // Ydensity (high byte, low byte)
      finalBytes[app0Index + 14] = (dpi >> 8) & 0xff;
      finalBytes[app0Index + 15] = dpi & 0xff;
    } else {
      // Insert standard 18-byte JFIF marker right after SOI (FF D8)
      const jfifMarker = new Uint8Array([
        0xff, 0xe0, 0x00, 0x10,
        0x4a, 0x46, 0x49, 0x46, 0x00, // JFIF\0
        0x01, 0x01,                   // version 1.1
        0x01,                         // units: 1 = DPI
        (dpi >> 8) & 0xff, dpi & 0xff,// Xdensity (300)
        (dpi >> 8) & 0xff, dpi & 0xff,// Ydensity (300)
        0x00, 0x00,                   // thumbnail dimensions (0, 0)
      ]);
      finalBytes = new Uint8Array(bytes.length + jfifMarker.length);
      finalBytes.set(bytes.subarray(0, 2), 0);
      finalBytes.set(jfifMarker, 2);
      finalBytes.set(bytes.subarray(2), 2 + jfifMarker.length);
    }

    // Convert to binary string in 16KB chunks to prevent call stack overflow
    let binary = '';
    const chunkSize = 16384;
    for (let i = 0; i < finalBytes.length; i += chunkSize) {
      const chunk = finalBytes.subarray(i, Math.min(i + chunkSize, finalBytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return header + btoa(binary);
  } catch (err) {
    console.warn('Could not inject 300 DPI metadata into JPEG:', err);
    return dataUrl;
  }
}
