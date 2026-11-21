import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  base: process.env.PUBLIC_ENV__BASE_URL ?? './',
  resolve: {
    alias: {
      '~': new URL('./src/', import.meta.url).pathname
    }
  }
});
