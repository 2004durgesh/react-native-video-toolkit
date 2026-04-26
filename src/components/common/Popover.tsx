import React, { type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as RNPopover from '@rn-primitives/popover';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface PopoverRootProps {
  children: ReactNode;
  onOpenChange?: (open: boolean) => void;
}

interface PopoverTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface PopoverPortalProps {
  children: ReactNode;
  hostName?: string;
  forceMount?: true | undefined;
}

interface PopoverOverlayProps {
  style?: StyleProp<ViewStyle>;
  closeOnPress?: boolean;
  forceMount?: true | undefined;
}

interface PopoverContentProps {
  children: ReactNode;
  side?: 'top' | 'bottom';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
  avoidCollisions?: boolean;
  style?: StyleProp<ViewStyle>;
  forceMount?: true | undefined;
}

interface PopoverCloseProps {
  children: ReactNode;
  asChild?: boolean;
}

/**
 * Root component that manages popover open/close state.
 *
 * @param {PopoverRootProps} props - The props for the component.
 * @returns {ReactElement} The popover root component.
 */
const PopoverRoot = ({ children, onOpenChange }: PopoverRootProps): ReactElement => {
  return <RNPopover.Root onOpenChange={onOpenChange}>{children}</RNPopover.Root>;
};

/**
 * Trigger element that toggles the popover and provides anchor positioning.
 *
 * @param {PopoverTriggerProps} props - The props for the component.
 * @returns {ReactElement} The popover trigger component.
 */
const PopoverTrigger = ({ children, asChild = true }: PopoverTriggerProps): ReactElement => {
  return <RNPopover.Trigger asChild={asChild}>{children}</RNPopover.Trigger>;
};

/**
 * Portal that renders popover content outside the component tree.
 *
 * @param {PopoverPortalProps} props - The props for the component.
 * @returns {ReactElement} The popover portal component.
 */
const PopoverPortal = ({ children, hostName, forceMount }: PopoverPortalProps): ReactElement => {
  return (
    <RNPopover.Portal hostName={hostName} forceMount={forceMount}>
      {children}
    </RNPopover.Portal>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Full-screen overlay behind the popover content that closes on press.
 *
 * @param {PopoverOverlayProps} props - The props for the component.
 * @returns {ReactElement} The popover overlay component.
 */
const PopoverOverlay = ({ style, closeOnPress = true, forceMount }: PopoverOverlayProps): ReactElement => {
  return (
    <RNPopover.Overlay closeOnPress={closeOnPress} forceMount={forceMount} asChild>
      <AnimatedPressable
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={StyleSheet.flatten([styles.overlay, style])}
      />
    </RNPopover.Overlay>
  );
};

/**
 * Content container positioned relative to the trigger.
 *
 * @param {PopoverContentProps} props - The props for the component.
 * @returns {ReactElement} The popover content component.
 */
const PopoverContent = ({
  children,
  side = 'bottom',
  sideOffset = 8,
  align = 'end',
  alignOffset = 0,
  avoidCollisions = true,
  style,
  forceMount,
}: PopoverContentProps): ReactElement => {
  return (
    <RNPopover.Content
      side={side}
      sideOffset={sideOffset}
      align={align}
      alignOffset={alignOffset}
      avoidCollisions={avoidCollisions}
      forceMount={forceMount}
      style={StyleSheet.flatten([styles.content, style])}>
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
        {children}
      </Animated.View>
    </RNPopover.Content>
  );
};

/**
 * Close button that dismisses the popover.
 *
 * @param {PopoverCloseProps} props - The props for the component.
 * @returns {ReactElement} The popover close component.
 */
const PopoverClose = ({ children, asChild = true }: PopoverCloseProps): ReactElement => {
  return <RNPopover.Close asChild={asChild}>{children}</RNPopover.Close>;
};

export { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverOverlay, PopoverContent, PopoverClose };

export type {
  PopoverRootProps,
  PopoverTriggerProps,
  PopoverPortalProps,
  PopoverOverlayProps,
  PopoverContentProps,
  PopoverCloseProps,
};

/**
 * Provides access to the popover root context.
 */
export const usePopoverContext = RNPopover.useRootContext;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  content: {
    borderRadius: 8,
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
});
