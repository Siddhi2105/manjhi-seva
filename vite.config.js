import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 2000,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Manjhi Seva",
        short_name: "ManjhiSeva",
        description: "Healthcare and NGO Management Platform",
        theme_color: "#2b7cff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});