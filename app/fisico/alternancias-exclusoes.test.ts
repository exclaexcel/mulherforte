import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const MENSAGEM_ATUALIZAR = "Não foi possível atualizar agora. Tente novamente.";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser }, from: mocks.from }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import {
  alternarProteina,
  excluirHabitosHoje,
  excluirMedidasHoje,
  excluirPesoHoje,
  excluirTreinoHoje,
} from "./actions";

type Chamada = { metodo: string; args: unknown[] };
type Config = {
  leitura?: { data?: unknown; error?: unknown };
  escrita?: { data?: unknown[]; error?: unknown };
};

const ESCRITAS = ["upsert", "insert", "update", "delete"];
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
  mocks.revalidatePath.mockReset();
  registros = [];
  configs = {};
});

describe("alternarProteina — estado vem do banco e água não é tocada", () => {
  it("inverte a proteína lida do banco (falso vira verdadeiro)", async () => {
    preparar({ adesao_habitos: { leitura: { data: { priorizou_proteina: false } } } });

    const r = await alternarProteina();

    expect(r).toEqual({ ok: true, destino: "/fisico/habitos" });
    expect(chamadas("adesao_habitos", "upsert")[0].args[0]).toMatchObject({ priorizou_proteina: true });
    expect(temEq("adesao_habitos", "user_id", USER_ID)).toBe(true);
  });

  it("sem registro do dia: começa de falso e grava verdadeiro", async () => {
    preparar({ adesao_habitos: { leitura: { data: null } } });

    await alternarProteina();

    expect(chamadas("adesao_habitos", "upsert")[0].args[0]).toMatchObject({ priorizou_proteina: true });
  });

  it("o payload só carrega a proteína: quantidade de água fica como está", async () => {
    preparar({ adesao_habitos: { leitura: { data: { priorizou_proteina: true } } } });

    await alternarProteina();

    const payload = chamadas("adesao_habitos", "upsert")[0].args[0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["data", "priorizou_proteina", "user_id"]);
  });

  it("falha de leitura bloqueia a gravação", async () => {
    preparar({ adesao_habitos: { leitura: { error: { message: "pg_leitura_habitos" } } } });

    const r = await alternarProteina();

    expect(r).toEqual({ ok: false, erro: MENSAGEM_ATUALIZAR });
    expect(chamadas("adesao_habitos", "upsert")).toHaveLength(0);
    expect(JSON.stringify(r)).not.toContain("pg_leitura");
  });

  it("falha de gravação: mensagem neutra", async () => {
    preparar({
      adesao_habitos: { leitura: { data: null }, escrita: { error: { message: "pg_upsert" } } },
    });

    const r = await alternarProteina();

    expect(r).toEqual({ ok: false, erro: MENSAGEM_ATUALIZAR });
    expect(JSON.stringify(r)).not.toContain("pg_upsert");
  });
});

describe.each([
  ["excluirPesoHoje", excluirPesoHoje, "registros_peso", "/fisico/peso?registro_excluido=1"],
  ["excluirMedidasHoje", excluirMedidasHoje, "medidas_corporais", "/fisico/medidas?registro_excluido=1"],
  ["excluirTreinoHoje", excluirTreinoHoje, "adesao_treino", "/fisico/treino?registro_excluido=1"],
  ["excluirHabitosHoje", excluirHabitosHoje, "adesao_habitos", "/fisico/habitos?registro_excluido=1"],
])("%s — exclusão segura", (_nome, excluir, tabela, destino) => {
  it("sucesso: filtra por user_id e data, e devolve o destino", async () => {
    preparar();

    expect(await excluir()).toEqual({ ok: true, destino });
    expect(temEq(tabela, "user_id", USER_ID)).toBe(true);
    expect(chamadas(tabela, "delete")).toHaveLength(1);
  });

  it("zero linhas apagadas não é sucesso", async () => {
    preparar({ [tabela]: { escrita: { data: [] } } });

    const r = await excluir();

    expect(r).toEqual({
      ok: false,
      erro: "Não há registro de hoje para excluir. Atualize a página.",
    });
  });

  it("falha do banco: mensagem neutra, sem nome de tabela nem detalhe", async () => {
    preparar({ [tabela]: { escrita: { error: { message: `violates ${tabela} pg_excluir` } } } });

    const r = await excluir();

    expect(r).toEqual({ ok: false, erro: "Não foi possível excluir o registro agora. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain(tabela);
    expect(JSON.stringify(r)).not.toContain("pg_");
  });

  it("não revalida nada quando a exclusão falha", async () => {
    preparar({ [tabela]: { escrita: { error: { message: "falha" } } } });

    await excluir();

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
