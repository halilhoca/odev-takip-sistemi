import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Repository adınız: Değiştirmeyi unutmayın!
const repositoryName = 'odev-takip-sistemi';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? `/${repositoryName}/` : '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
