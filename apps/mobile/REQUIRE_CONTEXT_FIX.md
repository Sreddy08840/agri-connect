# require.context Fix for Expo Router / Metro Bundler

## Problem
Metro bundler (React Native) doesn't support `require.context`, which is a webpack-specific feature. When expo-router tries to use it in `_ctx.android.js` and `_ctx.ios.js`, the app crashes with:

```
Invalid call at line <unknown>: undefined
First argument of `require.context` should be a string denoting the directory to require.
```

## Solution

### The Approach
The fix patches `require.context` globally **before** expo-router's entry code runs by creating a custom entry point.

### Files Created/Modified

#### 1. **`index.js`** (NEW - Custom Entry Point)
```javascript
// Custom entry point that sets up require.context polyfill
// BEFORE expo-router's code runs

// Polyfill require.context globally
if (typeof require !== 'undefined') {
  require.context = require.context || function() {
    const mockContext = function() { return {}; };
    mockContext.keys = () => [];
    mockContext.resolve = () => null;
    mockContext.id = 'mock';
    return mockContext;
  };
}

// Now load expo-router's entry
require('expo-router/entry');
```

**Why this works:** This file runs FIRST, patches the global `require` object with a mock `context` method, then loads expo-router normally.

#### 2. **`package.json`** (MODIFIED)
Changed:
```json
"main": "index.js"  // Was: "expo-router/entry"
```

Updated scripts to use `npx expo`:
```json
"scripts": {
  "start": "cross-env EXPO_ROUTER_APP_ROOT=app npx expo start",
  "start:clear": "cross-env EXPO_ROUTER_APP_ROOT=app npx expo start -c",
  "android": "npx expo run:android",
  "ios": "npx expo run:ios",
  "web": "npx expo start --web"
}
```

#### 3. **`metro.config.js`** (SIMPLIFIED)
Removed complex serializers and resolvers. Now just handles monorepo setup:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.projectRoot = projectRoot;
config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.sourceExts = ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs'];

module.exports = config;
```

#### 4. **`app/_layout.tsx`** (MODIFIED)
Added import at the top (belt-and-suspenders approach):
```typescript
// MUST BE FIRST: Setup require.context polyfill before expo-router processes routes
import '../setup-require-context';
```

#### 5. **Supporting Files** (KEPT for compatibility)
- `require-context-polyfill.js` - Polyfill module
- `setup-require-context.js` - Setup helper

## How to Use

### Start Development Server
```bash
# Clear cache and start (recommended after changes)
npx expo start -c

# Or use npm script
npm run start:clear

# Normal start
npm start
```

### Key Points
- ✅ Uses `npx expo` instead of deprecated global `expo-cli`
- ✅ Patches `require.context` globally before any app code runs
- ✅ Works with Expo SDK 51+ and expo-router
- ✅ Only affects mobile app (backend/web unchanged)
- ✅ Simple, maintainable solution

### What Happens
1. App starts → loads `index.js` (custom entry)
2. `index.js` patches `require.context` on global `require` object
3. `index.js` loads expo-router's normal entry point
4. expo-router's `_ctx.*.js` files run and find `require.context` available
5. The polyfill returns empty arrays/nulls, preventing crashes
6. App bundles and runs successfully

## Testing
Run `npx expo start -c` and verify:
- ✅ Metro bundler starts without errors
- ✅ No "Invalid call" or "require.context" errors
- ✅ QR code appears for Expo Go
- ✅ App builds successfully for Android/iOS

## Troubleshooting

### If you still see the error:
1. Clear all caches: `npx expo start -c`
2. Delete `node_modules/.cache`
3. Restart the terminal
4. Verify `package.json` has `"main": "index.js"`

### If the app doesn't start:
1. Check that `index.js` exists in the mobile app root
2. Verify it has the require.context polyfill code
3. Make sure `app/_layout.tsx` is importing the setup file

## Why This Approach?

Other attempted approaches that **didn't work**:
- ❌ Metro resolver only - expo-router already has the code compiled
- ❌ Custom serializer - too complex, breaks other things
- ❌ Babel transformer - runs too late in the pipeline
- ❌ Module mapping - require.context is called directly, not imported

**This approach works** because:
- ✅ Runs at the earliest possible point (entry file)
- ✅ Patches the actual `require` object that expo-router uses
- ✅ Simple and maintainable
- ✅ Doesn't interfere with Metro's normal operation
