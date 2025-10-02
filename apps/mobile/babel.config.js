module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'transform-inline-environment-variables',
      ['@babel/plugin-transform-private-methods', { loose: true }],
      'react-native-reanimated/plugin'
    ],
  };
}
