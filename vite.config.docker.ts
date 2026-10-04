import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 700,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: { safari10: true },
      format: { comments: false },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) return 'vendor-react';
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) return 'vendor-router';
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/gsap')) return 'vendor-gsap';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules/swiper')) return 'vendor-swiper';
          if (id.includes('node_modules/react-datepicker') || id.includes('node_modules/date-fns')) return 'vendor-datepicker';
          if (id.includes('node_modules/lenis')) return 'vendor-lenis';
          if (id.includes('node_modules/bootstrap')) return 'vendor-bootstrap';
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
      },
    },
  },
});
