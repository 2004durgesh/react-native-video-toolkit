import { createHlsSubtitleLoader, parseMasterPlaylist, parseMediaPlaylist } from '../hls';
import type { Cue } from '../types';

const MASTER = [
  '#EXTM3U',
  '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud1",NAME="English",URI="a1/prog_index.m3u8"',
  '#EXT-X-MEDIA:TYPE=CLOSED-CAPTIONS,GROUP-ID="cc1",LANGUAGE="en",NAME="English",INSTREAM-ID="CC1"',
  '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="sub1",LANGUAGE="en",NAME="English",AUTOSELECT=YES,DEFAULT=YES,FORCED=NO,URI="s1/en/prog_index.m3u8"',
  '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="sub1",LANGUAGE="fr",NAME="Français, forcé",FORCED=YES,URI="s1/fr/prog_index.m3u8"',
  '#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="sub2",LANGUAGE="en",NAME="English",URI="s1/en/prog_index.m3u8"',
  '#EXT-X-STREAM-INF:BANDWIDTH=2177116,SUBTITLES="sub1"',
  'v5/prog_index.m3u8',
].join('\n');

const BASE = 'https://cdn.example.com/bipbop/master.m3u8';

describe('HLS playlists', () => {
  it('lists the subtitle renditions of a master playlist, once each, names with commas included', () => {
    expect(parseMasterPlaylist(MASTER, BASE)).toEqual([
      {
        uri: 'https://cdn.example.com/bipbop/s1/en/prog_index.m3u8',
        name: 'English',
        language: 'en',
        default: true,
      },
      {
        uri: 'https://cdn.example.com/bipbop/s1/fr/prog_index.m3u8',
        name: 'Français, forcé',
        language: 'fr',
        default: false,
      },
    ]);
  });

  it('reads a VOD media playlist into timed segments', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-TARGETDURATION:6',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      '#EXTINF:6.00000,\t',
      'fileSequence0.webvtt',
      '#EXTINF:4.5,',
      'fileSequence1.webvtt',
      '#EXT-X-ENDLIST',
    ].join('\n');
    expect(parseMediaPlaylist(playlist, 'https://cdn.example.com/s1/en/prog_index.m3u8')).toEqual({
      vod: true,
      segments: [
        { uri: 'https://cdn.example.com/s1/en/fileSequence0.webvtt', start: 0, duration: 6000 },
        { uri: 'https://cdn.example.com/s1/en/fileSequence1.webvtt', start: 6000, duration: 4500 },
      ],
    });
  });

  it('resolves rendition URIs of every form against the master playlist', () => {
    const rendition = (uri: string) => `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="s",NAME="${uri}",URI="${uri}"`;
    const master = (uris: string[]) => ['#EXTM3U', ...uris.map(rendition), '#EXT-X-STREAM-INF:BANDWIDTH=1', 'v.m3u8'].join('\n');
    const uris = (base: string, list: string[]) => parseMasterPlaylist(master(list), base).map((found) => found.uri);
    expect(
      uris('https://cdn.example.com/video/master.m3u8?token=abc', [
        's1/en/prog_index.m3u8',
        '../subs/fr.m3u8',
        '/subs/de.m3u8?x=1',
        '//other.example.com/es.m3u8',
        'https://x.example.com/it.m3u8',
      ])
    ).toEqual([
      'https://cdn.example.com/video/s1/en/prog_index.m3u8',
      'https://cdn.example.com/subs/fr.m3u8',
      'https://cdn.example.com/subs/de.m3u8?x=1',
      'https://other.example.com/es.m3u8',
      'https://x.example.com/it.m3u8',
    ]);
    expect(uris('file:///data/hls/master.m3u8', ['en/prog_index.m3u8'])).toEqual(['file:///data/hls/en/prog_index.m3u8']);
  });
});

describe('createHlsSubtitleLoader', () => {
  const PLAYLIST = 'https://cdn.example.com/s1/en/prog_index.m3u8';
  const segmentFile = (index: number, mpegts: number) =>
    `WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:${mpegts},LOCAL:00:00:00.000\n\n` +
    `00:00:${String(index * 6 + 1).padStart(2, '0')}.000 --> 00:00:${String(index * 6 + 2).padStart(2, '0')}.000\nSegment ${index}`;

  const setUp = (files: Record<string, string>) => {
    const requested: string[] = [];
    global.fetch = jest.fn(async (url: string) => {
      requested.push(url);
      const body = files[url];
      return {
        ok: body !== undefined,
        status: body === undefined ? 404 : 200,
        arrayBuffer: async () => new TextEncoder().encode(body ?? '').buffer,
      } as Response;
    }) as unknown as typeof fetch;
    return requested;
  };

  const flush = async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve();
  };

  const playlist = (count: number, live = false) =>
    ['#EXTM3U', ...Array.from({ length: count }, (_, i) => `#EXTINF:6,\nfileSequence${i}.webvtt`), live ? '' : '#EXT-X-ENDLIST'].join(
      '\n'
    );

  it('loads segment 0 first, then the segments at the playhead, keeping media times', async () => {
    const files: Record<string, string> = { [PLAYLIST]: playlist(40) };
    for (let i = 0; i < 40; i++) files[`https://cdn.example.com/s1/en/fileSequence${i}.webvtt`] = segmentFile(i, 900000);
    const requested = setUp(files);
    let latest: Cue[] = [];
    const loader = createHlsSubtitleLoader({ playlistUrl: PLAYLIST, onCues: (cues) => (latest = cues), onError: jest.fn() });
    /** Lets the loads finish until no more start. */
    const settle = async () => {
      for (let seen = -1; seen !== requested.length; ) {
        seen = requested.length;
        await flush();
      }
    };
    await settle();
    const loadedSegments = () => requested.slice(1).map((url) => Number(/fileSequence(\d+)/.exec(url)?.[1]));
    // The playlist, then segment 0, whose timestamp map the others are placed by
    expect(requested[0]).toBe(PLAYLIST);
    expect(loadedSegments()[0]).toBe(0);
    // The playhead at 0 is in segment 0; the next one loads too
    expect(loadedSegments()).toContain(1);

    loader.setTime(30_000);
    await settle();
    // Segment 5 holds 30 s
    expect(loadedSegments()).toEqual(expect.arrayContaining([5, 6]));
    // Segments far from the playhead wait until it gets near them
    expect(loadedSegments()).not.toContain(30);
    const times = latest.map((cue) => [cue.start, cue.text]);
    expect(times).toContainEqual([31_000, 'Segment 5']);
    expect(times).toContainEqual([1000, 'Segment 0']);
    loader.dispose();
  });

  it('shifts a segment whose timestamp map differs from segment 0', async () => {
    const files: Record<string, string> = {
      [PLAYLIST]: playlist(2),
      // Segment 0 maps media time 0 (MPEGTS 900000, 10 s) to its local time 0
      'https://cdn.example.com/s1/en/fileSequence0.webvtt': segmentFile(0, 900000),
      // This one maps media time 2 s (MPEGTS 1080000, 12 s) to its local time 1 s: its cues are
      // written 1 s early
      'https://cdn.example.com/s1/en/fileSequence1.webvtt':
        'WEBVTT\nX-TIMESTAMP-MAP=MPEGTS:1080000,LOCAL:00:00:01.000\n\n00:00:06.000 --> 00:00:07.000\nShifted',
    };
    setUp(files);
    let latest: Cue[] = [];
    const loader = createHlsSubtitleLoader({ playlistUrl: PLAYLIST, onCues: (cues) => (latest = cues), onError: jest.fn() });
    await flush();
    loader.setTime(6000);
    await flush();
    expect(latest.find((cue) => cue.text === 'Shifted')).toMatchObject({ start: 7000, end: 8000 });
    loader.dispose();
  });

  it('keeps going when a segment fails, taking the baseline from the next one', async () => {
    const files: Record<string, string> = { [PLAYLIST]: playlist(4) };
    // Segment 0 is missing; the others start the stream at 10 s, as Apple's examples do
    for (let i = 1; i < 4; i++) files[`https://cdn.example.com/s1/en/fileSequence${i}.webvtt`] = segmentFile(i, 900000);
    const requested = setUp(files);
    const onError = jest.fn();
    let latest: Cue[] = [];
    const loader = createHlsSubtitleLoader({ playlistUrl: PLAYLIST, onCues: (cues) => (latest = cues), onError });
    await flush();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'LOAD_FAILED', reason: 'HTTP 404' }));
    expect(requested.filter((url) => url.includes('fileSequence0'))).toHaveLength(1);
    // Not shifted by the stream's 10 s start
    expect(latest.map((cue) => [cue.start, cue.text])).toContainEqual([7000, 'Segment 1']);
    loader.dispose();
  });

  it('keeps the query of a playlist URL when resolving its segments', async () => {
    const signed = 'https://cdn.example.com/s1/en/prog_index.m3u8?token=abc';
    const requested = setUp({
      [signed]: '#EXTM3U\n#EXTINF:6,\nfileSequence0.webvtt?token=abc\n#EXT-X-ENDLIST',
      'https://cdn.example.com/s1/en/fileSequence0.webvtt?token=abc': segmentFile(0, 900000),
    });
    let latest: Cue[] = [];
    const loader = createHlsSubtitleLoader({ playlistUrl: signed, onCues: (cues) => (latest = cues), onError: jest.fn() });
    await flush();
    expect(requested).toEqual([signed, 'https://cdn.example.com/s1/en/fileSequence0.webvtt?token=abc']);
    expect(latest.map((cue) => cue.text)).toEqual(['Segment 0']);
    loader.dispose();
  });

  it('keeps a cue repeated across segments once', async () => {
    const repeated = 'WEBVTT\n\n00:00:05.000 --> 00:00:07.000\nAcross';
    setUp({
      [PLAYLIST]: playlist(2),
      'https://cdn.example.com/s1/en/fileSequence0.webvtt': repeated,
      'https://cdn.example.com/s1/en/fileSequence1.webvtt': repeated,
    });
    let latest: Cue[] = [];
    const loader = createHlsSubtitleLoader({ playlistUrl: PLAYLIST, onCues: (cues) => (latest = cues), onError: jest.fn() });
    await flush();
    loader.setTime(6500);
    await flush();
    expect(latest.map((cue) => cue.text)).toEqual(['Across']);
    loader.dispose();
  });

  it('reports a live playlist as unsupported', async () => {
    setUp({ [PLAYLIST]: playlist(2, true) });
    const onError = jest.fn();
    createHlsSubtitleLoader({ playlistUrl: PLAYLIST, onCues: jest.fn(), onError });
    await flush();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'UNSUPPORTED_FORMAT' }));
  });

  it('reports a missing playlist and stops quietly once disposed', async () => {
    setUp({});
    const onError = jest.fn();
    createHlsSubtitleLoader({ playlistUrl: PLAYLIST, onCues: jest.fn(), onError });
    await flush();
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'LOAD_FAILED', reason: 'HTTP 404' }));

    const quiet = jest.fn();
    const loader = createHlsSubtitleLoader({ playlistUrl: PLAYLIST, onCues: jest.fn(), onError: quiet });
    loader.dispose();
    await flush();
    expect(quiet).not.toHaveBeenCalled();
  });
});
