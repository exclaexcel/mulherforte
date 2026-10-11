import { test, expect } from "@playwright/test";

test("exportar dados — resumo aparece e o download é gerado", async ({ page }) => {
  await page.goto("/perfil/exportar");

  await expect(page.getByText("O que vai ser exportado")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click('button:has-text("Exportar para Excel")'),
  ]);

  expect(download.suggestedFilename()).toMatch(/\.zip$/);
  await expect(page.getByText("Download iniciado")).toBeVisible();
});
