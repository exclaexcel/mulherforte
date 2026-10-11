import { test, expect, type Page } from "@playwright/test";

test.beforeEach(({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});

/**
 * Garante que o painel está aberto, sem fechá-lo se já estiver — um segundo clique
 * no <summary> alterna (toggle), e o `router.refresh()` do FormularioAcao preserva
 * o estado aberto do <details> entre uma ação e a próxima.
 */
async function garantirPainelAberto(page: Page) {
  const detalhes = page.locator("details", { hasText: "Editar ou excluir um item" });
  if ((await detalhes.getAttribute("open")) === null) {
    await detalhes.locator("summary").click();
  }
}

test("criar, editar (trocar grupo) e excluir um item de compra", async ({ page }) => {
  const item = `E2E Item ${Date.now()}`;

  await page.goto("/marmitas/compras");
  await page.getByText("+ Novo item").click();
  await page.selectOption("#grupo", "despensa");
  await page.fill("#item", item);
  await page.click('button:has-text("Salvar item")');

  await expect(page.getByText("Item adicionado à lista.")).toBeVisible();
  await expect(page.locator("li").getByText(item, { exact: false })).toBeVisible();

  // Editar: trocar nome e grupo — label da option é "<Grupo>: <item>" (sem data, string fixa)
  await garantirPainelAberto(page);
  await page.selectOption("#selecionar-item-correcao", { label: `Despensa: ${item}` });

  const itemEditado = `${item} (editado)`;
  await page.fill("#item-correcao", itemEditado);
  await page.selectOption("#grupo-correcao", "vegetais");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();

  await expect(page.getByText("Item atualizado.")).toBeVisible();
  await expect(page.locator("li").getByText(itemEditado, { exact: false })).toBeVisible();

  // Excluir — agora no grupo "Vegetais", trocado no passo anterior
  await garantirPainelAberto(page);
  await page.selectOption("#selecionar-item-correcao", { label: `Vegetais: ${itemEditado}` });
  await page.getByRole("button", { name: "Excluir item" }).click();

  await expect(page.getByText("Item excluído.")).toBeVisible();
  await expect(page.locator("li").getByText(itemEditado, { exact: false })).not.toBeVisible();
});
