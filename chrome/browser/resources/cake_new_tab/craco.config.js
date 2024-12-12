const path = require('path');

module.exports = {
  webpack: {
    alias: {
      'resources/cake_ui/ui.rollup.js': path.resolve(__dirname, 'src/dev/deps'),
    },
    configure: (webpackConfig) => {
      // Add custom resolver
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins || [];
      webpackConfig.resolve.plugins.push({
        apply: (resolver) => {
          resolver.hooks.resolve.tapAsync('StripJsExtension', (request, resolveContext, callback) => {
            // Check if the request path ends with .js
            if (request.request && request.request.endsWith('.js') && !request.request.endsWith('ui.rollup.js')) {
              // Create new request with .js stripped off
              const newRequest = {
                ...request,
                request: request.request.replace(/\.js$/, '')
              };
              return resolver.doResolve(
                resolver.hooks.resolve,
                newRequest,
                null,
                resolveContext,
                callback
              );
            }
            callback();
          });
        }
      });

      webpackConfig.entry = './src/dev.tsx';
      return webpackConfig;
    },
  },
};