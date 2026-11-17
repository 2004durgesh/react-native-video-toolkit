/* eslint-disable no-bitwise -- decoding bytes into characters */
type Decoder = { decode: (bytes: Uint8Array) => string };
type DecoderConstructor = new (label: string, options?: { fatal?: boolean }) => Decoder;

const getTextDecoder = (): DecoderConstructor | undefined =>
  (globalThis as { TextDecoder?: DecoderConstructor }).TextDecoder;

/** UTF-8 without `TextDecoder`, replacing invalid bytes with U+FFFD. */
const decodeUTF8 = (bytes: Uint8Array, fatal: boolean): string => {
  let text = '';
  let i = 0;
  const invalid = () => {
    if (fatal) throw new TypeError('Invalid UTF-8');
    text += '\uFFFD';
    i += 1;
  };
  while (i < bytes.length) {
    const byte = bytes[i] ?? 0;
    const length = byte < 0x80 ? 1 : byte >= 0xf0 && byte < 0xf8 ? 4 : byte >= 0xe0 ? 3 : byte >= 0xc2 ? 2 : 0;
    if (length === 0 || i + length > bytes.length) {
      invalid();
      continue;
    }
    let code = length === 1 ? byte : byte & (0xff >> (length + 1));
    let valid = true;
    for (let k = 1; k < length; k++) {
      const next = bytes[i + k] ?? 0;
      if ((next & 0xc0) !== 0x80) valid = false;
      code = code * 64 + (next & 0x3f);
    }
    if (!valid || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      invalid();
      continue;
    }
    text += String.fromCodePoint(code);
    i += length;
  }
  return text;
};

/** UTF-16 without `TextDecoder`. */
const decodeUTF16 = (bytes: Uint8Array, littleEndian: boolean): string => {
  const units: number[] = [];
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    units.push(littleEndian ? a | (b << 8) : (a << 8) | b);
  }
  let text = '';
  // In chunks, as `fromCharCode` takes its arguments on the stack
  for (let i = 0; i < units.length; i += 8192) text += String.fromCharCode(...units.slice(i, i + 8192));
  return text;
};

// Windows-1252's characters for bytes 0x80-0x9F, where it differs from Latin-1 (smart quotes,
// dashes, the euro sign); the five bytes it leaves undefined keep their own code points
const WINDOWS_1252_HIGH = [
  0x20ac, 0x81, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x8d, 0x017d,
  0x8f, 0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x9d,
  0x017e, 0x0178,
];

/** Windows-1252 without `TextDecoder`, for legacy files. */
const decodeWindows1252 = (bytes: Uint8Array): string => {
  const codes = Array.from(bytes, (byte) => (byte >= 0x80 && byte <= 0x9f ? WINDOWS_1252_HIGH[byte - 0x80]! : byte));
  let text = '';
  for (let i = 0; i < codes.length; i += 8192) text += String.fromCharCode(...codes.slice(i, i + 8192));
  return text;
};

const decodeWith = (bytes: Uint8Array, label: string, fatal = false): string => {
  const TextDecoder = getTextDecoder();
  const normalized = label.toLowerCase();
  if (TextDecoder) {
    try {
      return new TextDecoder(normalized, { fatal }).decode(bytes);
    } catch (error) {
      // An unknown label falls through to the built-in decoders; invalid bytes with `fatal` rethrow
      if (fatal && (normalized === 'utf-8' || normalized === 'utf8')) throw error;
    }
  }
  if (normalized === 'utf-16le' || normalized === 'utf-16') return decodeUTF16(bytes, true);
  if (normalized === 'utf-16be') return decodeUTF16(bytes, false);
  if (normalized === 'utf-8' || normalized === 'utf8') return decodeUTF8(bytes, fatal);
  return decodeWindows1252(bytes);
};

/**
 * A subtitle file's bytes as text. A byte-order mark decides UTF-8 or UTF-16 (and is dropped).
 * Without one: UTF-16 when every other byte is zero, else UTF-8, and a file that isn't valid UTF-8
 * is read as Windows-1252, the usual encoding of legacy SRT files.
 * @internal
 */
export const decodeCaptionBytes = (bytes: Uint8Array): string => {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return decodeWith(bytes.subarray(3), 'utf-8');
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return decodeWith(bytes.subarray(2), 'utf-16le');
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return decodeWith(bytes.subarray(2), 'utf-16be');
  // UTF-16 without a byte-order mark: Latin text has a zero byte in every other position
  const sample = bytes.subarray(0, 256);
  let evenZeros = 0;
  let oddZeros = 0;
  sample.forEach((byte, i) => {
    if (byte === 0) {
      if (i % 2 === 0) evenZeros += 1;
      else oddZeros += 1;
    }
  });
  const pairs = sample.length / 2;
  if (pairs >= 4 && oddZeros > pairs * 0.4 && evenZeros < pairs * 0.1) return decodeWith(bytes, 'utf-16le');
  if (pairs >= 4 && evenZeros > pairs * 0.4 && oddZeros < pairs * 0.1) return decodeWith(bytes, 'utf-16be');
  try {
    return decodeWith(bytes, 'utf-8', true);
  } catch {
    return decodeWith(bytes, 'windows-1252');
  }
};
