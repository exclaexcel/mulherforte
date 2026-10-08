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

import { atualizarItemCompra } from "./actions";

type Chamada = { metodo: string; args: unknown[] };
type ConfigTabela = {
  /** Resultado de `.maybeSingle()` — busca do grupo atual do item. */
  leituraAtual?: { data?: { grupo: string } | null; error?: unknown };
  /** Resultado da checagem de duplicidade (lista, sem maybeSingle). */
  leituraDuplicidade?: { data?: unknown[]; error?: unknown };
  /** Resultado do update. */
  escrita?: { data?: unknown[] | null; error?: unknown };
};

let configs: Record<string, ConfigTabela> = {};
let registros: { tabela: string; chamadas: Chamada[] }[] = [];

function criarBuilder(tabela: string) {
  const chamadas: Chamada[] = [];
  const builder: Record<string, unknown> = {};
  for (const metodo of ["select", "eq", "neq", "maybeSingle", "update"]) {
    builder[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
    const cfg = configs[tabela] ?? {};
    const escrevendo = chamadas.some((c) => c.metodo === "update");
    const comMaybeSingle = chamadas.some((c) => c.metodo === "maybeSingle");

    let resultado: unknown;
    if (escrevendo) {
      resultado = { data: cfg.escrita?.data ?? [{ id: "linha" }], error: cfg.escrita?.error ?? null };
    } else if (comMaybeSingle) {
      resultado = {
        data: cfg.leituraAtual?.data === undefined ? { grupo: "despensa" } : cfg.leituraAtual.data,
        error: cfg.leituraAtual?.error ?? null,
      };
    } else {
      resultado = {
        data: cfg.leituraDuplicidade?.data ?? [],
        error: cfg.leituraDuplicidade?.error ?? null,
      };
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

describe("atualizarItemCompra", () => {
  it("sem id: erro previsível, sem acessar o banco", async () => {
    preparar();

    const r = await atualizarItemCompra(formulario({ item: "Arroz" }));

    expect(r).toEqual({ ok: false, erro: "Item não encontrado. Atualize a página e tente de novo." });
    expect(chamadas("itens_compra", "update")).toHaveLength(0);
  });

  it("item vazio: erro previsível, sem acessar o banco", async () => {
    preparar();

    const r = await atualizarItemCompra(formulario({ id: "i1", item: "   " }));

    expect(r).toEqual({ ok: false, erro: "Informe o nome do item." });
    expect(chamadas("itens_compra", "update")).toHaveLength(0);
  });

  it("item não encontrado (leitura do grupo vazia): erro previsível", async () => {
    preparar({ itens_compra: { leituraAtual: { data: null } } });

    const r = await atualizarItemCompra(formulario({ id: "i1", item: "Arroz" }));

    expect(r).toEqual({ ok: false, erro: "Item não encontrado. Atualize a página e tente de novo." });
    expect(chamadas("itens_compra", "update")).toHaveLength(0);
  });

  it("falha ao ler o item atual: mensagem neutra, sem gravar", async () => {
    preparar({ itens_compra: { leituraAtual: { error: { message: "falha" } } } });

    const r = await atualizarItemCompra(formulario({ id: "i1", item: "Arroz" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_VALIDACAO });
    expect(chamadas("itens_compra", "update")).toHaveLength(0);
  });

  it("nome repetido no mesmo grupo (sem diferenciar maiúsculas): erro previsível", async () => {
    preparar({
      itens_compra: {
        leituraAtual: { data: { grupo: "despensa" } },
        leituraDuplicidade: { data: [{ item: "Arroz integral " }] },
      },
    });

    const r = await atualizarItemCompra(formulario({ id: "i1", item: "arroz integral" }));

    expect(r).toMatchObject({ ok: false, erro: expect.stringContaining("já está na lista") });
    expect(chamadas("itens_compra", "update")).toHaveLength(0);
  });

  it("a checagem de duplicidade exclui o próprio item (neq id)", async () => {
    preparar({ itens_compra: { leituraAtual: { data: { grupo: "despensa" } } } });

    await atualizarItemCompra(formulario({ id: "i1", item: "Arroz" }));

    expect(chamadas("itens_compra", "neq").some((c) => c.args[0] === "id" && c.args[1] === "i1")).toBe(
      true
    );
  });

  it("falha ao checar duplicidade: mensagem neutra, sem gravar", async () => {
    preparar({
      itens_compra: {
        leituraAtual: { data: { grupo: "despensa" } },
        leituraDuplicidade: { error: { message: "falha" } },
      },
    });

    const r = await atualizarItemCompra(formulario({ id: "i1", item: "Arroz" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_VALIDACAO });
    expect(chamadas("itens_compra", "update")).toHaveLength(0);
  });

  it("sucesso: grava filtrando por id e user_id, destino correto", async () => {
    preparar({ itens_compra: { leituraAtual: { data: { grupo: "despensa" } } } });

    const r = await atualizarItemCompra(formulario({ id: "i1", item: "Arroz integral" }));

    expect(r).toEqual({ ok: true, destino: "/marmitas/compras?item_atualizado=1" });
    expect(temEq("itens_compra", "id", "i1")).toBe(true);
    expect(temEq("itens_compra", "user_id", USER_ID)).toBe(true);
    expect(chamadas("itens_compra", "update")[0].args[0]).toEqual({ item: "Arroz integral" });
  });

  it("zero linhas atualizadas: item não encontrado", async () => {
    preparar({
      itens_compra: { leituraAtual: { data: { grupo: "despensa" } }, escrita: { data: [] } },
    });

    const r = await atualizarItemCompra(formulario({ id: "i1", item: "Arroz" }));

    expect(r).toEqual({ ok: false, erro: "Item não encontrado. Atualize a página e tente de novo." });
  });

  it("falha de gravação: mensagem neutra, sem texto técnico", async () => {
    preparar({
      itens_compra: {
        leituraAtual: { data: { grupo: "despensa" } },
        escrita: { error: { message: "pg_update_secreto" } },
      },
    });

    const r = await atualizarItemCompra(formulario({ id: "i1", item: "Arroz" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar o item. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_");
  });
});
