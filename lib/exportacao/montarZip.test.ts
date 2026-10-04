import { describe, expect, it } from "vitest";
import { unzipSync } from "fflate";
import { montarZip } from "./montarZip";
import { montarCsv } from "./montarCsv";

describe("montarZip", () => {
  const arquivos = {
    "perfil.csv": montarCsv(["Nome"], [['"Ana"']]),
    "metas.csv": montarCsv(["Indicador"], []),
  };

  it("gera um ZIP válido (assinatura PK)", () => {
    const zip = montarZip(arquivos);
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
  });

  it("contém exatamente os arquivos pedidos, com nomes ASCII", () => {
    const aberto = unzipSync(montarZip(arquivos));
    expect(Object.keys(aberto).sort()).toEqual(["metas.csv", "perfil.csv"]);
  });

  it("preserva o conteúdo byte a byte, incluindo o BOM UTF-8", () => {
    const aberto = unzipSync(montarZip(arquivos));
    const bytes = aberto["perfil.csv"];
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    const texto = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    expect(texto).toBe(arquivos["perfil.csv"]);
  });

  it("preserva acentos e quebras de linha dentro das células", () => {
    const comAcento = { "receitas.csv": montarCsv(["Notas"], [['"Abdômen\nlinha 2"']]) };
    const aberto = unzipSync(montarZip(comAcento));
    const texto = new TextDecoder("utf-8", { ignoreBOM: true }).decode(aberto["receitas.csv"]);
    expect(texto).toContain("Abdômen");
    expect(texto).toContain("linha 2");
  });

  it("arquivo vazio com cabeçalho continua presente no ZIP", () => {
    const aberto = unzipSync(montarZip({ "treinos.csv": montarCsv(["Data"], []) }));
    expect(aberto["treinos.csv"].length).toBeGreaterThan(0);
  });
});
