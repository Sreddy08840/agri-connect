// Custom Metro serializer that injects require.context polyfill
// at the very beginning of the bundle, before any other code runs

const createModuleIdFactory = require('metro/src/lib/createModuleIdFactory');
const {
  isJsModule,
  wrapModule,
} = require('metro/src/lib/bundle-modules/helpers');

// The polyfill code that will be injected
const POLYFILL_CODE = `
// require.context polyfill - INJECTED AT BUNDLE START
(function() {
  if (typeof require !== 'undefined' && !require.context) {
    require.context = function(directory, useSubdirectories, regExp) {
      var contextFunction = function(id) { return {}; };
      contextFunction.keys = function() { return []; };
      contextFunction.resolve = function(id) { return id; };
      contextFunction.id = 'require-context-polyfill';
      return contextFunction;
    };
  }
})();
`;

function customSerializer(entryPoint, preModules, graph, options) {
  const processModules = [...preModules, ...graph.dependencies.values()]
    .filter(isJsModule)
    .map((module) => [
      options.createModuleId(module.path),
      wrapModule(module, options),
    ]);

  const modulesArray = processModules.map(([id, code]) => [id, code]);
  
  // Build the bundle with polyfill injected first
  let bundle = '(function(global) {\n';
  bundle += POLYFILL_CODE;
  bundle += '\n';
  bundle += options.runModule
    ? `global.__r = require; `
    : '';
  
  // Add all modules
  modulesArray.forEach(([id, code]) => {
    bundle += code + '\n';
  });
  
  // Run the entry point
  if (options.runModule) {
    bundle += `global.__r(${options.createModuleId(entryPoint)});\n`;
  }
  
  bundle += '})(typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof window !== "undefined" ? window : this);\n';
  
  return bundle;
}

module.exports = customSerializer;
