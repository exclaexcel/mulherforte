import { describe, expect, it } from "vitest";
import { montarArquivosCsv } from "./montarCsv";
import { montarJson } from "./montarJson";
import type { DadosExportacao, ReceitaExport } from "./tipos";

const GERADO_EM = new Date("2026-10-04T12:00:00.000Z");

function receitaSemValidade(): ReceitaExport {
  return {
    id: "00000000-0000-4000-8000-0000000000d1",
    nome: "Receita fictícia sem validade",
    categoria: null,
    ingredientes: null,
    modo_preparo: null,
    dica_congelamento: null,
    selos: [],
    validade_congelado_dias: null,
    notas: null,
  };
}

function dados(): DadosExportacao {
  return {
    perfil: null,
    pesos: [],
    medidas: [],
    habitos: [],
    treinos: [],
    metas: [],
    receitas: [receitaSemValidade()],
    preparos: [],
    itens_compra: [],
    cronograma_marmitas: [],
  };
}

describe("receita sem validade informada na exportação", () => {
  it("CSV: validade vazia vira célula vazia, não zero nem texto", () => {
    const linha = montarArquivosCsv(dados())["receitas.csv"].split("\r\n")[1];
    const celulas = linha.split(";");
    // Coluna 7 do cabeçalho: "Validade congelada em dias".
    expect(celulas[6]).toBe("");
  });

  it("JSON: validade null é preservada como null", () => {
    const obj = JSON.parse(montarJson(dados(), GERADO_EM));
    expect(obj.receitas[0].validade_congelado_dias).toBeNull();
  });
});
