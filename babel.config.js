module.exports = (api) => {
  // Jest runs React Native's own source, whose newer Flow syntax only React Native's preset reads
  const isTest = api.env('test');
  return {
    presets: isTest
      ? ['module:@react-native/babel-preset']
      : [['module:react-native-builder-bob/babel-preset', { modules: 'commonjs' }]],
  };
};
