import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, cpSync, readFileSync, writeFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-and-patch-extension-assets',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }
        
        // Copy manifest
        copyFileSync(
          resolve(__dirname, 'public/manifest.json'),
          resolve(distDir, 'manifest.json')
        );
        
        // Copy icons folder
        const iconsSource = resolve(__dirname, 'public/icons');
        const iconsDest = resolve(distDir, 'icons');
        if (existsSync(iconsSource)) {
          cpSync(iconsSource, iconsDest, { recursive: true });
        }

        // Copy and patch content scripts
        const contentDir = resolve(distDir, 'content');
        if (!existsSync(contentDir)) {
          mkdirSync(contentDir, { recursive: true });
        }

        // Copy bridge.js as-is (no obfuscation per Chrome Web Store policy)
        copyFileSync(
          resolve(__dirname, 'public/content/bridge.js'),
          resolve(contentDir, 'bridge.js')
        );

        // Copy and patch content script (no obfuscation per Chrome Web Store policy)
        let contentScript = readFileSync(
          resolve(__dirname, 'shopee-stats.js'),
          'utf-8'
        );
        
        // Replace chrome.runtime with window.postMessage
        contentScript = contentScript
          .replace(/chrome\.runtime\.sendMessage\({/g, 'window.postMessage({')
          .replace(/type: 'progress'/g, "type: 'SHOPEE_STATS_PROGRESS'")
          .replace(/type: 'complete'/g, "type: 'SHOPEE_STATS_COMPLETE'")
          .replace(/type: 'error'/g, "type: 'SHOPEE_STATS_ERROR'");
        
        writeFileSync(resolve(contentDir, 'content.js'), contentScript);
        
        console.log('✅ Extension assets copied and patched successfully');
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.log for debugging
        drop_debugger: true,
        pure_funcs: [], // Remove specific functions if needed
      },
      mangle: {
        toplevel: true,
        properties: false, // Don't mangle properties to avoid breaking chrome APIs
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/pages/popup/index.html'),
      },
      output: {
        manualChunks: undefined, // Don't split chunks for extension
      },
    },
  },
});
