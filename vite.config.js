import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.REPO_NAME || "/repo-name/",
  plugins: [
    /**
     * We're using `SharedArrayBuffer`s in our code,
     * which requires either HTTPS or localhost, and it requires cross origin isolation.
     * So we're enabling the CORS headers here for development mode.
     */
    {
      // Plugin code is from https://github.com/chaosprint/vite-plugin-cross-origin-isolation
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ],
});
