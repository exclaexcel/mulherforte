import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // Mesmo runtime de JSX do Next (automático), para testar componentes .tsx.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
  },
});
