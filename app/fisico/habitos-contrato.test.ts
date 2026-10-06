import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const MENSAGEM_AGUA = "Não foi possível atualizar a água agora. Tente novamente.";

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

import { ajustarAguaManual, incrementarAgua } from "./actions";

type Chamada = { metodo: string; args: unknown[] };
type Config = {
  leitura?: { data?: unknown; error?: unknown };
  escrita?: { error?: unknown };
};

let configs: Record<string, Config> = {};
let registros: { tabela: string; chamadas: Chamada[] }[] = [];

function criarBuilder(tabela: string) {
  const chamadas: Chamada[] = [];
  const builder: Record<string, unknown> = {};
  for (const metodo of ["select", "eq", "maybeSingle", "upsert"]) {
    builder[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
    const cfg = configs[tabela] ?? {};
    const resultado = chamadas.some((c) => c.metodo === "upsert")
      ? { error: cfg.escrita?.error ?? null }
      : { data: cfg.leitura?.data ?? null, error: cfg.leitura?.error ?? null };
    return Promise.resolve(resultado).then(resolve, reject);
  };
  registros.push({ tabela, chamadas });
  return builder;
}

function preparar(cfg: Record<string, Config> = {}, sessao: { id: string } | null = { id: USER_ID }) {
  configs = cfg;
  mocks.getUser.mockResolvedValue({ data: { user: sessao } });
  mocks.from.mockImplementation((tabela: string) => criarBuilder(tabela));
}

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

function upserts(): Record<string, unknown>[] {
  return registros
    .filter((r) => r.tabela === "adesao_habitos")
    .flatMap((r) => r.chamadas)
    .filter((c) => c.metodo === "upsert")
    .map((c) => c.args[0] as Record<string, unknown>);
}

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  registros = [];
  configs = {};
});

describe("incrementarAgua — contrato de resultado, sem throw previsível", () => {
  it.each(["0", "-250", "abc", "Infinity", ""])("incremento '%s' retorna erro estruturado", async (valor) => {
    preparar();

    expect(await incrementarAgua(formulario({ incremento_ml: valor }))).toEqual({
      ok: false,
      erro: "Incremento inválido.",
    });
    expect(upserts()).toHaveLength(0);
  });

  it("falha ao ler o total: erro neutro, sem upsert e sem zero no lugar do total", async () => {
    preparar({ adesao_habitos: { leitura: { error: { message: "pg_total" } } } });

    const r = await incrementarAgua(formulario({ incremento_ml: "250" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_AGUA });
    expect(upserts()).toHaveLength(0);
    expect(JSON.stringify(r)).not.toContain("pg_");
  });

  it("falha ao ler a meta: erro neutro, sem upsert e sem bebeu_agua_meta falso", async () => {
    preparar({
      adesao_habitos: { leitura: { data: { quantidade_agua_ml: 500 } } },
      metas: { leitura: { error: { message: "timeout" } } },
    });

    expect(await incrementarAgua(formulario({ incremento_ml: "250" }))).toEqual({
      ok: false,
      erro: MENSAGEM_AGUA,
    });
    expect(upserts()).toHaveLength(0);
  });

  it("falha de gravação: mensagem neutra, sem texto do banco", async () => {
    preparar({
      adesao_habitos: { leitura: { data: null }, escrita: { error: { message: "pg_upsert_agua" } } },
      metas: { leitura: { data: null } },
    });

    const r = await incrementarAgua(formulario({ incremento_ml: "250" }));

    expect(r).toEqual({ ok: false, erro: MENSAGEM_AGUA });
    expect(JSON.stringify(r)).not.toContain("pg_upsert");
  });

  it("sucesso: soma o incremento ao total e devolve resultado de sucesso", async () => {
    preparar({
      adesao_habitos: { leitura: { data: { quantidade_agua_ml: 500 } } },
      metas: { leitura: { data: { meta_hidratacao_litros_dia: 0.7 } } },
    });

    const r = await incrementarAgua(formulario({ incremento_ml: "250" }));

    expect(r.ok).toBe(true);
    expect(upserts()[0]).toMatchObject({ quantidade_agua_ml: 750, bebeu_agua_meta: true });
  });

  it("meta ausente com leitura bem-sucedida: bebeu_agua_meta falso (regra existente)", async () => {
    preparar({
      adesao_habitos: { leitura: { data: { quantidade_agua_ml: 500 } } },
      metas: { leitura: { data: null } },
    });

    await incrementarAgua(formulario({ incremento_ml: "250" }));

    expect(upserts()[0]).toMatchObject({ quantidade_agua_ml: 750, bebeu_agua_meta: false });
  });

  it("sem sessão: redireciona para login (autenticação continua funcionando)", async () => {
    preparar({}, null);

    await expect(incrementarAgua(formulario({ incremento_ml: "250" }))).rejects.toThrow("REDIRECT:/login");
  });
});

describe("ajustarAguaManual — contrato de resultado", () => {
  it.each(["Infinity", "-Infinity", "abc", "-5", "   "])("valor '%s' retorna erro estruturado e não grava", async (valor) => {
    preparar();

    expect(await ajustarAguaManual(formulario({ valor_ml: valor }))).toEqual({
      ok: false,
      erro: "Informe uma quantidade de água válida.",
    });
    expect(upserts()).toHaveLength(0);
  });

  it("campo vazio não vira zero em silêncio", async () => {
    preparar({ adesao_habitos: { leitura: { data: { quantidade_agua_ml: 900 } } } });

    expect((await ajustarAguaManual(formulario({ valor_ml: "" }))).ok).toBe(false);
    expect(upserts()).toHaveLength(0);
  });

  it("ajuste substitui o total pelo informado", async () => {
    preparar({
      adesao_habitos: { leitura: { data: { quantidade_agua_ml: 900 } } },
      metas: { leitura: { data: { meta_hidratacao_litros_dia: 1 } } },
    });

    const r = await ajustarAguaManual(formulario({ valor_ml: "1200" }));

    expect(r.ok).toBe(true);
    expect(upserts()[0]).toMatchObject({ quantidade_agua_ml: 1200, bebeu_agua_meta: true });
  });

  it("zero é total válido: registra zero, não ausência", async () => {
    preparar({
      adesao_habitos: { leitura: { data: { quantidade_agua_ml: 900 } } },
      metas: { leitura: { data: null } },
    });

    expect((await ajustarAguaManual(formulario({ valor_ml: "0" }))).ok).toBe(true);
    expect(upserts()[0]).toMatchObject({ quantidade_agua_ml: 0 });
  });

  it("falha de leitura do registro: erro neutro, sem upsert", async () => {
    preparar({ adesao_habitos: { leitura: { error: { message: "falha" } } } });

    expect(await ajustarAguaManual(formulario({ valor_ml: "1200" }))).toEqual({
      ok: false,
      erro: MENSAGEM_AGUA,
    });
    expect(upserts()).toHaveLength(0);
  });

  it("o payload da água não inclui a proteína do dia", async () => {
    preparar({
      adesao_habitos: { leitura: { data: null } },
      metas: { leitura: { data: null } },
    });

    await ajustarAguaManual(formulario({ valor_ml: "800" }));

    expect(Object.keys(upserts()[0]).sort()).toEqual(
      ["bebeu_agua_meta", "data", "quantidade_agua_ml", "user_id"].sort()
    );
  });
});
