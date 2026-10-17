import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — собранное приложение можно открыть из любой папки (vite preview или любой статический сервер).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
} as never);
