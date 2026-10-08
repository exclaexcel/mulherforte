import { describe, expect, it } from "vitest";
import { agruparMedidasPorDia } from "./historicoMedidas";

describe("agruparMedidasPorDia", () => {
  it("junta linhas da mesma data em um registro só", () => {
    const registros = agruparMedidasPorDia([
      { data: "2026-10-06", regiao: "cintura", valorCm: 77 },
      { data: "2026-10-06", regiao: "quadril", valorCm: 96 },
    ]);

    expect(registros).toEqual([
      { data: "2026-10-06", valoresPorRegiao: { cintura: 77, quadril: 96 } },
    ]);
  });

  it("datas diferentes geram registros diferentes", () => {
    const registros = agruparMedidasPorDia([
      { data: "2026-10-06", regiao: "cintura", valorCm: 77 },
      { data: "2026-09-06", regiao: "cintura", valorCm: 80 },
    ]);

    expect(registros).toHaveLength(2);
  });

  it("lista vazia: nenhum registro", () => {
    expect(agruparMedidasPorDia([])).toEqual([]);
  });
});
