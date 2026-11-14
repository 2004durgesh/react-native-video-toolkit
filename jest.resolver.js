// React Native's resolver (it lets Jest mock react-native's subpaths) under Reanimated's (it picks
// the web versions of the modules Reanimated's mock runs in Jest)
const reactNativeResolver = require('@react-native/jest-preset/jest/resolver.js');
const reanimatedResolver = require('react-native-reanimated/jest/resolver');

module.exports = (request, options) =>
  reanimatedResolver(request, {
    ...options,
    defaultResolver: (path, nextOptions) =>
      reactNativeResolver(path, { ...nextOptions, defaultResolver: options.defaultResolver }),
  });
