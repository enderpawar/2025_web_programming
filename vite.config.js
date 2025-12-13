import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // pdfjs worker 파일 복사
  const copyPdfWorker = () => {
    return {
      name: 'copy-pdf-worker',
      buildStart() {
        const publicDir = path.resolve(__dirname, 'public');
        if (!existsSync(publicDir)) {
          mkdirSync(publicDir, { recursive: true });
        }
        
        try {
          const workerSrc = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
          const workerDest = path.resolve(publicDir, 'pdf.worker.min.mjs');
          copyFileSync(workerSrc, workerDest);
          console.log('PDF.js worker copied to public directory');
        } catch (error) {
          console.warn('Failed to copy PDF.js worker:', error.message);
        }
      }
    };
  };
  
  return {
    base: mode === 'production' ? '/2025_web_programming/' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), copyPdfWorker()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
