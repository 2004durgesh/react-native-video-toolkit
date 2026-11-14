import { decodeEntities, isRTL, parseInline } from '../parse/text';

describe('decodeEntities (SUB-PARSE-13)', () => {
  it('decodes the named entities subtitles use', () => {
    expect(decodeEntities('Tom &amp; Jerry &lt;3 &gt; a&nbsp;b')).toBe('Tom & Jerry <3 > a\u00A0b');
    expect(decodeEntities('&lrm;x&rlm;')).toBe('\u200Ex\u200F');
  });

  it('leaves an entity for half a surrogate pair, which cannot show alone', () => {
    expect(decodeEntities('&#xD800; &#55296; &#x1F600;')).toBe('&#xD800; &#55296; \u{1F600}');
  });

  it('decodes numeric entities and leaves unknown ones', () => {
    expect(decodeEntities('caf&#233; &#x1F600; &bogus;')).toBe('café 😀 &bogus;');
  });
});

describe('parseInline (SUB-PARSE-12)', () => {
  it('maps b, i and u to styled spans', () => {
    expect(parseInline('plain <b>bold <i>both</i></b> <u>under</u>')).toEqual([
      { text: 'plain ' },
      { text: 'bold ', bold: true },
      { text: 'both', bold: true, italic: true },
      { text: ' ' },
      { text: 'under', underline: true },
    ]);
  });

  it('strips class, voice, language and timestamp tags', () => {
    const spans = parseInline('<v Roger Bingham><c.yellow>We are</c> <lang en-GB>in</lang> <00:00:01.000>New York</v>');
    expect(spans.map((span) => span.text).join('')).toBe('We are in New York');
  });

  it('leaves out ruby annotations', () => {
    expect(parseInline('<ruby>漢<rt>kan</rt>字<rt>ji</rt></ruby>').map((span) => span.text).join('')).toBe('漢字');
  });

  it('styles the rest of the cue after an unclosed tag', () => {
    expect(parseInline('a<b>c')).toEqual([{ text: 'a' }, { text: 'c', bold: true }]);
  });

  it('never shows a stray tag, even unbalanced', () => {
    const text = parseInline('<b>open </i>close</b></b>')
      .map((span) => span.text)
      .join('');
    expect(text).toBe('open close');
  });

  it('decodes entities inside spans', () => {
    expect(parseInline('<i>&lt;whisper&gt;</i>')).toEqual([{ text: '<whisper>', italic: true }]);
  });
});

describe('isRTL (SUB-I18N-01)', () => {
  it('reads the direction from the first letter with one', () => {
    expect(isRTL('مرحبا بالعالم')).toBe(true);
    expect(isRTL('שלום')).toBe(true);
    expect(isRTL('123 - مرحبا')).toBe(true);
    expect(isRTL('Hello مرحبا')).toBe(false);
    expect(isRTL('नमस्ते')).toBe(false);
    expect(isRTL('こんにちは')).toBe(false);
    expect(isRTL('123')).toBe(false);
  });
});
