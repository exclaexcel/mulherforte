import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // Mesmo runtime de JSX do Next (automático), para testar componentes .tsx.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
    // e2e/ são testes do Playwright (outro runner, outra API) — nunca do Vitest.
    exclude: ["**/node_modules/**", "**/e2e/**"],
  },
});
