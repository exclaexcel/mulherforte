import { test, expect } from "@playwright/test";

test.beforeEach(({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});

test("criar, editar e excluir uma receita", async ({ page }) => {
  const nome = `E2E Receita ${Date.now()}`;

  await page.goto("/marmitas/receitas/nova");
  await page.fill("#nome", nome);
  await page.selectOption("#categoria", "jantar");
  await page.click('button:has-text("Salvar receita")');

  await expect(page).toHaveURL(/\/marmitas\/receitas/);
  const card = page.locator("li", { hasText: nome });
  await expect(card.getByText(nome, { exact: true })).toBeVisible();

  // Editar: abre o card, segue pro formulário de edição, muda o nome
  await card.getByText(nome, { exact: true }).click();
  await card.getByRole("link", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/marmitas\/receitas\/.+\/editar/);

  const nomeEditado = `${nome} (editada)`;
  await page.fill("#nome", nomeEditado);
  await page.click('button:has-text("Salvar alterações")');

  await expect(page).toHaveURL(/\/marmitas\/receitas/);
  const cardEditado = page.locator("li", { hasText: nomeEditado });
  await expect(cardEditado.getByText(nomeEditado, { exact: true })).toBeVisible();

  // Excluir — a exclusão pela lista não mostra banner (só a da tela de editar, via
  // destinoSucesso); o sinal real de sucesso é o card sumir da lista.
  await cardEditado.getByText(nomeEditado, { exact: true }).click();
  await cardEditado.getByRole("button", { name: "Excluir", exact: true }).click();

  await expect(page.getByText(nomeEditado, { exact: true })).not.toBeVisible();
});
