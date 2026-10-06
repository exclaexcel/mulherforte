import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";

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

import { criarPreparo } from "./actions";

let inserts: Record<string, unknown>[] = [];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-05T15:00:00Z"));
  inserts = [];
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  mocks.from.mockImplementation((tabela: string) => {
    const builder: Record<string, unknown> = {};
    for (const metodo of ["select", "eq"]) builder[metodo] = () => builder;
    builder.maybeSingle = () => builder;
    builder.insert = (payload: Record<string, unknown>) => {
      if (tabela === "preparos") inserts.push(payload);
      return builder;
    };
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: { id: "r1" }, error: null }).then(resolve);
    return builder;
  });
});

afterEach(() => {
  vi.useRealTimers();
});

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

describe("criarPreparo — data do preparo não pode estar no futuro", () => {
  it("data futura é recusada sem inserir", async () => {
    expect(
      await criarPreparo(formulario({ receita_id: "r1", data_preparo: "2026-10-06", quantidade_porcoes: "2" }))
    ).toEqual({ ok: false, erro: "A data não pode estar no futuro." });
    expect(inserts).toHaveLength(0);
  });

  it("data de hoje é aceita", async () => {
    const r = await criarPreparo(
      formulario({ receita_id: "r1", data_preparo: "2026-10-05", quantidade_porcoes: "2" })
    );

    expect(r.ok).toBe(true);
    expect(inserts).toHaveLength(1);
  });
});
