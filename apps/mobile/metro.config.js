const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

/** @type {import('metro-config').ConfigT} */
const config = getDefaultConfig(projectRoot);

// Ensure Metro watches the monorepo root so it can resolve workspace packages
config.watchFolders = [workspaceRoot];

// Prefer local node_modules in the app and the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Monorepo-friendly resolution
// Allow hierarchical lookup so Metro can resolve packages from the workspace root
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enableSymlinks = true;

// Fallback to workspace root for any module lookups (helps with pnpm hoisting)
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (target, name) => path.join(workspaceRoot, 'node_modules', name),
  }
);

module.exports = config;
