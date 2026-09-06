import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
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
      // Production is static PHP hosting (no local PHP server) — every *.php endpoint
      // (tts-edge.php, tts-greek.php, cron-publish.php, tiktok-*.php, pinterest-*.php,
      // article.php) 404s under local `vite dev` with no proxy, which silently breaks
      // features that depend on them (e.g. TTS falls back to the browser's broken
      // letter-by-letter voice). Proxy any root-level *.php request straight to the live
      // site so local testing exercises the same backend production actually uses.
      proxy: {
        '^/[^/]+\\.php(\\?.*)?$': {
          target: 'https://smartgarden.gr',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
