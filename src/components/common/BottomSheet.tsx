import React, { type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import * as Dialog from '@rn-primitives/dialog';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInRight,
  SlideOutDown,
  SlideOutRight,
} from 'react-native-reanimated';
import { PlatformUtils } from '../../utils/orientation';

/** Bottom sheets stop growing at 640 wide on large screens (Material guidance). */
const SHEET_MAX_WIDTH = 640;

/** On TV the sheet becomes a right-hand side panel taking about a third of the screen. */
const TV_PANEL_WIDTH_RATIO = 0.33;
const TV_PANEL_MIN_WIDTH = 320;
const TV_PANEL_MAX_WIDTH = 600;

const IS_TV = PlatformUtils.isTV();

interface BottomSheetRootProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface BottomSheetTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface BottomSheetPortalProps {
  children: ReactNode;
  hostName?: string;
  forceMount?: true | undefined;
}

interface BottomSheetOverlayProps {
  style?: StyleProp<ViewStyle>;
  closeOnPress?: boolean;
  forceMount?: true | undefined;
}

interface BottomSheetContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  showGrabber?: boolean;
  forceMount?: true | undefined;
  /**
   * Accessible title for the sheet. Rendered visually hidden and announced by
   * screen readers. Required by the underlying dialog on web for accessibility.
   */
  title?: string;
  /**
   * Optional accessible description for the sheet. Rendered visually hidden.
   */
  description?: string;
}

interface BottomSheetCloseProps {
  children: ReactNode;
  asChild?: boolean;
}

/**
 * Root component that manages the bottom sheet's open/close state.
 *
 * @param {BottomSheetRootProps} props - The props for the component.
 * @returns {ReactElement} The bottom sheet root component.
 */
const BottomSheetRoot = ({ children, open, onOpenChange }: BottomSheetRootProps): ReactElement => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
};

/**
 * Trigger element that opens the bottom sheet.
 *
 * @param {BottomSheetTriggerProps} props - The props for the component.
 * @returns {ReactElement} The bottom sheet trigger component.
 */
const BottomSheetTrigger = ({ children, asChild = true }: BottomSheetTriggerProps): ReactElement => {
  return <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>;
};

/**
 * Portal that renders the sheet outside the component tree, into the host.
 *
 * @param {BottomSheetPortalProps} props - The props for the component.
 * @returns {ReactElement} The bottom sheet portal component.
 */
const BottomSheetPortal = ({ children, hostName, forceMount }: BottomSheetPortalProps): ReactElement => {
  return (
    <Dialog.Portal hostName={hostName} forceMount={forceMount}>
      {children}
    </Dialog.Portal>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * react-native-reanimated's web layout-animation path is unstable in some
 * bundler setups (it throws "Cannot convert undefined or null to object" when
 * resolving the DOM node). The sheet/overlay transitions are polish, so we skip
 * them on web while keeping them on native.
 *
 * @template T
 * @param {T} animation - The layout animation config (e.g. `FadeIn.duration(200)`).
 * @returns {T | undefined} The animation on native, or `undefined` on web.
 */
const webSafeAnimation = <T,>(animation: T): T | undefined => (PlatformUtils.isWeb() ? undefined : animation);

/**
 * Normalizes a style prop before it is flattened.
 *
 * When a style array (e.g. `[a, b, c]`) is passed through a component that merges
 * props via object spread (`{ ...style }`, as `@radix-ui/react-slot` does on web),
 * the array is turned into an array-like object (`{ 0: a, 1: b, 2: c }`). Passing
 * that to `StyleSheet.flatten` on react-native-web keeps the numeric keys, which
 * then leak to the DOM node and throw:
 * "Failed to set an indexed property [0] on 'CSSStyleDeclaration'".
 *
 * This restores such array-like objects back into a real array so flattening
 * produces a plain style object. Real arrays and plain style objects pass through
 * untouched.
 *
 * @param {StyleProp<ViewStyle>} style - The style prop to normalize.
 * @returns {StyleProp<ViewStyle>} A style value safe to flatten.
 */
const normalizeStyle = (style: StyleProp<ViewStyle>): StyleProp<ViewStyle> => {
  if (!style || Array.isArray(style) || typeof style !== 'object') {
    return style;
  }
  const keys = Object.keys(style);
  const isArrayLike = keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
  if (!isArrayLike) {
    return style;
  }
  return keys.sort((a, b) => Number(a) - Number(b)).map((key) => (style as Record<string, StyleProp<ViewStyle>>)[key]);
};

/**
 * Dimmed backdrop behind the sheet that closes it on press.
 *
 * @param {BottomSheetOverlayProps} props - The props for the component.
 * @returns {ReactElement} The bottom sheet overlay component.
 */
const BottomSheetOverlay = ({ style, closeOnPress = true, forceMount }: BottomSheetOverlayProps): ReactElement => {
  return (
    <Dialog.Overlay closeOnPress={closeOnPress} forceMount={forceMount} asChild>
      <AnimatedPressable
        entering={webSafeAnimation(FadeIn.duration(200))}
        exiting={webSafeAnimation(FadeOut.duration(200))}
        style={StyleSheet.flatten([styles.overlay, normalizeStyle(style)])}
      />
    </Dialog.Overlay>
  );
};

/**
 * Sheet container that slides into view.
 *
 * On phones, tablets and web it is a bottom sheet capped at the screen's shorter side (and at
 * {@link SHEET_MAX_WIDTH}), so in landscape/fullscreen it stays as wide as it is in portrait
 * and is centered instead of spanning the whole screen. On TV it becomes a full-height panel
 * on the right edge, with no grabber since there is no touch input.
 *
 * @param {BottomSheetContentProps} props - The props for the component.
 * @returns {ReactElement} The bottom sheet content component.
 */
const BottomSheetContent = ({
  children,
  style,
  showGrabber = true,
  forceMount,
  title = 'Menu',
  description,
}: BottomSheetContentProps): ReactElement => {
  const { width, height } = useWindowDimensions();

  const sizeStyle: ViewStyle = IS_TV
    ? { width: Math.min(TV_PANEL_MAX_WIDTH, Math.max(TV_PANEL_MIN_WIDTH, width * TV_PANEL_WIDTH_RATIO)) }
    : { maxWidth: Math.min(SHEET_MAX_WIDTH, width, height) };

  return (
    <View style={IS_TV ? styles.panelWrapper : styles.sheetWrapper} pointerEvents="box-none">
      <Dialog.Content forceMount={forceMount} asChild>
        <Animated.View
          entering={webSafeAnimation(IS_TV ? SlideInRight.duration(300) : SlideInDown.duration(300))}
          exiting={webSafeAnimation(IS_TV ? SlideOutRight.duration(250) : SlideOutDown.duration(250))}
          style={StyleSheet.flatten([IS_TV ? styles.panel : styles.sheet, sizeStyle, normalizeStyle(style)])}>
          <Dialog.Title style={styles.srOnly}>{title}</Dialog.Title>
          {description ? <Dialog.Description style={styles.srOnly}>{description}</Dialog.Description> : null}
          {showGrabber && !IS_TV && <View style={styles.grabber} />}
          {children}
        </Animated.View>
      </Dialog.Content>
    </View>
  );
};

/**
 * Close button that dismisses the sheet.
 *
 * @param {BottomSheetCloseProps} props - The props for the component.
 * @returns {ReactElement} The bottom sheet close component.
 */
const BottomSheetClose = ({ children, asChild = true }: BottomSheetCloseProps): ReactElement => {
  return <Dialog.Close asChild={asChild}>{children}</Dialog.Close>;
};

export {
  BottomSheetRoot,
  BottomSheetTrigger,
  BottomSheetPortal,
  BottomSheetOverlay,
  BottomSheetContent,
  BottomSheetClose,
};

export type {
  BottomSheetRootProps,
  BottomSheetTriggerProps,
  BottomSheetPortalProps,
  BottomSheetOverlayProps,
  BottomSheetContentProps,
  BottomSheetCloseProps,
};

/**
 * Provides access to the bottom sheet root context (open state and setter).
 */
export const useBottomSheetContext = Dialog.useRootContext;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetWrapper: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    marginHorizontal: 'auto',
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 12,
    elevation: 12,
  },
  panelWrapper: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  panel: {
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingVertical: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: -2, height: 0 },
    shadowRadius: 16,
    elevation: 16,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: 'hidden',
    opacity: 0,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    marginBottom: 8,
  },
});
