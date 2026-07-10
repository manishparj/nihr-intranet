import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import express from 'express';
import apiRouter from './server/api';
import { Database } from './server/db';

function expressPlugin() {
  return {
    name: 'express-plugin',
    configureServer(server) {
      Database.load();
      const app = express();
      app.use(express.json({ limit: '50mb' }));
      app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), expressPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
