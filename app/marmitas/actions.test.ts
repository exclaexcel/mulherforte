import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const OUTRA_USUARIA_ID = "00000000-0000-4000-8000-000000000002";
const MENSAGEM_VALIDACAO = "Não foi possível validar os dados agora. Tente novamente.";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser }, from: mocks.from }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  alternarTenhoEmCasa,
  criarItemCompra,
  criarPreparo,
  criarReceita,
  criarReceitaCompleta,
  marcarConsumido,
  salvarDiaCronograma,
} from "./actions";
// alternarTenhoEmCasa e marcarConsumido têm testes próprios em consumo-alternancia.test.ts.

type Chamada = { metodo: string; args: unknown[] };
type Config = {
  /** Resultado das leituras (select/maybeSingle). */
  leitura?: { data?: unknown; error?: unknown };
  /** Resultado das escritas (insert/upsert/update). */
  escrita?: { error?: unknown };
};

let configs: Record<string, Config> = {};
let registros: { tabela: string; chamadas: Chamada[] }[] = [];

const ESCRITAS = ["insert", "upsert", "update"];

/** Builder que registra as chamadas e resolve com a leitura ou a escrita configurada. */
function criarBuilder(tabela: string) {
  const chamadas: Chamada[] = [];
  const builder: Record<string, unknown> = {};
  for (const metodo of ["select", "eq", "maybeSingle", ...ESCRITAS]) {
    builder[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
    const cfg = configs[tabela] ?? {};
    const resultado = chamadas.some((c) => ESCRITAS.includes(c.metodo))
      ? { error: cfg.escrita?.error ?? null }
      : { data: cfg.leitura?.data ?? null, error: cfg.leitura?.error ?? null };
    return Promise.resolve(resultado).then(resolve, reject);
  };
  registros.push({ tabela, chamadas });
  return builder;
}

function preparar(sessao: { id: string } | null, cfg: Record<string, Config> = {}) {
  configs = cfg;
  mocks.getUser.mockResolvedValue({ data: { user: sessao } });
  mocks.from.mockImplementation((tabela: string) => criarBuilder(tabela));
}

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

/** Payloads gravados (insert, upsert ou update) numa tabela. */
function gravacoes(tabela: string): Record<string, unknown>[] {
  return registros
    .filter((r) => r.tabela === tabela)
    .flatMap((r) => r.chamadas)
    .filter((c) => ESCRITAS.includes(c.metodo))
    .map((c) => c.args[0] as Record<string, unknown>);
}

function temEq(tabela: string, coluna: string, valor: unknown) {
  return registros
    .filter((r) => r.tabela === tabela)
    .flatMap((r) => r.chamadas)
    .some((c) => c.metodo === "eq" && c.args[0] === coluna && c.args[1] === valor);
}

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  registros = [];
  configs = {};
});

describe("sessão obrigatória", () => {
  it("criarReceitaCompleta sem sessão redireciona para login e não toca no banco", async () => {
    preparar(null);

    await expect(criarReceitaCompleta(formulario({ nome: "Sopa" }))).rejects.toThrow(
      "REDIRECT:/login"
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("criarPreparo sem sessão redireciona para login e não toca no banco", async () => {
    preparar(null);

    await expect(criarPreparo(formulario({ receita_id: "r1" }))).rejects.toThrow("REDIRECT:/login");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("marcarConsumido e alternarTenhoEmCasa sem sessão redirecionam", async () => {
    preparar(null);

    await expect(marcarConsumido(formulario({ id: "p1" }))).rejects.toThrow("REDIRECT:/login");
    await expect(
      alternarTenhoEmCasa(formulario({ id: "i1", tenho_em_casa: "false" }))
    ).rejects.toThrow("REDIRECT:/login");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("receita completa e cadastro rápido", () => {
  it("nome vazio: erro previsível, sem insert", async () => {
    preparar({ id: USER_ID });

    const r = await criarReceitaCompleta(formulario({ nome: "   " }));

    expect(r).toEqual({ ok: false, erro: "Informe o nome da receita." });
    expect(gravacoes("receitas")).toHaveLength(0);
  });

  it("validade inválida: erro previsível, sem insert", async () => {
    preparar({ id: USER_ID });

    const r = await criarReceita(formulario({ nome: "Sopa", validade_congelado_dias: "0" }));

    expect(r.ok).toBe(false);
    expect(r).toMatchObject({ erro: expect.stringContaining("inteiro maior que zero") });
    expect(gravacoes("receitas")).toHaveLength(0);
  });

  it("nome repetido, sem diferenciar maiúsculas: erro previsível, sem insert", async () => {
    preparar({ id: USER_ID }, { receitas: { leitura: { data: [{ nome: "Sopa de Abóbora" }] } } });

    const r = await criarReceitaCompleta(formulario({ nome: "sopa de abóbora" }));

    expect(r).toMatchObject({ ok: false, erro: expect.stringContaining("Já existe") });
    expect(gravacoes("receitas")).toHaveLength(0);
  });

  it("falha ao ler duplicidade: bloqueia a criação, sem presumir que não há duplicata", async () => {
    preparar(
      { id: USER_ID },
      { receitas: { leitura: { error: { message: "falha interna" } } } }
    );

    const r = await criarReceitaCompleta(formulario({ nome: "Sopa" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_VALIDACAO });
    expect(gravacoes("receitas")).toHaveLength(0);
  });

  it("falha no insert: mensagem neutra, sem texto do banco", async () => {
    preparar(
      { id: USER_ID },
      { receitas: { escrita: { error: { message: "violates check pg_secret_constraint" } } } }
    );

    const r = await criarReceitaCompleta(formulario({ nome: "Sopa" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar a receita. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_secret");
  });

  it("sucesso no completo: grava com user_id da sessão e devolve o destino", async () => {
    preparar({ id: USER_ID });

    const r = await criarReceitaCompleta(
      formulario({ nome: "Sopa", user_id: OUTRA_USUARIA_ID, validade_congelado_dias: "60" })
    );

    expect(r).toEqual({ ok: true, destino: "/marmitas/receitas?receita_salva=1" });
    expect(gravacoes("receitas")[0]).toMatchObject({
      user_id: USER_ID,
      nome: "Sopa",
      validade_congelado_dias: 60,
    });
  });

  it("sucesso no cadastro rápido: devolve o destino do preparo", async () => {
    preparar({ id: USER_ID });

    const r = await criarReceita(formulario({ nome: "Caldo" }));

    expect(r).toEqual({ ok: true, destino: "/marmitas/preparo?receita_salva=1" });
    expect(gravacoes("receitas")[0]).toMatchObject({ user_id: USER_ID, nome: "Caldo" });
  });
});

describe("criarPreparo", () => {
  const preparoOk = {
    receitas: { leitura: { data: { id: "r1" } } },
  };

  it("campos obrigatórios ausentes: erro previsível, sem insert", async () => {
    preparar({ id: USER_ID }, preparoOk);

    expect(await criarPreparo(formulario({ receita_id: "r1" }))).toEqual({
      ok: false,
      erro: "Escolha a receita e a data do preparo.",
    });
    expect(gravacoes("preparos")).toHaveLength(0);
  });

  it.each(["0", "abc", "2.5", "-1"])("quantidade '%s' inválida: erro previsível, sem insert", async (q) => {
    preparar({ id: USER_ID }, preparoOk);

    const r = await criarPreparo(
      formulario({ receita_id: "r1", data_preparo: "2026-10-01", quantidade_porcoes: q })
    );

    expect(r).toEqual({ ok: false, erro: "Informe uma quantidade de porções maior que zero." });
    expect(gravacoes("preparos")).toHaveLength(0);
  });

  it("semana do ciclo fora de 1 a 4: erro previsível, sem insert", async () => {
    preparar({ id: USER_ID }, preparoOk);

    const r = await criarPreparo(
      formulario({ receita_id: "r1", data_preparo: "2026-10-01", quantidade_porcoes: "2", semana_ciclo: "5" })
    );

    expect(r).toEqual({ ok: false, erro: "A semana do ciclo deve ser de 1 a 4." });
    expect(gravacoes("preparos")).toHaveLength(0);
  });

  it("receita de outra usuária ou inexistente: erro previsível, sem insert", async () => {
    preparar({ id: USER_ID }, { receitas: { leitura: { data: null } } });

    const r = await criarPreparo(
      formulario({ receita_id: "r-de-outra", data_preparo: "2026-10-01", quantidade_porcoes: "2" })
    );

    expect(r).toEqual({
      ok: false,
      erro: "Receita não encontrada. Atualize a página e tente de novo.",
    });
    expect(temEq("receitas", "user_id", USER_ID)).toBe(true);
    expect(gravacoes("preparos")).toHaveLength(0);
  });

  it("falha ao ler a receita: bloqueia, sem afirmar que ela não existe", async () => {
    preparar({ id: USER_ID }, { receitas: { leitura: { error: { message: "falha" } } } });

    const r = await criarPreparo(
      formulario({ receita_id: "r1", data_preparo: "2026-10-01", quantidade_porcoes: "2" })
    );

    expect(r).toEqual({ ok: false, erro: MENSAGEM_VALIDACAO });
    expect(gravacoes("preparos")).toHaveLength(0);
  });

  it("falha no insert: mensagem neutra, sem texto técnico", async () => {
    preparar(
      { id: USER_ID },
      { ...preparoOk, preparos: { escrita: { error: { message: "invalid input syntax for type date pg_x" } } } }
    );

    const r = await criarPreparo(
      formulario({ receita_id: "r1", data_preparo: "2026-10-01", quantidade_porcoes: "2" })
    );

    expect(r).toEqual({
      ok: false,
      erro: "Não foi possível registrar o preparo. Tente novamente.",
    });
    expect(JSON.stringify(r)).not.toContain("pg_x");
  });

  it("sucesso: grava com user_id da sessão, mesmo se o formulário trouxer outro", async () => {
    preparar({ id: USER_ID }, preparoOk);

    const r = await criarPreparo(
      formulario({
        receita_id: "r1",
        data_preparo: "2026-10-01",
        quantidade_porcoes: "2",
        user_id: OUTRA_USUARIA_ID,
      })
    );

    expect(r).toEqual({ ok: true, destino: "/marmitas/estoque" });
    expect(gravacoes("preparos")[0]).toMatchObject({
      user_id: USER_ID,
      receita_id: "r1",
      quantidade_porcoes: 2,
      status: "congelado",
    });
  });
});

describe("criarItemCompra", () => {
  it("grupo inválido: erro previsível, sem insert", async () => {
    preparar({ id: USER_ID });

    const r = await criarItemCompra(formulario({ grupo: "inexistente", item: "Arroz" }));

    expect(r).toEqual({
      ok: false,
      erro: "Grupo inválido. Escolha uma das opções da lista.",
    });
    expect(gravacoes("itens_compra")).toHaveLength(0);
  });

  it("item vazio: erro previsível, sem insert", async () => {
    preparar({ id: USER_ID });

    expect(await criarItemCompra(formulario({ grupo: "despensa", item: "   " }))).toEqual({
      ok: false,
      erro: "Grupo e item são obrigatórios.",
    });
    expect(gravacoes("itens_compra")).toHaveLength(0);
  });

  it("item duplicado no mesmo grupo, sem diferenciar maiúsculas: erro, sem insert", async () => {
    preparar(
      { id: USER_ID },
      { itens_compra: { leitura: { data: [{ item: "Arroz integral " }] } } }
    );

    const r = await criarItemCompra(formulario({ grupo: "despensa", item: "arroz integral" }));

    expect(r).toMatchObject({ ok: false, erro: expect.stringContaining("já está na lista") });
    expect(gravacoes("itens_compra")).toHaveLength(0);
  });

  it("falha ao ler duplicidade: bloqueia o insert", async () => {
    preparar({ id: USER_ID }, { itens_compra: { leitura: { error: { message: "falha" } } } });

    const r = await criarItemCompra(formulario({ grupo: "despensa", item: "Arroz" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_VALIDACAO });
    expect(gravacoes("itens_compra")).toHaveLength(0);
  });

  it("falha no insert: mensagem neutra", async () => {
    preparar(
      { id: USER_ID },
      { itens_compra: { escrita: { error: { message: "pg_constraint_grupo" } } } }
    );

    const r = await criarItemCompra(formulario({ grupo: "despensa", item: "Arroz" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar o item. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_constraint");
  });

  it("sucesso: grava com user_id da sessão e devolve o destino", async () => {
    preparar({ id: USER_ID });

    const r = await criarItemCompra(formulario({ grupo: "despensa", item: "Arroz", user_id: OUTRA_USUARIA_ID }));

    expect(r).toEqual({ ok: true, destino: "/marmitas/compras?item_salvo=1" });
    expect(gravacoes("itens_compra")[0]).toMatchObject({ user_id: USER_ID, grupo: "despensa", item: "Arroz" });
  });
});

describe("salvarDiaCronograma", () => {
  it.each(["0", "5", "abc"])("semana '%s' inválida: erro previsível, sem gravação", async (semana) => {
    preparar({ id: USER_ID });

    const r = await salvarDiaCronograma(formulario({ semana_ciclo: semana, dia_semana: "Segunda" }));

    expect(r).toEqual({ ok: false, erro: "A semana do ciclo deve ser de 1 a 4." });
    expect(gravacoes("cronograma_planejado")).toHaveLength(0);
  });

  it("dia vazio: erro previsível, sem gravação", async () => {
    preparar({ id: USER_ID });

    expect(await salvarDiaCronograma(formulario({ semana_ciclo: "1", dia_semana: " " }))).toEqual({
      ok: false,
      erro: "Informe o dia da semana.",
    });
    expect(gravacoes("cronograma_planejado")).toHaveLength(0);
  });

  it("dia que não existe: erro previsível, sem gravação", async () => {
    preparar({ id: USER_ID });

    const r = await salvarDiaCronograma(formulario({ semana_ciclo: "1", dia_semana: "Funday" }));

    expect(r).toMatchObject({ ok: false, erro: expect.stringContaining("Dia da semana inválido") });
    expect(gravacoes("cronograma_planejado")).toHaveLength(0);
  });

  it("normaliza o dia para o nome padrão, sem acento nem maiúscula", async () => {
    preparar({ id: USER_ID });

    const r = await salvarDiaCronograma(
      formulario({ semana_ciclo: "2", dia_semana: "terca", proteina: "frango" })
    );

    expect(r).toEqual({ ok: true, destino: "/marmitas/cronograma?dia_salvo=1#semana-2" });
    expect(gravacoes("cronograma_planejado")[0]).toMatchObject({
      user_id: USER_ID,
      semana_ciclo: 2,
      dia_semana: "Terça",
      proteina: "frango",
    });
  });

  it("falha no upsert: mensagem neutra, sem texto técnico", async () => {
    preparar(
      { id: USER_ID },
      { cronograma_planejado: { escrita: { error: { message: "pg_unique_violation_semana" } } } }
    );

    const r = await salvarDiaCronograma(formulario({ semana_ciclo: "1", dia_semana: "Segunda" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar agora. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_");
  });
});
