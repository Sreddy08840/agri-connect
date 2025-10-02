// Custom Metro transformer that replaces require.context calls
// in expo-router files with inline polyfill

const upstreamTransformer = require('metro-react-native-babel-transformer');

console.log('==========================================');
console.log('✅ Custom Metro Transformer Loaded!');
console.log('==========================================');

module.exports.transform = async function({ src, filename, options }) {
  // Check if this is an expo-router file
  if (filename.includes('expo-router') && filename.includes('_ctx')) {
    console.log('[Transformer] 🔍 Processing expo-router ctx file:', filename);
    
    // Check if the file contains require.context
    if (src.includes('require.context')) {
      console.log('[Transformer] 🎯 Found require.context! Applying patch...');
      
      // Replace ALL instances of require.context with inline polyfill
      // This replaces: require.context(directory, useSubdirectories, regExp)
      // With a function that returns a mock context object
      const originalSrc = src;
      src = src.replace(
        /require\.context/g,
        '(function(){return function(d,u,r){var c=function(id){return{}};c.keys=function(){return[]};c.resolve=function(id){return id};c.id="ctx-polyfill";return c}})().bind(null)'
      );
      
      if (src !== originalSrc) {
        console.log('[Transformer] ✅ Successfully patched require.context!');
        console.log('[Transformer] 📝 Patched code length:', src.length);
      } else {
        console.log('[Transformer] ⚠️ No changes made - pattern didnt match');
      }
    } else {
      console.log('[Transformer] ℹ️ No require.context found in this file');
    }
  }

  // Use the default transformer
  try {
    return await upstreamTransformer.transform({ src, filename, options });
  } catch (error) {
    console.error('[Transformer] ❌ Error transforming:', filename, error.message);
    throw error;
  }
};
