import { test, expect } from "@playwright/test";

function ontemISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

test("registrar peso e corrigir um dia passado a partir do histórico", async ({ page }) => {
  const ontem = ontemISO();

  // Semeia um registro de ontem direto pelo formulário (upsert por data).
  await page.goto("/fisico/peso");
  await page.fill("#data", ontem);
  await page.fill("#peso_kg", "60.0");
  await page.click('button:has-text("Registrar peso")');
  await expect(page.getByText("Peso salvo.")).toBeVisible();

  // Corrigir via histórico: achar o dia de ontem e editar.
  await page.goto("/fisico/historico?aba=peso");
  const card = page.locator("li", { hasText: "60kg" }).first();
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: "Editar" }).click();

  await expect(page.getByText(/Corrigindo o peso de/)).toBeVisible();
  await page.fill("#peso_kg", "61.5");
  await page.click('button:has-text("Salvar correção")');

  await expect(page).toHaveURL(/\/fisico\/historico/);
  await expect(page.getByText("Peso corrigido!")).toBeVisible();
  await expect(page.getByText("61,5kg")).toBeVisible();
});
