import { decodeCaptionBytes } from '../decode';
import { CaptionLoadAborted } from '../errors';
import { clearCaptionCache, fetchCaptionBytes, loadCaptionFile } from '../load';
import { resolveUrl } from '../url';

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

describe('decodeCaptionBytes (SUB-LOAD-02)', () => {
  it('reads UTF-8, with or without a BOM, with no mojibake', () => {
    expect(decodeCaptionBytes(utf8('Café'))).toBe('Café');
    expect(decodeCaptionBytes(new Uint8Array([0xef, 0xbb, 0xbf, ...utf8('Café')]))).toBe('Café');
  });

  it('reads UTF-16 little and big endian from the BOM', () => {
    const le = new Uint8Array([0xff, 0xfe, 0x48, 0x00, 0xe9, 0x00]);
    const be = new Uint8Array([0xfe, 0xff, 0x00, 0x48, 0x00, 0xe9]);
    expect(decodeCaptionBytes(le)).toBe('Hé');
    expect(decodeCaptionBytes(be)).toBe('Hé');
  });

  it('recognises UTF-16 without a BOM', () => {
    const text = 'WEBVTT\n\n00:01.000 --> 00:02.000\nHi';
    const le = new Uint8Array(text.length * 2);
    const be = new Uint8Array(text.length * 2);
    [...text].forEach((char, i) => {
      le[i * 2] = char.charCodeAt(0);
      be[i * 2 + 1] = char.charCodeAt(0);
    });
    expect(decodeCaptionBytes(le)).toBe(text);
    expect(decodeCaptionBytes(be)).toBe(text);
  });

  it('reads a file that is not valid UTF-8 as Windows-1252', () => {
    expect(decodeCaptionBytes(new Uint8Array([0x43, 0x61, 0x66, 0xe9]))).toBe('Café');
  });

  it('uses the encoding it is given', () => {
    expect(decodeCaptionBytes(new Uint8Array([0x43, 0x61, 0x66, 0xe9]), 'latin1')).toBe('Café');
  });
});

describe('resolveUrl', () => {
  const base = 'https://cdn.example.com/video/master.m3u8?token=abc';
  it('resolves relative, root-relative, protocol-relative and absolute URIs', () => {
    expect(resolveUrl(base, 's1/en/prog_index.m3u8')).toBe('https://cdn.example.com/video/s1/en/prog_index.m3u8');
    expect(resolveUrl(base, '../subs/en.m3u8')).toBe('https://cdn.example.com/subs/en.m3u8');
    expect(resolveUrl(base, '/subs/en.m3u8?x=1')).toBe('https://cdn.example.com/subs/en.m3u8?x=1');
    expect(resolveUrl(base, '//other.example.com/a.vtt')).toBe('https://other.example.com/a.vtt');
    expect(resolveUrl(base, 'https://x.example.com/a.vtt')).toBe('https://x.example.com/a.vtt');
    expect(resolveUrl('file:///data/hls/master.m3u8', 'en/seg0.vtt')).toBe('file:///data/hls/en/seg0.vtt');
  });
});

describe('loadCaptionFile (SUB-LOAD-01, 03)', () => {
  it('loads and parses a remote file, sending its headers', async () => {
    const result = await loadCaptionFile('https://example.com/en.vtt', { headers: { Authorization: 'Bearer t' } });
    expect(result.cues.map((cue) => cue.text)).toEqual(['Hello']);
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/en.vtt', expect.objectContaining({ headers: { Authorization: 'Bearer t' } }));
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

  it('times out after 10 seconds by default', async () => {
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
    const loading = fetchCaptionBytes('https://example.com/en.vtt', { signal: controller.signal });
    controller.abort();
    await expect(loading).rejects.toBeInstanceOf(CaptionLoadAborted);
  });
});
