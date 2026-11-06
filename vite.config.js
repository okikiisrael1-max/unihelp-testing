import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { canonicalUrl, seoPages } from "./src/assets/data/seoPages.js";

const escapeAttribute = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const replaceMeta = (html, attribute, key, content) => {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"\\s+content="[^"]*"\\s*\\/?>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeAttribute(content)}" />`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace("</head>", `  ${tag}\n  </head>`);
};

const withRouteMetadata = (html, page) => {
  let output = html.replace(/<title>.*?<\/title>/is, `<title>${escapeAttribute(page.title)}</title>`);
  output = replaceMeta(output, "name", "description", page.description);
  output = replaceMeta(output, "name", "robots", "index, follow, max-image-preview:large");
  output = replaceMeta(output, "property", "og:title", page.title);
  output = replaceMeta(output, "property", "og:description", page.description);
  output = replaceMeta(output, "property", "og:url", canonicalUrl(page.path));
  output = replaceMeta(output, "property", "og:image", "https://myunihelp.com.ng/logo.png");
  output = replaceMeta(output, "property", "og:image:alt", "UniHelp logo");
  output = replaceMeta(output, "name", "twitter:card", "summary_large_image");
  output = replaceMeta(output, "name", "twitter:title", page.title);
  output = replaceMeta(output, "name", "twitter:description", page.description);
  output = replaceMeta(output, "name", "twitter:image", "https://myunihelp.com.ng/logo.png");
  output = output.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl(page.path)}" />`);
  const jsonLd = JSON.stringify(page.schema).replaceAll("<", "\\u003c");
  output = output.replace("</head>", `  <script id="unihelp-structured-data" type="application/ld+json">${jsonLd}</script>\n  </head>`);
  return output;
};

const seoHtmlPlugin = () => {
  let outputDir;

  return {
    name: "unihelp-seo-html",
    apply: "build",
    configResolved(config) {
      outputDir = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const sourceHtml = await readFile(resolve(outputDir, "index.html"), "utf8");
      await Promise.all(seoPages.map(async (page) => {
        const outputPath = page.path === "/"
          ? resolve(outputDir, "index.html")
          : resolve(outputDir, page.path.slice(1), "index.html");
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, withRouteMetadata(sourceHtml, page));
      }));
    },
  };
};

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
    seoHtmlPlugin(),
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
