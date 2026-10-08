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

import { atualizarReceita, excluirReceita } from "./actions";

type Chamada = { metodo: string; args: unknown[] };
type ConfigTabela = {
  /** Resultado de uma leitura comum (checagem de nome duplicado). */
  leitura?: { data?: unknown[]; error?: unknown };
  /** Resultado de um select com `{ count: "exact", head: true }` (checagem de preparos). */
  contagem?: { count?: number; error?: unknown };
  /** Resultado de um update ou delete. */
  escrita?: { data?: unknown[] | null; error?: unknown };
};

let configs: Record<string, ConfigTabela> = {};
let registros: { tabela: string; chamadas: Chamada[] }[] = [];

/** Builder único: decide a resposta pela combinação de chamadas feitas na cadeia. */
function criarBuilder(tabela: string) {
  const chamadas: Chamada[] = [];
  const builder: Record<string, unknown> = {};
  for (const metodo of ["select", "eq", "neq", "maybeSingle", "update", "delete"]) {
    builder[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
    const cfg = configs[tabela] ?? {};
    const escrevendo = chamadas.some((c) => c.metodo === "update" || c.metodo === "delete");
    const selectComContagem = chamadas.some(
      (c) => c.metodo === "select" && Boolean((c.args[1] as { count?: string } | undefined)?.count)
    );

    let resultado: unknown;
    if (escrevendo) {
      resultado = { data: cfg.escrita?.data ?? [{ id: "linha" }], error: cfg.escrita?.error ?? null };
    } else if (selectComContagem) {
      resultado = { count: cfg.contagem?.count ?? 0, error: cfg.contagem?.error ?? null };
    } else {
      resultado = { data: cfg.leitura?.data ?? [], error: cfg.leitura?.error ?? null };
    }

    return Promise.resolve(resultado).then(resolve, reject);
  };
  registros.push({ tabela, chamadas });
  return builder;
}

function preparar(cfg: Record<string, ConfigTabela> = {}) {
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

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  registros = [];
  configs = {};
});

describe("atualizarReceita", () => {
  it("sem id: erro previsível, sem gravação", async () => {
    preparar();

    const r = await atualizarReceita(formulario({ nome: "Sopa" }));

    expect(r).toEqual({ ok: false, erro: "Receita não encontrada. Atualize a página e tente de novo." });
    expect(chamadas("receitas", "update")).toHaveLength(0);
  });

  it("nome vazio: erro de validação, sem checar duplicidade", async () => {
    preparar();

    const r = await atualizarReceita(formulario({ id: "r1", nome: "  " }));

    expect(r).toEqual({ ok: false, erro: "Informe o nome da receita." });
    expect(chamadas("receitas", "update")).toHaveLength(0);
  });

  it("nome repetido com outra receita (sem diferenciar maiúsculas): erro previsível", async () => {
    preparar({ receitas: { leitura: { data: [{ nome: "Sopa" }] } } });

    const r = await atualizarReceita(formulario({ id: "r1", nome: "sopa" }));

    expect(r).toMatchObject({ ok: false, erro: expect.stringContaining('Já existe uma receita') });
    expect(chamadas("receitas", "update")).toHaveLength(0);
  });

  it("a checagem de duplicidade exclui a própria receita (neq id)", async () => {
    preparar({ receitas: { leitura: { data: [] } } });

    await atualizarReceita(formulario({ id: "r1", nome: "Sopa" }));

    expect(chamadas("receitas", "neq").some((c) => c.args[0] === "id" && c.args[1] === "r1")).toBe(true);
  });

  it("falha ao checar duplicidade: mensagem neutra, sem gravar", async () => {
    preparar({ receitas: { leitura: { error: { message: "pg_leitura_secreta" } } } });

    const r = await atualizarReceita(formulario({ id: "r1", nome: "Sopa" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_VALIDACAO });
    expect(chamadas("receitas", "update")).toHaveLength(0);
  });

  it("sucesso: grava filtrando por id e user_id, destino correto", async () => {
    preparar({ receitas: { leitura: { data: [] } } });

    const r = await atualizarReceita(formulario({ id: "r1", nome: "Sopa de abóbora" }));

    expect(r).toEqual({ ok: true, destino: "/marmitas/receitas?receita_atualizada=1" });
    expect(temEq("receitas", "id", "r1")).toBe(true);
    expect(temEq("receitas", "user_id", USER_ID)).toBe(true);
    expect(chamadas("receitas", "update")[0].args[0]).toMatchObject({ nome: "Sopa de abóbora" });
  });

  it("zero linhas atualizadas: receita não encontrada", async () => {
    preparar({ receitas: { leitura: { data: [] }, escrita: { data: [] } } });

    const r = await atualizarReceita(formulario({ id: "r1", nome: "Sopa" }));

    expect(r).toEqual({ ok: false, erro: "Receita não encontrada. Atualize a página e tente de novo." });
  });

  it("falha de gravação: mensagem neutra, sem texto técnico", async () => {
    preparar({
      receitas: { leitura: { data: [] }, escrita: { error: { message: "pg_update_secreto" } } },
    });

    const r = await atualizarReceita(formulario({ id: "r1", nome: "Sopa" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar a receita. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_");
  });
});

describe("excluirReceita", () => {
  it("sem id: erro previsível, sem acessar o banco", async () => {
    preparar();

    const r = await excluirReceita(formulario({}));

    expect(r).toEqual({ ok: false, erro: "Receita não encontrada. Atualize a página e tente de novo." });
    expect(chamadas("receitas", "delete")).toHaveLength(0);
  });

  it("com preparo vinculado: bloqueia com mensagem clara, sem excluir", async () => {
    preparar({ preparos: { contagem: { count: 2 } } });

    const r = await excluirReceita(formulario({ id: "r1" }));

    expect(r).toEqual({
      ok: false,
      erro: "Essa receita já tem preparos registrados e não pode ser excluída. Você pode editá-la.",
    });
    expect(chamadas("receitas", "delete")).toHaveLength(0);
  });

  it("falha ao checar preparos vinculados: mensagem neutra, não exclui", async () => {
    preparar({ preparos: { contagem: { error: { message: "pg_contagem_secreta" } } } });

    const r = await excluirReceita(formulario({ id: "r1" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_VALIDACAO });
    expect(chamadas("receitas", "delete")).toHaveLength(0);
  });

  it("sem preparo vinculado: exclui filtrando por id e user_id", async () => {
    preparar({ preparos: { contagem: { count: 0 } } });

    const r = await excluirReceita(formulario({ id: "r1" }));

    expect(r).toEqual({ ok: true, destino: "/marmitas/receitas?receita_excluida=1" });
    expect(temEq("receitas", "id", "r1")).toBe(true);
    expect(temEq("receitas", "user_id", USER_ID)).toBe(true);
  });

  it("zero linhas excluídas: receita não encontrada", async () => {
    preparar({ preparos: { contagem: { count: 0 } }, receitas: { escrita: { data: [] } } });

    const r = await excluirReceita(formulario({ id: "r1" }));

    expect(r).toEqual({ ok: false, erro: "Receita não encontrada. Atualize a página e tente de novo." });
  });

  it("falha na exclusão: mensagem neutra, sem texto técnico", async () => {
    preparar({
      preparos: { contagem: { count: 0 } },
      receitas: { escrita: { error: { message: "pg_delete_secreto" } } },
    });

    const r = await excluirReceita(formulario({ id: "r1" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível excluir a receita. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_");
  });
});
