import { describe, expect, it } from "vitest";
import { agruparPorSemana } from "./historico";

type Registro = { data: string; valor: number };

describe("agruparPorSemana", () => {
  it("agrupa por semana (segunda a domingo), semana mais recente primeiro", () => {
    const grupos = agruparPorSemana<Registro>([
      { data: "2026-09-24", valor: 1 }, // semana de 21/09 a 27/09
      { data: "2026-10-01", valor: 2 }, // semana de 28/09 a 04/10
      { data: "2026-09-28", valor: 3 }, // semana de 28/09 a 04/10
    ]);

    expect(grupos).toHaveLength(2);
    expect(grupos[0]).toMatchObject({ inicioSemana: "2026-09-28", fimSemana: "2026-10-04" });
    expect(grupos[1]).toMatchObject({ inicioSemana: "2026-09-21", fimSemana: "2026-09-27" });
  });

  it("ordena os registros dentro de cada semana do mais recente pro mais antigo", () => {
    const grupos = agruparPorSemana<Registro>([
      { data: "2026-09-28", valor: 1 },
      { data: "2026-10-01", valor: 2 },
    ]);

    expect(grupos[0].registros.map((r) => r.data)).toEqual(["2026-10-01", "2026-09-28"]);
  });

  it("lista vazia: nenhum grupo", () => {
    expect(agruparPorSemana<Registro>([])).toEqual([]);
  });
});
