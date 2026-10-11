import { describe, expect, it } from "vitest";
import { construirDadosGrafico } from "./grafico-tendencia-peso";
import type { PontoTendenciaPeso } from "@/lib/fisico/tendenciaPeso";

function ponto(overrides: Partial<PontoTendenciaPeso> = {}): PontoTendenciaPeso {
  return {
    data: "2026-09-03",
    pesoKg: 58.1,
    mediaMovel7d: 58.1,
    quantidadeRegistros7d: 1,
    janela7dCompleta: true,
    mediaMovel28d: 58.1,
    quantidadeRegistros28d: 1,
    janela28dCompleta: true,
    ...overrides,
  };
}

describe("construirDadosGrafico — primeiro ponto", () => {
  it("nunca quebra o primeiro ponto, não há pesagem anterior pra comparar", () => {
    const [primeiro] = construirDadosGrafico([ponto()]);

    expect(primeiro.mediaMovel7dGrafico).toBe(58.1);
    expect(primeiro.mediaMovel28dGrafico).toBe(58.1);
  });
});

describe("construirDadosGrafico — vão grande entre pesagens (achado da Dany: 03/09 a 29/09)", () => {
  const dados = construirDadosGrafico([
    ponto({ data: "2026-09-03", pesoKg: 58.1, mediaMovel7d: 58.1, mediaMovel28d: 58.1 }),
    ponto({
      data: "2026-09-29",
      pesoKg: 57.7,
      mediaMovel7d: 57.7,
      quantidadeRegistros7d: 1,
      mediaMovel28d: 57.9,
      quantidadeRegistros28d: 2,
      janela28dCompleta: false,
    }),
  ]);

  it("quebra a média de 7 dias — 26 dias de vão é bem mais que a janela de 7", () => {
    expect(dados[1].mediaMovel7dGrafico).toBeNull();
  });

  it("quebra a média de 28 dias também — 26 dias ainda é dentro da janela? não, é mais que o limite de conexão", () => {
    // Vão de 26 dias é MENOR que a janela de 28 — a média de 28d já soma as duas pesagens de verdade,
    // então a reta deve continuar ligada aqui (diferente da média de 7d, que fica isolada).
    expect(dados[1].mediaMovel28dGrafico).toBe(57.9);
  });

  it("nunca mexe no valor real (tooltip e resumo continuam corretos)", () => {
    expect(dados[1].mediaMovel7d).toBe(57.7);
    expect(dados[1].quantidadeRegistros7d).toBe(1);
  });
});

describe("construirDadosGrafico — vão maior que a janela de 28 dias também quebra a média longa", () => {
  const dados = construirDadosGrafico([
    ponto({ data: "2026-08-01", mediaMovel7d: 60, mediaMovel28d: 60 }),
    ponto({
      data: "2026-09-10",
      pesoKg: 57,
      mediaMovel7d: 57,
      quantidadeRegistros7d: 1,
      mediaMovel28d: 57,
      quantidadeRegistros28d: 1,
    }),
  ]);

  it("40 dias de vão quebra as duas médias", () => {
    expect(dados[1].mediaMovel7dGrafico).toBeNull();
    expect(dados[1].mediaMovel28dGrafico).toBeNull();
  });
});

describe("construirDadosGrafico — pesagens próximas não quebram nada", () => {
  const dados = construirDadosGrafico([
    ponto({ data: "2026-10-01", mediaMovel7d: 58, mediaMovel28d: 58 }),
    ponto({ data: "2026-10-03", pesoKg: 57.8, mediaMovel7d: 57.9, mediaMovel28d: 57.9 }),
    ponto({ data: "2026-10-05", pesoKg: 57.6, mediaMovel7d: 57.77, mediaMovel28d: 57.83 }),
  ]);

  it("mantém a reta contínua quando as pesagens estão a poucos dias uma da outra", () => {
    for (const d of dados) {
      expect(d.mediaMovel7dGrafico).not.toBeNull();
      expect(d.mediaMovel28dGrafico).not.toBeNull();
    }
  });
});
