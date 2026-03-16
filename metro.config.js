const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Load .env so EXPO_PUBLIC_* vars are in process.env when Metro inlines them.
// Required for local Xcode archive builds which run in a clean environment
// without shell env vars. EAS cloud builds inject vars via their own mechanism.
require('dotenv').config();

const config = getDefaultConfig(__dirname);

// Add path aliases for metro bundler
const projectRoot = __dirname;
const watchFolders = [projectRoot];

config.projectRoot = projectRoot;
config.watchFolders = watchFolders;

// Configure module resolver
config.resolver.alias = {
  '@': path.resolve(__dirname, './src'),
  '@components': path.resolve(__dirname, './src/components'),
  '@screens': path.resolve(__dirname, './src/screens'),
  '@services': path.resolve(__dirname, './src/services'),
  '@stores': path.resolve(__dirname, './src/stores'),
  '@hooks': path.resolve(__dirname, './src/hooks'),
  '@types': path.resolve(__dirname, './src/types'),
  '@constants': path.resolve(__dirname, './src/constants'),
  '@utils': path.resolve(__dirname, './src/utils'),
  '@contexts': path.resolve(__dirname, './src/contexts'),
  '@navigation': path.resolve(__dirname, './src/navigation'),
  '@locales': path.resolve(__dirname, './src/locales'),
};

module.exports = config;
