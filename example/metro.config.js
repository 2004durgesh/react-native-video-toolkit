const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');
const project = __dirname;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The library's peer dependencies live in both the monorepo root and the
// example app. Force Metro to resolve a single copy (the example's) so we
// don't end up with duplicate React/React Native instances.
const modules = [
  '@react-native/assets-registry',
  ...Object.keys(pkg.peerDependencies ?? {}),
];

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = getDefaultConfig(project);

config.watchFolders = [root];

config.resolver.blockList = [
  ...config.resolver.blockList,
  ...modules.map(
    (m) => new RegExp(`^${escapeRegExp(path.join(root, 'node_modules', m))}\\/.*$`)
  ),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...modules.reduce((acc, name) => {
    acc[name] = path.join(project, 'node_modules', name);
    return acc;
  }, {}),
};

module.exports = config;
