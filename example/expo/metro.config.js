const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const { getConfig } = require('react-native-builder-bob/metro-config');
const pkg = require('../../package.json');

const root = path.resolve(__dirname, '../..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getConfig(getDefaultConfig(__dirname), {
  root,
  pkg,
  project: __dirname,
});
//  config = {
//   // When enabled, the optional code below will allow Metro to resolve
//   // and bundle source files with TV-specific extensions
//   // (e.g., *.ios.tv.tsx, *.android.tv.tsx, *.tv.tsx)
//   //
//   // Metro will still resolve source files with standard extensions
//   // as usual if TV-specific files are not found for a module.
//   //
//   // This code is not enabled by default, since it will impact bundling performance,
//   // but is available for developers who need this capability.
//   //
//   resolver: process.env.BUILDING_FOR_TV
//     ? {
//         sourceExts: [].concat(
//           defaultConfig.resolver.sourceExts.map(e => `tv.${e}`),
//           defaultConfig.resolver.sourceExts,
//         ),
//       }
//     : undefined,
// };

// Merge in custom resolver options
module.exports = config;
