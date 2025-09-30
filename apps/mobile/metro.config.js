// Metro config for Expo Router with robust plugin resolution under pnpm
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
// Resolve expo-router package root, then require its metro-plugin
const expoRouterPkg = require.resolve('expo-router/package.json');
const expoRouterDir = path.dirname(expoRouterPkg);
const { withExpoRouter } = require(path.join(expoRouterDir, 'metro-plugin'));

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(__dirname);

// Allow require.context used by expo-router
config.transformer.unstable_allowRequireContext = true;

module.exports = withExpoRouter(config, {
  appRoot: 'app',
});
