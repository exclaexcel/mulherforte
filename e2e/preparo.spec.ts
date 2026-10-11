import { test, expect } from "@playwright/test";

test.beforeEach(({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});

test("registrar preparo, corrigir e marcar como consumido", async ({ page }) => {
  const nomeReceita = `E2E Preparo ${Date.now()}`;

  // Pré-condição: precisa de uma receita pra escolher no formulário de preparo.
  await page.goto("/marmitas/receitas/nova");
  await page.fill("#nome", nomeReceita);
  await page.click('button:has-text("Salvar receita")');
  await expect(
    page.locator("li", { hasText: nomeReceita }).getByText(nomeReceita, { exact: true })
  ).toBeVisible();

  await page.goto("/marmitas/preparo");
  await page.selectOption("#receita_id", { label: nomeReceita });
  await page.fill("#quantidade_porcoes", "3");
  await page.click('button:has-text("Registrar preparo")');

  await expect(page).toHaveURL(/\/marmitas\/estoque/);
  const item = page.locator("li", { hasText: nomeReceita });
  await expect(item.getByText(nomeReceita, { exact: true })).toBeVisible();

  // Corrigir: via "Editar ou excluir um preparo" — lê o value real da <option> (o
  // label completo inclui a data, que varia por fuso; selectOption não aceita RegExp).
  await page.getByText("Editar ou excluir um preparo").click();
  const valorOpcao = await page
    .locator("#selecionar-preparo-correcao option", { hasText: nomeReceita })
    .getAttribute("value");
  await page.selectOption("#selecionar-preparo-correcao", valorOpcao!);
  await page.fill("#quantidade_porcoes-correcao", "5");
  await page.click('button:has-text("Salvar correção")');

  await expect(page.getByText("Preparo corrigido.")).toBeVisible();

  // Marcar como consumido: some da lista do estoque — único sinal real de sucesso
  // (a action não navega nem mostra banner, só atualiza a lista).
  await item.getByRole("button", { name: "Marcar como consumido" }).click();

  await expect(page).toHaveURL(/\/marmitas\/estoque/);
  await expect(page.locator("li", { hasText: nomeReceita })).toHaveCount(0);
});
