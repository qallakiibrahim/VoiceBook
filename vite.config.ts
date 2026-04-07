import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  
  // Try to get keys from loadEnv (for .env files) or process.env (for injected secrets)
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const apiKey = env.API_KEY || process.env.API_KEY || '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey || process.env.GEMINI_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(apiKey || process.env.API_KEY || ''),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey || process.env.GEMINI_API_KEY || ''),
      'import.meta.env.VITE_API_KEY': JSON.stringify(apiKey || process.env.API_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
