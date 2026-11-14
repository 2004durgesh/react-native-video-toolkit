import { parseCaptions } from '../parse';

/** A small seeded random generator, so a failure can be reproduced. */
const random = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

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
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('never throws on random input and always returns sorted, valid cues', () => {
    const next = random(42);
    for (let run = 0; run < 2000; run++) {
      let input = '';
      const length = Math.floor(next() * 60);
      for (let i = 0; i < length; i++) {
        input +=
          next() < 0.8
            ? PIECES[Math.floor(next() * PIECES.length)]
            : String.fromCharCode(Math.floor(next() * 0xffff));
      }
      const result = parseCaptions(input);
      for (const [i, cue] of result.cues.entries()) {
        expect(cue.end).toBeGreaterThan(cue.start);
        if (i > 0) expect(cue.start).toBeGreaterThanOrEqual(result.cues[i - 1]!.start);
        expect(cue.text).not.toMatch(/<\/?[bi]>/);
      }
    }
  });
});
