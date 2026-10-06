import { beforeEach, describe, expect, it, vi } from "vitest";

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

let payloads: Record<string, unknown>[] = [];
let erroGravacao: unknown = null;

function preparar(sessao: { id: string } | null = { id: USER_ID }) {
  mocks.getUser.mockResolvedValue({ data: { user: sessao } });
  mocks.from.mockImplementation(() => ({
    upsert: (payload: Record<string, unknown>) => {
      payloads.push(payload);
      return Promise.resolve({ error: erroGravacao });
    },
  }));
}

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  payloads = [];
  erroGravacao = null;
});

describe("salvarPerfil", () => {
  it("sem sessão: redireciona para login e não grava", async () => {
    preparar(null);

    await expect(salvarPerfil(formulario({ nome: "Dany" }))).rejects.toThrow("REDIRECT:/login");
    expect(payloads).toHaveLength(0);
  });

  it("nome vazio: erro previsível, sem gravação", async () => {
    preparar();

    expect(await salvarPerfil(formulario({ nome: "   " }))).toEqual({ ok: false, erro: "Informe seu nome." });
    expect(payloads).toHaveLength(0);
  });

  it.each(["abc", "0", "-3"])("altura '%s' inválida: erro previsível, sem gravação", async (altura) => {
    preparar();

    expect(await salvarPerfil(formulario({ nome: "Dany", altura_cm: altura }))).toEqual({
      ok: false,
      erro: "Informe uma altura válida, em centímetros.",
    });
    expect(payloads).toHaveLength(0);
  });

  it.each(["2026-02-30", "x", "2026-1-5"])("data '%s' inválida: erro previsível, sem gravação", async (data) => {
    preparar();

    expect(await salvarPerfil(formulario({ nome: "Dany", data_nascimento: data }))).toEqual({
      ok: false,
      erro: "Informe uma data de nascimento válida.",
    });
    expect(payloads).toHaveLength(0);
  });

  it("falha de gravação: mensagem neutra, sem texto técnico", async () => {
    preparar();
    erroGravacao = { message: "duplicate key pg_secret_perfil" };

    const r = await salvarPerfil(formulario({ nome: "Dany", altura_cm: "165" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar o perfil. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_secret");
  });

  it("sucesso: user_id da sessão e início do ciclo fora do payload (preservado no banco)", async () => {
    preparar();

    const r = await salvarPerfil(
      formulario({
        nome: "Dany",
        altura_cm: "165.5",
        data_nascimento: "1990-03-15",
        user_id: "00000000-0000-4000-8000-000000000009",
      })
    );

    expect(r).toEqual({ ok: true, destino: "/?perfil_salvo=1" });
    expect(payloads[0]).toEqual({
      user_id: USER_ID,
      nome: "Dany",
      altura_cm: 165.5,
      data_nascimento: "1990-03-15",
    });
    expect(payloads[0]).not.toHaveProperty("cronograma_inicio_ciclo");
  });

  it("data de nascimento vazia vira null e altura vazia vira null", async () => {
    preparar();

    await salvarPerfil(formulario({ nome: "Dany", altura_cm: "", data_nascimento: "" }));

    expect(payloads[0]).toMatchObject({ altura_cm: null, data_nascimento: null });
  });
});
