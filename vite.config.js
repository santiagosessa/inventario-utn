import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const { PORT = '3000' } = loadEnv(mode, process.cwd(), 'PORT');
  return {
    base: '/inventario/',
    server: { proxy: { '/api': `http://127.0.0.1:${PORT}` } },
  };
});
