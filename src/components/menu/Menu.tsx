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
} from 'react-native';
import { BottomSheet, type BottomSheetProps } from '../common';
import { useVideo } from '../../providers';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSettings } from '../../hooks';
import { SettingsButton, type SettingsButtonProps } from '../controls';

interface MenuContextType {
  closeSettings: () => void;
  openSettings: () => void;
  isSettingsMenuVisible: boolean;
  navigationStack: string[]; // Array of view IDs (e.g., ['root', 'playback'])
  navigateTo: (viewId: string) => void;
  currentView: string;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);
export const MenuProvider = MenuContext.Provider;
const useMenuContext = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu components must be used within a Menu.Root');
  }
  return context;
};

export const Menu = {
  /**
   * Root component with navigation stack for sub-menus.
   */
  /**
   * Root component with navigation stack for sub-menus.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} props.children - The child components to render within the menu.
   * @param {string} [props.initialView='root'] - The initial view ID to display when the menu opens.
   * @returns {React.ReactElement} The root menu component.
   */
  Root: ({ children, initialView = 'root' }: { children: ReactNode; initialView?: string }): React.ReactElement => {
    const { openSettings, closeSettings, isSettingsMenuVisible } = useSettings();
    const [navigationStack, setNavigationStack] = useState<string[]>([initialView]);
    const currentView = navigationStack[navigationStack.length - 1]!;

    const navigateTo = (viewId: string) => {
      setNavigationStack((prev) => [...prev, viewId]);
    };

    const goBack = () => {
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
          currentView,
        }}>
        {children}
      </MenuProvider>
    );
  },

  /**
   * Trigger to open the menu.
   * @note handles its own press events internally.
   *
   * @param {SettingsButtonProps} props - The props for the component.
   * @returns {React.ReactElement} The menu trigger component.
   */
  Trigger: ({ ...props }: SettingsButtonProps): React.ReactElement => {
    return <SettingsButton {...props} />;
  },

  /**
   * Content wrapper for the BottomSheet. Renders children based on current view.
   * Supports fade animation on view change.
   */
  /**
   * Content wrapper for the BottomSheet. Renders children based on current view.
   * Supports fade animation on view change.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} props.children - The content to be rendered inside the menu content.
   * @param {ViewStyle} [props.sheetStyle] - Optional style for the sheet container.
   * @param {(currentView: string) => ReactNode} [props.header] - Optional custom header renderer function.
   * @returns {React.ReactElement} The menu content component.
   */
  Content: ({
    children,
    sheetStyle,
    header,
    ...props
  }: {
    children: ReactNode;
    sheetStyle?: ViewStyle;
    header?: (currentView: string) => ReactNode; // Optional custom header
  } & Partial<BottomSheetProps>): React.ReactElement => {
    const { isSettingsMenuVisible, closeSettings, currentView, navigationStack } = useMenuContext();
    const menuContext = useMenuContext(); // Capture the full context value here
    const { state } = useVideo();
    const { theme } = state;
    const opacity = useSharedValue(0);

    useEffect(() => {
      opacity.value = withTiming(1, { duration: 200 });
    }, [currentView, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <BottomSheet visible={isSettingsMenuVisible} onClose={closeSettings} {...props}>
        <View style={[styles.content, { backgroundColor: theme.colors.background }, sheetStyle]}>
          <MenuProvider value={menuContext}>
            {/* Re-provide the captured context */}
            {header ? (
              header(currentView)
            ) : (
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                  {currentView === 'root' ? 'Settings' : currentView}
                </Text>
              </View>
            )}
            <Animated.View style={[styles.contentBody, animatedStyle]}>{children}</Animated.View>
          </MenuProvider>
        </View>
      </BottomSheet>
    );
  },

  /**
   * SubContent: Conditionally renders content for a specific view ID.
   * Use multiple of these inside Content for different sub-menus.
   */
  /**
   * SubContent: Conditionally renders content for a specific view ID.
   * Use multiple of these inside Content for different sub-menus.
   *
   * @param {object} props - The props for the component.
   * @param {string} props.viewId - The ID of the view this sub-content belongs to.
   * @param {ReactNode} props.children - The content to be rendered inside the sub-content.
   * @param {ViewStyle} [props.style] - Optional style for the sub-content container.
   * @returns {React.ReactElement | null} The menu sub-content component or null if not the current view.
   */
  SubContent: ({
    viewId,
    children,
    style,
  }: {
    viewId: string;
    children: ReactNode;
    style?: ViewStyle;
  }): React.ReactElement | null => {
    const { currentView } = useMenuContext();
    if (currentView !== viewId) return null;
    return <View style={[styles.subContent, style]}>{children}</View>;
  },

  /**
   * Item: Now supports navigating to sub-views if `navigateTo` prop is provided.
   */
  /**
   * Item: Now supports navigating to sub-views if `navigateTo` prop is provided.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} props.children - The content to be rendered inside the menu item.
   * @param {(value?: any) => void} [props.onPress] - Callback function invoked when the item is pressed.
   * @param {boolean} [props.disabled=false] - If true, the item is not pressable.
   * @param {ViewStyle} [props.style] - Optional style for the item container.
   * @param {TextStyle} [props.textStyle] - Optional style for the item text.
   * @param {any} [props.value] - An optional value associated with the item, passed to `onPress`.
   * @param {boolean} [props.autoClose=true] - If true, the menu will close after pressing the item (unless `navigateTo` is set).
   * @param {string} [props.navigateTo] - The view ID to navigate to on press, if provided.
   * @returns {React.ReactElement} The menu item component.
   */
  Item: ({
    children,
    onPress,
    disabled = false,
    style,
    textStyle,
    value,
    autoClose = true,
    navigateTo: navTo,
    ...props
  }: {
    children: ReactNode;
    onPress?: (value?: any) => void;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    value?: any;
    autoClose?: boolean;
    navigateTo?: string; // View ID to navigate to on press
  } & PressableProps): React.ReactElement => {
    const { closeSettings, navigateTo: ctxNavigate } = useMenuContext();
    const { state } = useVideo();
    const { theme } = state;

    const handlePress = () => {
      if (disabled) return;
      onPress?.(value);
      if (navTo) {
        ctxNavigate(navTo);
      } else if (autoClose) {
        closeSettings();
      }
    };

    // Helper function to render children safely
    const renderChildren = () => {
      if (typeof children === 'string') {
        return <Text style={[styles.itemText, { color: theme.colors.text }, textStyle]}>{children}</Text>;
      }
      return children;
    };

    return (
      <Pressable
        onPress={handlePress}
        style={[styles.item, { backgroundColor: theme.colors.background, opacity: disabled ? 0.5 : 1 }, style]}
        disabled={disabled}
        {...props}>
        {renderChildren()}
      </Pressable>
    );
  },

  /**
   * Label component for section headers in the menu.
   */
  /**
   * Label component for section headers in the menu.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} props.children - The content to be rendered inside the label.
   * @param {TextStyle} [props.style] - Optional style for the label text.
   * @returns {React.ReactElement} The menu label component.
   */
  Label: ({
    children,
    style,
    ...props
  }: { children: ReactNode; style?: TextStyle } & TextProps): React.ReactElement => {
    const { state } = useVideo();
    const { theme } = state;

    return (
      <Text style={[styles.label, { color: theme.colors.text }, style]} {...props}>
        {children}
      </Text>
    );
  },

  /**
   * Separator component for dividing menu sections.
   */
  /**
   * Separator component for dividing menu sections.
   *
   * @param {object} props - The props for the component.
   * @param {ViewStyle} [props.style] - Optional style for the separator.
   * @returns {React.ReactElement} The menu separator component.
   */
  Separator: ({ style, ...props }: { style?: ViewStyle } & ViewProps): React.ReactElement => {
    const { state } = useVideo();
    const { theme } = state;

    return <View style={[styles.separator, { backgroundColor: theme.colors.border || '#ccc' }, style]} {...props} />;
  },

  /**
   * Group component for grouping related items (e.g., radio groups).
   * This is a simple wrapper; for radio behavior, use RadioGroup below.
   */
  /**
   * Group component for grouping related items (e.g., radio groups).
   * This is a simple wrapper; for radio behavior, use RadioGroup below.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} props.children - The content to be rendered inside the group.
   * @param {ViewStyle} [props.style] - Optional style for the group container.
   * @returns {React.ReactElement} The menu group component.
   */
  Group: ({
    children,
    style,
    ...props
  }: { children: ReactNode; style?: ViewStyle } & ViewProps): React.ReactElement => {
    return (
      <View style={[styles.group, style]} {...props}>
        {children}
      </View>
    );
  },

  /**
   * RadioGroup component for managing radio selection states.
   * Use with RadioItem for selectable options like playback speeds.
   */
  /**
   * RadioGroup component for managing radio selection states.
   * Use with RadioItem for selectable options like playback speeds.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} props.children - The RadioItem components to render within the group.
   * @param {any} props.value - The currently selected value in the radio group.
   * @param {(newValue: any) => void} props.onValueChange - Callback function invoked when the selected value changes.
   * @param {ViewStyle} [props.style] - Optional style for the radio group container.
   * @returns {React.ReactElement} The menu radio group component.
   */
  RadioGroup: ({
    children,
    value,
    onValueChange,
    style,
    ...props
  }: {
    children: ReactNode;
    value: any;
    onValueChange: (newValue: any) => void;
    style?: ViewStyle;
  } & ViewProps): React.ReactElement => {
    return (
      <View style={[styles.group, style]} {...props}>
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child as React.ReactElement<{ selectedValue?: any; onSelect?: (v: any) => void }>, {
                selectedValue: value,
                onSelect: onValueChange,
              })
            : child
        )}
      </View>
    );
  },

  /**
   * RadioItem component for use within RadioGroup.
   * Displays a check or indicator when selected.
   */
  /**
   * RadioItem component for use within RadioGroup.
   * Displays a check or indicator when selected.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} props.children - The content to be rendered inside the radio item.
   * @param {any} props.value - The value of this radio item.
   * @param {any} [props.selectedValue] - The currently selected value from the parent RadioGroup.
   * @param {(newValue: any) => void} [props.onSelect] - Callback function invoked when this item is selected.
   * @param {ViewStyle} [props.style] - Optional style for the radio item container.
   * @param {TextStyle} [props.textStyle] - Optional style for the radio item text.
   * @returns {React.ReactElement} The menu radio item component.
   */
  RadioItem: ({
    children,
    value,
    selectedValue,
    onSelect,
    style,
    textStyle,
    ...props
  }: {
    children: ReactNode;
    value: any;
    selectedValue?: any;
    onSelect?: (newValue: any) => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
  } & PressableProps): React.ReactElement => {
    const isSelected = value === selectedValue;
    const { state } = useVideo();
    const { theme } = state;

    const handlePress = () => {
      onSelect?.(value);
    };

    return (
      // @ts-ignore
      <Menu.Item onPress={handlePress} style={style} textStyle={textStyle} {...props}>
        <View style={styles.radioItem}>
          <Text style={[styles.itemText, { color: theme.colors.text }, textStyle]}>{children}</Text>
          {isSelected && <Text style={[styles.radioIndicator, { color: theme.colors.primary }]}>✓</Text>}
        </View>
      </Menu.Item>
    );
  },

  /**
   * CheckboxItem component for toggleable options.
   * Manages its own checked state unless controlled.
   */
  /**
   * CheckboxItem component for toggleable options.
   * Manages its own checked state unless controlled.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} props.children - The content to be rendered inside the checkbox item.
   * @param {boolean} [props.checked] - Controls the checked state of the checkbox (controlled component).
   * @param {(checked: boolean) => void} [props.onCheckedChange] - Callback function invoked when the checked state changes.
   * @param {ViewStyle} [props.style] - Optional style for the checkbox item container.
   * @param {TextStyle} [props.textStyle] - Optional style for the checkbox item text.
   * @returns {React.ReactElement} The menu checkbox item component.
   */
  CheckboxItem: ({
    children,
    checked,
    onCheckedChange,
    style,
    textStyle,
    ...props
  }: {
    children: ReactNode;
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    style?: ViewStyle;
    textStyle?: TextStyle;
  } & PressableProps): React.ReactElement => {
    const [internalChecked, setInternalChecked] = useState(checked ?? false);
    const isChecked = checked !== undefined ? checked : internalChecked;
    const { state } = useVideo();
    const { theme } = state;

    const handlePress = () => {
      const newChecked = !isChecked;
      setInternalChecked(newChecked);
      onCheckedChange?.(newChecked);
    };

    return (
      // @ts-ignore
      <Menu.Item onPress={handlePress} style={style} textStyle={textStyle} {...props}>
        <View style={styles.radioItem}>
          <Text style={[styles.itemText, { color: theme.colors.text }, textStyle]}>{children}</Text>
          <Text style={[styles.radioIndicator, { color: theme.colors.primary }]}>{isChecked ? '✓' : ' '}</Text>
        </View>
      </Menu.Item>
    );
  },

  /**
   * Close component: a button to manually close the menu.
   */
  /**
   * Close component: a button to manually close the menu.
   *
   * @param {object} props - The props for the component.
   * @param {ReactNode} [props.children='Close'] - The content to be rendered inside the close button.
   * @param {ViewStyle} [props.style] - Optional style for the close button container.
   * @returns {React.ReactElement} The menu close button component.
   */
  Close: ({
    children = 'Close',
    style,
    ...props
  }: { children?: ReactNode; style?: ViewStyle } & PressableProps): React.ReactElement => {
    const { closeSettings } = useMenuContext();

    return (
      // @ts-ignore
      <Menu.Item onPress={closeSettings} style={style} {...props}>
        {children}
      </Menu.Item>
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
    flex: 1,
    padding: 0, // Padding already in BottomSheet
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  contentBody: {
    flex: 1,
  },
  subContent: {
    flex: 1,
  },
});

export default Menu;
