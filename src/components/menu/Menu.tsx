import React, { createContext, useContext, useState, useEffect, type ReactNode, type ReactElement } from 'react';
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
import { BaseIconButton } from '../common';
import { useVideo, useVideoComponents } from '../../providers';
import { ContextBridge, useBridgedContexts } from '../../providers/ContextBridge';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInRight,
  FadeOutLeft,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSettings } from '../../hooks';
import { PlatformUtils } from '../../utils/orientation';
import { type SettingsButtonProps } from '../controls';
import { ChevronLeft, Close, Settings } from '../svgs';
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

interface MenuContentProps {
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  header?: (currentView: string) => ReactNode;
  portalHost?: string;
  side?: 'top' | 'bottom';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
}

interface MenuSubContentProps {
  viewId: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// FIXED: Omit onPress from PressableProps to avoid signature conflict
interface MenuItemProps extends Omit<PressableProps, 'onPress'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  value?: string;
  autoClose?: boolean;
  navigateTo?: string;
  onPress?: (value?: string) => void; // Custom handler signature
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

interface MenuCheckboxItemProps extends Omit<MenuItemProps, 'onPress'> {
  children: ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
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

/**
 * react-native-reanimated's web layout/style update path throws when it cannot
 * resolve the underlying node ("Cannot convert undefined or null to object").
 * The animations here are non-essential polish (entering fades, press/checkmark
 * scale), so we skip them on web while keeping them on native.
 */
const IS_WEB = PlatformUtils.isWeb();

/**
 * Returns the given reanimated layout-animation config, or `undefined` on web
 * where reanimated's web animation path is unstable in this setup.
 *
 * @template T
 * @param {T} animation - The layout animation config (e.g. `FadeIn.duration(200)`).
 * @returns {T | undefined} The animation on native, or `undefined` on web.
 */
const webSafeAnimation = <T,>(animation: T): T | undefined => (IS_WEB ? undefined : animation);

export const Menu = {
  /**
   * Root component with navigation stack management. The open state lives in the settings state
   * (`useSettings`), so any `Sheet` can host the menu.
   */
  Root: ({ children, initialView = 'root' }: MenuRootProps): ReactElement => {
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
  Trigger: ({ size, color, style, renderSettingIcon }: SettingsButtonProps): ReactElement => {
    const {
      state: { theme },
    } = useVideo();
    const { openSettings } = useMenuContext();
    const SettingsIcon = renderSettingIcon || Settings;
    const iconSize = size ?? theme.iconSizes.md;
    const iconColor = color || theme.colors.iconNormal;

    return (
      <Pressable
        onPress={openSettings}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        style={[styles.triggerButton, style]}>
        {typeof SettingsIcon === 'function' ? <SettingsIcon size={iconSize} color={iconColor} /> : SettingsIcon}
      </Pressable>
    );
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
  }: MenuHeaderProps): ReactElement => {
    const { currentView, navigationStack } = useMenuContext();
    const { state } = useVideo();
    const { theme } = state;

    const displayTitle = title || (currentView === 'root' ? 'Settings' : currentView);
    const shouldShowBackButton = showBackButton && (navigationStack.length > 1 || currentView !== 'root');

    return (
      <AnimatedView
        style={[styles.header, { borderBottomColor: theme.colors.menuBorder || '#ccc' }, style]}
        entering={webSafeAnimation(FadeIn.duration(200))}
        {...props}>
        {/* Equal side slots keep the title centered whether or not each button is shown. */}
        <View style={[styles.headerSide, styles.headerSideStart]}>{shouldShowBackButton && <Menu.Back />}</View>
        {children || (
          <Title
            text={displayTitle}
            numberOfLines={1}
            style={[styles.headerTitle, { color: theme.colors.menuText }, titleStyle]}
          />
        )}
        <View style={[styles.headerSide, styles.headerSideEnd]}>{showCloseButton && <Menu.Close />}</View>
      </AnimatedView>
    );
  },

  /**
   * Content wrapper, rendered inside the `Sheet` from `VideoProvider`'s `components`
   * (a bottom sheet by default).
   */
  Content: ({ children, sheetStyle, header, portalHost }: MenuContentProps): ReactElement => {
    const menuContext = useMenuContext();
    const { currentView } = menuContext;
    const { setSettingsMenuVisible } = useSettings();
    const { Sheet } = useVideoComponents();
    const contexts = useBridgedContexts();
    const { state } = useVideo();
    const { theme, portalHostName } = state;

    // Sheets render through portals that can sit outside the providers, so the toolkit's contexts
    // and the menu's own context are re-provided around the content.
    return (
      <Sheet
        open={menuContext.isSettingsMenuVisible}
        onOpenChange={setSettingsMenuVisible}
        style={[styles.sheetContent, { backgroundColor: theme.colors.menuBackground }, sheetStyle]}
        portalHost={portalHost || portalHostName}>
        <ContextBridge contexts={contexts}>
          <MenuProvider value={menuContext}>
            {header ? header(currentView) : <Menu.Header />}
            <View style={styles.contentBody}>{children}</View>
          </MenuProvider>
        </ContextBridge>
      </Sheet>
    );
  },

  /**
   * SubContent: Conditionally renders content for a specific view ID with slide animation.
   */
  SubContent: ({ viewId, children, style }: MenuSubContentProps): ReactElement | null => {
    const { currentView } = useMenuContext();

    if (currentView !== viewId) return null;

    return (
      <AnimatedView
        key={viewId}
        style={[styles.subContent, style]}
        entering={webSafeAnimation(FadeInRight.duration(200))}
        exiting={webSafeAnimation(FadeOutLeft.duration(150))}>
        {children}
      </AnimatedView>
    );
  },

  /*
   * Item: Pressable menu item with optional navigation and auto-close behavior.
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
  }: MenuItemProps): ReactElement => {
    const { navigateTo: ctxNavigate, closeSettings } = useMenuContext();
    const { state } = useVideo();
    const { theme } = state;
    const scale = useSharedValue(1);

    const handlePressIn = (): void => {
      scale.value = withTiming(0.95, { duration: 100 });
    };

    const handlePressOut = (): void => {
      scale.value = withTiming(1, { duration: 100 });
    };

    const handlePress = (): void => {
      scale.value = withTiming(1.02, { duration: 50 }, () => {
        scale.value = withTiming(1, { duration: 100 });
      });

      if (onPress) {
        scheduleOnRN(onPress, value);
      }
      if (navTo) {
        scheduleOnRN(ctxNavigate, navTo);
      } else if (autoClose) {
        setTimeout(() => {
          scheduleOnRN(closeSettings);
        }, 300);
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
        return <Text style={[styles.itemText, { color: theme.colors.menuText }, textStyle]}>{children}</Text>;
      }
      return children;
    };

    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.item, { backgroundColor: theme.colors.menuBackground }, style, IS_WEB ? null : animatedStyle]}
        {...props}>
        {renderChildren()}
      </AnimatedPressable>
    );
  },

  /**
   * Label: Non-interactive text label for menu sections.
   */
  Label: ({ children, style, ...props }: MenuLabelProps): ReactElement => {
    const { state } = useVideo();
    const { theme } = state;

    return (
      <Animated.Text
        style={[styles.label, { color: theme.colors.textSecondary || theme.colors.menuText }, style]}
        entering={webSafeAnimation(FadeIn.delay(150).duration(250))}
        {...props}>
        {children}
      </Animated.Text>
    );
  },

  /**
   * Separator: Horizontal line to separate menu sections.
   */
  Separator: ({ style, ...props }: MenuSeparatorProps): ReactElement => {
    const { state } = useVideo();
    const { theme } = state;

    return (
      <AnimatedView
        style={[styles.separator, { backgroundColor: theme.colors.menuSeparator || '#ccc' }, style]}
        entering={webSafeAnimation(FadeIn.delay(100).duration(200))}
        {...props}
      />
    );
  },

  /*
   * Group: Container for grouping related menu items.
   */
  Group: ({ children, style, ...props }: MenuGroupProps): ReactElement => {
    return (
      <AnimatedView style={[styles.group, style]} entering={webSafeAnimation(FadeIn.duration(250))} {...props}>
        {children}
      </AnimatedView>
    );
  },

  /**
   * CheckboxItem: Menu item with a check indicator for boolean selection.
   */
  CheckboxItem: ({
    children,
    checked,
    onCheckedChange,
    style,
    textStyle,
    ...props
  }: MenuCheckboxItemProps): ReactElement => {
    const [internalChecked, setInternalChecked] = useState(checked ?? false);
    const isChecked = checked !== undefined ? checked : internalChecked;
    const { state } = useVideo();
    const { theme } = state;
    const checkScale = useSharedValue(isChecked ? 1 : 0);

    useEffect(() => {
      checkScale.value = withTiming(isChecked ? 1 : 0, { duration: 150 });
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
      <Menu.Item onPress={handlePress} style={style} textStyle={textStyle} autoClose={false} {...props}>
        <View style={styles.radioItem}>
          <Text style={[styles.itemText, { color: theme.colors.menuText }, textStyle]}>{children}</Text>
          <AnimatedView style={IS_WEB ? undefined : checkAnimatedStyle}>
            {isChecked ? (
              <Check size={theme.iconSizes.sm} fill={theme.colors.iconNormal} style={[styles.radioIndicator]} />
            ) : null}
          </AnimatedView>
        </View>
      </Menu.Item>
    );
  },

  /*
   * Close: Button to close the menu.
   */
  Close: ({ style, ...props }: MenuCloseProps): ReactElement => {
    const { closeSettings } = useMenuContext();
    return <BaseIconButton onTap={closeSettings} IconComponent={Close} style={style} {...props} />;
  },

  /*
   * Back: Button to navigate back in the menu stack.
   */
  Back: ({ style, ...props }: MenuBackProps): ReactElement => {
    const { goBack, navigationStack } = useMenuContext();
    const canGoBack = navigationStack.length > 1;
    return (
      <BaseIconButton
        onTap={() => goBack()}
        style={style}
        disabled={!canGoBack}
        IconComponent={ChevronLeft}
        {...props}
      />
    );
  },
};

const styles = StyleSheet.create({
  sheetContent: {
    paddingBottom: 16,
  },
  triggerButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
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
    marginLeft: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  headerSide: {
    flex: 1,
    flexDirection: 'row',
  },
  headerSideStart: {
    justifyContent: 'flex-start',
  },
  headerSideEnd: {
    justifyContent: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'center',
    textTransform: 'capitalize',
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
