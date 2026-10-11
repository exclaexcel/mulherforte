import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "e2e/.auth/user.json";

/**
 * Loga com a conta de teste dedicada e salva a sessão (cookies) pra reutilizar nos
 * outros testes — evita logar de novo a cada arquivo. Falha cedo e com mensagem
 * clara se as variáveis de ambiente não estiverem configuradas (ver e2e/README.md).
 */
setup("autenticar com a conta de teste", async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const senha = process.env.E2E_TEST_PASSWORD;

  if (!email || !senha) {
    throw new Error(
      "E2E_TEST_EMAIL / E2E_TEST_PASSWORD não configuradas. Veja e2e/README.md — " +
        "nunca use a conta real aqui."
    );
  }

  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", senha);
  await page.click('button[type="submit"]');

  // O redirect pós-login demora alguns segundos em dev (compilação sob demanda) —
  // esperar a Home de verdade em vez de um timeout fixo.
  await expect(page).toHaveURL("/", { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
