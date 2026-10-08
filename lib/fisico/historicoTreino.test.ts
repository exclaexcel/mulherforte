import { describe, expect, it } from "vitest";
import { agruparTreinosPorSemana, classificarTreino, type RegistroTreino } from "./historicoTreino";

function treino(parcial: Partial<RegistroTreino> & { data: string }): RegistroTreino {
  return {
    tipo: "moves",
    tipoOutroDescricao: null,
    realizado: true,
    duracaoMinutos: null,
    calorias: null,
    ...parcial,
  };
}

describe("classificarTreino", () => {
  // 2026-09-28 é segunda-feira: Move's obrigatório no calendário fixo.
  it("obrigatório e realizado: obrigatorio_cumprido", () => {
    expect(classificarTreino({ data: "2026-09-28", realizado: true })).toBe("obrigatorio_cumprido");
  });

  it("obrigatório e não realizado: obrigatorio_nao_realizado", () => {
    expect(classificarTreino({ data: "2026-09-28", realizado: false })).toBe("obrigatorio_nao_realizado");
  });

  // 2026-10-02 é sexta-feira: sem treino obrigatório no calendário fixo.
  it("fora do calendário fixo e realizado: extra_realizado", () => {
    expect(classificarTreino({ data: "2026-10-02", realizado: true })).toBe("extra_realizado");
  });

  it("fora do calendário fixo e não realizado: nao_realizado", () => {
    expect(classificarTreino({ data: "2026-10-02", realizado: false })).toBe("nao_realizado");
  });
});

describe("agruparTreinosPorSemana", () => {
  it("agrupa por semana (segunda a domingo), semana mais recente primeiro", () => {
    const grupos = agruparTreinosPorSemana([
      treino({ data: "2026-09-24" }), // semana de 21/09 a 27/09
      treino({ data: "2026-10-01" }), // semana de 28/09 a 04/10
      treino({ data: "2026-09-28" }), // semana de 28/09 a 04/10
    ]);

    expect(grupos).toHaveLength(2);
    expect(grupos[0]).toMatchObject({ inicioSemana: "2026-09-28", fimSemana: "2026-10-04" });
    expect(grupos[1]).toMatchObject({ inicioSemana: "2026-09-21", fimSemana: "2026-09-27" });
  });

  it("ordena os registros dentro de cada semana do mais recente pro mais antigo", () => {
    const grupos = agruparTreinosPorSemana([
      treino({ data: "2026-09-28" }),
      treino({ data: "2026-10-01" }),
    ]);

    expect(grupos[0].registros.map((r) => r.data)).toEqual(["2026-10-01", "2026-09-28"]);
  });

  it("lista vazia: nenhum grupo", () => {
    expect(agruparTreinosPorSemana([])).toEqual([]);
  });
});
