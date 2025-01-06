import path from "path";
import * as url from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const dirname = url.fileURLToPath(new URL(".", import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  base: "/v2/",

  server: {
    host: true,
    port: 8101,
  },

  resolve: {
    alias: {
      "@fa-kit": "@awesome.me/kit-c1c3245051",
      "@": path.resolve(dirname, "src"),
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/breakpoints.scss" as *;`,
      },
    },
  },
});
