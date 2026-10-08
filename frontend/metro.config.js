const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Bundle the on-device face AI: model weights (.bin) and the face-api script kept as text (.txt)
config.resolver.assetExts.push("bin", "txt");

module.exports = config;
