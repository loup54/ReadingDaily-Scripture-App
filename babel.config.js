module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['babel-plugin-module-resolver', {
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@stores': './src/stores',
          '@hooks': './src/hooks',
          '@types': './src/types',
          '@constants': './src/constants',
          '@utils': './src/utils',
          '@contexts': './src/contexts',
          '@navigation': './src/navigation',
          '@locales': './src/locales',
        },
      }],
    ],
  };
};
