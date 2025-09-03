const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable console logs in Metro (temporary fix for RN 0.76+)
config.transformer = {
    ...config.transformer,
    minifierConfig: {
        ...config.transformer?.minifierConfig,
        keep_fnames: true,
        mangle: {
            keep_fnames: true,
        },
    },
};

// Add resolver configuration to handle module resolution issues
config.resolver = {
    ...config.resolver,
    // Exclude problematic nested react-native installations
    blockList: [
        /node_modules\/react-native-appwrite\/node_modules\/react-native\/.*/,
    ],
    // Use nodeModulesPaths to prioritize the main node_modules
    nodeModulesPaths: [
        require('path').resolve(__dirname, 'node_modules'),
    ],
};

// Watchman configuration to ignore problematic paths
config.watchFolders = [__dirname];
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./app/global.css" });
