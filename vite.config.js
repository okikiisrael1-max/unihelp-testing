import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['buffer'],
      globals: {
        Buffer: true,
      },
    }),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      strategies: "generateSW",
      includeAssets: [
        "apple-touch-icon.png",
        "favicon.png",
        "logo.png",
        "pwa-192.png",
        "pwa-512.png",
      ],
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: "UniHelp",
        short_name: "UniHelp",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        theme_color: "#0f172a",
        background_color: "#0b0f1a",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      apple: {
        icon: "/apple-touch-icon.png",
        statusBarStyle: "black-translucent",
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
            "recharts"
          ],
          plotly: [
            "plotly.js",
            "react-plotly.js"
          ],
          mathjs: [
            "mathjs"
          ],
          icons: [
            "lucide-react",
            "react-icons"
          ]
        },
      },
    },
  },
});
