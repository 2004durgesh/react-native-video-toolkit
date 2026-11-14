import type { CueSpan } from '../types';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
  lrm: '\u200E',
  rlm: '\u200F',
};

/**
 * Decodes the HTML entities subtitle files use: `&amp;`, `&lt;`, `&nbsp;`, `&lrm;`... and numeric
 * ones like `&#233;`. Unknown entities are left as they are.
 */
export const decodeEntities = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      // Not NUL, not past Unicode, and not half of a surrogate pair, which can't show on its own
      const valid = Number.isFinite(code) && code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff);
      return valid ? String.fromCodePoint(code) : entity;
    }
    return NAMED_ENTITIES[name.toLowerCase()] ?? entity;
  });

type Style = Pick<CueSpan, 'bold' | 'italic' | 'underline'>;

const STYLE_TAGS: Record<string, keyof Style> = { b: 'bold', i: 'italic', u: 'underline' };

/**
 * Splits a cue's text into styled runs. `<b>`, `<i>` and `<u>` set the style; every other tag
 * (`<c.yellow>`, `<v Speaker>`, `<lang>`, `<00:01.000>`, SRT's `<font>`) and SRT's `{\an8}`
 * overrides are dropped, so no raw tag reaches the screen. Ruby annotations (`<rt>`) are left out.
 */
export const parseInline = (raw: string): CueSpan[] => {
  const spans: CueSpan[] = [];
  const counts: Record<keyof Style, number> = { bold: 0, italic: 0, underline: 0 };
  let inRubyText = 0;
  const source = raw.replace(/\{\\[^}]*\}/g, '');
  const push = (text: string) => {
    if (!text || inRubyText > 0) return;
    const decoded = decodeEntities(text);
    const style: Style = {};
    if (counts.bold > 0) style.bold = true;
    if (counts.italic > 0) style.italic = true;
    if (counts.underline > 0) style.underline = true;
    const last = spans[spans.length - 1];
    if (last && last.bold === style.bold && last.italic === style.italic && last.underline === style.underline) {
      last.text += decoded;
    } else {
      spans.push({ text: decoded, ...style });
    }
  };

  const tag = /<(\/?)([a-z0-9]+)?[^>]*>/gi;
  let index = 0;
  let match: RegExpExecArray | null;
  while ((match = tag.exec(source))) {
    push(source.slice(index, match.index));
    index = tag.lastIndex;
    const closing = match[1] === '/';
    const name = (match[2] ?? '').toLowerCase();
    const styleKey = STYLE_TAGS[name];
    if (styleKey) {
      counts[styleKey] = Math.max(0, counts[styleKey] + (closing ? -1 : 1));
    } else if (name === 'rt') {
      inRubyText = Math.max(0, inRubyText + (closing ? -1 : 1));
    }
  }
  push(source.slice(index));
  return spans;
};

// Right-to-left scripts: Hebrew, Arabic, Syriac, Thaana, N'Ko and their presentation forms
const RTL_CHAR = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
// Left-to-right letters: Latin, Greek, Cyrillic, Armenian, Indic and the rest of the BMP's scripts
const LTR_CHAR = /[A-Za-z\u00C0-\u02AF\u0370-\u058F\u0900-\u1FFF\u2C00-\uFAFF]/;

/**
 * Whether text reads right to left, from its first letter that has a direction.
 */
export const isRTL = (text: string): boolean => {
  for (const char of text) {
    if (RTL_CHAR.test(char)) return true;
    if (LTR_CHAR.test(char)) return false;
  }
  return false;
};
