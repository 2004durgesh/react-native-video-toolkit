/// <reference lib="dom" />
/**
 * @file NativeVideoToolkit.web.ts
 * @description This file provides a web implementation of the NativeVideoToolkit module.
 * For web, we use CSS-based fullscreen instead of browser fullscreen API to maintain
 * React Native Web compatibility and avoid black screen issues.
 */

export interface Spec {
  /**
   * Enters fullscreen mode.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  enterFullscreen(): Promise<boolean>;
  /**
   * Exits fullscreen mode.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  exitFullscreen(): Promise<boolean>;
  /**
   * Checks if the application is currently in fullscreen mode.
   * @returns A promise that resolves to a boolean indicating whether the application is in fullscreen mode.
   */
  isFullscreen(): Promise<boolean>;
}

// Internal state to track fullscreen status
let isCurrentlyFullscreen = false;
let fullscreenElement: HTMLElement | null = null;
let originalStyles: {
  position?: string;
  top?: string;
  left?: string;
  width?: string;
  height?: string;
  zIndex?: string;
  backgroundColor?: string;
} = {};

/**
 * Find the video player container element
 */
const findVideoPlayerContainer = (): HTMLElement | null => {
  // Try to find the video player container by common selectors
  const selectors = [
    '[data-testid="video-player"]',
    '[data-testid="video-container"]',
    '[data-videotoolkit="container"]', // Custom attribute we can add
    '.video-player',
    '.video-container',
    'video',
    '[role="video"]',
    '[data-rn-videoplayer]', // React Native Web video player marker
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      // For video elements, get their container
      if (element.tagName === 'VIDEO') {
        return element.parentElement || element;
      }
      return element;
    }
  }

  // Alternative: Find by React Native Web structure
  // Look for divs that contain video elements
  const videos = document.querySelectorAll('video');
  if (videos.length > 0) {
    const firstVideo = videos[0];
    if (firstVideo?.parentElement) {
      // Find the outermost container that's likely the video player
      let container = firstVideo.parentElement;
      while (container && container.parentElement && container !== document.body) {
        const style = window.getComputedStyle(container);
        // Look for containers that have relative/absolute positioning and defined dimensions
        if (
          (style.position === 'relative' || style.position === 'absolute') &&
          (style.width !== 'auto' || style.height !== 'auto')
        ) {
          break;
        }
        container = container.parentElement;
      }
      if (container && container !== document.body) {
        return container;
      }
    }
  }

  // Fallback: find the root React Native Web container
  const appContainer = document.querySelector('#root, .App, [data-reactroot]') as HTMLElement;
  return appContainer || document.body;
};

export const NativeVideoToolkit: Spec = {
  /**
   * Enters fullscreen mode on the web using CSS positioning.
   * This avoids the black screen issue caused by browser fullscreen API.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  enterFullscreen: async (): Promise<boolean> => {
    try {
      if (isCurrentlyFullscreen) {
        return true; // Already fullscreen
      }

      const element = findVideoPlayerContainer();
      if (!element) {
        console.warn('Could not find video player container for fullscreen');
        return false;
      }

      // Store original styles
      const computedStyle = window.getComputedStyle(element);
      originalStyles = {
        position: element.style.position || computedStyle.position,
        top: element.style.top || computedStyle.top,
        left: element.style.left || computedStyle.left,
        width: element.style.width || computedStyle.width,
        height: element.style.height || computedStyle.height,
        zIndex: element.style.zIndex || computedStyle.zIndex,
        backgroundColor: element.style.backgroundColor || computedStyle.backgroundColor,
      };

      // Apply fullscreen styles
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.width = '100vw';
      element.style.height = '100vh';
      element.style.zIndex = '9999';
      element.style.backgroundColor = element.style.backgroundColor || '#000';

      // Ensure the container can properly display its children
      if (element.style.display === '' || element.style.display === 'none') {
        element.style.display = 'flex';
      }
      if (!element.style.flexDirection) {
        element.style.flexDirection = 'column';
      }

      // Ensure all child elements maintain their relative positioning
      const allChildren = element.querySelectorAll('*');
      allChildren.forEach((child: Element) => {
        const htmlChild = child as HTMLElement;
        const childStyle = window.getComputedStyle(htmlChild);
        // Preserve z-index for controls and other overlay elements
        if (childStyle.position === 'absolute' && !htmlChild.style.zIndex) {
          htmlChild.style.zIndex = '10';
        }
      });

      // Hide scroll bars on body
      document.body.style.overflow = 'hidden';

      fullscreenElement = element;
      isCurrentlyFullscreen = true;

      console.log('Entered CSS fullscreen mode');
      console.log('Fullscreen element:', element);
      console.log('Element dimensions:', {
        width: element.offsetWidth,
        height: element.offsetHeight,
        position: element.style.position,
      });

      // Debug: Check if controls are present
      const controls = element.querySelectorAll('[style*="absolute"]');
      console.log('Found controls with absolute positioning:', controls.length);

      return true;
    } catch (error) {
      console.warn('Failed to enter fullscreen:', error);
      return false;
    }
  },

  /**
   * Exits fullscreen mode on the web.
   * @returns A promise that resolves to a boolean indicating whether the operation was successful.
   */
  exitFullscreen: async (): Promise<boolean> => {
    try {
      if (!isCurrentlyFullscreen || !fullscreenElement) {
        return true; // Already not fullscreen
      }

      // Restore original styles
      if (originalStyles.position !== undefined) {
        fullscreenElement.style.position = originalStyles.position === 'static' ? '' : originalStyles.position;
      }
      if (originalStyles.top !== undefined) {
        fullscreenElement.style.top = originalStyles.top === 'auto' ? '' : originalStyles.top;
      }
      if (originalStyles.left !== undefined) {
        fullscreenElement.style.left = originalStyles.left === 'auto' ? '' : originalStyles.left;
      }
      if (originalStyles.width !== undefined) {
        fullscreenElement.style.width = originalStyles.width === 'auto' ? '' : originalStyles.width;
      }
      if (originalStyles.height !== undefined) {
        fullscreenElement.style.height = originalStyles.height === 'auto' ? '' : originalStyles.height;
      }
      if (originalStyles.zIndex !== undefined) {
        fullscreenElement.style.zIndex = originalStyles.zIndex === 'auto' ? '' : originalStyles.zIndex;
      }

      // Restore body scroll
      document.body.style.overflow = '';

      fullscreenElement = null;
      originalStyles = {};
      isCurrentlyFullscreen = false;

      console.log('Exited CSS fullscreen mode');
      return true;
    } catch (error) {
      console.warn('Failed to exit fullscreen:', error);
      return false;
    }
  },

  /**
   * Checks if the application is currently in fullscreen mode on the web.
   * @returns A promise that resolves to a boolean indicating whether the application is in fullscreen mode.
   */
  isFullscreen: async (): Promise<boolean> => {
    return isCurrentlyFullscreen;
  },
};

export default NativeVideoToolkit;
