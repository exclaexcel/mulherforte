import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.test.local");
} catch {
  // Arquivo ausente: auth.setup.ts falha com mensagem clara explicando o que falta.
}

/**
 * Roda contra a conta de teste dedicada (e2e-teste@mulherforte.app), nunca a conta
 * real. Credenciais em .env.test.local (fora do Git — ver README dos testes em
 * e2e/README.md). Sem esse arquivo, o setup de autenticação falha com erro claro.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // mesma conta de teste em todos os testes — evitar corrida entre eles
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "html",
  timeout: 45_000,
  // Timeouts folgados de propósito: roda contra `next dev`, que compila cada rota
  // sob demanda na primeira visita — bem mais lento que um build de produção.
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
