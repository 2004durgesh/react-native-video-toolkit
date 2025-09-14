import { createMDX } from 'fumadocs-mdx/next';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const withMDX = createMDX({
  extension: /\.mdx?$/,
});

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    'react-native',
    'react-native-web',
    'react-native-css-interop',
    'react-native-reanimated',
    'react-native-gesture-handler',
    'react-native-video',
    'react-native-svg',
    'react-native-material-ripple',
    'react-native-video-toolkit',
    'react-native-awesome-slider',
  ],
  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web',
    },
    resolveExtensions: [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      '.mdx',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
    ],
  },
  experimental: {
    forceSwcTransforms: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
};

export default withMDX(withExpo(config));

// https://github.com/expo/expo-webpack-integrations/blob/main/packages/next-adapter/src/index.ts
function withExpo(nextConfig) {
  return {
    ...nextConfig,
    webpack(config, options) {
      // 🔹 Polyfill requestAnimationFrame for RN libs like Reanimated
      const raf = require('raf');
      raf.polyfill();

      // Ensure resolve is initialized
      if (!config.resolve) config.resolve = {};

      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'react-native$': 'react-native-web',
        // Alias internal react-native modules to react-native-web
        'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
          'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
        'react-native/Libraries/vendor/emitter/EventEmitter$':
          'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
        'react-native/Libraries/EventEmitter/NativeEventEmitter$':
          'react-native-web/dist/vendor/react-native/NativeEventEmitter',
      };

      // Extensions
      config.resolve.extensions = [
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
        '.mdx',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.mjs',
        '.json',
        ...(config.resolve?.extensions ?? []),
      ];

      // Node fallbacks (including process polyfill for RN libs)
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        'react-native$': 'react-native-web',
        'process': require.resolve('process/browser'), // Polyfill process for client-side RN code
      };

      // Ensure module rules exist
      if (!config.module) config.module = {};
      if (!config.module.rules) config.module.rules = [];

      // 🔹 Add support for .txt assets
      config.module.rules.push({
        test: /\.txt$/,
        type: 'asset/source',
      });

      // 🔹 Ignore NativeVideoToolkit.ts (prefer .web.ts)
      config.module.rules.push({
        test: /NativeVideoToolkit\.ts$/,
        exclude: /NativeVideoToolkit\.web\.ts$/,
        use: 'null-loader',
      });

      config.module.rules.push({
        test: /NativeOrientation\.ts$/,
        exclude: /NativeOrientation\.web\.ts$/,
        use: 'null-loader',
      });

      if (!config.plugins) config.plugins = [];

      // 🔹 Define __DEV__ for client builds (fixes "__DEV__ is not defined" in RN libs like Reanimated/GestureHandler)
      config.plugins.push(
        new options.webpack.DefinePlugin({
          __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
        })
      );

      // Call user-defined webpack if provided
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }
      return config;
    },
  };
}
