import type { CaptionError, CaptionErrorCode } from './types';

/** @internal */
export const captionError = (code: CaptionErrorCode, url: string, reason: string): CaptionError => ({
  code,
  url,
  reason,
});

/** @internal */
export const isCaptionError = (value: unknown): value is CaptionError =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as CaptionError).code === 'string' &&
  typeof (value as CaptionError).url === 'string';

/**
 * Thrown when a load is cancelled (the track changed, or the player unmounted). Not an error to
 * report: whoever cancelled it no longer wants the result.
 * @internal
 */
export class CaptionLoadAborted extends Error {
  constructor() {
    super('Subtitle load aborted');
    this.name = 'CaptionLoadAborted';
  }
}

/** A thrown value as text, for an error's `reason`. @internal */
export const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
