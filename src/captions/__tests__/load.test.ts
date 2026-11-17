import { CaptionLoadAborted } from '../errors';
import { clearCaptionCache, loadCaptionFile } from '../load';

const utf8 = (text: string) => new TextEncoder().encode(text);

const respond = (body: Uint8Array | string, status = 200) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    arrayBuffer: async () => {
      const bytes = typeof body === 'string' ? utf8(body) : body;
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  } as Response);

const VTT = 'WEBVTT\n\n00:01.000 --> 00:02.000\nHello';

let fetchMock: jest.Mock;
beforeEach(() => {
  clearCaptionCache();
  fetchMock = jest.fn(() => respond(VTT));
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => {
  jest.useRealTimers();
});

let files = 0;
/** The text of the cues in a file with these bytes. */
const textOf = async (bytes: Uint8Array) => {
  fetchMock.mockImplementation(() => respond(bytes));
  files += 1;
  const { cues } = await loadCaptionFile(`https://example.com/${files}.srt`);
  return cues.map((cue) => cue.text);
};

/** An SRT file whose one cue says `text`, as single-byte characters. */
const srtCodes = (text: string) => [...`1\n00:00:01,000 --> 00:00:02,000\n${text}`].map((char) => char.charCodeAt(0));

/** Takes `TextDecoder` away in each test, as on devices: Hermes has none, so the toolkit decodes by itself. */
const withoutTextDecoder = () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'TextDecoder')!;
  beforeEach(() => {
    Object.defineProperty(globalThis, 'TextDecoder', { value: undefined, configurable: true });
  });
  afterEach(() => {
    Object.defineProperty(globalThis, 'TextDecoder', descriptor);
  });
};

describe.each([
  ['with TextDecoder', () => {}],
  ['without TextDecoder', withoutTextDecoder],
])('reading the text of a file %s (SUB-LOAD-02)', (_name, setUpDecoder) => {
  setUpDecoder();

  it('reads UTF-8, with or without a BOM', async () => {
    const file = utf8('1\n00:00:01,000 --> 00:00:02,000\nCafé 漢字 😀');
    expect(await textOf(file)).toEqual(['Café 漢字 😀']);
    expect(await textOf(new Uint8Array([0xef, 0xbb, 0xbf, ...file]))).toEqual(['Café 漢字 😀']);
  });

  it('reads UTF-16, little and big endian, from the BOM or without one', async () => {
    const codes = srtCodes('Hé');
    const le = codes.flatMap((code) => [code, 0]);
    const be = codes.flatMap((code) => [0, code]);
    expect(await textOf(new Uint8Array([0xff, 0xfe, ...le]))).toEqual(['Hé']);
    expect(await textOf(new Uint8Array([0xfe, 0xff, ...be]))).toEqual(['Hé']);
    expect(await textOf(new Uint8Array(le))).toEqual(['Hé']);
    expect(await textOf(new Uint8Array(be))).toEqual(['Hé']);
  });

  it('reads a file that is not valid UTF-8 as Windows-1252, smart quotes and euro sign included', async () => {
    // "Café" with é as 0xE9, then “€” as 0x93 0x80 0x94
    expect(await textOf(new Uint8Array([...srtCodes('Café '), 0x93, 0x80, 0x94]))).toEqual(['Café “€”']);
  });
});

describe('loadCaptionFile (SUB-LOAD-01, 03)', () => {
  it('loads and parses a remote file', async () => {
    const result = await loadCaptionFile('https://example.com/en.vtt');
    expect(result.cues.map((cue) => cue.text)).toEqual(['Hello']);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/en.vtt', expect.anything());
  });

  it('reuses the cues of a URL it already loaded (SUB-LOAD-07)', async () => {
    await loadCaptionFile('https://example.com/en.vtt');
    await loadCaptionFile('https://example.com/en.vtt');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports HTTP errors as LOAD_FAILED', async () => {
    fetchMock.mockImplementation(() => respond('Not found', 404));
    await expect(loadCaptionFile('https://example.com/missing.vtt')).rejects.toEqual({
      code: 'LOAD_FAILED',
      url: 'https://example.com/missing.vtt',
      reason: 'HTTP 404',
    });
  });

  it('reports network failures as LOAD_FAILED', async () => {
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('Network request failed')));
    await expect(loadCaptionFile('https://example.com/en.vtt')).rejects.toMatchObject({
      code: 'LOAD_FAILED',
      reason: 'Network request failed',
    });
  });

  it('times out after 10 seconds', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))))
    );
    const loading = loadCaptionFile('https://example.com/slow.vtt');
    jest.advanceTimersByTime(10_000);
    await expect(loading).rejects.toMatchObject({ code: 'TIMEOUT' });
  });

  it('rejects TTML and HTML pages as UNSUPPORTED_FORMAT', async () => {
    fetchMock.mockImplementation(() => respond('<?xml version="1.0"?><tt></tt>'));
    await expect(loadCaptionFile('https://example.com/en.ttml')).rejects.toMatchObject({ code: 'UNSUPPORTED_FORMAT' });
  });

  it('reports a file with text but no valid cue as PARSE_FAILED, and an empty file as an empty track', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockImplementation(() => respond('WEBVTT\n\nnot a cue'));
    await expect(loadCaptionFile('https://example.com/bad.vtt')).rejects.toMatchObject({ code: 'PARSE_FAILED' });
    fetchMock.mockImplementation(() => respond(''));
    await expect(loadCaptionFile('https://example.com/empty.vtt')).resolves.toEqual({ cues: [], skipped: 0 });
  });

  it('stops when cancelled, without an error to report (SUB-LOAD-05)', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('x'))))
    );
    const loading = loadCaptionFile('https://example.com/en.vtt', { signal: controller.signal });
    controller.abort();
    await expect(loading).rejects.toBeInstanceOf(CaptionLoadAborted);
  });
});
