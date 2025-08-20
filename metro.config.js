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

module.exports = withNativeWind(config, { input: "./app/global.css" });
