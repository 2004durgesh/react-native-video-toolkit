module.exports = {
  presets: [
    require.resolve('@docusaurus/core/lib/babel/preset'),
    ["@babel/preset-react", {
      "runtime": "automatic"
    }],
    ["@babel/preset-typescript", {
      "isTSX": true,
      "allExtensions": true
    }]
  ],
  "plugins": [
    [
      "module-resolver",
      {
        "alias": {
          "^react-native$": "react-native-web",
          "react-native/Libraries/Image/AssetRegistry": "react-native-web/dist/modules/AssetRegistry"
        }
      }
    ],
    "babel-plugin-react-native-web"
  ]
};