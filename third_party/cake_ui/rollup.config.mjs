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
    // Custom local UMD->ESM mappings.
    ['react', path.join(hereDir, 'src/deps/esm/react.ts')],
    ['react/jsx-runtime', path.join(hereDir, 'src/deps/esm/react.ts')],
    ['react-dom', path.join(hereDir, 'src/deps/esm/react-dom.ts')],
    ['prop-types', path.join(hereDir, 'src/deps/esm/prop-types.ts')],

    // Mappings to third_party/node/node_modules files.

    // TODO: Do all the fucking hackjob garbage shit with every single library here that you did with the react and react-dom, 
    // adding them to /esm by simply importing exporting again...otherwise you get BS runtime errors like process is not defined or
    // prototype is not defined...
    ['react/index.js', path.join(pathToNodeModules, 'react/umd/react.production.min.js')],
    ['react-dom/index.js', path.join(pathToNodeModules, 'react-dom/umd/react-dom.production.min.js')],
    ['prop-types/index.js', path.join(pathToNodeModules, 'prop-types/prop-types.min.js')],
    ['@tabler/icons-react', path.join(pathToNodeModules, '@tabler/icons-react/dist/esm/tabler-icons-react.js')],
    ['lexical', path.join(pathToNodeModules, 'lexical/Lexical.prod.mjs')],
    ['@lexical/react/LexicalAutoFocusPlugin', path.join(pathToNodeModules, '@lexical/react/LexicalAutoFocusPlugin.prod.mjs')],
    ['@lexical/react/LexicalComposer', path.join(pathToNodeModules, '@lexical/react/LexicalComposer.prod.mjs')],
    ['@lexical/react/LexicalComposerContext', path.join(pathToNodeModules, '@lexical/react/LexicalComposerContext.prod.mjs')],
    ['@lexical/react/LexicalPlainTextPlugin', path.join(pathToNodeModules, '@lexical/react/LexicalPlainTextPlugin.prod.mjs')],
    ['@lexical/react/LexicalContentEditable', path.join(pathToNodeModules, '@lexical/react/LexicalContentEditable.prod.mjs')],
    ['@lexical/react/LexicalHistoryPlugin', path.join(pathToNodeModules, '@lexical/react/LexicalHistoryPlugin.prod.mjs')],
    ['@lexical/react/LexicalErrorBoundary', path.join(pathToNodeModules, '@lexical/react/LexicalErrorBoundary.prod.mjs')],
    ['@lexical/react/useLexicalEditable', path.join(pathToNodeModules, '@lexical/react/useLexicalEditable.prod.mjs')],
    ['@lexical/history', path.join(pathToNodeModules, '@lexical/history/LexicalHistory.prod.mjs')],
    ['@lexical/text', path.join(pathToNodeModules, '@lexical/text/LexicalText.prod.mjs')],
    ['@lexical/utils', path.join(pathToNodeModules, '@lexical/utils/LexicalUtils.prod.mjs')],
    ['@lexical/dragon', path.join(pathToNodeModules, '@lexical/dragon/LexicalDragon.prod.mjs')],
    ['@lexical/plain-text', path.join(pathToNodeModules, '@lexical/plain-text/LexicalPlainText.prod.mjs')],
    ['@lexical/selection', path.join(pathToNodeModules, '@lexical/selection/LexicalSelection.prod.mjs')],
    ['@lexical/table', path.join(pathToNodeModules, '@lexical/table/LexicalTable.prod.mjs')],
    ['@lexical/clipboard', path.join(pathToNodeModules, '@lexical/clipboard/LexicalClipboard.prod.mjs')],
    ['@lexical/html', path.join(pathToNodeModules, '@lexical/html/LexicalHtml.prod.mjs')],
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
