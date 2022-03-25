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
  resolve: {
    alias: {
      '@packages': resolve('./packages'),
    },
  },
})
