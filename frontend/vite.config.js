import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Cho phép tất cả host để hỗ trợ ngrok và truy cập từ xa
    allowedHosts: true,

    // Giữ nguyên đoạn cấu hình proxy bên dưới của bạn (nếu có)
    proxy: {
      "/api": {
        target: "http://backend:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://backend:5000",
        ws: true,
      },
    },
  },
});
