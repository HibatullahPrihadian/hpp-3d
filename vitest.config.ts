import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@hpp/shared": resolve(here, "shared/src/index.ts"),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  ssr: {
    external: ["node:sqlite"],
  },
  test: {
    include: [
      "shared/src/**/*.test.ts",
      "server/src/**/*.test.ts",
      "client/src/**/*.test.ts",
      "client/src/**/*.test.tsx",
    ],
    environment: "node",
    server: {
      deps: {
        external: ["node:sqlite"],
      },
    },
  },
});
