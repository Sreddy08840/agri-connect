// apps/mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Set the app root for expo-router
config.projectRoot = projectRoot;

// Monorepo setup: watch workspace root
config.watchFolders = [workspaceRoot];

// Node modules resolution for monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Ensure source extensions are correct
config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];

// Use custom transformer to patch require.context in expo-router files
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./metro.transformer.js'),
};

module.exports = config;