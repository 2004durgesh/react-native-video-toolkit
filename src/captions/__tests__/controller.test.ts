import { AppState } from 'react-native';
import { createCaptionsController, type CaptionPlayback } from '../CaptionsController';
import { clearCaptionCache } from '../load';

const VTT = [
  'WEBVTT',
  '',
  '00:01.000 --> 00:02.000',
  'One',
  '',
  '00:02.000 --> 00:03.000',
  'Two',
  '',
  '00:05.000 --> 00:06.000',
  'Three',
].join('\n');

const OTHER = 'WEBVTT\n\n00:00.000 --> 00:10.000\nAutre';

const respond = (body: string, status = 200) =>
  Promise.resolve({
    ok: status === 200,
    status,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer,
  } as Response);

/** A fake player: a media time in seconds, playback state, and a manual clock. */
const setUp = (initial: Partial<CaptionPlayback> = {}) => {
  let clock = 0;
  let time = 0;
  let playback: CaptionPlayback = {
    isPlaying: false,
    buffering: false,
    ended: false,
    pictureInPicture: false,
    playbackRate: 1,
    ...initial,
  };
  const timeListeners = new Set<() => void>();
  const playbackListeners = new Set<() => void>();
  const onError = jest.fn();
  const controller = createCaptionsController({
    getTime: () => time,
    subscribeTime: (listener) => {
      timeListeners.add(listener);
      return () => timeListeners.delete(listener);
    },
    getPlayback: () => playback,
    subscribePlayback: (listener) => {
      playbackListeners.add(listener);
      return () => playbackListeners.delete(listener);
    },
    onError,
    now: () => clock,
  });
  const stop = controller.start();
  const changes = jest.fn();
  controller.subscribe(changes);
  return {
    controller,
    stop,
    onError,
    changes,
    text: () => controller.getActive().map((cue) => cue.text),
    /** The player reports a time, in seconds. */
    report: (seconds: number) => {
      time = seconds;
      timeListeners.forEach((listener) => listener());
    },
    setPlayback: (next: Partial<CaptionPlayback>) => {
      playback = { ...playback, ...next };
      playbackListeners.forEach((listener) => listener());
    },
    /** Moves the clock and runs the timers due by then. */
    advance: (ms: number) => {
      clock += ms;
      jest.advanceTimersByTime(ms);
    },
  };
};

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

let fetchMock: jest.Mock;
beforeEach(() => {
  jest.useFakeTimers();
  clearCaptionCache();
  fetchMock = jest.fn((url: string) => respond(url.includes('fr') ? OTHER : VTT));
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => {
  jest.useRealTimers();
});

describe('CaptionsController', () => {
  it('shows the cue for the reported time, and nothing in gaps (SUB-SEL-01, 02)', async () => {
    const player = setUp();
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    expect(player.text()).toEqual([]);
    player.report(1.5);
    expect(player.text()).toEqual(['One']);
    player.report(4);
    expect(player.text()).toEqual([]);
    player.stop();
  });

  it('changes cues on time between progress reports, at each boundary (SUB-TIME-01, 02)', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(0.9);
    expect(player.text()).toEqual([]);
    player.advance(99);
    expect(player.text()).toEqual([]);
    player.advance(2);
    expect(player.text()).toEqual(['One']);
    // Back to back: Two replaces One with no empty moment between (SUB-SEL-04)
    player.advance(1000);
    expect(player.text()).toEqual(['Two']);
    player.advance(1000);
    expect(player.text()).toEqual([]);
    player.stop();
  });

  it('keeps the cue while paused and continues on resume (SUB-TIME-06)', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(1.5);
    player.setPlayback({ isPlaying: false });
    player.advance(5000);
    expect(player.text()).toEqual(['One']);
    player.setPlayback({ isPlaying: true });
    player.advance(501);
    expect(player.text()).toEqual(['Two']);
    player.stop();
  });

  it('runs no timer while paused (SUB-PERF-06)', async () => {
    const player = setUp();
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(1.5);
    expect(jest.getTimerCount()).toBe(0);
    player.stop();
  });

  it('follows the playback rate (SUB-TIME-07)', async () => {
    const player = setUp({ isPlaying: true, playbackRate: 2 });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(0);
    player.advance(499);
    expect(player.text()).toEqual([]);
    player.advance(2);
    expect(player.text()).toEqual(['One']);
    player.stop();
  });

  it('holds the cue while buffering instead of running ahead (SUB-TIME-08)', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(1.2);
    player.setPlayback({ buffering: true });
    player.advance(3000);
    expect(player.text()).toEqual(['One']);
    player.stop();
  });

  it('shows the right cue straight after a seek, either way (SUB-TIME-04)', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(5.5);
    expect(player.text()).toEqual(['Three']);
    player.report(1.1);
    expect(player.text()).toEqual(['One']);
    player.report(100);
    expect(player.text()).toEqual([]);
    player.stop();
  });

  it('does not flash an old cue back when a report lags slightly behind', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(1.5);
    player.advance(520);
    expect(player.text()).toEqual(['Two']);
    // Reported 60 ms behind the prediction, just before the boundary
    player.report(1.96);
    expect(player.text()).toEqual(['Two']);
    player.stop();
  });

  it('hides cues once the video has ended, and shows them again on replay (SUB-TIME-10)', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(5.5);
    player.setPlayback({ ended: true, isPlaying: false });
    expect(player.text()).toEqual([]);
    player.report(0);
    player.setPlayback({ ended: false, isPlaying: true });
    player.advance(1001);
    expect(player.text()).toEqual(['One']);
    player.stop();
  });

  it('follows a loop back to the start (SUB-TIME-09)', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(5.5);
    player.report(1.5);
    expect(player.text()).toEqual(['One']);
    player.stop();
  });

  it('switches tracks mid-cue, clearing the old cue at once (SUB-TRACK-03)', async () => {
    const player = setUp();
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(1.5);
    expect(player.text()).toEqual(['One']);
    player.controller.select({ kind: 'file', uri: 'https://example.com/fr.vtt' });
    expect(player.text()).toEqual([]);
    await flush();
    expect(player.text()).toEqual(['Autre']);
    player.stop();
  });

  it('applies only the last of quick switches, even if an earlier load finishes last (SUB-LOAD-06)', async () => {
    let finishEnglish: (value: Response) => void = () => {};
    fetchMock.mockImplementation((url: string) =>
      url.includes('en') ? new Promise<Response>((resolve) => (finishEnglish = resolve)) : respond(OTHER)
    );
    const player = setUp();
    player.report(1.5);
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    player.controller.select({ kind: 'file', uri: 'https://example.com/fr.vtt' });
    await flush();
    finishEnglish((await respond(VTT)) as Response);
    await flush();
    expect(player.text()).toEqual(['Autre']);
    player.stop();
  });

  it('turns off and on again with the cue for now (SUB-TRACK-02)', async () => {
    const player = setUp();
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(2.5);
    player.controller.select(null);
    expect(player.text()).toEqual([]);
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    expect(player.text()).toEqual(['Two']);
    // The second load came from the cache
    expect(fetchMock).toHaveBeenCalledTimes(1);
    player.stop();
  });

  it('only tells listeners when the cues on screen change (SUB-SEL-06)', async () => {
    const player = setUp();
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.changes.mockClear();
    player.report(1.1);
    player.report(1.2);
    player.report(1.3);
    expect(player.changes).toHaveBeenCalledTimes(1);
    player.stop();
  });

  it('reports load failures and keeps going, even if the callback throws (SUB-LOAD-03, SUB-ERR-01)', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    fetchMock.mockImplementation(() => respond('', 500));
    const player = setUp();
    player.onError.mockImplementation(() => {
      throw new Error('app bug');
    });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    expect(player.onError).toHaveBeenCalledWith({ code: 'LOAD_FAILED', url: 'https://example.com/en.vtt', reason: 'HTTP 500' });
    expect(player.text()).toEqual([]);
    player.stop();
  });

  it('pauses in the background and resyncs on the next report (SUB-LIFE-01)', async () => {
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener as (state: string) => void);
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(1.5);
    listeners.forEach((listener) => listener('background'));
    expect(jest.getTimerCount()).toBe(0);
    player.advance(60_000);
    listeners.forEach((listener) => listener('active'));
    // Still the last known cue, not a prediction from a stale time
    expect(player.text()).toEqual(['One']);
    player.report(5.5);
    expect(player.text()).toEqual(['Three']);
    player.stop();
  });

  it('holds the time of a new video until the player reports it', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    await flush();
    player.report(0);
    player.report(1.5);
    expect(player.text()).toEqual(['One']);
    player.report(0);
    player.controller.reset();
    // The video is still loading: no cue, even for 0, and none runs ahead of it
    player.advance(1500);
    expect(player.text()).toEqual([]);
    expect(jest.getTimerCount()).toBe(0);
    player.report(1.2);
    expect(player.text()).toEqual(['One']);
    player.stop();
  });

  it('stops everything when stopped, with no update afterwards (SUB-LOAD-05, SUB-PERF-04)', async () => {
    const player = setUp({ isPlaying: true });
    player.controller.select({ kind: 'file', uri: 'https://example.com/en.vtt' });
    player.stop();
    await flush();
    player.report(1.5);
    expect(player.text()).toEqual([]);
    expect(jest.getTimerCount()).toBe(0);
  });
});
