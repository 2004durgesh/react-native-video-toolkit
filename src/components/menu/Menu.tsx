import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from 'react';
import {
  BackHandler,
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
  type HostInstance,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BaseIconButton } from '../common';
import { useVideoSelector, useVideoComponents } from '../../providers';
import { MenuOpenStateContext } from '../../providers/SettingsProvider';
import { ContextBridge, useBridgedContexts } from '../../providers/ContextBridge';
import Animated, {
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeInRight,
  FadeOutLeft,
  LayoutAnimationConfig,
} from 'react-native-reanimated';
import { PlatformUtils, webSafeAnimation, webDependencies } from '../../utils/platform';
import { useTestID } from '../../utils/testIDs';
import { ControlsFocusableContext, requestTVFocus, TRAP_FOCUS, TV_FOCUS_GUIDE, TVFocusContext } from '../../tv/TVFocus';
import { SettingsButton } from '../controls/SettingsButton';
import { Check, ChevronLeft, Close } from '../svgs';
import { Title } from '../display';
import type { IconProps } from '../../types/svg';

interface MenuContextType {
  /** Closes the menu. */
  closeSettings: () => void;
  /** Opens the menu. */
  openSettings: () => void;
  /** Whether the menu is open. */
  isSettingsMenuVisible: boolean;
  navigationStack: string[];
  /** Opens a view, titled `title` in the header (by default, its id). */
  navigateTo: (viewId: string, title?: string) => void;
  goBack: () => void;
  currentView: string;
  /** The current view's title: the label of the row that opened it, the menu's title on its first view. */
  currentTitle: string;
  /**
   * The view the menu last went back from, so on TV the row leading to it takes the focus again.
   * @internal
   */
  returnedFrom?: string | null;
}

interface MenuRootProps {
  children: ReactNode;
  initialView?: string;
  /**
   * Whether the menu is open, to control it yourself with `onOpenChange`. Left out, the menu keeps
   * its own open state, which its `Menu.Trigger` opens.
   */
  open?: boolean;
  /** Called with `true` when the menu asks to open, and `false` when it asks to close. */
  onOpenChange?: (open: boolean) => void;
  /**
   * The menu's title, shown in the header on its first view.
   * @default 'Settings'
   */
  title?: string;
}

interface MenuContentProps {
  children: ReactNode;
  sheetStyle?: StyleProp<ViewStyle>;
  header?: (currentView: string) => ReactNode;
  portalHost?: string;
  /** @deprecated Has no effect: the `Sheet` places the menu. Will be removed in 2.0. */
  side?: 'top' | 'bottom';
  /** @deprecated Has no effect: the `Sheet` places the menu. Will be removed in 2.0. */
  sideOffset?: number;
  /** @deprecated Has no effect: the `Sheet` places the menu. Will be removed in 2.0. */
  align?: 'start' | 'center' | 'end';
  /** @deprecated Has no effect: the `Sheet` places the menu. Will be removed in 2.0. */
  alignOffset?: number;
  /**
   * Identifies the menu's content in end-to-end tests, for example to wait until it's open.
   * @default `video-settings`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

interface MenuSubContentProps {
  viewId: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Identifies the view in end-to-end tests.
   * @default `video-settings-view-<viewId>`, with the player's `testID` in place of `video`
   */
  testID?: string;
}

interface MenuItemProps extends Omit<PressableProps, 'onPress'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  value?: string;
  autoClose?: boolean;
  navigateTo?: string;
  /**
   * The title of the view `navigateTo` opens, shown in its header.
   * @default the row's text when its children are a string, else the view's id
   */
  title?: string;
  /** Called with `value` when the row is pressed. */
  onPress?: (value?: string) => void;
  /**
   * On TV, take the remote's focus as the view opens: the checked row of a submenu.
   * @internal
   */
  tvPreferred?: boolean;
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

interface MenuRadioItemProps extends Omit<MenuItemProps, 'onPress'> {
  children: ReactNode;
  /** Whether this is the chosen option. */
  selected: boolean;
  /** Called when the row is pressed, chosen already or not. */
  onSelect: () => void;
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

/** A view on the navigation stack, with the title the row that opened it gave it. */
interface MenuView {
  id: string;
  title?: string;
}

// The menu sits on a plain background, so its icons skip the drop shadow meant for icons over video.
const MenuCloseIcon = (props: IconProps): ReactElement => <Close {...props} shadow={false} />;
const MenuBackIcon = (props: IconProps): ReactElement => <ChevronLeft {...props} shadow={false} />;

const MenuContext = createContext<MenuContextType | undefined>(undefined);

/**
 * Provides a menu's context.
 * @deprecated `Menu.Root` provides it. Will be removed in 2.0.
 */
export const MenuProvider = MenuContext.Provider;

/**
 * The menu's navigation (`navigateTo`, `goBack`, `closeSettings`, `currentView`), for custom controls
 * in `DefaultLayout`'s menu slots and views. Only works inside the menu.
 */
export const useMenuContext = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('Menu components must be used within a Menu.Root');
  }
  return context;
};

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const IS_WEB = PlatformUtils.isWeb();
const IS_TV = PlatformUtils.isTV();

/** A view id like `playbackRate` read as a title: "playback Rate", which the header capitalizes. */
const titleFromViewId = (viewId: string): string => viewId.replace(/([a-z])([A-Z])/g, '$1 $2');

/**
 * Holds the menu's open state and its navigation stack. Its `Menu.Trigger` opens it, or control it
 * with `open` and `onOpenChange`.
 */
const MenuRoot = ({
  children,
  initialView = 'root',
  open,
  onOpenChange,
  title = 'Settings',
}: MenuRootProps): ReactElement => {
  const [ownOpen, setOwnOpen] = useState(false);
  const isOpen = open ?? ownOpen;
  const setOpen = (next: boolean): void => {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };
  const close = (): void => setOpen(false);

  const [stack, setStack] = useState<MenuView[]>([{ id: initialView }]);
  const current = stack[stack.length - 1] ?? { id: initialView };
  const [returnedFrom, setReturnedFrom] = useState<string | null>(null);

  const navigateTo = (viewId: string, viewTitle?: string): void => {
    setReturnedFrom(null);
    setStack((prev) => [...prev, { id: viewId, title: viewTitle }]);
  };

  const goBack = (): void => {
    if (stack.length > 1) {
      setReturnedFrom(current.id);
      setStack((prev) => prev.slice(0, -1));
    } else {
      close();
    }
  };

  // Back to the first view when the menu closes, so it reopens there. Done during render: an effect
  // would first commit a render with the old stack.
  const [resetFor, setResetFor] = useState({ open: isOpen, initialView });
  if (resetFor.open !== isOpen || resetFor.initialView !== initialView) {
    setResetFor({ open: isOpen, initialView });
    if (!isOpen) {
      setStack([{ id: initialView }]);
      setReturnedFrom(null);
    }
  }

  // On TV, Back goes back through the menu and then closes it, before the player sees it. The
  // listener is added a frame late, after the sheet's own (the default sheet closes on Back), so it
  // runs first. As the menu closes, the remote goes back into the player.
  const tvFocus = useContext(TVFocusContext);
  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;
  useEffect(() => {
    if (!IS_TV || !isOpen) return;
    let back: { remove: () => void } | null = null;
    const frame = requestAnimationFrame(() => {
      back = BackHandler.addEventListener('hardwareBackPress', () => {
        goBackRef.current();
        return true;
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      back?.remove();
      tvFocus?.returnFocus();
    };
  }, [isOpen, tvFocus]);

  return (
    <MenuOpenStateContext.Provider value={{ open: isOpen, setOpen }}>
      <MenuContext.Provider
        value={{
          closeSettings: close,
          openSettings: () => setOpen(true),
          isSettingsMenuVisible: isOpen,
          navigationStack: stack.map((view) => view.id),
          navigateTo,
          goBack,
          currentView: current.id,
          currentTitle: current.title ?? (stack.length === 1 ? title : titleFromViewId(current.id)),
          returnedFrom,
        }}>
        {children}
      </MenuContext.Provider>
    </MenuOpenStateContext.Provider>
  );
};

/** Button to close the menu. */
const MenuClose = ({ style, testID, ...props }: MenuCloseProps): ReactElement => {
  const { closeSettings } = useMenuContext();
  const buttonTestID = useTestID('settings-close', testID ?? undefined);
  return (
    <BaseIconButton
      onTap={closeSettings}
      IconComponent={MenuCloseIcon}
      style={style}
      {...props}
      testID={buttonTestID}
    />
  );
};

/** Button to navigate back in the menu stack. */
const MenuBack = ({ style, testID, ...props }: MenuBackProps): ReactElement => {
  const { goBack, navigationStack } = useMenuContext();
  const canGoBack = navigationStack.length > 1;
  const buttonTestID = useTestID('settings-back', testID ?? undefined);
  return (
    <BaseIconButton
      onTap={() => goBack()}
      style={style}
      disabled={!canGoBack}
      IconComponent={MenuBackIcon}
      {...props}
      testID={buttonTestID}
    />
  );
};

/** Header component for menu navigation and titles. */
const MenuHeader = ({
  children,
  title,
  showBackButton = true,
  showCloseButton = true,
  style,
  titleStyle,
  ...props
}: MenuHeaderProps): ReactElement => {
  const { currentTitle, navigationStack } = useMenuContext();
  const theme = useVideoSelector((state) => state.theme);
  const titleTestID = useTestID('settings-title');
  const shouldShowBackButton = showBackButton && navigationStack.length > 1;

  return (
    <AnimatedView
      style={[styles.header, { borderBottomColor: theme.colors.menuBorder }, style]}
      entering={webSafeAnimation(FadeIn.duration(200))}
      {...props}>
      {/* Equal side slots keep the title centered whether or not each button is shown. */}
      <View style={[styles.headerSide, styles.headerSideStart]}>{shouldShowBackButton && <MenuBack />}</View>
      {children || (
        <Title
          text={title || currentTitle}
          testID={titleTestID}
          numberOfLines={1}
          style={[styles.headerTitle, { color: theme.colors.menuText }, titleStyle]}
        />
      )}
      <View style={[styles.headerSide, styles.headerSideEnd]}>{showCloseButton && <MenuClose />}</View>
    </AnimatedView>
  );
};

/**
 * The menu's own focus region on TV: its buttons stay focusable while the player's controls fade,
 * and don't tell the player that it has the focus.
 */
const MenuFocusRegion = ({ children }: { children: ReactNode }): ReactElement => (
  <TVFocusContext.Provider value={null}>
    <ControlsFocusableContext.Provider value={true}>{children}</ControlsFocusableContext.Provider>
  </TVFocusContext.Provider>
);

/**
 * Content wrapper, rendered inside the `Sheet` from `VideoProvider`'s `components` (a bottom sheet by
 * default).
 */
const MenuContent = ({ children, sheetStyle, header, portalHost, testID }: MenuContentProps): ReactElement => {
  const contentTestID = useTestID('settings', testID);
  const menuContext = useMenuContext();
  const openState = useContext(MenuOpenStateContext);
  const { currentView, isSettingsMenuVisible: open } = menuContext;
  const { Sheet } = useVideoComponents();
  const contexts = useBridgedContexts();
  const theme = useVideoSelector((state) => state.theme);
  const portalHostName = useVideoSelector((state) => state.portalHostName);
  const bottomInset = useVideoSelector((state) => state.config.safeAreaInsets?.bottom ?? 0);

  // On TV, the remote goes into the menu as it opens and as each view opens, to the first row
  // through the focus guide. A ref callback, as a sheet's portal can mount the body after this
  // component's effects; keyed by the view, so each view attaches afresh. A row that should have the
  // focus (the checked one, or the one the menu came back to) then takes it in its own effect.
  const focusBody = useCallback(
    (body: HostInstance | null) => {
      if (IS_TV && open && body) requestTVFocus(body);
    },
    [open]
  );

  // Sheets render through portals that can sit outside the providers, so the toolkit's contexts
  // and the menu's own are re-provided around the content.
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => (next ? menuContext.openSettings() : menuContext.closeSettings())}
      style={[styles.sheetContent, { backgroundColor: theme.colors.menuBackground }, sheetStyle]}
      portalHost={portalHost || portalHostName}
      bottomInset={bottomInset}>
      <ContextBridge contexts={contexts}>
        <MenuOpenStateContext.Provider value={openState}>
          <MenuContext.Provider value={menuContext}>
            <MenuFocusRegion>
              {/* A native sheet renders this in its own window, outside the app's
                  GestureHandlerRootView, where gesture-handler buttons (Close, Back) don't respond.
                  In the app's window a nested root does nothing. */}
              <GestureHandlerRootView style={styles.gestureRoot}>
                {/* On TV the remote stays in the menu while it's open */}
                <View
                  style={styles.gestureRoot}
                  collapsable={false}
                  testID={contentTestID}
                  {...(IS_TV ? TRAP_FOCUS : null)}>
                  {header ? header(currentView) : <MenuHeader />}
                  {/* When the sheet closes, the sub-view's exit animation is skipped. With Reanimated's
                      ENABLE_SHARED_ELEMENT_TRANSITIONS flag, a native sheet would otherwise stay mounted
                      waiting for that animation and leave its invisible window over the app. */}
                  <LayoutAnimationConfig skipExiting>
                    <View
                      key={IS_TV ? currentView : undefined}
                      ref={focusBody}
                      style={styles.contentBody}
                      collapsable={!IS_TV}
                      {...(IS_TV ? TV_FOCUS_GUIDE : null)}>
                      {children}
                    </View>
                  </LayoutAnimationConfig>
                </View>
              </GestureHandlerRootView>
            </MenuFocusRegion>
          </MenuContext.Provider>
        </MenuOpenStateContext.Provider>
      </ContextBridge>
    </Sheet>
  );
};

/** Renders its children, sliding in, while the menu shows the view `viewId`. */
const MenuSubContent = ({ viewId, children, style, testID }: MenuSubContentProps): ReactElement | null => {
  const { currentView } = useMenuContext();
  const viewTestID = useTestID(`settings-view-${viewId}`, testID);

  if (currentView !== viewId) return null;

  return (
    <AnimatedView
      key={viewId}
      testID={viewTestID}
      style={[styles.subContent, style]}
      entering={webSafeAnimation(FadeInRight.duration(200))}
      exiting={webSafeAnimation(FadeOutLeft.duration(150))}>
      {children}
    </AnimatedView>
  );
};

/** A pressable row that opens a view (`navigateTo`) or acts and closes the menu (`autoClose`). */
const MenuItem = ({
  children,
  onPress,
  style,
  textStyle,
  value,
  autoClose = true,
  navigateTo: navTo,
  title,
  onFocus,
  onBlur,
  tvPreferred = false,
  ...props
}: MenuItemProps): ReactElement => {
  const { navigateTo: ctxNavigate, closeSettings, returnedFrom } = useMenuContext();
  const theme = useVideoSelector((state) => state.theme);
  // The TV remote focuses rows rather than hovering or pressing them, so show which one it's on
  const [tvFocused, setTVFocused] = useState(false);
  // And it lands on the selected row as a view opens, and back on the row it came from
  const itemRef = useRef<HostInstance>(null);
  const takesTVFocus = IS_TV && (tvPreferred || (navTo !== undefined && navTo === returnedFrom));
  useEffect(() => {
    if (takesTVFocus) requestTVFocus(itemRef.current);
  }, [takesTVFocus]);

  const handlePress = (): void => {
    onPress?.(value);
    if (navTo) {
      ctxNavigate(navTo, title ?? (typeof children === 'string' ? children : undefined));
    } else if (autoClose) {
      // Let the press feedback finish before the sheet closes.
      setTimeout(closeSettings, 300);
    }
  };

  // A pseudo-selector object owns its property, so a background from `style` becomes the resting value.
  const restingBackground = StyleSheet.flatten(style)?.backgroundColor ?? theme.colors.menuBackground;

  const renderChildren = (): ReactNode => {
    if (typeof children === 'string') {
      return <Text style={[styles.itemText, { color: theme.colors.menuText }, textStyle]}>{children}</Text>;
    }
    return children;
  };

  return (
    <AnimatedPressable
      ref={itemRef}
      onPress={handlePress}
      onFocus={(event) => {
        if (IS_TV) setTVFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        if (IS_TV) setTVFocused(false);
        onBlur?.(event);
      }}
      style={[
        styles.item,
        style,
        {
          // Hover and press feedback run natively (CSS on web), without re-rendering.
          backgroundColor: {
            'default': restingBackground,
            ':hover': theme.colors.ripple,
            ':active': theme.colors.ripple,
          },
          transform: { 'default': [{ scale: 1 }], ':active': [{ scale: 0.97 }] },
          transitionProperty: ['backgroundColor', 'transform'],
          transitionDuration: 100,
        },
        tvFocused && { backgroundColor: theme.colors.tvFocus },
      ]}
      {...props}>
      {renderChildren()}
    </AnimatedPressable>
  );
};

/** Non-interactive text label for menu sections. */
const MenuLabel = ({ children, style, ...props }: MenuLabelProps): ReactElement => {
  const theme = useVideoSelector((state) => state.theme);

  return (
    <Animated.Text
      style={[styles.label, { color: theme.colors.textSecondary || theme.colors.menuText }, style]}
      entering={webSafeAnimation(FadeIn.delay(150).duration(250))}
      {...props}>
      {children}
    </Animated.Text>
  );
};

/** Horizontal line to separate menu sections. */
const MenuSeparator = ({ style, ...props }: MenuSeparatorProps): ReactElement => {
  const theme = useVideoSelector((state) => state.theme);

  return (
    <AnimatedView
      style={[styles.separator, { backgroundColor: theme.colors.menuSeparator }, style]}
      entering={webSafeAnimation(FadeIn.delay(100).duration(200))}
      {...props}
    />
  );
};

/** Container for grouping related menu items. */
const MenuGroup = ({ children, style, ...props }: MenuGroupProps): ReactElement => {
  return (
    <AnimatedView style={[styles.group, style]} entering={webSafeAnimation(FadeIn.duration(250))} {...props}>
      {children}
    </AnimatedView>
  );
};

/**
 * A row with a check mark while `checked`, which stays open when pressed. On TV, the checked row takes
 * the remote's focus as its view opens.
 */
const CheckRow = ({
  children,
  checked,
  onPress,
  kind,
  textStyle,
  ...props
}: Omit<MenuItemProps, 'onPress'> & {
  checked: boolean;
  onPress: () => void;
  kind: 'checkbox' | 'radio';
}): ReactElement => {
  const theme = useVideoSelector((state) => state.theme);
  // The worklet animates to the new scale on the UI thread whenever `checked` changes. The first
  // render applies the end value without animating.
  const checkAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: withTiming(checked ? 1 : 0, { duration: 150 }) }],
    }),
    webDependencies([checked])
  );

  return (
    <MenuItem
      onPress={onPress}
      textStyle={textStyle}
      autoClose={false}
      tvPreferred={checked}
      accessibilityRole={kind}
      accessibilityState={{ checked }}
      {...props}>
      <View style={styles.radioItem}>
        <Text style={[styles.itemText, { color: theme.colors.menuText }, textStyle]}>{children}</Text>
        <AnimatedView style={IS_WEB ? undefined : checkAnimatedStyle}>
          {checked ? (
            <Check
              size={theme.iconSizes.sm}
              fill={theme.colors.iconNormal}
              shadow={false}
              style={[styles.radioIndicator]}
            />
          ) : null}
        </AnimatedView>
      </View>
    </MenuItem>
  );
};

/** A row that toggles a check mark. Without `checked`, it keeps its own state. */
const MenuCheckboxItem = ({ checked, onCheckedChange, ...props }: MenuCheckboxItemProps): ReactElement => {
  const [internalChecked, setInternalChecked] = useState(checked ?? false);
  const isChecked = checked !== undefined ? checked : internalChecked;

  return (
    <CheckRow
      kind="checkbox"
      checked={isChecked}
      onPress={() => {
        setInternalChecked(!isChecked);
        onCheckedChange?.(!isChecked);
      }}
      {...props}
    />
  );
};

/** One option of a list where one is chosen, checked while `selected`. */
const MenuRadioItem = ({ selected, onSelect, ...props }: MenuRadioItemProps): ReactElement => (
  <CheckRow kind="radio" checked={selected} onPress={onSelect} {...props} />
);

/**
 * A menu in a sheet, with views to navigate between: generic parts that the settings menu is built
 * from, for menus of your own.
 */
export const Menu = {
  Root: MenuRoot,
  /**
   * The button that opens the menu around it: the same component as `VideoPlayer.SettingsButton`,
   * whose `useSettings().openSettings` acts on the menu it's in.
   */
  Trigger: SettingsButton,
  Header: MenuHeader,
  Content: MenuContent,
  SubContent: MenuSubContent,
  Item: MenuItem,
  Label: MenuLabel,
  Separator: MenuSeparator,
  Group: MenuGroup,
  CheckboxItem: MenuCheckboxItem,
  RadioItem: MenuRadioItem,
  Close: MenuClose,
  Back: MenuBack,
};

const styles = StyleSheet.create({
  sheetContent: {
    paddingBottom: 16,
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
  // Passes the sheet's size through like the plain children it wraps: no `flex: 1` default,
  // which would collapse sheets sized to their content
  gestureRoot: {
    flexShrink: 1,
    maxHeight: '100%',
  },
  subContent: {
    flexShrink: 1,
  },
});

export default Menu;
