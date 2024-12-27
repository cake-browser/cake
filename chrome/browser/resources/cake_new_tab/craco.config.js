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
            if (
              request.request && 
              request.request.endsWith('.js') && 
              !request.request.endsWith('ui.rollup.js')
            ) {
              let newRequest

              if (request.request.endsWith('/proxy.js')) {
                newRequest = {
                  ...request,
                  request: request.request.replace('/proxy.js', '/dev/proxy')
                };
              } else if (request.request.endsWith('/cake_new_tab.mojom-webui.js')) {
                newRequest = {
                  ...request,
                  request: request.request.replace('../cake_new_tab.mojom-webui.js', '/dev/mojom')
                };
              } else {
                newRequest = {
                  ...request,
                  request: request.request.replace(/\.js$/, '')
                };
              }

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