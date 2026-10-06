import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

import { ControleAgua } from "./controle-agua";

const INCREMENTOS = [
  { label: "+200ml", value: 200 },
  { label: "Copo (250ml)", value: 250 },
];

describe("ControleAgua — estado inicial", () => {
  const html = renderToStaticMarkup(
    <ControleAgua
      incrementos={INCREMENTOS}
      acaoIncremento={async () => ({ ok: true, destino: "/fisico/habitos" })}
      acaoAjuste={async () => ({ ok: true, destino: "/fisico/habitos" })}
      quantidadeAtualMl={750}
    />
  );

  it("mostra os incrementos com rótulo legível", () => {
    expect(html).toContain("+200ml");
    expect(html).toContain("Copo (250ml)");
  });

  it("mantém o ajuste manual com o total atual", () => {
    expect(html).toContain("Ajustar manualmente");
    expect(html).toContain('value="750"');
  });

  it("não mostra alerta nem bloqueio antes de qualquer envio", () => {
    expect(html).not.toContain('role="alert"');
    expect(html).not.toMatch(/ disabled=""/);
  });
});
