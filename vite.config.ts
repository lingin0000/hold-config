import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 8777,
    strictPort: true,watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库分离到单独的 chunk
          react: ["react", "react-dom"],
          // 将其他第三方库分离
          vendor: ["@tauri-apps/api"],
        },
      },
    },
    // 调整警告阈值
    chunkSizeWarningLimit: 1000,
  },
});
