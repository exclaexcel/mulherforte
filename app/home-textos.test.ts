import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const fonteHome = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");

describe("Home (app/page.tsx)", () => {
  it("não cita quantidade fixa de receitas do guia", () => {
    expect(fonteHome).not.toMatch(/\b\d+\s+receitas/i);
  });

  it("descreve a biblioteca de receitas sem número", () => {
    expect(fonteHome).toContain("Acesse sua biblioteca de receitas para planejar as marmitas.");
  });
});

/** Luminância relativa WCAG 2.x de um hex, para razão de contraste. */
function razaoContraste(a: string, b: string) {
  const lum = (h: string) => {
    const canais = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const [r, g, b2] = canais.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe("abas da Home (components/home-tabs.tsx)", () => {
  const fonteAbas = readFileSync(join(process.cwd(), "components", "home-tabs.tsx"), "utf8");

  it("aba inativa usa stone-600 e não stone-500", () => {
    expect(fonteAbas).toContain('inativa: "bg-stone-100 text-stone-600 border border-stone-200"');
    expect(fonteAbas).not.toContain("inativa: \"bg-stone-100 text-stone-500");
  });

  it("texto stone-600 sobre stone-100 atinge 4,5:1", () => {
    expect(razaoContraste("#57534E", "#F5F5F4")).toBeGreaterThanOrEqual(4.5);
  });
});
