import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages 部署时的仓库名
  base: '/mediakit/',
  build: {
    outDir: 'dist',
    // 启用 CSS 代码分割
    cssCodeSplit: false,
    // 生产环境构建报告
    reportCompressedSize: true,
  },
  server: {
    port: 3000,
    open: true,
  },
})
