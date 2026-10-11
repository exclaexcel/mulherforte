import { describe, expect, it } from "vitest";
import {
  listarMesesComDescarte,
  ordenarDescartados,
  resumoDescartes,
  resumoMensal,
  type ItemDescartado,
  type PreparoParaResumo,
} from "./descartes";

describe("resumoDescartes", () => {
  it("sem preparos: tudo zerado, sem NaN", () => {
    const resumo = resumoDescartes([]);

    expect(resumo.totalDescartado).toBe(0);
    expect(resumo.porMotivo).toEqual([
      { motivo: "vencido", quantidade: 0, percentual: 0 },
      { motivo: "estragado", quantidade: 0, percentual: 0 },
      { motivo: "outro", quantidade: 0, percentual: 0 },
    ]);
    expect(resumo.porReceita).toEqual([]);
  });

  it("conta e calcula percentual por motivo só sobre os descartados", () => {
    const preparos: PreparoParaResumo[] = [
      { receitaNome: "A", status: "descartado", motivoDescarte: "vencido" },
      { receitaNome: "A", status: "descartado", motivoDescarte: "vencido" },
      { receitaNome: "A", status: "descartado", motivoDescarte: "estragado" },
      { receitaNome: "A", status: "congelado", motivoDescarte: null },
    ];

    const resumo = resumoDescartes(preparos);

    expect(resumo.totalDescartado).toBe(3);
    expect(resumo.porMotivo).toEqual([
      { motivo: "vencido", quantidade: 2, percentual: 67 },
      { motivo: "estragado", quantidade: 1, percentual: 33 },
      { motivo: "outro", quantidade: 0, percentual: 0 },
    ]);
  });

  it("taxa por receita considera todos os preparos da receita, não só descartados", () => {
    const preparos: PreparoParaResumo[] = [
      { receitaNome: "Panqueca", status: "descartado", motivoDescarte: "estragado" },
      { receitaNome: "Panqueca", status: "consumido", motivoDescarte: null },
      { receitaNome: "Panqueca", status: "congelado", motivoDescarte: null },
      { receitaNome: "Panqueca", status: "congelado", motivoDescarte: null },
      { receitaNome: "Torta", status: "consumido", motivoDescarte: null },
    ];

    const resumo = resumoDescartes(preparos);

    expect(resumo.porReceita).toEqual([
      { receitaNome: "Panqueca", totalPreparos: 4, descartados: 1, taxaDescarte: 25 },
      { receitaNome: "Torta", totalPreparos: 1, descartados: 0, taxaDescarte: 0 },
    ]);
  });

  it("ordena por receita por taxa de descarte, maior primeiro; empate por nome", () => {
    const preparos: PreparoParaResumo[] = [
      { receitaNome: "Zebra", status: "descartado", motivoDescarte: "outro" },
      { receitaNome: "Abacate", status: "descartado", motivoDescarte: "outro" },
      { receitaNome: "Sempre boa", status: "consumido", motivoDescarte: null },
    ];

    const resumo = resumoDescartes(preparos);

    expect(resumo.porReceita.map((r) => r.receitaNome)).toEqual(["Abacate", "Zebra", "Sempre boa"]);
  });
});

describe("ordenarDescartados", () => {
  it("mais recente primeiro; empate por nome da receita", () => {
    const itens: ItemDescartado[] = [
      { receitaNome: "B", dataPreparo: "2026-10-01", dataDescarte: "2026-10-05", motivo: "vencido", quantidadePorcoes: 1 },
      { receitaNome: "A", dataPreparo: "2026-10-02", dataDescarte: "2026-10-05", motivo: "outro", quantidadePorcoes: 2 },
      { receitaNome: "C", dataPreparo: "2026-09-20", dataDescarte: "2026-09-25", motivo: "estragado", quantidadePorcoes: 1 },
    ];

    expect(ordenarDescartados(itens).map((i) => i.receitaNome)).toEqual(["A", "B", "C"]);
  });
});

describe("listarMesesComDescarte", () => {
  it("sem itens: lista vazia", () => {
    expect(listarMesesComDescarte([])).toEqual([]);
  });

  it("meses únicos, mais recente primeiro", () => {
    const itens: ItemDescartado[] = [
      { receitaNome: "A", dataPreparo: "2026-09-01", dataDescarte: "2026-09-05", motivo: "vencido", quantidadePorcoes: 1 },
      { receitaNome: "B", dataPreparo: "2026-10-01", dataDescarte: "2026-10-03", motivo: "outro", quantidadePorcoes: 1 },
      { receitaNome: "C", dataPreparo: "2026-10-10", dataDescarte: "2026-10-12", motivo: "outro", quantidadePorcoes: 1 },
    ];

    expect(listarMesesComDescarte(itens)).toEqual(["2026-10", "2026-09"]);
  });
});

describe("resumoMensal", () => {
  it("mês sem descarte: tudo zerado/null, sem NaN", () => {
    const resumo = resumoMensal([], "2026-10");

    expect(resumo).toEqual({
      mes: "2026-10",
      totalPorcoesPerdidas: 0,
      receitaMaisDescartada: null,
      motivoPredominante: null,
    });
  });

  it("soma porções, acha receita e motivo predominantes, só do mês pedido", () => {
    const itens: ItemDescartado[] = [
      { receitaNome: "Panqueca", dataPreparo: "2026-10-01", dataDescarte: "2026-10-05", motivo: "vencido", quantidadePorcoes: 2 },
      { receitaNome: "Panqueca", dataPreparo: "2026-10-08", dataDescarte: "2026-10-10", motivo: "vencido", quantidadePorcoes: 1 },
      { receitaNome: "Torta", dataPreparo: "2026-10-12", dataDescarte: "2026-10-15", motivo: "estragado", quantidadePorcoes: 3 },
      // mês diferente, não deve entrar na conta de outubro
      { receitaNome: "Sopa", dataPreparo: "2026-09-01", dataDescarte: "2026-09-05", motivo: "outro", quantidadePorcoes: 5 },
    ];

    const resumo = resumoMensal(itens, "2026-10");

    expect(resumo.totalPorcoesPerdidas).toBe(6);
    expect(resumo.receitaMaisDescartada).toEqual({ nome: "Panqueca", quantidade: 2 });
    expect(resumo.motivoPredominante).toEqual({ motivo: "vencido", quantidade: 2 });
  });

  it("empate de receita: desempata por nome", () => {
    const itens: ItemDescartado[] = [
      { receitaNome: "Zebra", dataPreparo: "2026-10-01", dataDescarte: "2026-10-05", motivo: "outro", quantidadePorcoes: 1 },
      { receitaNome: "Abacate", dataPreparo: "2026-10-02", dataDescarte: "2026-10-06", motivo: "outro", quantidadePorcoes: 1 },
    ];

    expect(resumoMensal(itens, "2026-10").receitaMaisDescartada).toEqual({ nome: "Abacate", quantidade: 1 });
  });
});
