import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import ErroGlobal from "./error";
import PaginaNaoEncontrada from "./not-found";

describe("tela de erro global (app/error.tsx)", () => {
  const html = renderToStaticMarkup(<ErroGlobal reset={() => {}} />);

  it("texto em português com cabeçalho de nível 1", () => {
    expect(html).toContain("<h1");
    expect(html).toContain("Não foi possível abrir esta tela");
  });

  it("oferece nova tentativa como botão de verdade", () => {
    expect(html).toContain("<button");
    expect(html).toContain("Tentar novamente");
  });

  it("tem link para a Home", () => {
    expect(html).toContain('href="/"');
    expect(html).toContain("Voltar para o início");
  });

  it("não mostra detalhe técnico, mesmo que venha no erro", () => {
    const comErro = renderToStaticMarkup(<ErroGlobal reset={() => {}} />);
    expect(comErro.toLowerCase()).not.toMatch(/digest|stack|supabase|postgres|error:|pg_/);
  });

  it("o título recebe foco pelo código (tabIndex -1, não tabulável)", () => {
    expect(html).toContain('tabindex="-1"');
  });
});

describe("página 404 (app/not-found.tsx)", () => {
  const html = renderToStaticMarkup(<PaginaNaoEncontrada />);

  it("texto em português com cabeçalho de nível 1", () => {
    expect(html).toContain("<h1");
    expect(html).toContain("Página não encontrada");
  });

  it("tem link para a Home", () => {
    expect(html).toContain('href="/"');
    expect(html).toContain("Voltar para o início");
  });

  it("não expõe o caminho pedido nem detalhe técnico", () => {
    expect(html.toLowerCase()).not.toMatch(/stack|digest|supabase|pg_/);
  });
});
