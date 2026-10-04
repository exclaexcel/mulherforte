import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  apresentarValidade,
  calcularValidade,
  formatarDataBR,
  ordenarEstoque,
  type ItemEstoque,
} from "./estoque";

const HOJE = "2026-10-04";
const PREPARO = "2026-09-04"; // 30 dias antes de HOJE

/** Preparo em PREPARO com validade informada: vence em PREPARO + validade. */
function comValidade(validade: number) {
  return calcularValidade(PREPARO, validade, HOJE);
}

describe("validade informada: situações", () => {
  it("receita com 30 dias: 30 dias de validade, ainda faltam 0", () => {
    const v = comValidade(30);
    expect(v.dataVencimento).toBe("2026-10-04");
    expect(v.situacao).toBe("vence_hoje");
  });

  it("receita com 60 dias: faltam 30 dias", () => {
    const v = comValidade(60);
    expect(v.diasRestantes).toBe(30);
    expect(v.situacao).toBe("dentro");
  });

  it("receita com 90 dias: faltam 60 dias", () => {
    const v = comValidade(90);
    expect(v.diasRestantes).toBe(60);
    expect(v.situacao).toBe("dentro");
  });

  it("receita com 120 dias: faltam 90 dias", () => {
    const v = comValidade(120);
    expect(v.diasRestantes).toBe(90);
    expect(v.situacao).toBe("dentro");
  });

  it("preparo vencido: data de vencimento já passou", () => {
    const v = calcularValidade("2026-09-01", 10, HOJE);
    expect(v.situacao).toBe("vencido");
    expect(v.diasRestantes).toBeLessThan(0);
  });

  it("preparo que vence hoje", () => {
    expect(calcularValidade("2026-09-04", 30, HOJE).situacao).toBe("vence_hoje");
  });

  it("preparo com 1 dia restante: próximo do vencimento", () => {
    const v = calcularValidade("2026-09-05", 30, HOJE);
    expect(v.diasRestantes).toBe(1);
    expect(v.situacao).toBe("proximo");
  });

  it("preparo com 7 dias restantes: ainda próximo do vencimento", () => {
    const v = calcularValidade("2026-09-11", 30, HOJE);
    expect(v.diasRestantes).toBe(7);
    expect(v.situacao).toBe("proximo");
  });

  it("preparo com 8 dias restantes: dentro da validade", () => {
    const v = calcularValidade("2026-09-12", 30, HOJE);
    expect(v.diasRestantes).toBe(8);
    expect(v.situacao).toBe("dentro");
  });

  it("data de vencimento = data do preparo + validade da receita", () => {
    expect(calcularValidade("2026-09-28", 60, HOJE).dataVencimento).toBe("2026-11-27");
  });
});

describe("validade não informada", () => {
  it("preparo sem validade: situação própria, sem data de vencimento", () => {
    const v = calcularValidade(PREPARO, null, HOJE);
    expect(v).toEqual({ situacao: "nao_informada", dataVencimento: null, diasRestantes: null });
  });

  it("não classifica como vencido, próximo ou dentro quando não há validade", () => {
    const v = calcularValidade("2020-01-01", null, HOJE);
    expect(v.situacao).toBe("nao_informada");
  });

  it("não usa 60 nem 90 dias como padrão: sem validade não há vencimento, mesmo com preparo antigo", () => {
    const antigo = calcularValidade("2025-01-01", null, HOJE);
    expect(antigo.dataVencimento).toBeNull();
    expect(antigo.diasRestantes).toBeNull();
  });

  it("apresenta 'Prazo não informado' sem linguagem de segurança", () => {
    const a = apresentarValidade(calcularValidade(PREPARO, null, HOJE));
    expect(a.titulo).toBe("Prazo não informado");
    expect(a.detalhe).toBeNull();
    expect(JSON.stringify(a)).not.toMatch(/seguro|segurança|ótima|-18/i);
  });
});

describe("apresentação", () => {
  it("datas em DD/MM/AAAA", () => {
    expect(formatarDataBR("2026-10-04")).toBe("04/10/2026");
  });

  it("vencido mostra quando venceu; próximo mostra dias restantes", () => {
    expect(apresentarValidade(calcularValidade("2026-09-01", 10, HOJE)).detalhe).toBe("Encerrou em 11/09/2026");
    const proximo = apresentarValidade(calcularValidade("2026-09-05", 30, HOJE));
    expect(proximo.detalhe).toContain("Faltam 1 dia(s)");
    expect(proximo.titulo).toBe("Prazo próximo do fim");
  });

  it("nenhuma apresentação usa 'ainda seguro' ou fala de qualidade ótima", () => {
    const casos = [
      calcularValidade("2026-09-01", 10, HOJE),
      calcularValidade(PREPARO, 30, HOJE),
      calcularValidade(PREPARO, 120, HOJE),
      calcularValidade(PREPARO, null, HOJE),
    ].map(apresentarValidade);
    for (const c of casos) {
      expect(JSON.stringify(c)).not.toMatch(/ainda seguro|qualidade ótima|qualidade comprometida/i);
    }
  });
});

describe("ordenação do estoque", () => {
  function item(id: string, dataPreparo: string, validadeDias: number | null, receitaNome = "Receita"): ItemEstoque {
    return {
      id,
      dataPreparo,
      receitaNome,
      validade: calcularValidade(dataPreparo, validadeDias, HOJE),
    };
  }

  it("grupos na ordem: vencidos, vence hoje, próximos, dentro da validade, sem validade", () => {
    const itens = [
      item("sem", "2026-09-01", null),
      item("dentro", "2026-09-20", 60),
      item("proximo", "2026-09-05", 30),
      item("hoje", "2026-09-04", 30),
      item("vencido", "2026-09-01", 10),
    ];
    expect(ordenarEstoque(itens).map((i) => i.id)).toEqual(["vencido", "hoje", "proximo", "dentro", "sem"]);
  });

  it("dentro da validade: a data de vencimento mais próxima vem primeiro", () => {
    const itens = [item("longe", "2026-09-20", 200), item("perto", "2026-09-20", 30)];
    expect(ordenarEstoque(itens).map((i) => i.id)).toEqual(["perto", "longe"]);
  });

  it("empate: usa data do preparo e depois nome da receita, de forma determinística", () => {
    const a = item("b", "2026-09-20", null, "Arroz");
    const b = item("a", "2026-09-10", null, "Zebra");
    const c = item("c", "2026-09-10", null, "Abobrinha");
    expect(ordenarEstoque([a, b, c]).map((i) => i.id)).toEqual(["c", "a", "b"]);
  });

  it("não altera a lista original", () => {
    const itens = [item("x", "2026-09-20", null), item("y", "2026-09-01", 10)];
    ordenarEstoque(itens);
    expect(itens.map((i) => i.id)).toEqual(["x", "y"]);
  });
});

describe("fronteiras de data: virada de mês e de ano, sem D+1", () => {
  it("virada de mês: preparo em 25/09 com 10 dias vence em 05/10", () => {
    const v = calcularValidade("2026-09-25", 10, "2026-10-04");
    expect(v.dataVencimento).toBe("2026-10-05");
    expect(v.diasRestantes).toBe(1);
    expect(v.situacao).toBe("proximo");
  });

  it("virada de ano: preparo em 28/12 com 10 dias vence em 07/01", () => {
    const v = calcularValidade("2026-12-28", 10, "2027-01-01");
    expect(v.dataVencimento).toBe("2027-01-07");
    expect(v.diasRestantes).toBe(6);
  });

  it("ano bissexto: 28/02/2028 + 1 dia é 29/02, não 01/03", () => {
    expect(calcularValidade("2028-02-28", 1, "2028-02-28").dataVencimento).toBe("2028-02-29");
  });

  it("vence hoje não vira vencido nem próximo por causa de fuso (D+1)", () => {
    expect(calcularValidade("2026-10-01", 3, "2026-10-04").situacao).toBe("vence_hoje");
  });
});

describe("null nunca entra em data, soma ou comparação", () => {
  it("null e undefined não geram data, dias nem classificação, e não lançam erro", () => {
    for (const valor of [null, undefined]) {
      const v = calcularValidade(PREPARO, valor, HOJE);
      expect(v.situacao).toBe("nao_informada");
      expect(v.dataVencimento).toBeNull();
      expect(v.diasRestantes).toBeNull();
    }
  });

  it("apresentação de validade não informada não contém 'null', 'undefined' nem data inválida", () => {
    const a = apresentarValidade(calcularValidade(PREPARO, null, HOJE));
    const visivel = `${a.titulo} ${a.detalhe ?? ""}`;
    expect(visivel).not.toMatch(/null|undefined|Invalid|NaN/);
  });

  it("ordenação com validade não informada não quebra e mantém o grupo por último", () => {
    const itens: ItemEstoque[] = [
      { id: "a", dataPreparo: PREPARO, receitaNome: "A", validade: calcularValidade(PREPARO, null, HOJE) },
      { id: "b", dataPreparo: PREPARO, receitaNome: "B", validade: calcularValidade(PREPARO, 30, HOJE) },
    ];
    expect(ordenarEstoque(itens).map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("validade informada sempre tem data e dias preenchidos", () => {
    const v = calcularValidade(PREPARO, 30, HOJE);
    if (v.situacao === "nao_informada") throw new Error("deveria ter validade");
    expect(typeof v.dataVencimento).toBe("string");
    expect(typeof v.diasRestantes).toBe("number");
  });
});

describe("guarda contra cortes fixos", () => {
  it("o módulo de estoque não contém 60 nem 90 como constante de regra", () => {
    const codigo = readFileSync(join(process.cwd(), "lib", "marmitas", "estoque.ts"), "utf8");
    expect(codigo).not.toMatch(/\b(60|90)\b/);
  });
});
