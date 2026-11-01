import React, { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useVideoSelector } from '../providers';
import { useVideoStore } from '../providers/VideoProvider';
import { useControlsController } from '../providers/ControlsController';
import { useProgressStore } from '../providers/ProgressStore';
import { addTVRemoteListener } from './tvRemote';
import { createTVFocus, TRAP_FOCUS, TVFocusContext, tvPreferredFocus } from './TVFocus';

/** How far the remote's left and right, and its rewind and fast-forward keys, seek, in seconds. */
const SEEK_STEP = 10;

/** While left or right is held, the position moves a step this often, in milliseconds. */
const SCRUB_TICK = 250;

/** The step while held: faster the longer the hold, as TV video apps do. */
const scrubStep = (heldFor: number) => (heldFor < 2000 ? 10 : heldFor < 5000 ? 30 : 60);

/**
 * When a player that had the focus unmounted. Apps often mount a new player for the next episode,
 * and Android then moves the focus to the first thing on the screen; the new player takes it back.
 */
let focusHandedOffAt = 0;

/** Keys that bring up the controls from the hidden player, with the play button focused. */
const SHOW_CONTROLS_KEYS = new Set(['select', 'up', 'down']);

/**
 * Drives the player from a TV remote, the way TV video apps do. While the controls are hidden, a
 * surface over the video holds focus: left and right seek and bring up the progress bar, and select,
 * up and down bring up the controls on the play button. With the controls up, the D-pad moves
 * between them, any key keeps them up, and Back hides them. Holding left or right scrubs, faster the
 * longer it's held, and seeks once on release. The media keys work wherever focus is.
 * Rendered by `VideoPlayer` on TV only, around the layout.
 * @internal
 */
export const TVPlayerFocus = ({ children }: { children: ReactNode }): React.ReactElement => {
  const store = useVideoStore();
  const progressStore = useProgressStore();
  const controls = useControlsController();
  const [focus] = useState(createTVFocus);
  const controlsVisible = useVideoSelector((state) => state.controlsVisible);
  // From the focus state directly: this component provides it, so the context hook above it sees none
  const target = useSyncExternalStore(focus.subscribe, focus.getTarget, focus.getTarget);
  const surfacePreferred = target === 'surface' && !controlsVisible;

  useEffect(() => {
    const clamp = (time: number) => {
      const { duration } = store.getState();
      return Math.max(0, duration > 0 ? Math.min(time, duration) : time);
    };
    const seekTo = (time: number) => {
      store.getState().videoRef?.current?.seek(time);
      progressStore.update({ currentTime: time });
    };
    const seekBy = (seconds: number) => seekTo(clamp(progressStore.getSnapshot().currentTime + seconds));
    const togglePlay = () => store.dispatch({ type: 'TOGGLE_PLAY_PAUSE' });

    // Holding left or right: the thumb and the time move on a timer, and the player seeks once on
    // release, rather than a seek on every step at a stream that would buffer each one
    let scrub: { startedAt: number; time: number; timer: ReturnType<typeof setInterval> } | null = null;
    const endScrub = (commit: boolean) => {
      if (!scrub) return;
      clearInterval(scrub.timer);
      const { time } = scrub;
      scrub = null;
      progressStore.setPreview(null);
      if (commit) seekTo(time);
    };
    const startScrub = (direction: 1 | -1) => {
      endScrub(true);
      const startedAt = Date.now();
      const step = () => {
        if (!scrub) return;
        // The player lost the focus without a release, so stop where it got to
        if (focus.getHolder() === null) return endScrub(true);
        scrub.time = clamp(scrub.time + direction * scrubStep(Date.now() - startedAt));
        progressStore.setPreview(scrub.time);
        controls.show();
      };
      scrub = { startedAt, time: progressStore.getSnapshot().currentTime, timer: setInterval(step, SCRUB_TICK) };
      step();
    };

    const stopRemote = addTVRemoteListener(({ eventType, eventKeyAction }) => {
      // A held key comes as a long press: `longLeft`/`longRight` as the hold starts, and again with
      // `eventKeyAction` 1 on release
      if (eventType === 'longLeft' || eventType === 'longRight') {
        if (eventKeyAction === 1) return endScrub(true);
        const holder = focus.getHolder();
        if (holder !== 'surface' && holder !== 'progress') return;
        if (holder === 'surface') focus.setTarget('progress');
        return startScrub(eventType === 'longRight' ? 1 : -1);
      }
      // Another key ends a hold whose release went missing
      endScrub(true);
      // Android TV reports the release (and a press only when key-down events are on), so act on the
      // release, and skip the press wherever both come
      if (eventKeyAction === 0) return;
      switch (eventType) {
        case 'playPause':
          togglePlay();
          return controls.show();
        case 'play':
        case 'pause':
          store.dispatch({ type: 'SET_PLAYING', payload: eventType === 'play' });
          return controls.show();
        case 'fastForward':
        case 'rewind':
          seekBy(eventType === 'fastForward' ? SEEK_STEP : -SEEK_STEP);
          return controls.show();
      }
      const holder = focus.getHolder();
      // The D-pad only drives the player while it has focus
      if (holder === null) return;
      const direction = eventType === 'left' ? -1 : eventType === 'right' ? 1 : 0;
      if (holder === 'surface') {
        if (direction !== 0) seekBy(direction * SEEK_STEP);
        else if (!SHOW_CONTROLS_KEYS.has(eventType)) return;
        // Batched with showing the controls, so the target is focusable when it's focused
        focus.setTarget(direction !== 0 ? 'progress' : 'play');
      } else if (holder === 'progress') {
        if (direction !== 0) seekBy(direction * SEEK_STEP);
        else if (eventType === 'select') togglePlay();
      }
      // Any press keeps the controls up
      controls.show();
    });

    // The faded-out controls can't keep focus, so it would jump elsewhere on the screen: move it to
    // the surface when they hide while the player has it. Read at the dispatch, before React renders.
    let visible = store.getState().controlsVisible;
    const unsubscribe = store.subscribe(() => {
      const next = store.getState().controlsVisible;
      if (next === visible) return;
      visible = next;
      if (!next && focus.getHolder() !== null) focus.setTarget('surface');
      // And the surface stops taking focus when they show, so if something other than a key brought
      // them up (the source ending, playback starting), focus moves to the play button with them
      const pending = focus.getTarget();
      if (next && focus.getHolder() === 'surface' && pending !== 'play' && pending !== 'progress') {
        focus.setTarget('play');
      }
    });

    // Back hides the controls first, as TV apps do; with them hidden it goes back as usual
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!store.getState().controlsVisible || focus.getHolder() === null) return false;
      controls.hide();
      return true;
    });

    if (Date.now() - focusHandedOffAt < 1000) {
      focusHandedOffAt = 0;
      focus.setTarget(store.getState().controlsVisible ? 'play' : 'surface');
    }

    return () => {
      endScrub(false);
      stopRemote();
      unsubscribe();
      back.remove();
      if (focus.hadFocusRecently()) focusHandedOffAt = Date.now();
    };
  }, [store, progressStore, controls, focus]);

  return (
    <TVFocusContext.Provider value={focus}>
      {/* Traps the D-pad while the controls are hidden, so a press drives the player rather than
          moving focus out of it before the controls come up */}
      <View style={StyleSheet.absoluteFill} collapsable={false} {...(controlsVisible ? null : TRAP_FOCUS)}>
        <Pressable
          style={StyleSheet.absoluteFill}
          focusable={!controlsVisible}
          {...tvPreferredFocus(surfacePreferred)}
          onFocus={() => {
            // Arriving from elsewhere on the screen brings the controls up on the play button, so
            // the player shows it has the focus; being handed the focus as they hid doesn't
            const arriving = !focus.hadFocusRecently();
            focus.setHolder('surface');
            if (arriving) {
              focus.setTarget('play');
              controls.show();
            }
          }}
          onBlur={() => focus.setHolder(null)}
        />
      </View>
      {children}
    </TVFocusContext.Provider>
  );
};
