/* eslint-disable unused-imports/no-unused-imports */
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
const path = require('path');
const webpack = require('webpack');

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)
const config: Config = {
  title: 'React Native Video Toolkit',
  tagline:
    'Build a fully-customizable, themeable, and gesture-driven video experience with a developer-friendly compound component API.',
  favicon: 'img/icon.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://2004durgesh.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/react-native-video-toolkit/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: '2004durgesh', // Usually your GitHub org/user name.
  projectName: 'react-native-video-toolkit', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          remarkPlugins: [[require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }]],
          editUrl: 'https://github.com/2004durgesh/react-native-video-toolkit/tree/main/docs/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          remarkPlugins: [[require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }]],
          editUrl: 'https://github.com/2004durgesh/react-native-video-toolkit/tree/main/docs/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        pages: {
          remarkPlugins: [[require('@docusaurus/remark-plugin-npm2yarn'), { sync: true }]],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    ...[process.env.NODE_ENV === 'production' && '@docusaurus/plugin-debug'].filter(Boolean),
    '@docusaurus/theme-live-codeblock',
    [
      '@gorhom/docusaurus-react-native-plugin',
      {
        alias: {
          'react-native-video-toolkit': path.resolve(__dirname, '../src'),
        },
      },
    ],

    async function reanimatedDocusaurusPlugin(context, options) {
      return {
        name: 'react-native-reanimated/docusaurus-plugin',
        configureWebpack(config, isServer, utils) {
          const processMock = !isServer ? { process: { env: {} } } : {};

          const raf = require('raf');
          raf.polyfill();

          return {
            mergeStrategy: {
              'resolve.extensions': 'prepend',
            },
            plugins: [
              new webpack.DefinePlugin({
                ...processMock,
                __DEV__: 'false',
              }),
            ],
            module: {
              rules: [
                {
                  test: /\.txt$/,
                  type: 'asset/source',
                },
                {
                  test: /\.tsx?$/,
                  use: 'babel-loader',
                },
                {
                  test: /\.js$/,
                  use: 'babel-loader',
                },
                // Rule to exclude the regular NativeVideoToolkit.ts in favor of .web.ts
                {
                  test: /NativeVideoToolkit\.ts$/,
                  exclude: /NativeVideoToolkit\.web\.ts$/,
                  use: 'null-loader', // This will ignore the file
                },
              ],
            },
            resolve: {
              alias: {
                'react-native$': 'react-native-web',
              },
              extensions: ['.web.ts', '.web.tsx', '.web.js', '.web.jsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
            },
          };
        },
      };
    },
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    liveCodeBlock: {
      playgroundPosition: 'bottom',
    },
    navbar: {
      title: 'React Native Media Toolkit',
      logo: {
        alt: 'My Site Logo',
        src: 'img/icon.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/2004durgesh/react-native-video-toolkit',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} react-native-video-toolkit.`,
    },
    prism: {
      theme: prismThemes.palenight,
      darkTheme: prismThemes.palenight,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
