// Hours are optional (WebVTT's short form), and the fraction may follow a dot (WebVTT) or a comma (SRT)
const TIMESTAMP = /^(?:(\d+):)?(\d{1,2}):(\d{1,2})[.,](\d{1,3})$/;

/**
 * Reads a cue timestamp, `01:02:03.456`, `02:03.456` or SRT's `01:02:03,456`.
 * @returns The time in milliseconds, or `null` if it isn't a timestamp.
 */
export const parseTimestamp = (value: string): number | null => {
  const match = TIMESTAMP.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (minutes > 59 || seconds > 59) return null;
  const millis = Number((match[4] ?? '').padEnd(3, '0'));
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + millis;
};

// Lenient about the spaces around the arrow, which some SRT files leave out
const TIMING = /^(\S+?)[ \t]*-->[ \t]*(\S+)(.*)$/;

/**
 * Reads a cue's timing line, `00:01.000 --> 00:02.500 align:start`.
 * @returns The start and end in milliseconds and the rest of the line, or `null` if malformed.
 */
export const parseTimingLine = (line: string): { start: number; end: number; rest: string } | null => {
  const match = TIMING.exec(line.trim());
  if (!match) return null;
  const start = parseTimestamp(match[1] ?? '');
  const end = parseTimestamp(match[2] ?? '');
  if (start === null || end === null) return null;
  return { start, end, rest: (match[3] ?? '').trim() };
};
