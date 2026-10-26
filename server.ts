/**
 * @license Apache-2.0
 * Avenora Fintech Platform — Server Entry Point
 *
 * Runs Express on port 3000 with Vite middleware mounted in development.
 */

import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createExpressApp } from './src/server/app.ts';
import { createServer as createViteServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  const app = createExpressApp();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Inline Vite config: Vite 8.3 + rolldown currently fails bundling vite.config.*
    // with sourcemapPathTransform ("object" vs "string") on this Windows install.
    const vite = await createViteServer({
      configFile: false,
      root: rootDir,
      appType: 'spa',
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(rootDir, 'src'),
        },
      },
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        ...(process.env.DISABLE_HMR === 'true' ? { watch: null } : {}),
      },
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Avenora Core] Server active at http://0.0.0.0:${port}`);
    console.log(`[Avenora Core] Status: Prototype/Demo Mode | Real-Money Movement: BLOCKED`);
  });
}

bootstrap().catch((err) => {
  console.error('[Avenora Core] Fatal startup error:', err);
  process.exit(1);
});
