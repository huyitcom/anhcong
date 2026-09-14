/**
 * Font Embedder Utility for Canvas / html-to-image High-Resolution Exports
 * 
 * Embeds Google Fonts as base64 Data URIs directly into SVG / Canvas options
 * so exported images render with exact custom typography without falling back
 * to system default fonts (e.g. Times New Roman).
 */

interface FontConfig {
  query: string;
  isScript?: boolean;
}

export const SUPPORTED_GOOGLE_FONTS: Record<string, FontConfig> = {
  'Alex Brush': { query: 'Alex+Brush', isScript: true },
  'Bodoni Moda': { query: 'Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900' },
  'Cinzel': { query: 'Cinzel:wght@400..800' },
  'Cormorant Garamond': { query: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400' },
  'Dancing Script': { query: 'Dancing+Script:wght@400..700', isScript: true },
  'Great Vibes': { query: 'Great+Vibes', isScript: true },
  'Montserrat': { query: 'Montserrat:ital,wght@0,300..800;1,300..800' },
  'Pinyon Script': { query: 'Pinyon+Script', isScript: true },
  'Playfair Display': { query: 'Playfair+Display:ital,wght@0,400..900;1,400..900' },
  'Plus Jakarta Sans': { query: 'Plus+Jakarta+Sans:wght@300;400;500;600;700' },
};

// In-memory cache for base64 font CSS
const fontCssCache = new Map<string, string>();
// In-memory cache for font file binaries
const fontBinaryCache = new Map<string, string>();

/**
 * Converts an ArrayBuffer to a base64 string safely
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Fetch and embed a single Google Font family as base64 CSS
 */
async function fetchAndEmbedFont(fontFamily: string): Promise<string> {
  // Normalize font name
  const cleanName = fontFamily.replace(/['",]/g, '').trim();
  const config = SUPPORTED_GOOGLE_FONTS[cleanName];
  if (!config) return '';

  if (fontCssCache.has(cleanName)) {
    return fontCssCache.get(cleanName)!;
  }

  try {
    const url = `https://fonts.googleapis.com/css2?family=${config.query}&display=swap`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      console.warn(`[FontEmbedder] Failed to fetch CSS for font: ${cleanName}`);
      return '';
    }

    let css = await res.text();
    const urlMatches = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)];

    // Download each font binary file in parallel and convert to base64
    await Promise.all(
      urlMatches.map(async (m) => {
        const fontUrl = m[1];
        let dataUri = fontBinaryCache.get(fontUrl);
        if (!dataUri) {
          try {
            const fontRes = await fetch(fontUrl);
            if (fontRes.ok) {
              const buf = await fontRes.arrayBuffer();
              const b64 = arrayBufferToBase64(buf);
              const mime = fontUrl.endsWith('.woff2')
                ? 'font/woff2'
                : fontUrl.endsWith('.ttf')
                ? 'font/truetype'
                : 'font/woff';
              dataUri = `data:${mime};charset=utf-8;base64,${b64}`;
              fontBinaryCache.set(fontUrl, dataUri);
            }
          } catch (e) {
            console.warn(`[FontEmbedder] Could not fetch font binary: ${fontUrl}`, e);
          }
        }
        if (dataUri) {
          css = css.replace(fontUrl, dataUri);
        }
      })
    );

    // If script font, duplicate @font-face rules with font-style: italic so it matches regardless of italic styling
    if (config.isScript) {
      const italicRules = css.replace(/font-style:\s*normal;/g, 'font-style: italic;');
      css = css + '\n' + italicRules;
    }

    fontCssCache.set(cleanName, css);
    return css;
  } catch (err) {
    console.error(`[FontEmbedder] Error embedding font ${cleanName}:`, err);
    return '';
  }
}

/**
 * Detects all font families used inside an HTML element and its descendants
 */
function detectFontsInElement(element: HTMLElement): Set<string> {
  const detected = new Set<string>();
  const supportedNames = Object.keys(SUPPORTED_GOOGLE_FONTS);

  const checkFontString = (fontStr: string | null) => {
    if (!fontStr) return;
    for (const name of supportedNames) {
      if (fontStr.toLowerCase().includes(name.toLowerCase())) {
        detected.add(name);
      }
    }
  };

  checkFontString(element.style.fontFamily);
  const elements = element.querySelectorAll('*');
  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    checkFontString(htmlEl.style.fontFamily);
    const computed = window.getComputedStyle(htmlEl).fontFamily;
    checkFontString(computed);
  });

  return detected;
}

/**
 * Retrieves the complete base64 @font-face CSS for all fonts used in the target element
 */
export async function getEmbeddedFontCSS(
  containerElement?: HTMLElement | null,
  explicitFonts: (string | undefined | null)[] = []
): Promise<string> {
  // Wait for document fonts to be ready first
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore
    }
  }

  const fontsToEmbed = new Set<string>();

  // Add explicit fonts
  explicitFonts.forEach((f) => {
    if (!f) return;
    const clean = f.replace(/['",]/g, '').trim();
    for (const name of Object.keys(SUPPORTED_GOOGLE_FONTS)) {
      if (clean.toLowerCase().includes(name.toLowerCase())) {
        fontsToEmbed.add(name);
      }
    }
  });

  // Detect fonts from container
  if (containerElement) {
    const detected = detectFontsInElement(containerElement);
    detected.forEach((f) => fontsToEmbed.add(f));
  }

  // Always ensure default primary fonts are included just in case
  fontsToEmbed.add('Great Vibes');
  fontsToEmbed.add('Dancing Script');
  fontsToEmbed.add('Bodoni Moda');
  fontsToEmbed.add('Playfair Display');
  fontsToEmbed.add('Plus Jakarta Sans');

  const cssPromises = Array.from(fontsToEmbed).map((font) => fetchAndEmbedFont(font));
  const cssList = await Promise.all(cssPromises);
  return cssList.filter(Boolean).join('\n\n');
}

/**
 * Pre-warms the font cache in background on page load
 */
export function prefetchCommonFonts() {
  if (typeof window === 'undefined') return;
  const commonFonts = [
    'Great Vibes',
    'Dancing Script',
    'Bodoni Moda',
    'Playfair Display',
    'Alex Brush',
    'Pinyon Script',
    'Cinzel',
    'Cormorant Garamond',
    'Montserrat',
    'Plus Jakarta Sans',
  ];

  const doPrefetch = async () => {
    for (const font of commonFonts) {
      if (!fontCssCache.has(font)) {
        await fetchAndEmbedFont(font);
      }
    }
  };

  if ('requestIdleCallback' in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
      doPrefetch();
    });
  } else {
    setTimeout(doPrefetch, 2000);
  }
}
