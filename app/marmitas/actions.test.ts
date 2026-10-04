import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const OUTRA_USUARIA_ID = "00000000-0000-4000-8000-000000000002";

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
  criarPreparo,
  marcarConsumido,
} from "./actions";

type Chamada = { metodo: string; args: unknown[] };

/** Builder que registra cada chamada e resolve com `resultado` ao ser aguardado. */
function criarBuilder(resultado: unknown) {
  const chamadas: Chamada[] = [];
  const builder: Record<string, unknown> = {};
  for (const metodo of ["select", "eq", "update", "insert", "maybeSingle"]) {
    builder[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(resultado).then(resolve, reject);
  return { builder, chamadas };
}

const builders: Record<string, ReturnType<typeof criarBuilder>> = {};

function preparar(sessao: { id: string } | null, receitaExiste = true) {
  mocks.getUser.mockResolvedValue({ data: { user: sessao } });
  builders.receitas = criarBuilder({ data: receitaExiste ? { id: "r1" } : null, error: null });
  builders.preparos = criarBuilder({ error: null });
  builders.itens_compra = criarBuilder({ error: null });
  mocks.from.mockImplementation((tabela: string) => builders[tabela].builder);
}

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

function temEq(chamadas: Chamada[], coluna: string, valor: unknown) {
  return chamadas.some((c) => c.metodo === "eq" && c.args[0] === coluna && c.args[1] === valor);
}

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  for (const k of Object.keys(builders)) delete builders[k];
});

describe("sessão obrigatória nas actions de Marmitas", () => {
  it("marcarConsumido sem sessão redireciona para login e não toca no banco", async () => {
    preparar(null);

    await expect(marcarConsumido(formulario({ id: "p1" }))).rejects.toThrow("REDIRECT:/login");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("alternarTenhoEmCasa sem sessão redireciona para login e não toca no banco", async () => {
    preparar(null);

    await expect(
      alternarTenhoEmCasa(formulario({ id: "i1", tenho_em_casa: "false" }))
    ).rejects.toThrow("REDIRECT:/login");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("criarPreparo sem sessão redireciona para login e não toca no banco", async () => {
    preparar(null);

    await expect(
      criarPreparo(formulario({ receita_id: "r1", data_preparo: "2026-10-01", quantidade_porcoes: "2" }))
    ).rejects.toThrow("REDIRECT:/login");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe("marcarConsumido — filtro por id e user_id", () => {
  it("atualiza com .eq('id') e .eq('user_id') da sessão", async () => {
    preparar({ id: USER_ID });

    await expect(marcarConsumido(formulario({ id: "p1" }))).resolves.toBeUndefined();

    const { chamadas } = builders.preparos;
    expect(temEq(chamadas, "id", "p1")).toBe(true);
    expect(temEq(chamadas, "user_id", USER_ID)).toBe(true);
    expect(chamadas.find((c) => c.metodo === "update")?.args[0]).toMatchObject({
      status: "consumido",
    });
  });

  it("ignora qualquer user_id enviado no formulário", async () => {
    preparar({ id: USER_ID });

    await marcarConsumido(formulario({ id: "p1", user_id: OUTRA_USUARIA_ID }));

    const { chamadas } = builders.preparos;
    expect(temEq(chamadas, "user_id", USER_ID)).toBe(true);
    expect(temEq(chamadas, "user_id", OUTRA_USUARIA_ID)).toBe(false);
  });
});

describe("alternarTenhoEmCasa — filtro por id e user_id", () => {
  it("inverte o valor e filtra por id e user_id da sessão", async () => {
    preparar({ id: USER_ID });

    await alternarTenhoEmCasa(formulario({ id: "i1", tenho_em_casa: "true" }));

    const { chamadas } = builders.itens_compra;
    expect(chamadas.find((c) => c.metodo === "update")?.args[0]).toEqual({
      tenho_em_casa: false,
    });
    expect(temEq(chamadas, "id", "i1")).toBe(true);
    expect(temEq(chamadas, "user_id", USER_ID)).toBe(true);
  });
});

describe("criarPreparo — user_id da sessão e receita da própria usuária", () => {
  it("grava user_id da sessão, mesmo se o formulário trouxer outro", async () => {
    preparar({ id: USER_ID });

    await expect(
      criarPreparo(
        formulario({
          receita_id: "r1",
          data_preparo: "2026-10-01",
          quantidade_porcoes: "2",
          user_id: OUTRA_USUARIA_ID,
        })
      )
    ).rejects.toThrow("REDIRECT:/marmitas/estoque");

    const insert = builders.preparos.chamadas.find((c) => c.metodo === "insert");
    expect(insert?.args[0]).toMatchObject({ user_id: USER_ID, receita_id: "r1" });
  });

  it("confere que a receita pertence à sessão antes de inserir", async () => {
    preparar({ id: USER_ID }, false);

    await expect(
      criarPreparo(formulario({ receita_id: "r-de-outra", data_preparo: "2026-10-01", quantidade_porcoes: "2" }))
    ).rejects.toThrow("Receita não encontrada");

    const { chamadas } = builders.receitas;
    expect(temEq(chamadas, "id", "r-de-outra")).toBe(true);
    expect(temEq(chamadas, "user_id", USER_ID)).toBe(true);
    expect(builders.preparos.chamadas.some((c) => c.metodo === "insert")).toBe(false);
  });
});
