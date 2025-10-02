// Setup file to polyfill require.context before expo-router loads
// This must be imported at the very beginning of the app

if (typeof require !== 'undefined' && !require.context) {
  // Create a polyfill that accepts arguments (directory, useSubdirectories, regExp)
  // and returns a context function with the required methods
  require.context = function(directory, useSubdirectories, regExp) {
    // Return a function that acts as the context
    const contextFunction = function(id) {
      // Return empty module
      return {};
    };
    
    // Add required methods
    contextFunction.keys = function() {
      return [];
    };
    
    contextFunction.resolve = function(id) {
      return id;
    };
    
    contextFunction.id = 'require-context-polyfill';
    
    return contextFunction;
  };
  
  console.log('[Setup] require.context polyfill installed');
}

// Export for module compatibility
module.exports = {};
