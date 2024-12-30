import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import fs from 'fs-extra'

// 自定义插件：复制静态文件
const copyManifest = () => {
  return {
    name: 'copy-manifest',
    writeBundle() {
      // 复制 manifest.json
      fs.copySync('public/manifest.json', 'dist/manifest.json')
      
      // 复制 background.js
      fs.copySync('public/background.js', 'dist/background.js')
      
      // 复制图标
      fs.ensureDirSync('dist/icons')
      fs.copySync('public/icons', 'dist/icons')
    }
  }
}

export default defineConfig({
  plugins: [react(), copyManifest()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './')
    }
  }
}) 