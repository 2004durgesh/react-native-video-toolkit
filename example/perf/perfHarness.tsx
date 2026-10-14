import { Profiler, useEffect, type ProfilerOnRenderCallback, type ReactNode } from 'react';
import { useControlsVisibility, usePlayback } from 'react-native-video-toolkit';

/**
 * Render measurements for the toolkit, for the perf audit. Off unless Metro is started with
 * `EXPO_PUBLIC_PERF_RUN=1`. Then the toolkit's `DevProfiler`s and `PerfProfiler` here report to
 * one accumulator, and `<PerfRun />` plays a scripted session and logs one `[perf]` line per
 * window (read them with `adb logcat -d | grep "\[perf\]"`).
 *
 * The example isn't part of the published package, so none of this ships.
 */
export const PERF_RUN = __DEV__ && process.env.EXPO_PUBLIC_PERF_RUN === '1';

type PerfEntry = { commits: number; mounts: number; duration: number };
const entries: Record<string, PerfEntry> = {};

const onPerfRender: ProfilerOnRenderCallback = (id, phase, actualDuration) => {
  const entry = (entries[id] ??= { commits: 0, mounts: 0, duration: 0 });
  entry.commits += 1;
  if (phase === 'mount') entry.mounts += 1;
  entry.duration += actualDuration;
};

// The toolkit's `DevProfiler` reads this when it renders, so it has to be set before the player mounts.
if (PERF_RUN) {
  (globalThis as { __videoToolkitOnRender?: ProfilerOnRenderCallback }).__videoToolkitOnRender = onPerfRender;
}

function resetPerf() {
  for (const id of Object.keys(entries)) delete entries[id];
}

function perfReport(label: string) {
  const rows = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, e]) => `${id}: commits=${e.commits} mounts=${e.mounts} ms=${e.duration.toFixed(1)}`);
  console.log(`[perf] ${label} | ${rows.join(' | ')}`);
}

/**
 * A `<Profiler>` for the example's own screens, active only during a perf run.
 */
export function PerfProfiler({ id, children }: { id: string; children: ReactNode }) {
  if (!PERF_RUN) return <>{children}</>;
  return (
    <Profiler id={id} onRender={onPerfRender}>
      {children}
    </Profiler>
  );
}

/**
 * Plays the scripted session during a perf run. Render it inside the player's `VideoProvider`, as
 * its own component, so its re-renders don't re-render the screen being measured:
 * 8 s to load and settle, then 10 s each of playing, paused, and playing with a controls toggle
 * (a tap) every 2 s. Ratios between windows matter; dev builds inflate the absolute times.
 */
export function PerfRun() {
  const { setPlaying } = usePlayback();
  const { toggleControls } = useControlsVisibility();

  useEffect(() => {
    if (!PERF_RUN) return;
    const play = setPlaying;
    const timers = [
      setTimeout(resetPerf, 8000),
      setTimeout(() => {
        perfReport('playing 10s');
        play(false);
      }, 18000),
      setTimeout(resetPerf, 19000),
      setTimeout(() => {
        perfReport('paused 10s');
        play(true);
      }, 29000),
      setTimeout(resetPerf, 31000),
      ...[32000, 34000, 36000, 38000, 40000].map((t) => setTimeout(toggleControls, t)),
      setTimeout(() => perfReport('playing+5 taps 10s'), 41000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [setPlaying, toggleControls]);

  return null;
}
