import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, cpSync, readFileSync, writeFileSync } from 'fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

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

        // Copy bridge.js and obfuscate
        let bridgeScript = readFileSync(
          resolve(__dirname, 'public/content/bridge.js'),
          'utf-8'
        );
        const obfuscatedBridge = JavaScriptObfuscator.obfuscate(bridgeScript, {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.5,
          deadCodeInjection: false,
          stringArray: true,
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false,
        });
        writeFileSync(resolve(contentDir, 'bridge.js'), obfuscatedBridge.getObfuscatedCode());

        // Copy and patch content script, then obfuscate
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
        
        // Obfuscate content script
        const obfuscatedContent = JavaScriptObfuscator.obfuscate(contentScript, {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.5,
          deadCodeInjection: false,
          stringArray: true,
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false,
        });
        writeFileSync(resolve(contentDir, 'content.js'), obfuscatedContent.getObfuscatedCode());
        
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
