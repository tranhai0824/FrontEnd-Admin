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
      // HMR bị tắt trong AI Studio thông qua biến môi trường DISABLE_HMR.
      // Không chỉnh phần này; theo dõi file bị tắt để tránh nhấp nháy khi chỉnh sửa bằng tác nhân.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Tắt theo dõi file khi DISABLE_HMR là true để tiết kiệm CPU trong lúc chỉnh sửa.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: ['**/.codex/**', '**/apps/admin/**'],
            },
    },
  };
});
