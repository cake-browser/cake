/**
 * @fileoverview Rollup configuration to bundle Cake UI using a custom plugin.
 */

import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

/**
 * Determines the path to |source| from the root directory based on the origin
 * of the request for it. For example, if ../a/b.js is requested from
 * c/d/e/f.js, the returned path will be c/d/a/b.js.
 * @param {string} origin The origin of the request.
 * @param {string} source The requested resource
 * @return {string} Path to source from the root directory.
 */
function combinePaths(origin, source) {
  const originDir = origin ? path.dirname(origin) : '';
  return path.normalize(path.join(originDir, source)).replace(/\\/gi, '/');
}

// Plugin for Rollup to resolve bare imports when bundling Cake UI.
function plugin() {
  // The aboslute path of the directory where the current file resides.
  const hereDir = url.fileURLToPath(new URL('.', import.meta.url));

  // The absolute path to third_party/node/node_modules/.
  const nodeModulesDir = path.join(hereDir, '../node/node_modules');

  // Relative path from the current working directory to
  // third_party/node/node_modules/.
  const pathToNodeModules = path.relative(process.cwd(), nodeModulesDir);

  // URL mappings from bare import URLs to file paths.
  const redirects = new Map([
    ['react', path.join(hereDir, 'src/deps/react-esm.ts')],
    ['react-dom', path.join(hereDir, 'src/deps/react-dom-esm.ts')],
    ['react/index.js', path.join(pathToNodeModules, 'react/umd/react.production.min.js')],
    ['react-dom/index.js', path.join(pathToNodeModules, 'react-dom/umd/react-dom.production.min.js')],
    ['prop-types', path.join(pathToNodeModules, 'prop-types/prop-types.min.js')],
    ['@tabler/icons-react', path.join(pathToNodeModules, '@tabler/icons-react/dist/esm/tabler-icons-react.js')],
  ]);

  return {
    name: 'ui-path-resolver-plugin',

    resolveId(source, origin) {
      if (source.startsWith('.')) {
        // Resolve relative path.
        let resolvedPath = combinePaths(origin, source);
        if (!fs.existsSync(resolvedPath)) return null;

        // If it's a directory, try index.js.
        if (fs.statSync(resolvedPath).isDirectory()) {
          resolvedPath = path.join(resolvedPath, 'index.js');
        } 
        // If the source already has an extension, don't add another one.
        else if (!path.extname(source)) {
          resolvedPath += '.js';
        }

        return resolvedPath;
      }

      if (origin === undefined) {
        return null;
      }

      const redirect = redirects.get(source) || null;
      if (redirect) {
        return redirect;
      }

      throw new Error(`Unresolved import '${source}' in '${origin}'`);
      return null;
    },
  };
}

export default ({
  plugins: [plugin()],
});
