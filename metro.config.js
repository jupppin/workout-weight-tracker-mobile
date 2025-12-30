const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Redirect expo-sqlite to shim on web platform
// This prevents bundling errors since expo-sqlite doesn't support web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return {
      filePath: path.resolve(__dirname, './shims/expo-sqlite.web.ts'),
      type: 'sourceFile',
    };
  }
  // Fall back to default resolution for all other modules
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
