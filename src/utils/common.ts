import type { AudioTrack, VideoTrack, TextTrack } from 'react-native-video';

export const combineHandlers =
  <T extends (...args: any[]) => void>(...handlers: (T | undefined)[]) =>
  (...args: Parameters<T>) => {
    handlers.forEach((handler) => {
      if (typeof handler === 'function') {
        handler(...args);
      }
    });
  };

/**
 * Deduplicates video tracks:
 * - Groups by width, height, codecs.
 * - Keeps the highest bitrate in each group.
 */
export function dedupeVideoTracks<T extends VideoTrack>(tracks?: T[]): T[] {
  const map = new Map<string, T>();

  for (const track of tracks ?? []) {
    const signature = `${track.width}|${track.height}|${track.codecs}`;
    const existing = map.get(signature);

    if (!existing || track.bitrate! > existing.bitrate!) {
      map.set(signature, track);
    }
  }

  return Array.from(map.values());
}

/**
 * Deduplicates audio/text tracks:
 * - Groups by language.
 * - Keeps the first occurrence of each language.
 * - Filters out tracks with null/undefined language.
 */
export function dedupeLanguageTracks<T extends AudioTrack | TextTrack>(tracks?: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const track of tracks ?? []) {
    if (!track.language) continue;

    if (!seen.has(`${track.language}|${track.title}`)) {
      seen.add(`${track.language}|${track.title}`);
      result.push(track);
    }
  }

  return result;
}

// English names of common languages, as Hermes may lack Intl.DisplayNames
const LANGUAGE_NAMES: Record<string, string> = {
  ar: 'Arabic',
  bg: 'Bulgarian',
  bn: 'Bengali',
  ca: 'Catalan',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  es: 'Spanish',
  fa: 'Persian',
  fi: 'Finnish',
  fil: 'Filipino',
  fr: 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  ml: 'Malayalam',
  mr: 'Marathi',
  ms: 'Malay',
  nb: 'Norwegian Bokmål',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sk: 'Slovak',
  sr: 'Serbian',
  sv: 'Swedish',
  ta: 'Tamil',
  te: 'Telugu',
  th: 'Thai',
  tl: 'Tagalog',
  tr: 'Turkish',
  uk: 'Ukrainian',
  ur: 'Urdu',
  vi: 'Vietnamese',
  zh: 'Chinese',
};

// ISO 639-2 codes (both B and T forms) for the languages above, which some players report instead
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  ara: 'ar',
  ben: 'bn',
  bul: 'bg',
  cat: 'ca',
  ces: 'cs',
  chi: 'zh',
  cze: 'cs',
  dan: 'da',
  deu: 'de',
  dut: 'nl',
  ell: 'el',
  eng: 'en',
  fas: 'fa',
  fin: 'fi',
  fra: 'fr',
  fre: 'fr',
  ger: 'de',
  gre: 'el',
  heb: 'he',
  hin: 'hi',
  hrv: 'hr',
  hun: 'hu',
  ind: 'id',
  ita: 'it',
  jpn: 'ja',
  kor: 'ko',
  mal: 'ml',
  mar: 'mr',
  may: 'ms',
  msa: 'ms',
  nld: 'nl',
  nob: 'nb',
  nor: 'no',
  per: 'fa',
  pol: 'pl',
  por: 'pt',
  ron: 'ro',
  rum: 'ro',
  rus: 'ru',
  slk: 'sk',
  slo: 'sk',
  spa: 'es',
  srp: 'sr',
  swe: 'sv',
  tam: 'ta',
  tel: 'te',
  tgl: 'tl',
  tha: 'th',
  tur: 'tr',
  ukr: 'uk',
  urd: 'ur',
  vie: 'vi',
  zho: 'zh',
};

// Codes that name no language
const NO_LANGUAGE = new Set(['und', 'unknown', 'mul', 'zxx', 'mis', 'off']);

/**
 * The English name of a language code: `English` for `en`, `eng` or `en-US`, with any region after it
 * (`Portuguese (BR)`). Undefined for unknown or empty codes.
 */
export function languageDisplayName(code?: string): string | undefined {
  const [base = '', ...rest] = (code ?? '').trim().split(/[-_]/);
  const language = base.toLowerCase();
  if (!language || NO_LANGUAGE.has(language)) return undefined;
  const region = rest.find((part) => /^([a-z]{2}|\d{3})$/i.test(part))?.toUpperCase();

  let name = LANGUAGE_NAMES[ALPHA3_TO_ALPHA2[language] ?? language];
  if (!name) {
    try {
      const DisplayNames = (Intl as { DisplayNames?: new (...args: any[]) => { of: (code: string) => string } })
        .DisplayNames;
      const found = DisplayNames && new DisplayNames(['en'], { type: 'language' }).of(language);
      if (found && found.toLowerCase() !== language) name = found;
    } catch {}
  }
  if (!name) return undefined;
  return region ? `${name} (${region})` : name;
}

// Titles react-native-video makes up for tracks without one
const PLACEHOLDER_TITLE = /^(Track|External) \d+$/;

/**
 * What to call an audio or text track in menus: its own title, else its language's name, else the language code,
 * else "Track n". react-native-video's "Track n" placeholders count as no title, so an MP4's tagged subtitle tracks
 * read "English" and "Arabic" rather than "Track 1" and "Track 2".
 */
export function trackLabel(track: { title?: string; language?: string; index?: number }): string {
  const title = track.title?.trim();
  if (title && !PLACEHOLDER_TITLE.test(title)) return title;
  const name = languageDisplayName(track.language);
  if (name) return name;
  const code = track.language?.trim();
  if (code && !NO_LANGUAGE.has(code.toLowerCase())) return code;
  return title || `Track ${(track.index ?? 0) + 1}`;
}

/**
 * Convert HEX + alpha to RGBA string
 * @param hex - hex color (#RRGGBB or #RGB)
 * @param alpha - opacity (0 to 1)
 * @returns rgba(r,g,b,a)
 */
export function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '');

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Height of the player in fullscreen. With screen rotation on, fullscreen is landscape, whose height is the window's
 * shorter side; that holds before and after the rotation lands, unlike a layout measured in one orientation.
 */
export function getFullscreenHeight(dimensions: { width: number; height: number }, rotates: boolean): number {
  return rotates ? Math.min(dimensions.width, dimensions.height) : dimensions.height;
}
