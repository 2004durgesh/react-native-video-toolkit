import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Portal } from '@rn-primitives/portal';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface PopoverContentProps {
  children: ReactNode;
  visible: boolean;
  onClose?: () => void;
  portalHost?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A popover content container rendered via portal with animated fade transitions.
 *
 * @param {PopoverContentProps} props - The props for the component.
 * @returns {React.ReactElement | null} The popover content component.
 */
const PopoverContent = ({
  children,
  visible,
  onClose,
  portalHost,
  style,
}: PopoverContentProps): React.ReactElement | null => {
  if (!visible) return null;

  return (
    <Portal name="popover-content" hostName={portalHost}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut}>
          <Pressable style={StyleSheet.flatten([styles.content, style])} onPress={(e) => e.stopPropagation()}>
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Portal>
  );
};

export { PopoverContent };

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  content: {
    width: 288,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
});
