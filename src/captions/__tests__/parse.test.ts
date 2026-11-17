import { detectCaptionFormat, parseCaptions } from '../parse';

const texts = (vtt: string) => parseCaptions(vtt).cues.map((cue) => cue.text);

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warn.mockRestore();
});

describe('WebVTT', () => {
  const file = [
    'WEBVTT',
    '',
    'intro',
    '00:00:01.000 --> 00:00:02.500',
    'Hello',
    '',
    '00:03.000 --> 00:04.000',
    'Short form',
  ].join('\n');

  it('parses cues with ids, times in ms and text (SUB-PARSE-01, 03)', () => {
    const { cues, skipped } = parseCaptions(file);
    expect(skipped).toBe(0);
    expect(cues).toEqual([
      expect.objectContaining({ id: 'intro', start: 1000, end: 2500, text: 'Hello' }),
      expect.objectContaining({ start: 3000, end: 4000, text: 'Short form' }),
    ]);
    expect(cues[1]?.id).toBeUndefined();
  });

  it('keeps line breaks in multi-line cues (SUB-PARSE-08)', () => {
    expect(texts('WEBVTT\n\n00:01.000 --> 00:02.000\nOne\nTwo')).toEqual(['One\nTwo']);
  });

  it('skips NOTE, STYLE and REGION blocks (SUB-PARSE-09)', () => {
    const vtt = [
      'WEBVTT',
      '',
      'STYLE',
      '::cue { color: red }',
      '',
      'REGION',
      'id:fred width:40%',
      '',
      'NOTE a comment',
      'over two lines',
      '',
      '00:01.000 --> 00:02.000',
      'Kept',
    ].join('\n');
    expect(parseCaptions(vtt)).toEqual(expect.objectContaining({ skipped: 0, cues: [expect.objectContaining({ text: 'Kept' })] }));
  });

  it('handles a BOM and every line ending (SUB-PARSE-10)', () => {
    const body = ['WEBVTT', '', '00:01.000 --> 00:02.000', 'Café'];
    for (const ending of ['\n', '\r\n', '\r']) {
      expect(texts('\uFEFF' + body.join(ending))).toEqual(['Café']);
    }
  });

  it('reads a cue whose timing line has settings, without showing them (SUB-PARSE-11)', () => {
    const [cue] = parseCaptions('WEBVTT\n\n00:01.000 --> 00:02.000 align:start position:10%\nText').cues;
    expect(cue).toMatchObject({ start: 1000, end: 2000, text: 'Text' });
  });

  it('skips a malformed cue and keeps the rest (SUB-PARSE-04)', () => {
    const vtt = 'WEBVTT\n\n00:01.000 -> 00:02.000\nBroken\n\nnot a cue\n\n00:03.000 --> 00:04.000\nGood';
    expect(parseCaptions(vtt)).toEqual(expect.objectContaining({ skipped: 2, cues: [expect.objectContaining({ text: 'Good' })] }));
  });

  it('drops cues that end before they start (SUB-PARSE-05)', () => {
    const vtt = 'WEBVTT\n\n00:02.000 --> 00:01.000\nBackwards\n\n00:03.000 --> 00:03.000\nEmpty\n\n00:04.000 --> 00:05.000\nGood';
    const { cues, skipped } = parseCaptions(vtt);
    expect(skipped).toBe(2);
    expect(cues.map((cue) => cue.text)).toEqual(['Good']);
    // Logged, without stopping anything
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipped 2'));
  });

  it('sorts cues by start (SUB-PARSE-06)', () => {
    const vtt = 'WEBVTT\n\n00:05.000 --> 00:06.000\nSecond\n\n00:01.000 --> 00:02.000\nFirst';
    expect(texts(vtt)).toEqual(['First', 'Second']);
  });

  it('keeps overlapping cues (SUB-PARSE-07)', () => {
    const vtt = 'WEBVTT\n\n00:01.000 --> 00:05.000\nLong\n\n00:02.000 --> 00:03.000\nInside';
    expect(texts(vtt)).toEqual(['Long', 'Inside']);
  });

  it('gives an empty track for empty and header-only files (SUB-PARSE-14)', () => {
    for (const empty of ['', 'WEBVTT', 'WEBVTT\n\n', 'WEBVTT\n\nNOTE only a note']) {
      expect(parseCaptions(empty).cues).toEqual([]);
    }
  });

  it('accepts a timing line without spaces around the arrow', () => {
    expect(texts('WEBVTT\n\n00:01.000-->00:02.000\nTight')).toEqual(['Tight']);
  });

  it('keeps an exact duplicate cue once', () => {
    expect(texts('WEBVTT\n\n00:01.000 --> 00:02.000\nTwice\n\n00:01.000 --> 00:02.000\nTwice')).toEqual(['Twice']);
  });

  it('keeps a literal < that is not a tag', () => {
    expect(texts('WEBVTT\n\n00:01.000 --> 00:02.000\nI <3 it\n\n00:03.000 --> 00:04.000\n2 < 3')).toEqual([
      'I <3 it',
      '2 < 3',
    ]);
  });

  it('decodes entities once and leaves &#0; as it is', () => {
    expect(texts('WEBVTT\n\n00:01.000 --> 00:02.000\n&amp;lt; and &#0;')).toEqual(['&lt; and &#0;']);
  });

  it('reads a cue right after the header, with no blank line', () => {
    expect(texts('WEBVTT\nKind: captions\n00:01.000 --> 00:02.000\nRight away')).toEqual(['Right away']);
  });

  it('reads cues with no blank line between them, as browsers do', () => {
    const result = parseCaptions('WEBVTT\n\n00:01.000 --> 00:02.000\nOne\n00:03.000 --> 00:04.000\nTwo');
    expect(result.cues.map((cue) => [cue.start, cue.text])).toEqual([
      [1000, 'One'],
      [3000, 'Two'],
    ]);
  });

  it('keeps a text line with an arrow that is not a timing', () => {
    expect(texts('WEBVTT\n\n00:01.000 --> 00:02.000\nLeft --> right')).toEqual(['Left --> right']);
  });

  it('removes NUL characters', () => {
    expect(texts('WEBVTT\n\n00:01.000 --> 00:02.000\nA\u0000B')).toEqual(['AB']);
  });

  it('reads the HLS timestamp map from the header', () => {
    const vtt = 'WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000\n\n00:01.000 --> 00:02.000\nBip';
    expect(parseCaptions(vtt).timestampMap).toEqual({ mpegts: 900000, local: 0 });
    const swapped = 'WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00:01.000,MPEGTS:180000\n\n00:01.000 --> 00:02.000\nBop';
    expect(parseCaptions(swapped).timestampMap).toEqual({ mpegts: 180000, local: 1000 });
  });
});

describe('SRT', () => {
  const file = ['1', '00:00:01,500 --> 00:00:03,000', 'First line', 'second line', '', '2', '00:00:04,000 --> 00:00:05,250 X1:10 X2:20', 'Next'].join(
    '\r\n'
  );

  it('parses comma milliseconds, numbers and multi-line text (SUB-PARSE-02, 08)', () => {
    expect(parseCaptions(file).cues).toEqual([
      expect.objectContaining({ id: '1', start: 1500, end: 3000, text: 'First line\nsecond line' }),
      expect.objectContaining({ id: '2', start: 4000, end: 5250, text: 'Next' }),
    ]);
  });

  it('reads numbered cues with no blank line between them', () => {
    const result = parseCaptions('1\n00:00:01,000 --> 00:00:02,000\nOne\n2\n00:00:03,000 --> 00:00:04,000\nTwo', 'srt');
    expect(result.cues.map((cue) => [cue.id, cue.text])).toEqual([
      ['1', 'One'],
      ['2', 'Two'],
    ]);
  });

  it('accepts dot milliseconds, trailing spaces, a BOM and coordinates', () => {
    const result = parseCaptions(
      '\uFEFF1\n00:00:01.000 --> 00:00:02.000 X1:100 X2:200 Y1:10 Y2:20  \nDots  \n\n2\n00:00:03,000-->00:00:04,000\nTight',
      'srt'
    );
    expect(result.cues.map((cue) => [cue.start, cue.text])).toEqual([
      [1000, 'Dots  '],
      [3000, 'Tight'],
    ]);
  });

  it('strips SRT font tags and ASS overrides (SUB-PARSE-12)', () => {
    const srt = '1\n00:00:01,000 --> 00:00:02,000\n{\\an8}<font color="#ff0">Top</font>';
    expect(parseCaptions(srt).cues[0]?.text).toBe('Top');
  });
});

describe('detectCaptionFormat', () => {
  it('tells WebVTT from SRT by the header', () => {
    expect(detectCaptionFormat('\uFEFFWEBVTT\n')).toBe('vtt');
    expect(detectCaptionFormat('1\n00:00:01,000 --> 00:00:02,000\nHi')).toBe('srt');
  });
});
