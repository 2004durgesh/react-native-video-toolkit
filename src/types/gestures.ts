import type {
  GestureTouchEvent,
  LongPressGestureEvent,
  PanGestureActiveEvent,
  TapGestureEvent,
} from 'react-native-gesture-handler';
import type { VideoRef } from 'react-native-video';
import type { RefObject } from 'react';

/**
 * Turns a gesture hook's gesture on and off.
 */
export interface GestureEnabledProps {
  /**
   * Whether the gesture recognizes touches. When off, the gestures composed with it act as if it
   * weren't there.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Props for the useDoubleTapGesture hook.
 */
export interface UseDoubleTapGestureProps extends GestureEnabledProps {
  /**
   * A ref to the video component.
   */
  videoRef: RefObject<VideoRef> | null;
  /**
   * The interval in seconds to seek forward or backward when double tapping.
   */
  doubleTapSeekInterval?: number;
  /**
   * A callback function that is called when a double tap seek starts.
   */
  onDoubleTapSeekStart?: () => void;
  /**
   * A callback function that is called when a double tap seek ends.
   */
  onDoubleTapSeekEnd?: () => void;
}

/**
 * Props for the usePanGesture hook.
 */
export interface UsePanGestureProps extends GestureEnabledProps {
  /**
   * A callback function that is called when a vertical pan gesture is performed on the left side of the screen.
   */
  onLeftVerticalPan?: (e: PanGestureActiveEvent) => void;
  /**
   * A callback function that is called when a vertical pan gesture is performed on the right side of the screen.
   */
  onRightVerticalPan?: (e: PanGestureActiveEvent) => void;
  /**
   * A callback function that is called when a vertical pan gesture is performed anywhere on the screen.
   */
  onGlobalVerticalPan?: (e: PanGestureActiveEvent) => void;
  /**
   * A callback function that is called once when a vertical pan ends as an upward swipe (far or fast enough).
   */
  onSwipeUp?: () => void;
  /**
   * A callback function that is called once when a vertical pan ends as a downward swipe (far or fast enough).
   */
  onSwipeDown?: () => void;
}

/**
 * Props for the useSingleTapGesture hook.
 */
export interface UseSingleTapGestureProps extends GestureEnabledProps {
  /**
   * A callback function that is called when a single tap gesture is performed anywhere on the screen.
   */
  onSingleTap?: (e: TapGestureEvent) => void;
}

/**
 * Props for the useLongPressGesture hook.
 */
export interface UseLongPressGestureProps extends GestureEnabledProps {
  /**
   * A callback function that is called when a long press gesture starts.
   */
  onLongPressStart?: (e: GestureTouchEvent) => void;

  /**
   * A callback function that is called when a long press gesture ends.
   */
  onLongPressEnd?: (e: LongPressGestureEvent) => void;
}

/**
 * Props for the GestureHandler component.
 */
export interface GestureHandlerProps
  extends
    Partial<Omit<UseDoubleTapGestureProps, 'enabled'>>,
    Partial<Omit<UsePanGestureProps, 'enabled'>>,
    Partial<Omit<UseSingleTapGestureProps, 'enabled'>>,
    Partial<Omit<UseLongPressGestureProps, 'enabled'>> {
  /**
   * The children to render inside the gesture handler.
   */
  children?: React.ReactNode;
}
