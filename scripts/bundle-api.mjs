/**
 * Bundles the Express API for Vercel (@vercel/node).
 * Output is CommonJS (api/package.json sets "type": "commonjs").
 */

import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(rootDir, '..');
const outFile = path.join(projectRoot, 'api/index.js');

await esbuild.build({
  absWorkingDir: projectRoot,
  entryPoints: [path.join(projectRoot, 'src/server/vercel-handler.ts')],
  outfile: outFile,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  packages: 'external',
  logLevel: 'info',
  external: ['@prisma/client', 'prisma'],
});

// Ensure Vercel gets the Express app on module.exports (not .default).
const footer = `
;module.exports = (typeof module.exports === 'function' || (module.exports && typeof module.exports.handle === 'function'))
  ? module.exports
  : (module.exports && module.exports.default) || module.exports;
`;
fs.appendFileSync(outFile, footer);

console.log('[build:api] Wrote api/index.js');
