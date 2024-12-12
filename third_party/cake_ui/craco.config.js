module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.entry = './src/dev.tsx';
      return webpackConfig;
    },
  },
};