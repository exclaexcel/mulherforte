import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";
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

import { editarPreparo, excluirPreparoRegistro } from "./actions";

type Chamada = { metodo: string; args: unknown[] };
type Config = {
  /** Resultado de `.maybeSingle()` — busca da receita (confere que é da usuária). */
  leitura?: { data?: unknown; error?: unknown };
  /** Resultado da escrita (update/delete): `data` são as linhas afetadas. */
  escrita?: { data?: unknown[]; error?: unknown };
};

const ESCRITAS = ["update", "delete"];
let configs: Record<string, Config> = {};
let registros: { tabela: string; chamadas: Chamada[] }[] = [];

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
    const escrevendo = chamadas.some((c) => ESCRITAS.includes(c.metodo));
    const resultado = escrevendo
      ? { data: cfg.escrita?.data ?? [{ id: "linha" }], error: cfg.escrita?.error ?? null }
      : { data: cfg.leitura?.data === undefined ? { id: "r1" } : cfg.leitura.data, error: cfg.leitura?.error ?? null };
    return Promise.resolve(resultado).then(resolve, reject);
  };
  registros.push({ tabela, chamadas });
  return builder;
}

function preparar(cfg: Record<string, Config> = {}) {
  configs = cfg;
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  mocks.from.mockImplementation((tabela: string) => criarBuilder(tabela));
}

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

function chamadas(tabela: string, metodo: string) {
  return registros
    .filter((r) => r.tabela === tabela)
    .flatMap((r) => r.chamadas)
    .filter((c) => c.metodo === metodo);
}

function temEq(tabela: string, coluna: string, valor: unknown) {
  return chamadas(tabela, "eq").some((c) => c.args[0] === coluna && c.args[1] === valor);
}

function gravacoes(tabela: string) {
  return chamadas(tabela, "update").map((c) => c.args[0] as Record<string, unknown>);
}

const CAMPOS_VALIDOS = {
  id: "p1",
  receita_id: "r1",
  data_preparo: "2026-10-05",
  quantidade_porcoes: "4",
};

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  registros = [];
  configs = {};
});

describe("sessão obrigatória", () => {
  it("editarPreparo sem sessão redireciona para login e não toca no banco", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(editarPreparo(formulario(CAMPOS_VALIDOS))).rejects.toThrow("REDIRECT:/login");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("excluirPreparoRegistro sem sessão redireciona para login e não toca no banco", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    await expect(excluirPreparoRegistro(formulario({ id: "p1" }))).rejects.toThrow("REDIRECT:/login");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("editarPreparo", () => {
  it("sem id ou sem receita: erro previsível, sem acessar o banco", async () => {
    preparar();

    expect(await editarPreparo(formulario({ ...CAMPOS_VALIDOS, id: "" }))).toEqual({
      ok: false,
      erro: "Escolha a receita e a data do preparo.",
    });
    expect(await editarPreparo(formulario({ ...CAMPOS_VALIDOS, receita_id: "" }))).toEqual({
      ok: false,
      erro: "Escolha a receita e a data do preparo.",
    });
    expect(chamadas("preparos", "update")).toHaveLength(0);
  });

  it("data inválida: erro previsível, sem gravar", async () => {
    preparar();

    const r = await editarPreparo(formulario({ ...CAMPOS_VALIDOS, data_preparo: "2026-02-30" }));

    expect(r).toEqual({ ok: false, erro: "Data inválida." });
    expect(chamadas("preparos", "update")).toHaveLength(0);
  });

  it("quantidade inválida: erro previsível, sem gravar", async () => {
    preparar();

    const r = await editarPreparo(formulario({ ...CAMPOS_VALIDOS, quantidade_porcoes: "0" }));

    expect(r).toEqual({ ok: false, erro: "Informe uma quantidade de porções maior que zero." });
    expect(chamadas("preparos", "update")).toHaveLength(0);
  });

  it("receita não encontrada (de outra usuária ou removida): erro previsível", async () => {
    preparar({ receitas: { leitura: { data: null } } });

    const r = await editarPreparo(formulario(CAMPOS_VALIDOS));

    expect(r).toEqual({ ok: false, erro: "Receita não encontrada. Atualize a página e tente de novo." });
    expect(chamadas("preparos", "update")).toHaveLength(0);
  });

  it("falha ao checar a receita: mensagem neutra, sem gravar", async () => {
    preparar({ receitas: { leitura: { error: { message: "falha" } } } });

    const r = await editarPreparo(formulario(CAMPOS_VALIDOS));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_VALIDACAO });
    expect(chamadas("preparos", "update")).toHaveLength(0);
  });

  it("sucesso: grava os 4 campos, filtra por id, user_id e status=congelado", async () => {
    preparar();

    const r = await editarPreparo(
      formulario({ ...CAMPOS_VALIDOS, observacoes: "  sem cebola  " })
    );

    expect(r).toEqual({ ok: true, destino: "/marmitas/estoque?preparo_corrigido=1" });
    expect(temEq("preparos", "id", "p1")).toBe(true);
    expect(temEq("preparos", "user_id", USER_ID)).toBe(true);
    expect(temEq("preparos", "status", "congelado")).toBe(true);
    expect(gravacoes("preparos")[0]).toMatchObject({
      receita_id: "r1",
      data_preparo: "2026-10-05",
      quantidade_porcoes: 4,
      observacoes: "sem cebola",
    });
  });

  it("observações vazias viram null, não string vazia", async () => {
    preparar();

    await editarPreparo(formulario(CAMPOS_VALIDOS));

    expect(gravacoes("preparos")[0]).toMatchObject({ observacoes: null });
  });

  it("zero linhas (já consumido/descartado): erro previsível", async () => {
    preparar({ preparos: { escrita: { data: [] } } });

    const r = await editarPreparo(formulario(CAMPOS_VALIDOS));

    expect(r).toEqual({
      ok: false,
      erro: "Preparo não encontrado ou já consumido/descartado. Atualize a página e tente de novo.",
    });
  });

  it("falha de gravação: mensagem neutra, sem texto técnico", async () => {
    preparar({ preparos: { escrita: { error: { message: "pg_update_secreto" } } } });

    const r = await editarPreparo(formulario(CAMPOS_VALIDOS));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar a correção. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_");
  });
});

describe("excluirPreparoRegistro", () => {
  it("sem id: erro previsível, sem acessar o banco", async () => {
    preparar();

    const r = await excluirPreparoRegistro(formulario({}));

    expect(r).toEqual({ ok: false, erro: "Preparo não encontrado. Atualize a página e tente de novo." });
    expect(chamadas("preparos", "delete")).toHaveLength(0);
  });

  it("sucesso: apaga filtrando por id, user_id e status=congelado", async () => {
    preparar({ preparos: { escrita: { data: [{ id: "p1" }] } } });

    const r = await excluirPreparoRegistro(formulario({ id: "p1" }));

    expect(r).toEqual({ ok: true, destino: "/marmitas/estoque?preparo_excluido=1" });
    expect(temEq("preparos", "id", "p1")).toBe(true);
    expect(temEq("preparos", "user_id", USER_ID)).toBe(true);
    expect(temEq("preparos", "status", "congelado")).toBe(true);
  });

  it("zero linhas (já consumido/descartado): erro previsível", async () => {
    preparar({ preparos: { escrita: { data: [] } } });

    const r = await excluirPreparoRegistro(formulario({ id: "p1" }));

    expect(r).toEqual({
      ok: false,
      erro: "Preparo não encontrado ou já consumido/descartado. Atualize a página e tente de novo.",
    });
  });

  it("falha ao excluir: mensagem neutra, sem texto técnico", async () => {
    preparar({ preparos: { escrita: { error: { message: "pg_delete_secreto" } } } });

    const r = await excluirPreparoRegistro(formulario({ id: "p1" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível excluir o preparo agora. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_");
  });
});
