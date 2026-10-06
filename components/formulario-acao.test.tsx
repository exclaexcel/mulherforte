import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BotaoEnvio, MensagemFormulario } from "./formulario-acao";

describe("MensagemFormulario", () => {
  it("erro usa role=alert e texto visível, sem depender só da cor", () => {
    const html = renderToStaticMarkup(<MensagemFormulario erro="Informe o nome da receita." sucesso={null} />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("Informe o nome da receita.");
  });

  it("sucesso usa role=status", () => {
    const html = renderToStaticMarkup(<MensagemFormulario erro={null} sucesso="Item adicionado à lista." />);

    expect(html).toContain('role="status"');
    expect(html).toContain("Item adicionado à lista.");
  });

  it("sem erro nem sucesso não renderiza nada", () => {
    expect(renderToStaticMarkup(<MensagemFormulario erro={null} sucesso={null} />)).toBe("");
  });
});

describe("BotaoEnvio", () => {
  it("enquanto envia: desabilitado, aria-disabled e texto de progresso visível", () => {
    const html = renderToStaticMarkup(
      <BotaoEnvio enviando rotulo="Salvar receita" rotuloEnviando="Salvando receita…" />
    );

    expect(html).toMatch(/ disabled=""/);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("Salvando receita…");
    expect(html).not.toContain("Salvar receita<");
  });

  it("fora do envio: habilitado com o rótulo normal", () => {
    const html = renderToStaticMarkup(
      <BotaoEnvio enviando={false} rotulo="Salvar receita" rotuloEnviando="Salvando receita…" />
    );

    expect(html).not.toMatch(/ disabled=""/);
    expect(html).toContain("Salvar receita");
  });
});
