import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const proxyTarget =
    (env.VITE_API_URL && env.VITE_API_URL.replace(/\/+$/, '')) ||
    'https://chat-without-internet.onrender.com';

  return {
    plugins: [react()],
    
    define: {
      'process.env': env,
    },

    server: {
      host: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },

    // ✅ IMPORTANT FOR CAPACITOR
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});