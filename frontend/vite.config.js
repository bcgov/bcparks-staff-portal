import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  base: "/v2/",

  server: {
    host: true,
    port: 8101,
  },
});
