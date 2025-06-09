import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// V2 版本的 Vite 配置
export default defineConfig({
  plugins: [react()],
  
  // 入口文件配置
  root: '.',
  build: {
    outDir: 'dist-v2',
    rollupOptions: {
      input: './index.v2.html'
    }
  },
  
  // 开发服务器配置
  server: {
    port: 3002,
    host: 'localhost',
    open: '/index.v2.html',
    strictPort: true,
  },
  
  // 路径别名
  resolve: {
    alias: {
      '@': '/src',
      '@v2': '/src/v2',
      '$src': '/src',
      'src': '/src',
    },
  },
  
  // CSS 配置
  css: {
    postcss: './postcss.config.js',
  },
  
  // 定义全局变量
  define: {
    __VERSION__: JSON.stringify('2.0.0'),
    __COMMIT_HASH__: JSON.stringify('dev'),
  },
}); 