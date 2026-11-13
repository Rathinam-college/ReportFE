import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Report/',
  plugins: [
    react(),
    {
      name: 'report-route-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url || '';
          const url = rawUrl.split('?')[0];
          const query = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';

          // If already at /Report/ or any path inside it, continue
          if (url.startsWith('/Report/')) {
            next();
            return;
          }

          // Redirect root / or empty path to /Report/
          if (url === '/' || url === '') {
            res.writeHead(302, { Location: `/Report/${query}` });
            res.end();
            return;
          }

          // Redirect /Report without trailing slash to /Report/
          if (url === '/Report') {
            res.writeHead(302, { Location: `/Report/${query}` });
            res.end();
            return;
          }

          // Case-insensitive support: redirect /report or /report/ to /Report/
          if (url === '/report' || url === '/report/') {
            res.writeHead(302, { Location: `/Report/${query}` });
            res.end();
            return;
          }

          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url || '';
          const url = rawUrl.split('?')[0];
          const query = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';

          if (url.startsWith('/Report/')) {
            next();
            return;
          }

          if (url === '/' || url === '' || url === '/Report' || url === '/report' || url === '/report/') {
            res.writeHead(302, { Location: `/Report/${query}` });
            res.end();
            return;
          }

          next();
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/Report/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Report\/api/, '/api')
      },
      '/report/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/report\/api/, '/api')
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
