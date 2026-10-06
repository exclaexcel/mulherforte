import { describe, expect, it } from "vitest";
import {
  buscarDadosExportacao,
  numeroObrigatorio,
  numeroOpcional,
  validarReferenciasReceitas,
} from "./buscarDados";
import { ExportacaoIntegridadeErro, ExportacaoLeituraErro, type DadosExportacao } from "./tipos";
import { criarFakeSupabase, OUTRA_USUARIA_ID, RECEITA_ID, RECEITA_ID_2, USER_ID } from "./__testes__/fakeSupabase";
import { tabelasFicticias } from "./__testes__/dadosFicticios";

const TABELAS_EXPORTADAS = [
  "perfil_usuario",
  "registros_peso",
  "medidas_corporais",
  "adesao_habitos",
  "adesao_treino",
  "metas",
  "receitas",
  "preparos",
  "itens_compra",
  "cronograma_planejado",
];

async function buscar(tabelas = tabelasFicticias()) {
  const fake = criarFakeSupabase(tabelas);
  const dados = await buscarDadosExportacao(fake.supabase as never, USER_ID);
  return { dados, ...fake };
}

describe("isolamento e segurança das consultas", () => {
  it("consulta as 10 tabelas (cada uma pelo menos uma vez, por páginas)", async () => {
    const { chamadas } = await buscar();
    const tabelasConsultadas = chamadas.filter((c) => c.metodo === "select").map((c) => c.tabela);
    expect(Array.from(new Set(tabelasConsultadas)).sort()).toEqual([...TABELAS_EXPORTADAS].sort());
  });

  it("toda consulta filtra explicitamente por user_id da sessão", async () => {
    const { chamadas } = await buscar();
    const selecionadas = chamadas.filter((c) => c.metodo === "select");
    for (const select of selecionadas) {
      const filtrou = chamadas.some(
        (c) =>
          c.tabela === select.tabela &&
          c.metodo === "eq" &&
          c.args[0] === "user_id" &&
          c.args[1] === USER_ID
      );
      expect(filtrou, `tabela ${select.tabela} sem filtro por user_id`).toBe(true);
    }
  });

  it("nunca usa select('*') nem lista de colunas com asterisco", async () => {
    const { chamadas } = await buscar();
    for (const c of chamadas.filter((x) => x.metodo === "select")) {
      expect(String(c.args[0])).not.toContain("*");
    }
  });

  it("não inclui linhas de outra usuária", async () => {
    const { dados } = await buscar();
    expect(JSON.stringify(dados)).not.toContain("Outra Pessoa");
    expect(JSON.stringify(dados)).not.toContain("Não deve aparecer");
    expect(dados.pesos.map((p) => p.peso_kg)).not.toContain(70);
    expect(dados.medidas.some((m) => m.valor_cm === 90)).toBe(false);
  });

  it("não executa nenhuma escrita (insert, update, upsert ou delete)", async () => {
    const { escritas } = await buscar();
    expect(escritas).toEqual([]);
  });

  it("user_id nunca vem dos dados nem do cliente: a busca só usa o id recebido da sessão", async () => {
    const fake = criarFakeSupabase(tabelasFicticias());
    await buscarDadosExportacao(fake.supabase as never, USER_ID);
    const valores = fake.chamadas.filter((c) => c.metodo === "eq" && c.args[0] === "user_id").map((c) => c.args[1]);
    expect(new Set(valores)).toEqual(new Set([USER_ID]));
  });

  it("erro retornado pelo Supabase vira ExportacaoLeituraErro com mensagem genérica, sem detalhe do banco", async () => {
    const fake = criarFakeSupabase(tabelasFicticias(), { erroEm: "registros_peso" });
    const erro = await buscarDadosExportacao(fake.supabase as never, USER_ID).catch((e) => e);
    expect(erro).toBeInstanceOf(ExportacaoLeituraErro);
    expect(erro).not.toBeInstanceOf(ExportacaoIntegridadeErro);
    expect(erro.message).toBe("Não foi possível gerar o arquivo agora. Tente novamente.");
    expect(erro.message).not.toContain("erro simulado");
    expect(erro.message).not.toContain("registros_peso");
  });

  it("exceção lançada pela biblioteca do Supabase vira ExportacaoLeituraErro, sem a mensagem crua", async () => {
    const fake = criarFakeSupabase(tabelasFicticias(), { lancaEm: "metas" });
    const erro = await buscarDadosExportacao(fake.supabase as never, USER_ID).catch((e) => e);
    expect(erro).toBeInstanceOf(ExportacaoLeituraErro);
    expect(erro.message).not.toContain("falha de rede");
    expect(erro.message).not.toContain("metas");
  });
});

describe("normalização numérica", () => {
  it("converte numeric em string para number", async () => {
    const { dados } = await buscar();
    expect(dados.pesos.find((p) => p.data === "2026-09-10")?.peso_kg).toBe(58.1);
    expect(typeof dados.pesos[0].peso_kg).toBe("number");
  });

  it("preserva null nos campos opcionais", async () => {
    const { dados } = await buscar();
    const semGordura = dados.pesos.find((p) => p.data === "2026-09-03");
    expect(semGordura?.percentual_gordura).toBeNull();
    expect(semGordura?.percentual_agua).toBeNull();
  });

  it("preserva zero (não vira null)", async () => {
    const { dados } = await buscar();
    expect(dados.habitos.find((h) => h.data === "2026-09-03")?.quantidade_agua_ml).toBe(0);
    expect(dados.treinos.find((t) => t.data === "2026-09-10")?.calorias).toBe(0);
  });

  it("numeroObrigatorio interrompe com erro seguro para valor não finito", () => {
    expect(() => numeroObrigatorio("abc", "peso_kg")).toThrow(ExportacaoIntegridadeErro);
    expect(() => numeroObrigatorio("abc", "peso_kg")).toThrow(/peso_kg/);
    expect(() => numeroObrigatorio(null, "peso_kg")).toThrow(ExportacaoIntegridadeErro);
    expect(() => numeroObrigatorio(Number.NaN, "peso_kg")).toThrow(ExportacaoIntegridadeErro);
  });

  it("numeroOpcional mantém null e valida o que não é null", () => {
    expect(numeroOpcional(null, "x")).toBeNull();
    expect(numeroOpcional(undefined, "x")).toBeNull();
    expect(numeroOpcional("12.5", "x")).toBe(12.5);
    expect(() => numeroOpcional("nope", "x")).toThrow(ExportacaoIntegridadeErro);
  });

  it("um peso inválido interrompe a exportação, sem retornar dados parciais", async () => {
    const tabelas = tabelasFicticias();
    tabelas.registros_peso[0] = { ...tabelas.registros_peso[0], peso_kg: "não é número" };
    const fake = criarFakeSupabase(tabelas);
    await expect(buscarDadosExportacao(fake.supabase as never, USER_ID)).rejects.toThrow(ExportacaoIntegridadeErro);
  });
});

describe("ordenação determinística", () => {
  it("pesos em ordem crescente de data", async () => {
    const { dados } = await buscar();
    expect(dados.pesos.map((p) => p.data)).toEqual(["2026-09-03", "2026-09-10"]);
  });

  it("medidas por data e depois na ordem funcional das regiões", async () => {
    const { dados } = await buscar();
    expect(dados.medidas.map((m) => `${m.data}|${m.regiao}`)).toEqual([
      "2026-09-03|quadril",
      "2026-09-10|cintura",
      "2026-09-10|coxa",
    ]);
  });

  it("itens de compra na ordem funcional dos grupos (proteínas antes de despensa)", async () => {
    const { dados } = await buscar();
    expect(dados.itens_compra.map((i) => i.grupo)).toEqual(["proteinas", "despensa"]);
  });

  it("cronograma por semana e depois na ordem dos dias da semana", async () => {
    const { dados } = await buscar();
    expect(dados.cronograma_marmitas.map((c) => c.dia_semana)).toEqual(["Segunda", "Quarta"]);
  });

  it("receitas por nome em pt-BR", async () => {
    const { dados } = await buscar();
    expect(dados.receitas.map((r) => r.nome)).toEqual(["Frango, fictício", "Ovo fictício"]);
  });
});

describe("integridade receita → preparo", () => {
  function dadosBase(): DadosExportacao {
    return {
      perfil: null,
      pesos: [],
      medidas: [],
      habitos: [],
      treinos: [],
      metas: [],
      receitas: [
        {
          id: RECEITA_ID,
          nome: "Receita A",
          categoria: null,
          ingredientes: null,
          modo_preparo: null,
          dica_congelamento: null,
          selos: [],
          validade_congelado_dias: 60,
          notas: null,
        },
      ],
      preparos: [],
      itens_compra: [],
      cronograma_marmitas: [],
    };
  }

  const preparo = (receita_id: string) => ({
    receita_id,
    data_preparo: "2026-09-10",
    dia_semana: "Quinta",
    semana_ciclo: 1,
    quantidade_porcoes: 2,
    observacoes: null,
    status: "congelado",
    data_consumo: null,
  });

  it("relação válida passa", () => {
    const dados = dadosBase();
    dados.preparos = [preparo(RECEITA_ID)];
    expect(() => validarReferenciasReceitas(dados)).not.toThrow();
  });

  it("múltiplos preparos da mesma receita passam", () => {
    const dados = dadosBase();
    dados.preparos = [preparo(RECEITA_ID), preparo(RECEITA_ID), preparo(RECEITA_ID)];
    expect(() => validarReferenciasReceitas(dados)).not.toThrow();
  });

  it("preparo com receita ausente interrompe, sem UUID na mensagem", () => {
    const dados = dadosBase();
    dados.preparos = [preparo(RECEITA_ID), preparo(RECEITA_ID_2)];
    let erro: unknown;
    try {
      validarReferenciasReceitas(dados);
    } catch (e) {
      erro = e;
    }
    expect(erro).toBeInstanceOf(ExportacaoIntegridadeErro);
    expect((erro as Error).message).not.toContain(RECEITA_ID_2);
    expect((erro as Error).message).toContain("nenhum dado foi alterado");
  });

  it("não remove o preparo órfão dos dados", () => {
    const dados = dadosBase();
    dados.preparos = [preparo(RECEITA_ID_2)];
    expect(() => validarReferenciasReceitas(dados)).toThrow(ExportacaoIntegridadeErro);
    expect(dados.preparos).toHaveLength(1);
  });
});
