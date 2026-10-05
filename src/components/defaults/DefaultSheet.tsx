import { BottomSheetContent, BottomSheetOverlay, BottomSheetPortal, BottomSheetRoot } from '../common/BottomSheet';
import type { SheetProps } from '../../types';

/**
 * The toolkit's default `Sheet`: a bottom sheet on phones, tablets and web, and a right-hand side
 * panel on TV. Built on `@rn-primitives/dialog`, rendered into the toolkit's portal host.
 *
 * @param {SheetProps} props - The props for the sheet.
 * @returns {React.ReactElement} The sheet component.
 */
export const DefaultSheet = ({ open, onOpenChange, children, style, portalHost }: SheetProps): React.ReactElement => (
  <BottomSheetRoot open={open} onOpenChange={onOpenChange}>
    <BottomSheetPortal hostName={portalHost}>
      <BottomSheetOverlay />
      <BottomSheetContent style={style}>{children}</BottomSheetContent>
    </BottomSheetPortal>
  </BottomSheetRoot>
);
