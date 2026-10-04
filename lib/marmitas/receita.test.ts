import { describe, expect, it } from "vitest";
import {
  interpretarReceita,
  interpretarValidadeCongelado,
  MENSAGEM_VALIDADE_INVALIDA,
} from "./receita";

function form(campos: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

const BASE = { nome: "Receita fictícia", validade_congelado_dias: "60" };

describe("interpretarReceita — obrigatórios", () => {
  it("aceita o mínimo: nome e validade", () => {
    const r = interpretarReceita(form(BASE));
    expect(r).toEqual({
      ok: true,
      dados: {
        nome: "Receita fictícia",
        categoria: null,
        ingredientes: null,
        modo_preparo: null,
        dica_congelamento: null,
        notas: null,
        selos: [],
        validade_congelado_dias: 60,
      },
    });
  });

  it("recusa nome vazio ou só com espaços", () => {
    const r = interpretarReceita(form({ ...BASE, nome: "   " }));
    expect(r).toEqual({ ok: false, erro: "Informe o nome da receita." });
  });

  it("validade em branco é aceita e vira null (não inventa um número)", () => {
    const r = interpretarReceita(form({ nome: "Receita fictícia", validade_congelado_dias: "" }));
    expect(r.ok && r.dados.validade_congelado_dias).toBe(null);
  });

  it("validade só com espaços é tratada como ausência de valor", () => {
    const r = interpretarReceita(form({ nome: "Receita fictícia", validade_congelado_dias: "   " }));
    expect(r.ok && r.dados.validade_congelado_dias).toBe(null);
  });

  it("validade preenchida inválida é recusada: zero, negativa, decimal ou não numérica", () => {
    for (const validade of ["0", "-3", "2.5", "abc"]) {
      const r = interpretarReceita(form({ ...BASE, validade_congelado_dias: validade }));
      expect(r.ok, `validade "${validade}" deveria falhar`).toBe(false);
    }
  });
});

describe("interpretarValidadeCongelado — função única da regra", () => {
  it("vazio, espaços, undefined e null viram null, sem padrão", () => {
    for (const valor of [undefined, null, "", "   ", "\t"]) {
      expect(interpretarValidadeCongelado(valor)).toEqual({ ok: true, valor: null });
    }
  });

  it("inteiro positivo vira number (em texto ou número)", () => {
    expect(interpretarValidadeCongelado("60")).toEqual({ ok: true, valor: 60 });
    expect(interpretarValidadeCongelado(30)).toEqual({ ok: true, valor: 30 });
    expect(interpretarValidadeCongelado(" 120 ")).toEqual({ ok: true, valor: 120 });
  });

  it("zero, negativo, decimal e texto inválido são erro", () => {
    for (const valor of ["0", "-1", "2.5", "abc", "12 dias", 0, -3, 1.5]) {
      const r = interpretarValidadeCongelado(valor);
      expect(r.ok, `valor ${JSON.stringify(valor)} deveria falhar`).toBe(false);
    }
  });

  it("NaN e infinito são erro e nunca viram número", () => {
    for (const valor of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, "Infinity", "NaN"]) {
      const r = interpretarValidadeCongelado(valor);
      expect(r.ok, `valor ${String(valor)} deveria falhar`).toBe(false);
    }
  });

  it("tipo fora de string, número, null e undefined é erro", () => {
    expect(interpretarValidadeCongelado({}).ok).toBe(false);
    expect(interpretarValidadeCongelado(true).ok).toBe(false);
  });

  it("mensagem de validação é a mesma para qualquer valor inválido", () => {
    const mensagens = ["0", "abc", "2.5"].map((v) => {
      const r = interpretarValidadeCongelado(v);
      return r.ok ? null : r.erro;
    });
    expect(new Set(mensagens).size).toBe(1);
    expect(mensagens[0]).toBe(MENSAGEM_VALIDADE_INVALIDA);
  });
});

describe("interpretarReceita — textos longos", () => {
  it("preserva quebras de linha dos ingredientes e do modo de preparo", () => {
    const r = interpretarReceita(
      form({ ...BASE, ingredientes: "1 cebola\n2 dentes de alho\n\nSal a gosto", modo_preparo: "Passo 1.\nPasso 2." })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.dados.ingredientes).toBe("1 cebola\n2 dentes de alho\n\nSal a gosto");
    expect(r.dados.modo_preparo).toBe("Passo 1.\nPasso 2.");
  });

  it("converte \\r\\n do navegador em \\n", () => {
    const r = interpretarReceita(form({ ...BASE, notas: "linha 1\r\nlinha 2" }));
    expect(r.ok && r.dados.notas).toBe("linha 1\nlinha 2");
  });

  it("preserva aspas e acentos no texto", () => {
    const r = interpretarReceita(form({ ...BASE, modo_preparo: 'Asse "bem" até dourar — 20 min' }));
    expect(r.ok && r.dados.modo_preparo).toBe('Asse "bem" até dourar — 20 min');
  });

  it("texto só com espaços vira null", () => {
    const r = interpretarReceita(form({ ...BASE, dica_congelamento: "   \n  " }));
    expect(r.ok && r.dados.dica_congelamento).toBe(null);
  });

  it("recusa texto acima do limite", () => {
    const r = interpretarReceita(form({ ...BASE, ingredientes: "a".repeat(10001) }));
    expect(r.ok).toBe(false);
  });
});

describe("interpretarReceita — categoria e selos", () => {
  it("aceita só categorias conhecidas; outra coisa vira sem categoria", () => {
    expect(interpretarReceita(form({ ...BASE, categoria: "jantar" }))).toMatchObject({ ok: true, dados: { categoria: "jantar" } });
    expect(interpretarReceita(form({ ...BASE, categoria: "<script>" }))).toMatchObject({ ok: true, dados: { categoria: null } });
  });

  it("separa selos por vírgula, sem vazios e sem repetidos", () => {
    const r = interpretarReceita(form({ ...BASE, selos: " air fryer, congelável,, air fryer ,  " }));
    expect(r.ok && r.dados.selos).toEqual(["air fryer", "congelável"]);
  });
});
