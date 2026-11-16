import { StyleSheet } from 'react-native';
import { BottomSheetContent, BottomSheetOverlay, BottomSheetPortal, BottomSheetRoot } from '../common/BottomSheet';
import { useVideoSelector } from '../../providers';
import { PlatformUtils } from '../../utils/platform';
import type { SheetProps } from '../../types';

/**
 * The toolkit's default `Sheet`: a bottom sheet on phones, tablets and web, and a right-hand side
 * panel on TV. Built on `@rn-primitives/dialog`, rendered into the toolkit's portal host.
 *
 * @param {SheetProps} props - The props for the sheet.
 * @returns {React.ReactElement} The sheet component.
 */
export const DefaultSheet = ({ open, onOpenChange, children, style, portalHost }: SheetProps): React.ReactElement => {
  // The sheet sits at the screen's bottom edge, so its last row stays above the navigation bar or
  // home indicator (`config.safeAreaInsets`). The TV panel spans the full height and needs none.
  const bottomInset = useVideoSelector((state) => state.config.safeAreaInsets?.bottom ?? 0);
  let sheetStyle = style;
  if (bottomInset > 0 && !PlatformUtils.isTV()) {
    // On top of the sheet's own bottom padding, which would otherwise replace it
    const flat = StyleSheet.flatten(style) ?? {};
    const own = flat.paddingBottom ?? flat.paddingVertical ?? flat.padding;
    sheetStyle = [style, { paddingBottom: (typeof own === 'number' ? own : 0) + bottomInset }];
  }
  return (
    <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
      <BottomSheetPortal hostName={portalHost}>
        <BottomSheetOverlay />
        <BottomSheetContent style={sheetStyle}>{children}</BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheetRoot>
  );
};
