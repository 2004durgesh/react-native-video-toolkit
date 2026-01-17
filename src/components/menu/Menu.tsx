import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  type ViewStyle,
  type TextStyle,
  type PressableProps,
  type ViewProps,
  type TextProps,
  type StyleProp,
} from 'react-native';
import { BaseIconButton, BottomSheet, type BottomSheetProps } from '../common';
import { useVideo } from '../../providers';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  type AnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSettings } from '../../hooks';
import { SettingsButton, type SettingsButtonProps } from '../controls';
import { ChevronLeft, Close } from '../svgs';
import { Title } from '../display';
import Check from '../svgs/Check';

interface MenuContextType {
  closeSettings: () => void;
  openSettings: () => void;
  isSettingsMenuVisible: boolean;
  navigationStack: string[];
  navigateTo: (viewId: string) => void;
  goBack: () => void;
  currentView: string;
}

interface MenuRootProps {
  children: ReactNode;
  initialView?: string;
}

interface MenuContentProps extends Partial<BottomSheetProps> {
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  header?: (currentView: string) => ReactNode;
}

interface MenuSubContentProps {
  viewId: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface MenuItemProps extends PressableProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  value?: string;
  autoClose?: boolean;
  navigateTo?: string;
}

interface MenuLabelProps extends TextProps {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}

interface MenuSeparatorProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

interface MenuGroupProps extends ViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface MenuCheckboxItemProps extends PressableProps {
  children: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

interface MenuCloseProps extends PressableProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface MenuBackProps extends PressableProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface MenuHeaderProps extends ViewProps {
  children?: ReactNode;
  title?: string;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);
export const MenuProvider = MenuContext.Provider;

const useMenuContext = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu components must be used within a Menu.Root');
  }
  return context;
};

// Animated components
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Custom hook for slide animations
const useSlideAnimation = (
  isVisible: boolean,
  direction: 'left' | 'right' = 'right'
): {
  animatedStyle: AnimatedStyle<ViewStyle>;
  opacity: SharedValue<number>;
} => {
  const translateX = useSharedValue(direction === 'right' ? 300 : -300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateX.value = withTiming(0, {
        duration: 300,
      });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      translateX.value = withTiming(direction === 'right' ? 300 : -300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, translateX, opacity, direction]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    }),
    [translateX, opacity]
  );

  return { animatedStyle, opacity };
};

export const Menu = {
  /**
   * Root component with navigation stack for sub-menus.
   */
  Root: ({ children, initialView = 'root' }: MenuRootProps): React.ReactElement => {
    const { openSettings, closeSettings, isSettingsMenuVisible } = useSettings();
    const [navigationStack, setNavigationStack] = useState<string[]>([initialView]);
    const currentView = navigationStack[navigationStack.length - 1] || initialView;

    const navigateTo = (viewId: string): void => {
      setNavigationStack((prev) => [...prev, viewId]);
    };

    const goBack = (): void => {
      if (navigationStack.length > 1) {
        setNavigationStack((prev) => prev.slice(0, -1));
      } else {
        closeSettings();
      }
    };

    useEffect(() => {
      if (!isSettingsMenuVisible) {
        setNavigationStack([initialView]);
      }
    }, [isSettingsMenuVisible, initialView]);

    return (
      <MenuProvider
        value={{
          closeSettings,
          openSettings,
          isSettingsMenuVisible,
          navigationStack,
          navigateTo,
          goBack,
          currentView,
        }}>
        {children}
      </MenuProvider>
    );
  },

  /**
   * Trigger to open the menu.
   */
  Trigger: (props: SettingsButtonProps): React.ReactElement => {
    return <SettingsButton {...props} />;
  },

  /**
   * Header component for menu navigation and titles.
   */
  Header: ({
    children,
    title,
    showBackButton = true,
    showCloseButton = true,
    style,
    titleStyle,
    ...props
  }: MenuHeaderProps): React.ReactElement => {
    const { currentView, goBack, navigationStack } = useMenuContext();
    const { state } = useVideo();
    const { theme } = state;

    const displayTitle = title || (currentView === 'root' ? 'Settings' : currentView);
    const shouldShowBackButton = showBackButton && (navigationStack.length > 1 || currentView !== 'root');

    return (
      <AnimatedView
        style={[styles.header, { borderBottomColor: theme.colors.border || '#ccc' }, style]}
        entering={SlideInRight.duration(300)}
        {...props}>
        {shouldShowBackButton && <Menu.Back />}
        {children || (
          <Title text={displayTitle} style={[styles.headerTitle, { color: theme.colors.text }, titleStyle]} />
        )}
        {showCloseButton && <Menu.Close />}
      </AnimatedView>
    );
  },

  /**
   * Content wrapper for the BottomSheet with enhanced animations.
   */
  Content: ({ children, sheetStyle, header, ...props }: MenuContentProps): React.ReactElement => {
    const { isSettingsMenuVisible, closeSettings, currentView } = useMenuContext();
    const menuContext = useMenuContext();
    const { state } = useVideo();
    const { theme } = state;
    const opacity = useSharedValue(0);

    useEffect(() => {
      if (isSettingsMenuVisible) {
        opacity.value = withTiming(1, { duration: 300 });
      } else {
        opacity.value = withTiming(0, { duration: 200 });
      }
    }, [currentView, opacity, isSettingsMenuVisible]);

    const animatedStyle = useAnimatedStyle(
      () => ({
        opacity: opacity.value,
      }),
      [opacity]
    );

    return (
      <BottomSheet visible={isSettingsMenuVisible} onClose={closeSettings} {...props}>
        <AnimatedView
          style={[styles.content, { backgroundColor: theme.colors.background }, sheetStyle]}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}>
          <MenuProvider value={menuContext}>
            {header ? header(currentView) : <Menu.Header />}
            <AnimatedView style={[styles.contentBody, animatedStyle]}>{children}</AnimatedView>
          </MenuProvider>
        </AnimatedView>
      </BottomSheet>
    );
  },

  /**
   * SubContent: Conditionally renders content for a specific view ID with slide animation.
   */
  SubContent: ({ viewId, children, style }: MenuSubContentProps): React.ReactElement | null => {
    const { currentView, navigationStack } = useMenuContext();
    const isVisible = currentView === viewId;
    const wasNavigatedTo = navigationStack.length > 1 && currentView === viewId;

    const { animatedStyle } = useSlideAnimation(isVisible, wasNavigatedTo ? 'right' : 'left');

    if (!isVisible) return null;

    return (
      <AnimatedView
        style={[styles.subContent, style, animatedStyle]}
        entering={SlideInRight.duration(300)}
        exiting={SlideOutLeft.duration(200)}>
        {children}
      </AnimatedView>
    );
  },

  /**
   * Item: Enhanced with spring animation on press.
   */
  Item: ({
    children,
    onPress,
    style,
    textStyle,
    value,
    autoClose = true,
    navigateTo: navTo,
    ...props
  }: MenuItemProps): React.ReactElement => {
    const { closeSettings, navigateTo: ctxNavigate } = useMenuContext();
    const { state } = useVideo();
    const { theme } = state;
    const scale = useSharedValue(1);

    const handlePressIn = (): void => {
      scale.value = withTiming(0.95, {
        duration: 100,
      });
    };

    const handlePressOut = (): void => {
      scale.value = withTiming(1, {
        duration: 100,
      });
    };

    const handlePress = (): void => {
      scale.value = withTiming(
        1.02,
        {
          duration: 50,
        },
        () => {
          scale.value = withTiming(1, {
            duration: 100,
          });
        }
      );

      if (onPress) {
        // @ts-ignore
        runOnJS(onPress)(value);
      }
      if (navTo) {
        runOnJS(ctxNavigate)(navTo);
      } else if (autoClose) {
        runOnJS((fn: () => void) => {
          fn();
        })(() => {
          setTimeout(() => {
            closeSettings();
          }, 350);
        });
      }
    };

    const animatedStyle = useAnimatedStyle(
      () => ({
        transform: [{ scale: scale.value }],
      }),
      [scale]
    );

    const renderChildren = (): ReactNode => {
      if (typeof children === 'string') {
        return <Text style={[styles.itemText, { color: theme.colors.text }, textStyle]}>{children}</Text>;
      }
      return children;
    };

    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.item, { backgroundColor: theme.colors.background }, style, animatedStyle]}
        entering={FadeIn.delay(100).duration(200)}
        {...props}>
        {renderChildren()}
      </AnimatedPressable>
    );
  },

  /**
   * Label component for section headers.
   */
  Label: ({ children, style, ...props }: MenuLabelProps): React.ReactElement => {
    const { state } = useVideo();
    const { theme } = state;

    return (
      <Animated.Text
        style={[styles.label, { color: theme.colors.text }, style]}
        entering={FadeIn.delay(150).duration(250)}
        {...props}>
        {children}
      </Animated.Text>
    );
  },

  /**
   * Separator component with fade animation.
   */
  Separator: ({ style, ...props }: MenuSeparatorProps): React.ReactElement => {
    const { state } = useVideo();
    const { theme } = state;

    return (
      <AnimatedView
        style={[styles.separator, { backgroundColor: theme.colors.border || '#ccc' }, style]}
        entering={FadeIn.delay(100).duration(200)}
        {...props}
      />
    );
  },

  /**
   * Group component with staggered children animation.
   */
  Group: ({ children, style, ...props }: MenuGroupProps): React.ReactElement => {
    return (
      <AnimatedView style={[styles.group, style]} entering={FadeIn.duration(250)} {...props}>
        {children}
      </AnimatedView>
    );
  },

  /**
   * CheckboxItem component with toggle animation.
   */
  CheckboxItem: ({
    children,
    checked,
    onCheckedChange,
    style,
    textStyle,
    ...props
  }: MenuCheckboxItemProps): React.ReactElement => {
    const [internalChecked, setInternalChecked] = useState(checked ?? false);
    const isChecked = checked !== undefined ? checked : internalChecked;
    const { state } = useVideo();
    const { theme } = state;
    const checkScale = useSharedValue(isChecked ? 1 : 0);

    useEffect(() => {
      checkScale.value = withTiming(isChecked ? 1 : 0, {
        duration: 150,
      });
    }, [isChecked, checkScale]);

    const checkAnimatedStyle = useAnimatedStyle(
      () => ({
        transform: [{ scale: checkScale.value }],
      }),
      [checkScale]
    );

    const handlePress = (): void => {
      const newChecked = !isChecked;
      setInternalChecked(newChecked);
      if (onCheckedChange) {
        onCheckedChange(newChecked);
      }
    };

    return (
      <Menu.Item onPress={handlePress} style={style} textStyle={textStyle} {...props}>
        <View style={styles.radioItem}>
          <Text style={[styles.itemText, { color: theme.colors.text }, textStyle]}>{children}</Text>
          <AnimatedView style={checkAnimatedStyle}>
            {isChecked && <Check fill={theme.colors.text} style={[styles.radioIndicator]} />}
          </AnimatedView>
        </View>
      </Menu.Item>
    );
  },

  /**
   * Close component: a button to manually close the menu.
   */
  Close: ({ children, style, ...props }: MenuCloseProps): React.ReactElement => {
    const { closeSettings } = useMenuContext();

    return (
      <>
        {children || <BaseIconButton onTap={closeSettings} {...props} IconComponent={Close} style={style} {...props} />}
      </>
    );
  },
  /**
   * Back component: a button to go back in the navigation stack.
   */
  Back: ({ children, style, ...props }: MenuBackProps): React.ReactElement => {
    const { goBack, navigationStack } = useMenuContext();
    const canGoBack = navigationStack.length > 1;
    return (
      <>
        {children || (
          <BaseIconButton
            onTap={() => goBack()}
            style={style}
            disabled={!canGoBack}
            {...props}
            IconComponent={ChevronLeft}
          />
        )}
      </>
    );
  },
};

const styles = StyleSheet.create({
  trigger: {
    padding: 8,
    borderRadius: 4,
  },
  triggerText: {
    fontSize: 14,
  },
  content: {
    padding: 0,
    alignSelf: 'stretch',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  itemText: {
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
    opacity: 0.5,
  },
  group: {
    flexDirection: 'column',
  },
  radioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioIndicator: {
    fontSize: 16,
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
    borderBottomWidth: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textTransform: 'capitalize',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  contentBody: {
    flexShrink: 1,
    maxHeight: '100%',
  },
  subContent: {
    flexShrink: 1,
  },
});

export default Menu;
