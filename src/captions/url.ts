/**
 * Resolves a playlist's relative URI against the playlist's own URL. React Native's `URL` doesn't
 * resolve relative paths, so this does: absolute URLs, `//host`, `/path`, `./` and `../`.
 * @internal
 */
export const resolveUrl = (base: string, relative: string): string => {
  if (/^[a-z][a-z0-9+.-]*:/i.test(relative)) return relative;
  const scheme = /^([a-z][a-z0-9+.-]*:)/i.exec(base)?.[1] ?? '';
  if (relative.startsWith('//')) return scheme + relative;
  const origin = /^([a-z][a-z0-9+.-]*:\/\/[^/?#]*)/i.exec(base)?.[1] ?? '';
  const basePath = base.slice(origin.length).replace(/[?#].*$/, '');
  const path = relative.startsWith('/') ? relative : basePath.slice(0, basePath.lastIndexOf('/') + 1) + relative;

  const [pathOnly = '', ...rest] = path.split(/(?=[?#])/);
  const segments: string[] = [];
  for (const segment of pathOnly.split('/')) {
    if (segment === '..') segments.pop();
    else if (segment !== '.') segments.push(segment);
  }
  let resolved = segments.join('/');
  if (!resolved.startsWith('/')) resolved = '/' + resolved;
  return origin + resolved + rest.join('');
};
