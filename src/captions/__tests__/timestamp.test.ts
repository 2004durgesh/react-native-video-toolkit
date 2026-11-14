import { parseTimestamp, parseTimingLine } from '../parse/timestamp';

describe('parseTimestamp', () => {
  it('reads hours, minutes, seconds and milliseconds (SUB-PARSE-01)', () => {
    expect(parseTimestamp('01:02:03.456')).toBe(((1 * 60 + 2) * 60 + 3) * 1000 + 456);
  });

  it('reads the short form without hours (SUB-PARSE-03)', () => {
    expect(parseTimestamp('02:03.456')).toBe((2 * 60 + 3) * 1000 + 456);
  });

  it('reads SRT commas and WebVTT dots (SUB-PARSE-02)', () => {
    expect(parseTimestamp('00:00:01,500')).toBe(1500);
    expect(parseTimestamp('00:00:01.500')).toBe(1500);
  });

  it('pads short fractions to milliseconds', () => {
    expect(parseTimestamp('00:00:01.5')).toBe(1500);
    expect(parseTimestamp('00:00:01.05')).toBe(1050);
  });

  it('allows hours beyond two digits', () => {
    expect(parseTimestamp('100:00:00.000')).toBe(100 * 3600 * 1000);
  });

  it('rejects malformed values', () => {
    for (const value of ['', 'abc', '1:2', '00:00:01', '00:60:00.000', '00:00:61.000', '00:00:01.5000']) {
      expect(parseTimestamp(value)).toBeNull();
    }
  });
});

describe('parseTimingLine', () => {
  it('reads the start, end and settings', () => {
    expect(parseTimingLine('00:01.000 --> 00:02.500 align:start line:0')).toEqual({
      start: 1000,
      end: 2500,
      rest: 'align:start line:0',
    });
  });

  it('rejects lines without an arrow or with bad times', () => {
    expect(parseTimingLine('00:01.000 00:02.500')).toBeNull();
    expect(parseTimingLine('00:01.000 --> nope')).toBeNull();
  });
});
