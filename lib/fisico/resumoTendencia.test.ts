import { describe, expect, it } from "vitest";
import { resumoTendencia } from "./resumoTendencia";
import type { PontoTendenciaPeso } from "./tendenciaPeso";

function ponto(overrides: Partial<PontoTendenciaPeso> = {}): PontoTendenciaPeso {
  return {
    data: "2026-10-05",
    pesoKg: 58.1,
    mediaMovel7d: 58.4,
    quantidadeRegistros7d: 4,
    janela7dCompleta: true,
    mediaMovel28d: 59.0,
    quantidadeRegistros28d: 12,
    janela28dCompleta: true,
    ...overrides,
  };
}

describe("resumoTendencia — usa só os valores já calculados", () => {
  it("sem pontos: nenhum valor, nem zero", () => {
    expect(resumoTendencia([])).toEqual({
      ultimoPeso: null,
      media7: null,
      media28: null,
      historicoSuficiente: false,
    });
  });

  it("usa o último ponto (o mais recente) como referência", () => {
    const pontos = [
      ponto({ data: "2026-10-01", pesoKg: 60 }),
      ponto({ data: "2026-10-05", pesoKg: 58.1, mediaMovel7d: 58.4 }),
    ];

    const r = resumoTendencia(pontos);

    expect(r.ultimoPeso).toEqual({ pesoKg: 58.1, data: "2026-10-05" });
    expect(r.media7).toMatchObject({ valorKg: 58.4 });
  });

  it("janela completa e quantidade de pesagens vêm do ponto, sem recalcular", () => {
    const r = resumoTendencia([ponto({ quantidadeRegistros7d: 5, quantidadeRegistros28d: 14 })]);

    expect(r.media7).toEqual({ valorKg: 58.4, pesagens: 5, janelaCompleta: true });
    expect(r.media28).toEqual({ valorKg: 59, pesagens: 14, janelaCompleta: true });
  });

  it("janela parcial é sinalizada, sem esconder a média", () => {
    const r = resumoTendencia([ponto({ janela7dCompleta: false, quantidadeRegistros7d: 2 })]);

    expect(r.media7).toMatchObject({ janelaCompleta: false, pesagens: 2 });
  });

  it("um único ponto não é histórico suficiente para tendência", () => {
    expect(resumoTendencia([ponto()]).historicoSuficiente).toBe(false);
    expect(resumoTendencia([ponto(), ponto({ data: "2026-10-06" })]).historicoSuficiente).toBe(true);
  });

  it("não traz previsão nem campo de meta", () => {
    const r = resumoTendencia([ponto()]);

    expect(Object.keys(r).sort()).toEqual(["historicoSuficiente", "media28", "media7", "ultimoPeso"]);
  });
});
