// Web implementation using web APIs
export enum Orientation {
  portrait = 'portrait',
  landscape = 'landscape',
  portraitUpsideDown = 'portrait-upside-down',
  landscapeLeft = 'landscape-left',
  landscapeRight = 'landscape-right',
}

export type OrientationType = Orientation;

// Web-compatible orientation director
class WebOrientationDirector {
  /**
   * Check if orientation is lockable (always false on web for programmatic control)
   */
  isLockableOrientation(orientation: Orientation): boolean {
    // On web, we can't programmatically lock orientation in most cases
    // Only available in fullscreen mode and with user gesture
    return false;
  }

  /**
   * Lock to specific orientation (uses Screen Orientation API if available)
   */
  lockTo(orientation: Orientation): void {
    if (typeof screen !== 'undefined' && 'orientation' in screen && 'lock' in (screen.orientation as any)) {
      try {
        // Map our orientation enum to web API values
        let webOrientation: string;
        switch (orientation) {
          case Orientation.portrait:
            webOrientation = 'portrait';
            break;
          case Orientation.landscape:
            webOrientation = 'landscape';
            break;
          case Orientation.portraitUpsideDown:
            webOrientation = 'portrait-secondary';
            break;
          case Orientation.landscapeLeft:
            webOrientation = 'landscape-secondary';
            break;
          case Orientation.landscapeRight:
            webOrientation = 'landscape-primary';
            break;
          default:
            webOrientation = 'portrait';
        }

        // This will only work in fullscreen mode
        (screen.orientation as any).lock(webOrientation).catch((error: any) => {
          console.warn('[WebOrientationDirector] Failed to lock orientation:', error);
        });
      } catch (error) {
        console.warn('[WebOrientationDirector] Screen Orientation API not supported:', error);
      }
    } else {
      console.log('[WebOrientationDirector] Screen Orientation API not available');
    }
  }

  /**
   * Unlock orientation (uses Screen Orientation API if available)
   */
  unlock(): void {
    if (typeof screen !== 'undefined' && 'orientation' in screen && 'unlock' in (screen.orientation as any)) {
      try {
        (screen.orientation as any).unlock();
      } catch (error) {
        console.warn('[WebOrientationDirector] Failed to unlock orientation:', error);
      }
    } else {
      console.log('[WebOrientationDirector] Screen Orientation API not available');
    }
  }

  /**
   * Get current orientation
   */
  getCurrentOrientation(): Orientation {
    if (typeof screen !== 'undefined' && 'orientation' in screen) {
      const angle = (screen.orientation as any).angle;
      const type = (screen.orientation as any).type;

      if (type.includes('portrait')) {
        return angle === 180 ? Orientation.portraitUpsideDown : Orientation.portrait;
      } else {
        return angle === 270 ? Orientation.landscapeLeft : Orientation.landscapeRight;
      }
    }

    // Fallback: detect based on window dimensions
    if (typeof window !== 'undefined') {
      return window.innerWidth > window.innerHeight ? Orientation.landscape : Orientation.portrait;
    }

    return Orientation.portrait;
  }

  /**
   * Add orientation change listener
   */
  addOrientationListener(callback: (orientation: Orientation) => void): () => void {
    if (typeof screen !== 'undefined' && 'orientation' in screen) {
      const handleOrientationChange = () => {
        callback(this.getCurrentOrientation());
      };

      (screen.orientation as any).addEventListener('change', handleOrientationChange);

      return () => {
        (screen.orientation as any).removeEventListener('change', handleOrientationChange);
      };
    }

    // Fallback: use window resize as proxy for orientation change
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        callback(this.getCurrentOrientation());
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    // No-op if neither API is available
    return () => {};
  }
}

// Export the web implementation
export const RNOrientationDirector = new WebOrientationDirector();
export default RNOrientationDirector;
