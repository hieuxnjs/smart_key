import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Bổ sung dòng này để cho phép tên miền Ngrok truy cập
    allowedHosts: ["scolding-setback-gladly.ngrok-free.dev"],

    // Giữ nguyên đoạn cấu hình proxy bên dưới của bạn (nếu có)
    proxy: {
      "/api": {
        target: "http://backend:5000",
        changeOrigin: true,
      },
    },
  },
});
