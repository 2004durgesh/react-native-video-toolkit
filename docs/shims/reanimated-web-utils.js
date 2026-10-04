// Replaces react-native-reanimated's `webUtils.web.js` in the docs bundle (wired up in next.config.mjs).
//
// Reanimated loads these react-native-web internals with `require()` inside try/catch. Webpack leaves
// those calls untouched in that ES module, so in the browser they throw, the helpers stay undefined, and
// every animated style update crashes with "Cannot convert undefined or null to object". Since Next.js 16
// that error takes down the whole page. Static imports are bundled normally.
export { default as createReactDOMStyle } from 'react-native-web/dist/exports/StyleSheet/compiler/createReactDOMStyle';
export { createTransformValue, createTextShadowValue } from 'react-native-web/dist/exports/StyleSheet/preprocess';
