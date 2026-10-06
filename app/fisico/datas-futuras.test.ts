import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const MENSAGEM_FUTURO = "A data não pode estar no futuro.";

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

import { registrarMedidas, registrarPeso, registrarTreino, salvarMeta } from "./actions";

/** Relógio fixo: 5 de outubro, 12h em Brasília. */
const AGORA = new Date("2026-10-05T15:00:00Z");

let gravacoes: { tabela: string; payload: unknown }[] = [];

function preparar() {
  gravacoes = [];
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  mocks.from.mockImplementation((tabela: string) => {
    const builder: Record<string, unknown> = {};
    for (const metodo of ["select", "eq", "in", "neq", "maybeSingle"]) {
      builder[metodo] = () => builder;
    }
    builder.upsert = (payload: unknown) => {
      gravacoes.push({ tabela, payload });
      return builder;
    };
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve);
    return builder;
  });
}

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(AGORA);
  preparar();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("datas futuras são recusadas no servidor", () => {
  it("peso: amanhã é recusado, sem gravar", async () => {
    expect(await registrarPeso(formulario({ data: "2026-10-06", peso_kg: "58.1" }))).toEqual({
      ok: false,
      erro: MENSAGEM_FUTURO,
    });
    expect(gravacoes).toHaveLength(0);
  });

  it("peso: hoje e ontem são aceitos", async () => {
    expect((await registrarPeso(formulario({ data: "2026-10-05", peso_kg: "58.1" }))).ok).toBe(true);
    expect((await registrarPeso(formulario({ data: "2026-10-04", peso_kg: "58.1" }))).ok).toBe(true);
  });

  it("medidas: data futura é recusada antes de qualquer gravação", async () => {
    expect(await registrarMedidas(formulario({ data: "2026-10-06", cintura_cm: "80" }))).toEqual({
      ok: false,
      erro: MENSAGEM_FUTURO,
    });
    expect(gravacoes).toHaveLength(0);
  });

  it("treino: data futura é recusada, mesmo com campos válidos", async () => {
    expect(await registrarTreino(formulario({ data: "2026-10-06", tipo: "moves" }))).toEqual({
      ok: false,
      erro: MENSAGEM_FUTURO,
    });
    expect(gravacoes).toHaveLength(0);
  });

  it("metas: início futuro é recusado", async () => {
    expect(
      await salvarMeta(formulario({ indicador: "peso", valor_meta: "60", data_inicio: "2026-10-06" }))
    ).toEqual({ ok: false, erro: MENSAGEM_FUTURO });
    expect(gravacoes).toHaveLength(0);
  });

  it("virada de mês: 1º de novembro é futuro em 5 de outubro", async () => {
    expect(await registrarPeso(formulario({ data: "2026-11-01", peso_kg: "58.1" }))).toEqual({
      ok: false,
      erro: MENSAGEM_FUTURO,
    });
  });

  it("virada de ano: 1º de janeiro é futuro no fim de dezembro", async () => {
    vi.setSystemTime(new Date("2026-12-31T15:00:00Z"));

    expect(await registrarPeso(formulario({ data: "2027-01-01", peso_kg: "58.1" }))).toEqual({
      ok: false,
      erro: MENSAGEM_FUTURO,
    });
  });

  it("erro de data mantém o resultado sem gravar nenhum campo", async () => {
    const r = await registrarPeso(formulario({ data: "2026-10-06", peso_kg: "58.1", percentual_agua: "50" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_FUTURO });
    expect(gravacoes).toHaveLength(0);
  });
});
