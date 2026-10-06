import { describe, expect, it } from "vitest";
import { buscarDadosExportacao, validarReferenciasReceitas } from "./buscarDados";
import { ExportacaoIntegridadeErro, ExportacaoLeituraErro } from "./tipos";
import { criarFakeSupabase, type Linha, USER_ID } from "./__testes__/fakeSupabase";

/** Data fictícia AAAA-MM-DD, a partir de 2020-01-01 e somando `dias`. */
function dataDe(dias: number): string {
  return new Date(Date.UTC(2020, 0, 1) + dias * 86_400_000).toISOString().slice(0, 10);
}

function pesos(n: number): Linha[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `peso-${String(i + 1).padStart(6, "0")}`,
    user_id: USER_ID,
    data: dataDe(i),
    peso_kg: "58.10",
    percentual_gordura: null,
    percentual_massa_muscular: null,
    percentual_agua: null,
  }));
}

function habitos(n: number): Linha[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `habito-${String(i + 1).padStart(6, "0")}`,
    user_id: USER_ID,
    data: dataDe(i),
    quantidade_agua_ml: 1500,
    priorizou_proteina: false,
    bebeu_agua_meta: false,
  }));
}

describe("busca completa acima do limite de linhas", () => {
  it.each([500, 501, 1000, 1001, 1200])("%i pesos voltam todos", async (n) => {
    const fake = criarFakeSupabase({ registros_peso: pesos(n) });

    const dados = await buscarDadosExportacao(fake.supabase as never, USER_ID);

    expect(dados.pesos).toHaveLength(n);
  });

  it("1.200 hábitos voltam todos, mesmo com o servidor cortando em 100 linhas", async () => {
    const fake = criarFakeSupabase({ adesao_habitos: habitos(1200) }, { limiteServidor: 100 });

    const dados = await buscarDadosExportacao(fake.supabase as never, USER_ID);

    expect(dados.habitos).toHaveLength(1200);
  });

  it("cada página de cada tabela filtra por user_id", async () => {
    const fake = criarFakeSupabase({ registros_peso: pesos(1001) });

    await buscarDadosExportacao(fake.supabase as never, USER_ID);

    const consultasDePesos = fake.chamadas.filter((c) => c.tabela === "registros_peso" && c.metodo === "select");
    expect(consultasDePesos.length).toBeGreaterThanOrEqual(3);
    const filtrosUsuaria = fake.chamadas.filter(
      (c) => c.tabela === "registros_peso" && c.metodo === "eq" && c.args[0] === "user_id" && c.args[1] === USER_ID
    );
    expect(filtrosUsuaria.length).toBe(consultasDePesos.length);
  });

  it("a paginação não grava nada", async () => {
    const fake = criarFakeSupabase({ registros_peso: pesos(1001), adesao_habitos: habitos(600) });

    await buscarDadosExportacao(fake.supabase as never, USER_ID);

    expect(fake.escritas).toHaveLength(0);
  });

  it("nenhuma página de pesos inclui linhas de outra usuária", async () => {
    const outra = pesos(600).map((l, i) => ({ ...l, id: `outra-${i}`, user_id: "00000000-0000-4000-8000-0000000000ff" }));
    const fake = criarFakeSupabase({ registros_peso: [...pesos(600), ...outra] });

    const dados = await buscarDadosExportacao(fake.supabase as never, USER_ID);

    expect(dados.pesos).toHaveLength(600);
  });
});

describe("falha em página intermediária não vira arquivo parcial", () => {
  it("erro na segunda página de pesos interrompe a exportação com erro de leitura", async () => {
    const fake = criarFakeSupabase(
      { registros_peso: pesos(1001) },
      { erroNaPagina: { tabela: "registros_peso", pagina: 2 } }
    );

    const erro = await buscarDadosExportacao(fake.supabase as never, USER_ID).catch((e) => e);

    expect(erro).toBeInstanceOf(ExportacaoLeituraErro);
    expect(erro.message).toBe("Não foi possível gerar o arquivo agora. Tente novamente.");
    expect(erro.message).not.toContain("registros_peso");
  });

  it("erro em qualquer tabela paginada impede o retorno de dados", async () => {
    const fake = criarFakeSupabase({ adesao_habitos: habitos(600) }, { erroEm: "adesao_habitos" });

    await expect(buscarDadosExportacao(fake.supabase as never, USER_ID)).rejects.toBeInstanceOf(
      ExportacaoLeituraErro
    );
  });
});

describe("receitas e preparos em páginas diferentes", () => {
  it("referência de preparo para receita da segunda página resolve (sem falso órfão)", async () => {
    const receitas: Linha[] = Array.from({ length: 600 }, (_, i) => ({
      id: `receita-${String(i + 1).padStart(6, "0")}`,
      user_id: USER_ID,
      nome: `Receita ${String(i + 1).padStart(4, "0")}`,
      categoria: null,
      ingredientes: null,
      modo_preparo: null,
      dica_congelamento: null,
      selos: [],
      validade_congelado_dias: 60,
      notas: null,
    }));
    const preparo: Linha = {
      id: "preparo-000001",
      user_id: USER_ID,
      receita_id: "receita-000600",
      data_preparo: "2026-09-10",
      dia_semana: "Quinta",
      semana_ciclo: 2,
      quantidade_porcoes: "4",
      observacoes: null,
      status: "congelado",
      data_consumo: null,
    };
    const fake = criarFakeSupabase({ receitas, preparos: [preparo] });

    const dados = await buscarDadosExportacao(fake.supabase as never, USER_ID);

    expect(dados.receitas).toHaveLength(600);
    expect(() => validarReferenciasReceitas(dados)).not.toThrow();
  });

  it("preparo de fato órfão continua interrompendo com 422", async () => {
    const fake = criarFakeSupabase({
      receitas: [],
      preparos: [
        {
          id: "preparo-000001",
          user_id: USER_ID,
          receita_id: "receita-inexistente",
          data_preparo: "2026-09-10",
          dia_semana: "Quinta",
          semana_ciclo: 2,
          quantidade_porcoes: "4",
          observacoes: null,
          status: "congelado",
          data_consumo: null,
        },
      ],
    });

    const dados = await buscarDadosExportacao(fake.supabase as never, USER_ID);

    expect(() => validarReferenciasReceitas(dados)).toThrow(ExportacaoIntegridadeErro);
  });
});
