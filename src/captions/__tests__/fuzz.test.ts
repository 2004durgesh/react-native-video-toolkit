import { parseCaptions } from '../parse';

/** A small seeded random generator, so a failure can be reproduced. */
const random = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/** Valid files to break: most broken copies still have cues, so the cue parsing runs too. */
const FILES = [
  [
    'WEBVTT',
    'X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000',
    '',
    'NOTE a note',
    '',
    'intro',
    '00:00:01.000 --> 00:00:02.000 align:start',
    '<v Speaker>Hello <b>bold <i>both</i></b> &amp; <c.yellow>more</c>',
    '',
    '00:00:01.500 --> 00:00:03.000',
    'مرحبا <u>world</u>',
    '00:04.000 --> 00:05.000',
    '<ruby>漢<rt>kan</rt></ruby> &#x1F600; <00:04.500>later',
  ].join('\n'),
  [
    '1',
    '00:00:01,500 --> 00:00:03,000 X1:10 X2:20',
    '{\\an8}<font color="#ff0">Top</font> <i>line</i>',
    '',
    '2',
    '00:00:04,000 --> 00:00:05,250',
    'Next',
  ].join('\r\n'),
];

const PIECES = [
  'WEBVTT',
  '\n',
  '\r\n',
  '\r',
  '\n\n',
  '-->',
  ' --> ',
  '00:00:01.000',
  '00:01,500',
  '99:99:99.999',
  '<b>',
  '</i>',
  '<v Speaker',
  '&amp;',
  '&#xFFFFFFFF;',
  '&#0;',
  '&#xD800;',
  'NOTE',
  'STYLE',
  'X-TIMESTAMP-MAP=MPEGTS:',
  ':',
  '\uFEFF',
  '\u0000',
  'مرحبا',
  '😀',
  '1',
  ' ',
];

describe('parseCaptions fuzz', () => {
  beforeEach(() => {
    // Malformed cues are logged
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('never throws on broken files and always returns sorted, valid cues without raw tags', () => {
    const next = random(42);
    const pick = <T>(list: readonly T[]) => list[Math.floor(next() * list.length)]!;
    let withCues = 0;
    for (let run = 0; run < 2000; run++) {
      let input = pick(FILES);
      // A few edits at random places: a piece or a random character in, or a slice out
      const edits = 1 + Math.floor(next() * 6);
      for (let edit = 0; edit < edits; edit++) {
        const at = Math.floor(next() * (input.length + 1));
        const kind = next();
        if (kind < 0.5) input = input.slice(0, at) + pick(PIECES) + input.slice(at);
        else if (kind < 0.7) input = input.slice(0, at) + String.fromCharCode(Math.floor(next() * 0xffff)) + input.slice(at);
        else input = input.slice(0, at) + input.slice(at + Math.floor(next() * 12));
      }
      const result = parseCaptions(input);
      if (result.cues.length > 0) withCues += 1;
      for (const [i, cue] of result.cues.entries()) {
        expect(cue.end).toBeGreaterThan(cue.start);
        if (i > 0) expect(cue.start).toBeGreaterThanOrEqual(result.cues[i - 1]!.start);
        expect(cue.text).not.toMatch(/<\/?[biu]>/);
      }
    }
    // Most broken files still have cues
    expect(withCues).toBeGreaterThan(1000);
  });
});
