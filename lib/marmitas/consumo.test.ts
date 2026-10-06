import { describe, expect, it } from "vitest";
import {
  CONFIRMACAO_CONSUMO,
  CONFIRMACAO_CONSUMO_PRAZO_ENCERRADO,
  textoConfirmacaoConsumo,
} from "./consumo";

describe("textoConfirmacaoConsumo", () => {
  it("prazo encerrado usa a confirmação específica", () => {
    expect(textoConfirmacaoConsumo("vencido")).toBe(CONFIRMACAO_CONSUMO_PRAZO_ENCERRADO);
  });

  it("prazo que termina hoje ainda não está encerrado", () => {
    expect(textoConfirmacaoConsumo("vence_hoje")).toBe(CONFIRMACAO_CONSUMO);
  });

  it("dentro do prazo e sem prazo informado usam a confirmação padrão", () => {
    expect(textoConfirmacaoConsumo("dentro")).toBe(CONFIRMACAO_CONSUMO);
    expect(textoConfirmacaoConsumo("nao_informada")).toBe(CONFIRMACAO_CONSUMO);
  });

  it("linguagem neutra: não recomenda consumir nem descartar", () => {
    for (const texto of [CONFIRMACAO_CONSUMO, CONFIRMACAO_CONSUMO_PRAZO_ENCERRADO]) {
      expect(texto.toLowerCase()).not.toMatch(/descart|recomend|aconselh|deve comer/);
    }
  });
});
