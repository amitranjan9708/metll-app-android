// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Exclude native-only modules from web builds
const defaultResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Block react-native-agora on web platform
    if (platform === 'web' && moduleName === 'react-native-agora') {
        // Return empty mock for web
        return {
            type: 'empty',
        };
    }
    
    // Use default resolution
    if (defaultResolver) {
        return defaultResolver(context, moduleName, platform);
    }
    
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

