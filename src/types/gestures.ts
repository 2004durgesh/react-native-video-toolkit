import type {
  GestureStateChangeEvent,
  GestureTouchEvent,
  GestureUpdateEvent,
  PanGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import type { VideoRef } from 'react-native-video';
import type { RefObject } from 'react';

/**
 * Props for the useDoubleTapGesture hook.
 */
export interface UseDoubleTapGestureProps {
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
export interface UsePanGestureProps {
  /**
   * A callback function that is called when a vertical pan gesture is performed on the left side of the screen.
   */
  onLeftVerticalPan?: (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => void;
  /**
   * A callback function that is called when a vertical pan gesture is performed on the right side of the screen.
   */
  onRightVerticalPan?: (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => void;
  /**
   * A callback function that is called when a vertical pan gesture is performed anywhere on the screen.
   */
  onGlobalVerticalPan?: (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => void;
}

/**
 * Props for the useSingleTapGesture hook.
 */
export interface UseSingleTapGestureProps {
  /**
   * A callback function that is called when a single tap gesture is performed anywhere on the screen.
   */
  onSingleTap?: (e: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
}

/**
 * Props for the useLongPressGesture hook.
 */
export interface UseLongPressGestureProps {
  /**
   * A callback function that is called when a long press gesture starts.
   */
  onLongPressStart?: (e: GestureTouchEvent) => void;

  /**
   * A callback function that is called when a long press gesture ends.
   */
  onLongPressEnd?: (e: GestureStateChangeEvent<TapGestureHandlerEventPayload>) => void;
}

/**
 * Props for the GestureHandler component.
 */
export interface GestureHandlerProps
  extends
    Partial<UseDoubleTapGestureProps>,
    Partial<UsePanGestureProps>,
    Partial<UseSingleTapGestureProps>,
    Partial<UseLongPressGestureProps> {
  /**
   * The children to render inside the gesture handler.
   */
  children?: React.ReactNode;
}
