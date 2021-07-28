import path from 'path'
import { defineConfig } from 'vite'
import eslintPlugin from 'vite-plugin-eslint'
import reactRefresh from '@vitejs/plugin-react-refresh'

function resolve(relativePath: string) {
  return path.resolve(__dirname, relativePath)
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRefresh(),
    eslintPlugin({
      fix: true,
      include: ['{packages|example|tests}/**/*.{js|jsx|ts|tsx}'],
      exclude: ['node_modules', 'dist', 'dist-ssr', 'reducer-mapper'],
    }),
  ],
  // 构建
  build: {
    outDir: resolve('./dist'),
    lib: {
      entry: resolve('packages/index.ts'),
      // 暴露的全局变量
      name: 'ReactUseMethods',
      formats: ['es', 'umd'],
      // 打包后的文件名
      fileName: 'react-use-methods',
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['React'],
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          React: 'React',
        },
      },
    },
  },
  resolve: {
    alias: {
      '@packages': resolve('./packages'),
    },
  },
})
