import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SheetProps } from 'react-native-video-toolkit';

/**
 * Hosts the settings menu in a `@gorhom/bottom-sheet` modal.
 * Needs a `BottomSheetModalProvider` above it (see `app/_layout.tsx`).
 */
export function GorhomSheet({ open, onOpenChange, children, style }: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const presented = useRef(false);
  const insets = useSafeAreaInsets();

  // The toolkit owns the open state; mirror it onto the imperative modal API.
  useEffect(() => {
    if (open) {
      ref.current?.present();
      presented.current = true;
    } else if (presented.current) {
      // Only dismiss a presented modal: dismissing one that never opened leaves it stuck
      // "dismissing", and later `present()` calls are ignored.
      ref.current?.dismiss();
      presented.current = false;
    }
  }, [open]);

  const handleDismiss = useCallback(() => {
    presented.current = false;
    onOpenChange(false);
  }, [onOpenChange]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />,
    []
  );

  // `style` carries the theme's menu background; paint the whole sheet with it.
  const backgroundColor = StyleSheet.flatten(style)?.backgroundColor;

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor }}
      handleIndicatorStyle={styles.handle}>
      <BottomSheetView style={[style, { paddingBottom: insets.bottom + 16 }]}>{children}</BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: '#666',
  },
});
