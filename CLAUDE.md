# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

`react-native-video-toolkit` is a UI toolkit (controls, gestures, menus, subtitles, theming) on top of `react-native-video`, for iOS, Android, Android TV and web. It is a Yarn 3 workspace monorepo (use `yarn`, never `npm`):

- `/` is the library. `src/` is built by react-native-builder-bob into `lib/` (commonjs, module, typescript).
- `example/` is an Expo app (expo-router tabs) that resolves the library from `../src`, so JS changes show up without a build. Native changes need a rebuild.
- `docs/` is the Next.js + fumadocs site (`docs/content/docs/**/*.mdx`). It imports the library from `lib/`, so run `npx bob build` before building or previewing docs after changing `src/`. Read `docs/AGENTS.md` before touching the Next.js code: this Next version differs from older ones.

## Commands

```sh
yarn test                                   # Jest, all suites (src/**/__tests__)
yarn jest src/captions/__tests__/parse.test.ts   # one file
yarn jest -t "drops cues that end before"   # tests whose name matches
yarn typecheck                              # tsc in every workspace
yarn lint                                   # eslint (yarn lint --fix to fix)
npx bob build                               # build lib/ (also `yarn prepare`)
yarn docs build:docs                        # production docs build (catches SSR errors)
yarn docs dev                               # docs dev server

yarn example start                          # Metro for the example app
yarn example android | ios | web            # run the example
yarn example start:tv / android:tv          # Android TV (EXPO_TV=1)
yarn example prebuild / prebuild:tv         # regenerate native projects
```

The pre-commit hook (`.husky/pre-commit`) runs `bob build`, the docs build when `docs/` is staged, `yarn typecheck`, `yarn test`, prettier and `eslint --fix`, then re-stages only the files that were staged. Commit messages follow conventional commits, checked by commitlint: lowercase subject of at least 10 characters, no trailing period, body lines at most 100 characters.

## Architecture

**One store per player.** `VideoProvider` (`src/providers/VideoProvider.tsx`) owns a small external store (reducer and `subscribe`) holding player state, config and theme. Components subscribe to slices with `useVideoSelector(state => state.field)`, so a change re-renders only the components that read it. `useVideo()` returns everything and re-renders on every change: it exists for apps, and toolkit code never calls it. Reducer cases return the same `state` object when nothing changes.

Config and theme props are merged through the `INITIALIZE` action, so they apply live. Every nested group of the defaults merges one level down, and the merged values compare by content, so inline props don't produce new states. Select config fields (`state.config.autoPlay`), never the whole `config`: inline callbacks make it a new object on every parent render. Read callbacks at call time with `store.getState().config.onX`. The provider also owns the window size (`state.dimensions`).

Fast-changing and cross-cutting state lives beside the store, also created per provider:

- `ProgressStore`: the playback position (`useProgress()`, `useProgressValue(select)`), with Reanimated shared values for the slider. Only the player calls `report()`; seeks and resets call `update()`, and listeners get the cause.
- `ControlsController`: shows and hides the controls with one auto-hide timer, and shows them when playback starts or stops.
- `PlayerCommands` (`src/providers/PlayerCommands.ts`): every action on playback (seek with its clamp, play and pause, volume, rate, entering and leaving fullscreen). Hooks, gestures, the TV remote, `VideoSurface` and the fullscreen exits call these rather than dispatching.
- `SettingsProvider`: available and selected audio, video and text tracks, and the settings menu.
- `ComponentsProvider`: replaceable building blocks (`Sheet`, `Slider`, `Spinner`, `PressFeedback`) from the `components` prop, with defaults in `src/components/defaults/`.
- `CaptionsController` (`src/captions/`): which subtitle cues show (below).

**Player composition.** `VideoPlayer` (`src/components/VideoPlayer.tsx`) is a compound component. It renders `VideoSurface`, then its own subtitle layer, then its children (usually `DefaultLayout`, or a custom layout built from `VideoPlayer.PlayButton`, `VideoPlayer.ProgressBar` and so on). A layout that renders `<VideoPlayer.Captions>` claims the subtitles, and the player's own layer steps aside.

`VideoSurface` (`src/components/core/`) is the only code that talks to `react-native-video`:
- it wires the player's events into the stores;
- `startSource()` resets per-source state when the source changes and on `onLoadStart`;
- it lists tracks and passes the selection back.

`GestureHandler` wraps the player with `Gesture.Exclusive(doubleTap, singleTap, pan, longPress)`.

`DefaultLayout` (`src/layouts/`) groups its controls in `FadingControls` wrappers: they are the only parts that read `controlsVisible`, so a tap doesn't re-render the controls inside them. It renders its own `<VideoPlayer.Captions>` above its scrim, with insets measured from its controls' frames.

**Tracks** (`src/tracks/`): one place for languages (ISO 639-1/2 codes, display names, the device language), track labels, the Off entry, and the pick rules for a new source (the viewer's language carries over; otherwise the device's language, the player's pick, then English). These are pure functions.

**Fullscreen** (`src/fullscreen/`):
- the platform calls (`platform.ts` / `platform.web.ts`), with the browser's Esc;
- the orientation lock (`orientation.ts`, through `director.ts`, which has a web stub);
- `getFullscreenHeight`, `useFullscreen`, and the Esc and Android back handlers.

The player id prefix (`video-player-<id>`) used by web fullscreen is in `playerId.ts`.

**Menus, sheets and portals.** `Menu` (`src/components/menu/Menu.tsx`) is a set of generic parts: `Menu.Root` keeps its own open state (or takes `open`/`onOpenChange`) and a page stack, and `Menu.Trigger`, `Menu.Content`, `Menu.SubContent` (a page), `Menu.Item` and `Menu.RadioItem` build on it. The settings menu (`SettingsMenu.tsx`, internal) is built from data with those parts. A menu renders through the `Sheet` component into a portal host (`VideoPortalHost`, `@rn-primitives/portal`). Portal content sits outside the providers, so `Menu.Content` re-provides the toolkit's contexts with `ContextBridge` (`src/providers/ContextBridge.tsx`): a new context goes in its `BRIDGED` list.

**Subtitles** (`src/captions/`). By default the toolkit draws subtitles itself instead of the native player:

- **Parsing and loading:** pure WebVTT and SRT parsers (`parse/`), a loader with encoding detection, a cache and a timeout (`load.ts`, `decode.ts`), and HLS WebVTT renditions fetched around the playhead (`hls.ts`).
- **Timing:** `CaptionsController` predicts media time between progress reports and sets one timer per cue boundary.
- **Drawing:** the `Captions` overlay positions cues on the picture rectangle.
- **Track handling:** `useCaptionTracks` (`src/captions/`), called by `VideoSurface`, strips `source.textTracks` from what `react-native-video` gets and keeps native subtitles disabled. Subtitle files are listed with track indexes from 1000, and HLS renditions from 2000. It maps the selected track to the controller. The controller waits for the player's first report of a new source before showing cues.
- **Opting out:** `config.captionRenderer: 'native'` restores the native renderer.

**TV.** `src/tv/` adds D-pad support: `TVPlayerFocus` puts a focusable surface under the layout and handles the remote, and `TVFocus` tracks which control should hold focus. Use `PlatformUtils.isTV()` (`src/utils/platform.ts`) for TV checks.

**Native and web.** `NativeVideoToolkit` is a TurboModule (`ios/`, `android/`) with a `.web.ts` counterpart. Screen orientation goes through `react-native-orientation-director`, via `src/fullscreen/`; the public `useOrientation` and `utils/orientation` helpers are deprecated. Web fullscreen fullscreens the closest element whose id starts with `video-player` around the player's own `<video>`.

**Test IDs.** Every part takes a `testID`, built by `useTestID(part)` as `<player testID>-<part>`; the player's prefix defaults to `video` (`video-play-button`, `video-settings-captions-1000`). See `docs/content/docs/testing.mdx`.

**Profiling.** `DevProfiler` (`src/utils/DevProfiler.tsx`) wraps hot components. It does nothing unless the example runs its perf harness (`example/perf/`, Metro started with `EXPO_PUBLIC_PERF_RUN=1`).

## Rules learned from past bugs

- Every `useSyncExternalStore` call passes a third argument (`getServerSnapshot`). The docs site prerenders players on the server, and `next build` fails without it.
- Never dispatch to the video store during render. Sync props in a layout effect.
- Use explicit `SET_X(value)` actions rather than toggles for anything two callers or an effect might change.
- Reset per-source state in `VideoSurface`'s `startSource()` (called on a source change and on `onLoadStart`; the web player never sends `onLoadStart`), not in `onLoad`.
- Size fullscreen with `getFullscreenHeight(dimensions, enableScreenRotation)`, never with a layout measured in the other orientation.
- Faded-out controls stay mounted. Everything that fades (the controls' groups, `VideoPlayer.Overlay`) goes through `Fade` (`src/components/common/fade.tsx`), which gives it `pointerEvents: 'none'` and hides it from accessibility while hidden. Screen readers and Argent's `describe` don't list them, and Testing Library's queries skip them unless you pass `{ includeHiddenElements: true }`. In a test, show the controls before checking or tapping one.
- Reanimated's animated views drop `pointerEvents: 'box-none'` on web: a full-size one swallows every click, and one shown again keeps `none`. So `Fade` is a plain `View` with a CSS transition on web, and full-size layers over the video go through `VideoPlayer.Overlay`. Pass `useAnimatedStyle` dependencies through `webDependencies(...)`.
- react-native-video quirks: subtitles off must be `SelectedTrackType.DISABLED` (index -1 crashes iOS). Android's `onPlaybackRateChange` reports 1 or 0, not the speed, so the toolkit owns the rate. With `repeat`, `onEnd` fires on every loop. Android leaves `buffering` set after an error.
- Tracks carry across sources by language, never by index.
- Don't change app-wide state, such as orientation, on unmount. Apps own the screen lifecycle.

## Apps that use the toolkit

`../uwumi` installs the toolkit from npm (`^1.1.0`), and its Metro loads `lib/module` through `exports`. Renaming any of the following breaks uwumi, so treat that as a breaking change:

- **Components and hooks:** one global `VideoProvider` in its root layout, `VideoPlayer`, `useVideoSelector`, `BaseIconButton`, `BaseButton`, `Menu`, `useMenuContext`, `VideoPortalHost`, `useControlsVisibility`, `usePlayback`, `usePlaybackRate` and `useProgress`.
- **Props:** the `components` prop (its own `Slider` everywhere, and its own `Sheet` on phones), the layout slots (`beforeTitle`, `beforeMuteButton`, `beforeProgressBar`, `beforeMenuItems`) and `gestureProps`.
- **Test IDs:** its Argent e2e tests select the toolkit's own (`video-settings-button`, `video-settings-rate-1`, `video-title`, …).

To try an unreleased change in uwumi:

1. Run `npx bob build`.
2. Copy `lib/` into `../uwumi/node_modules/react-native-video-toolkit/`.
3. Restart uwumi's Metro with `--clear`.

Native changes also need a uwumi rebuild, and uwumi's next `yarn install` puts the npm version back.

## Tests

**Setup:**
- Jest uses `@react-native/jest-preset`.
- `babel.config.js` switches to `@react-native/babel-preset` only when `NODE_ENV` is `test`; builds use bob's preset.
- `jest.resolver.js` chains Reanimated's resolver.
- `jest.setup.ts` mocks Reanimated, Worklets, the native module and the orientation director. It also mocks `react-native-video`'s player as a `View` (test ID `native-video`), whose ref has a `seek` mock.
- The config sets `restoreMocks`, so spies reset between tests.

**Writing tests:**
- `@testing-library/react-native` 14 has async `render` and `act`, so always `await` them.
- Tests that render `VideoPlayer` need a `GestureHandlerRootView`.
- The toolkit's buttons use gesture-handler taps, not `onPress`. Tap them with `fireGestureHandler(getByGestureTestId('video-play-button'))` from `react-native-gesture-handler/jest-utils`: `BaseButton`'s tap gesture carries the button's test ID.
- Drive the player through the mocked view's props (`onLoad`, `onProgress`...).

Tests check behaviour through public API, and each one should fail on a real regression.

## Docs and JSDoc style

`CONTRIBUTING.md` defines the docs style guide (file naming, frontmatter, heading order, Property | Type | Default | Description tables, fumadocs `<Callout>` instead of admonitions) and strict JSDoc rules: a one-line summary, then a blank line, then `@param {Type} name - Description.` and `@returns`, in active voice. Component JSDoc goes directly above the export, with the props interface above it. Write user-facing docs for the developer using the library, not for its implementer.

## Planned work

- **Audit rounds.** The untangle refactor (2026-11-16/20, `8f5c744..d8348a8`) had two audit rounds after its fixes, and everything they found is fixed. Round 2 still found about 25 smaller items, so a third, confirming round is worth running:
  - use fresh read-only agents, one per slice (state, hooks and utils; components, layouts and TV; subtitles, tests and docs);
  - the rubric and earlier audits are local only, in `.refactor/untangle/` (git-excluded);
  - fix what's worth fixing, and repeat until they find nothing.
- **Remove the deprecated API in 2.0.** Every item is marked `@deprecated … Will be removed in 2.0` in code and docs (`grep -rn "@deprecated" src`). The main ones:
  - the orientation helpers (`useOrientation`, `utils/orientation`) and `ThemeProvider`;
  - the `useCustomAudioTracks`/`useCustomVideoTracks` flags, `enableVolumeControl`, and unused theme fields (`animations`, `iconActive`...);
  - the `SHOW_CONTROLS`, `HIDE_CONTROLS`, `SEEK`, `SET_VIDEO_REF` and `TOGGLE_FULLSCREEN` actions, and `videoWrapperLayout`;
  - `useProgress`'s setters and `useBuffering`'s `setBuffering`, `MenuProvider`, `Menu.Content`'s placement props, `CommonLayoutStyles`, VolumeControl's `orientation`, `gestureProps.videoRef` and `SubitleProps`.

  Removing them is a breaking change, so check `../uwumi` uses none of them first.
- **Open decisions:**
  - the long press has no flag of its own; it follows double tap or pan;
  - a height in `containerStyle` overrides the fullscreen height in `VideoPlayer`.
