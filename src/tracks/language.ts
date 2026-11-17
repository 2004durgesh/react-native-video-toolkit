import type { LanguageTrack } from './types';

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

/** Whether a code names no language: `und`, `mul`, `off`... */
export const namesNoLanguage = (code: string): boolean => NO_LANGUAGE.has(code.trim().toLowerCase());

/**
 * The ISO 639-1 code of a language code: `en` for `en`, `eng` or `en-US`. Undefined for empty codes,
 * codes that name no language (`und`), and text that isn't a code (`English`).
 */
export function languageCode(code?: string): string | undefined {
  const base = (code ?? '').trim().split(/[-_]/)[0]!.toLowerCase();
  if (!/^[a-z]{2,3}$/.test(base) || NO_LANGUAGE.has(base)) return undefined;
  return ALPHA3_TO_ALPHA2[base] ?? base;
}

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

/** The device's language, as a code: `en` for en-IN. */
export const DEVICE_LANGUAGE = (() => {
  try {
    return languageCode(Intl.DateTimeFormat().resolvedOptions().locale) ?? 'en';
  } catch {
    return 'en';
  }
})();

/**
 * Whether a track is in a language, given as a code. The track can say so with a code in its
 * language or title (`en`, `en-US`, `eng`), or with the language's name (`English`, `English [CC]`).
 */
export function isInLanguage(track: LanguageTrack, code: string): boolean {
  const name = languageDisplayName(code)?.toLowerCase();
  return [track.language, track.title].some((value) => {
    const text = value?.trim().toLowerCase();
    if (!text) return false;
    return languageCode(text) === code || (!!name && text.startsWith(name));
  });
}
