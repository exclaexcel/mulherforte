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

import { salvarPerfil } from "./actions";

let gravacoes: Record<string, unknown>[] = [];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-05T15:00:00Z"));
  gravacoes = [];
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  mocks.from.mockImplementation(() => ({
    upsert: (payload: Record<string, unknown>) => {
      gravacoes.push(payload);
      return Promise.resolve({ error: null });
    },
  }));
});

afterEach(() => {
  vi.useRealTimers();
});

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

describe("data de nascimento: UTC foi removido, data futura é recusada", () => {
  it("nascimento futuro é recusado, sem gravação", async () => {
    expect(await salvarPerfil(formulario({ nome: "Dany", data_nascimento: "2026-10-06" }))).toEqual({
      ok: false,
      erro: "A data não pode estar no futuro.",
    });
    expect(gravacoes).toHaveLength(0);
  });

  it("nascimento de hoje é aceito", async () => {
    expect((await salvarPerfil(formulario({ nome: "Dany", data_nascimento: "2026-10-05" }))).ok).toBe(true);
  });

  it("data que não existe é recusada como inválida, não como futura", async () => {
    expect(await salvarPerfil(formulario({ nome: "Dany", data_nascimento: "2026-02-30" }))).toEqual({
      ok: false,
      erro: "Informe uma data de nascimento válida.",
    });
  });

  it("Brasília, não UTC: às 02:30 UTC do dia 6 ainda é dia 5 em Brasília", async () => {
    vi.setSystemTime(new Date("2026-10-06T02:30:00Z"));

    // Em UTC seria "hoje" (6); em Brasília ainda é 5, então 6 é futuro.
    expect(await salvarPerfil(formulario({ nome: "Dany", data_nascimento: "2026-10-06" }))).toEqual({
      ok: false,
      erro: "A data não pode estar no futuro.",
    });
  });
});
