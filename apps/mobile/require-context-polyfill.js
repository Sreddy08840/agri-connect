// Polyfill for require.context to avoid Metro crash in React Native
// require.context is a webpack-specific feature that allows dynamic requires.
// Metro (React Native's bundler) does not support this feature.
// This polyfill prevents the app from crashing when expo-router or other
// packages attempt to use require.context.

/**
 * Polyfill function that replaces require.context
 * @throws {Error} Always throws an error explaining the limitation
 */
function requireContext() {
  throw new Error(
    'require.context is not supported in Metro bundler (React Native). ' +
    'This is a webpack-specific feature. Please use static imports or ' +
    'manual require() calls instead.'
  );
}

/**
 * Returns an empty array (no-op implementation)
 * In webpack, this would return an array of matched module paths
 */
requireContext.keys = function() {
  return [];
};

/**
 * Returns null (no-op implementation)
 * In webpack, this would resolve a module path
 */
requireContext.resolve = function() {
  return null;
};

/**
 * Required for webpack compatibility - returns the module ID
 */
requireContext.id = 'require-context-polyfill';

module.exports = requireContext;