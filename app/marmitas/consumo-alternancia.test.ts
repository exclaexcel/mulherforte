import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const MENSAGEM_ITEM = "Não foi possível atualizar o item agora. Tente novamente.";

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

import { alternarTenhoEmCasa, marcarConsumido } from "../marmitas/actions";

type Chamada = { metodo: string; args: unknown[] };
type Config = {
  leitura?: { data?: unknown; error?: unknown };
  /** Escrita (update/insert/upsert): `data` são as linhas afetadas. */
  escrita?: { data?: unknown[]; error?: unknown };
};

const ESCRITAS = ["insert", "upsert", "update", "delete"];
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
      : { data: cfg.leitura?.data ?? null, error: cfg.leitura?.error ?? null };
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

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  registros = [];
  configs = {};
});

describe("alternarTenhoEmCasa — estado vem do banco, não do formulário", () => {
  it("inverte o valor gravado mesmo se o formulário trouxer o valor antigo", async () => {
    preparar({ itens_compra: { leitura: { data: { tenho_em_casa: true } } } });

    // A tela antiga diz "false", mas o banco diz "true": a gravação parte do banco.
    const r = await alternarTenhoEmCasa(formulario({ id: "i1", tenho_em_casa: "false" }));

    expect(r).toEqual({ ok: true, destino: "/marmitas/compras" });
    expect(chamadas("itens_compra", "update")[0].args[0]).toEqual({ tenho_em_casa: false });
    expect(temEq("itens_compra", "id", "i1")).toBe(true);
    expect(temEq("itens_compra", "user_id", USER_ID)).toBe(true);
  });

  it("falha de leitura bloqueia a gravação e mostra mensagem neutra", async () => {
    preparar({ itens_compra: { leitura: { error: { message: "pg_secret_leitura" } } } });

    const r = await alternarTenhoEmCasa(formulario({ id: "i1" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_ITEM });
    expect(chamadas("itens_compra", "update")).toHaveLength(0);
    expect(JSON.stringify(r)).not.toContain("pg_secret");
  });

  it("item inexistente ou de outra usuária: não grava e avisa", async () => {
    preparar({ itens_compra: { leitura: { data: null } } });

    const r = await alternarTenhoEmCasa(formulario({ id: "de-outra" }));

    expect(r).toEqual({
      ok: false,
      erro: "Item não encontrado. Atualize a página e tente de novo.",
    });
    expect(chamadas("itens_compra", "update")).toHaveLength(0);
  });

  it("zero linhas alteradas na gravação não é sucesso", async () => {
    preparar({
      itens_compra: { leitura: { data: { tenho_em_casa: false } }, escrita: { data: [] } },
    });

    expect(await alternarTenhoEmCasa(formulario({ id: "i1" }))).toEqual({ ok: false, erro: MENSAGEM_ITEM });
  });

  it("erro de gravação: mensagem neutra, sem texto técnico", async () => {
    preparar({
      itens_compra: { leitura: { data: { tenho_em_casa: false } }, escrita: { error: { message: "pg_x" } } },
    });

    const r = await alternarTenhoEmCasa(formulario({ id: "i1" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_ITEM });
    expect(JSON.stringify(r)).not.toContain("pg_x");
  });

  it("sem id: erro previsível, sem consulta", async () => {
    preparar();

    expect(await alternarTenhoEmCasa(formulario({}))).toEqual({
      ok: false,
      erro: "Item inválido. Atualize a página e tente de novo.",
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("marcarConsumido — confirma a linha alterada e filtra por id e user_id", () => {
  it("sucesso: atualiza com id e user_id da sessão e devolve o destino", async () => {
    preparar();

    const r = await marcarConsumido(formulario({ id: "p1" }));

    expect(r).toEqual({ ok: true, destino: "/marmitas/estoque" });
    expect(chamadas("preparos", "update")[0].args[0]).toMatchObject({ status: "consumido" });
    expect(temEq("preparos", "id", "p1")).toBe(true);
    expect(temEq("preparos", "user_id", USER_ID)).toBe(true);
  });

  it("zero linhas alteradas: não é sucesso falso", async () => {
    preparar({ preparos: { escrita: { data: [] } } });

    expect(await marcarConsumido(formulario({ id: "p-de-outra" }))).toEqual({
      ok: false,
      erro: "Preparo não encontrado. Atualize a página e tente de novo.",
    });
  });

  it("erro de gravação: mensagem neutra, sem texto técnico", async () => {
    preparar({ preparos: { escrita: { error: { message: "pg_consumo" } } } });

    const r = await marcarConsumido(formulario({ id: "p1" }));

    expect(r).toEqual({
      ok: false,
      erro: "Não foi possível registrar o consumo agora. Tente novamente.",
    });
    expect(JSON.stringify(r)).not.toContain("pg_consumo");
  });

  it("sem id: erro previsível, sem gravação", async () => {
    preparar();

    expect(await marcarConsumido(formulario({}))).toEqual({
      ok: false,
      erro: "Preparo inválido. Atualize a página e tente de novo.",
    });
    expect(chamadas("preparos", "update")).toHaveLength(0);
  });
});
