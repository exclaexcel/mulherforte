import { describe, expect, it } from "vitest";
import {
  celulaBooleano,
  celulaData,
  celulaNumero,
  celulaTexto,
  montarArquivosCsv,
  montarCsv,
  sanitizarTexto,
} from "./montarCsv";
import { ExportacaoIntegridadeErro, type DadosExportacao } from "./tipos";
import { buscarDadosExportacao } from "./buscarDados";
import { criarFakeSupabase, USER_ID } from "./__testes__/fakeSupabase";
import { tabelasFicticias } from "./__testes__/dadosFicticios";

const BOM = "﻿";

function dadosVazios(): DadosExportacao {
  return {
    perfil: null,
    pesos: [],
    medidas: [],
    habitos: [],
    treinos: [],
    metas: [],
    receitas: [],
    preparos: [],
    itens_compra: [],
    cronograma_marmitas: [],
  };
}

async function dadosFicticios(): Promise<DadosExportacao> {
  const fake = criarFakeSupabase(tabelasFicticias());
  return buscarDadosExportacao(fake.supabase as never, USER_ID);
}

describe("formato do arquivo", () => {
  it("começa com BOM UTF-8 para o Excel reconhecer acentos", () => {
    const csv = montarCsv(["Nome"], [["\"Ana\""]]);
    expect(csv.startsWith(BOM)).toBe(true);
  });

  it("usa ponto e vírgula como separador", () => {
    const csv = montarCsv(["A", "B"], [['"x"', '"y"']]);
    expect(csv.split("\r\n")[1]).toBe('"x";"y"');
  });

  it("termina linhas com CRLF e fecha o arquivo com CRLF", () => {
    const csv = montarCsv(["A"], [["1"], ["2"]]);
    expect(csv).toBe(`${BOM}A\r\n1\r\n2\r\n`);
  });

  it("arquivo vazio sai com cabeçalho e sem linhas de dados", () => {
    expect(montarCsv(["Data", "Peso"], [])).toBe(`${BOM}Data;Peso\r\n`);
  });

  it("preserva acentos", () => {
    const csv = montarCsv(["Região"], [[celulaTexto("Abdômen inferior")]]);
    expect(csv).toContain('"Abdômen inferior"');
    expect(csv).toContain("Região");
  });
});

describe("células", () => {
  it("decimal com vírgula", () => {
    expect(celulaNumero(58.1)).toBe("58,1");
    expect(celulaNumero(0.51)).toBe("0,51");
  });

  it("zero é preservado como 0", () => {
    expect(celulaNumero(0)).toBe("0");
  });

  it("null vira célula vazia", () => {
    expect(celulaNumero(null)).toBe("");
    expect(celulaTexto(null)).toBe("");
    expect(celulaData(null)).toBe("");
  });

  it("data AAAA-MM-DD vira DD/MM/AAAA", () => {
    expect(celulaData("2026-10-03")).toBe("03/10/2026");
  });

  it("data em formato inválido interrompe a exportação", () => {
    expect(() => celulaData("03/10/2026")).toThrow(ExportacaoIntegridadeErro);
  });

  it("booleanos viram Sim e Não", () => {
    expect(celulaBooleano(true)).toBe("Sim");
    expect(celulaBooleano(false)).toBe("Não");
    expect(celulaBooleano(null)).toBe("");
  });

  it("texto entre aspas, com aspas internas duplicadas", () => {
    expect(celulaTexto('Asse "bem"')).toBe('"Asse ""bem"""');
  });

  it("texto multilinha fica dentro das aspas", () => {
    expect(celulaTexto("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
  });
});

describe("proteção contra CSV injection", () => {
  it("prefixa apóstrofo para =, +, -, @, TAB e CR", () => {
    expect(sanitizarTexto("=1+1")).toBe("'=1+1");
    expect(sanitizarTexto("+cmd")).toBe("'+cmd");
    expect(sanitizarTexto("-cmd")).toBe("'-cmd");
    expect(sanitizarTexto("@SOMA(A1)")).toBe("'@SOMA(A1)");
    expect(sanitizarTexto("\tx")).toBe("'\tx");
    expect(sanitizarTexto("\rx")).toBe("'\rx");
  });

  it("não altera texto comum", () => {
    expect(sanitizarTexto("Frango")).toBe("Frango");
    expect(sanitizarTexto("a=b")).toBe("a=b");
  });

  it("exemplo do requisito: =1+1 sai como '=1+1 dentro das aspas", () => {
    expect(celulaTexto("=1+1")).toBe('"\'=1+1"');
  });

  it("não aplica a números negativos nem a datas", () => {
    expect(celulaNumero(-5)).toBe("-5");
    expect(celulaData("2026-10-03")).toBe("03/10/2026");
  });

  it("valores fictícios de risco saem neutralizados em todos os textos livres", async () => {
    const arquivos = montarArquivosCsv(await dadosFicticios());
    expect(arquivos["perfil.csv"]).toContain("'=Teste Fórmula");
    expect(arquivos["treinos.csv"]).toContain("'-Caminhada");
    expect(arquivos["receitas.csv"]).toContain("'+100g de frango");
    // "@" depois de uma quebra de linha não inicia a célula: a regra vale só para o começo.
    expect(arquivos["receitas.csv"]).toContain("\n@ temperos");
    expect(arquivos["preparos.csv"]).toContain("'=SOMA(A1)");
    expect(arquivos["itens-compra.csv"]).toContain("'@loja");
    expect(arquivos["cronograma-marmitas.csv"]).toContain("'-brócolis");
  });
});

describe("montarArquivosCsv", () => {
  it("gera exatamente os 10 arquivos com nomes ASCII", async () => {
    const arquivos = montarArquivosCsv(await dadosFicticios());
    expect(Object.keys(arquivos).sort()).toEqual(
      [
        "perfil.csv",
        "pesos.csv",
        "medidas.csv",
        "habitos.csv",
        "treinos.csv",
        "metas.csv",
        "receitas.csv",
        "preparos.csv",
        "itens-compra.csv",
        "cronograma-marmitas.csv",
      ].sort()
    );
    for (const nome of Object.keys(arquivos)) {
      expect(nome).toMatch(/^[\x20-\x7e]+$/);
    }
  });

  it("perfil: data de nascimento e início do ciclo em DD/MM/AAAA, altura com vírgula", async () => {
    const linhas = montarArquivosCsv(await dadosFicticios())["perfil.csv"].split("\r\n");
    expect(linhas[0]).toBe(`${BOM}Nome;Altura em centímetros;Data de nascimento;Início do ciclo do cronograma`);
    expect(linhas[1]).toBe(`"'=Teste Fórmula";152;10/05/1990;28/09/2026`);
  });

  it("habitos: cabeçalho deixa claro que a meta é um snapshot", async () => {
    const cabecalho = montarArquivosCsv(await dadosFicticios())["habitos.csv"].split("\r\n")[0];
    expect(cabecalho).toContain("snapshot do registro, não recalculado");
  });

  it("treinos: obrigatório aparece como Sim/Não", async () => {
    const linhas = montarArquivosCsv(await dadosFicticios())["treinos.csv"].split("\r\n");
    expect(linhas.some((l) => l.includes(";Sim;"))).toBe(true);
    expect(linhas.some((l) => l.includes(";Não;"))).toBe(true);
  });

  it("receitas: selos unidos com ' | '", async () => {
    const csv = montarArquivosCsv(await dadosFicticios())["receitas.csv"];
    expect(csv).toContain('"air fryer | congelável"');
  });

  it("preparos: resolve o nome da receita, sem UUID no arquivo", async () => {
    const csv = montarArquivosCsv(await dadosFicticios())["preparos.csv"];
    expect(csv).toContain('"Frango, fictício"');
    expect(csv).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it("metas: data de criação em DD/MM/AAAA e meta de hidratação em litros", async () => {
    const csv = montarArquivosCsv(await dadosFicticios())["metas.csv"];
    expect(csv).toContain("Meta de hidratação diária (litros)");
    expect(csv).toContain("30/08/2026");
  });

  it("nenhum arquivo contém user_id, UUID de usuária ou e-mail", async () => {
    const arquivos = montarArquivosCsv(await dadosFicticios());
    for (const conteudo of Object.values(arquivos)) {
      expect(conteudo).not.toContain(USER_ID);
      expect(conteudo).not.toMatch(/@[a-z]+\.[a-z]+/i);
      expect(conteudo.toLowerCase()).not.toContain("user_id");
    }
  });

  it("dados vazios geram 10 arquivos só com cabeçalho", () => {
    const arquivos = montarArquivosCsv(dadosVazios());
    for (const conteudo of Object.values(arquivos)) {
      expect(conteudo.split("\r\n").filter((l) => l !== "")).toHaveLength(1);
    }
  });

  it("preparo sem receita correspondente interrompe a geração", () => {
    const dados = dadosVazios();
    dados.preparos = [
      {
        receita_id: "00000000-0000-4000-8000-0000000000ff",
        data_preparo: "2026-09-10",
        dia_semana: null,
        semana_ciclo: null,
        quantidade_porcoes: 1,
        observacoes: null,
        status: "congelado",
        data_consumo: null,
      },
    ];
    expect(() => montarArquivosCsv(dados)).toThrow(ExportacaoIntegridadeErro);
  });
});
