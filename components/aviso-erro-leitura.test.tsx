import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AvisoErroLeitura } from "./aviso-erro-leitura";
import { MENSAGEM_ERRO_LEITURA } from "@/lib/leitura";

describe("AvisoErroLeitura", () => {
  const html = renderToStaticMarkup(<AvisoErroLeitura novaTentativaHref="/fisico/score" />);

  it("anuncia a falha com role=alert e texto visível", () => {
    expect(html).toContain('role="alert"');
    expect(html).toContain(MENSAGEM_ERRO_LEITURA);
  });

  it("oferece nova tentativa para a própria página e volta à Home", () => {
    expect(html).toContain('href="/fisico/score"');
    expect(html).toContain("Tentar novamente");
    expect(html).toContain('href="/"');
  });

  it("não expõe detalhe técnico nem nome de tabela", () => {
    expect(html.toLowerCase()).not.toMatch(/supabase|postgres|relation|registros_|adesao_|metas</);
  });

  it("não mostra estado vazio, zero ou pedido de cadastro", () => {
    expect(html.toLowerCase()).not.toMatch(/ainda não|nenhum|cadastre|registre|zero/);
  });
});
