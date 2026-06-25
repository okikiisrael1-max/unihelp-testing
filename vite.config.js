import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

import tailwindcss from "@tailwindcss/vite";

import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/

export default defineConfig({
  plugins: [
    react(),

    tailwindcss(),

    VitePWA({
      registerType:
        "autoUpdate",

      injectRegister:
        "auto",

      strategies:
        "generateSW",

      workbox: {
        clientsClaim: true,

        skipWaiting: true,

        cleanupOutdatedCaches:
          true,

        // FIX BUILD ERROR
        maximumFileSizeToCacheInBytes:
          10 * 1024 * 1024,
      },

      devOptions: {
        enabled: true,
      },

      manifest: {
        name: "UniHelp",

        short_name:
          "UniHelp",

        start_url:
          "/dashboard?v=2",

        display:
          "standalone",

        theme_color:
          "#000000",

        background_color:
          "#000000",

        icons: [
          {
            src: "/favicon.png",

            sizes:
              "192x192",

            type: "image/png",
          },

          {
            src: "/favicon.png",

            sizes:
              "512x512",

            type: "image/png",
          },
        ],
      },
    }),
  ],

  server: {
    headers: {
      "Cross-Origin-Opener-Policy":
        "same-origin-allow-popups",
    },
  },

  // IMPORTANT PERFORMANCE FIX
  build: {
    chunkSizeWarningLimit:
      2000,

    rollupOptions: {
      output: {
        manualChunks: {
          react: [
            "react",
            "react-dom",
            "react-router-dom",
          ],

          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
          ],

          pdf: [
            "pdfjs-dist",
          ],

          math: [
            "katex",
            "react-katex",
          ],

          charts: [
            "chart.js",
            "react-chartjs-2",
          ],
        },
      },
    },
  },
});