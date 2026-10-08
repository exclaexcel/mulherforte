import { beforeEach, describe, expect, it, vi } from "vitest";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const MENSAGEM = "Não foi possível atualizar a água agora. Tente novamente.";

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

import { hojeISO } from "@/lib/date";
import { ajustarAguaManual, incrementarAgua } from "./actions";

type Chamada = { metodo: string; args: unknown[] };

type Cenario = {
  /** Resultado da leitura de adesao_habitos (registro do dia). */
  registro?: { data: unknown; error: unknown };
  /** Resultado da leitura de metas (hidratação). */
  meta?: { data: unknown; error: unknown };
  /** Resultado do upsert em adesao_habitos. */
  upsert?: { error: unknown };
};

const tabelasConsultadas: { tabela: string; chamadas: Chamada[] }[] = [];
let cenario: Cenario = {};

/**
 * Builder que registra as chamadas. Ao ser aguardado, devolve o resultado da
 * leitura ou do upsert, conforme a cadeia usada.
 */
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
    const usouUpsert = chamadas.some((c) => c.metodo === "upsert");
    let resultado: unknown;
    if (usouUpsert) {
      resultado = { error: cenario.upsert?.error ?? null };
    } else if (tabela === "metas") {
      resultado = cenario.meta ?? { data: null, error: null };
    } else {
      resultado = cenario.registro ?? { data: null, error: null };
    }
    return Promise.resolve(resultado).then(resolve, reject);
  };
  tabelasConsultadas.push({ tabela, chamadas });
  return builder;
}

function preparar(cenarioDoTeste: Cenario = {}) {
  cenario = cenarioDoTeste;
  mocks.getUser.mockResolvedValue({ data: { user: { id: USER_ID } } });
  mocks.from.mockImplementation((tabela: string) => criarBuilder(tabela));
}

function formulario(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

/** Todos os payloads enviados em upsert, em ordem. */
function upserts(): Record<string, unknown>[] {
  return tabelasConsultadas
    .flatMap((t) => t.chamadas)
    .filter((c) => c.metodo === "upsert")
    .map((c) => c.args[0] as Record<string, unknown>);
}

/** Valores usados em `.eq("data", valor)`, em ordem — pra confirmar qual dia foi lido/gravado. */
function datasConsultadas(): unknown[] {
  return tabelasConsultadas
    .flatMap((t) => t.chamadas)
    .filter((c) => c.metodo === "eq" && c.args[0] === "data")
    .map((c) => c.args[1]);
}

/**
 * Mensagem de erro da action, ou string vazia se deu certo. Aceita o contrato atual
 * (resultado `{ ok, erro }`) e, por segurança, também exceção lançada.
 */
async function erroDe(promessa: Promise<unknown>): Promise<string> {
  try {
    const resultado = (await promessa) as { ok?: boolean; erro?: string } | undefined;
    return resultado && resultado.ok === false ? (resultado.erro ?? "") : "";
  } catch (erro) {
    return (erro as Error).message;
  }
}

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  tabelasConsultadas.length = 0;
  cenario = {};
});

describe("incrementarAgua — falhas de leitura bloqueiam a gravação", () => {
  it("falha ao ler a quantidade atual: mensagem neutra e nenhum upsert", async () => {
    preparar({
      registro: { data: null, error: { message: "erro de rede" } },
      meta: { data: { meta_hidratacao_litros_dia: 2 }, error: null },
    });

    expect(await erroDe(incrementarAgua(formulario({ incremento_ml: "250" })))).toBe(MENSAGEM);
    expect(upserts()).toHaveLength(0);
  });

  it("falha ao ler a meta: não grava e não assume bebeu_agua_meta = false", async () => {
    preparar({
      registro: { data: { quantidade_agua_ml: 500 }, error: null },
      meta: { data: null, error: { message: "timeout" } },
    });

    expect(await erroDe(incrementarAgua(formulario({ incremento_ml: "250" })))).toBe(MENSAGEM);
    expect(upserts()).toHaveLength(0);
  });

  it("quantidade anterior e snapshot anterior são preservados quando a leitura falha", async () => {
    preparar({
      registro: { data: null, error: { message: "falha" } },
      meta: { data: { meta_hidratacao_litros_dia: 2 }, error: null },
    });

    await erroDe(incrementarAgua(formulario({ incremento_ml: "250" })));

    // Nenhum payload foi enviado: quantidade_agua_ml e bebeu_agua_meta do dia ficam como estavam.
    expect(upserts()).toEqual([]);
  });

  it("erro na gravação: mensagem neutra, sem a mensagem crua do Supabase", async () => {
    preparar({
      registro: { data: null, error: null },
      meta: { data: null, error: null },
      upsert: { error: { message: "relation adesao_habitos pg_secret_detalhe" } },
    });

    const erro = await erroDe(incrementarAgua(formulario({ incremento_ml: "250" })));
    expect(erro).toBe(MENSAGEM);
    expect(erro).not.toContain("pg_secret");
  });
});

describe("incrementarAgua — caminhos normais", () => {
  it("consulta bem-sucedida sem registro: grava só o incremento", async () => {
    preparar({
      registro: { data: null, error: null },
      meta: { data: null, error: null },
    });

    expect(await erroDe(incrementarAgua(formulario({ incremento_ml: "250" })))).toBe("");
    expect(upserts()).toEqual([
      expect.objectContaining({ quantidade_agua_ml: 250, bebeu_agua_meta: false }),
    ]);
  });

  it("consulta bem-sucedida sem meta: segue a regra existente (bebeu_agua_meta = false)", async () => {
    preparar({
      registro: { data: { quantidade_agua_ml: 3000 }, error: null },
      meta: { data: null, error: null },
    });

    await incrementarAgua(formulario({ incremento_ml: "250" }));

    expect(upserts()[0]).toMatchObject({ quantidade_agua_ml: 3250, bebeu_agua_meta: false });
  });

  it("incremento normal: soma ao total e calcula bebeu_agua_meta pela meta atual", async () => {
    preparar({
      registro: { data: { quantidade_agua_ml: 500 }, error: null },
      meta: { data: { meta_hidratacao_litros_dia: 0.7 }, error: null },
    });

    await incrementarAgua(formulario({ incremento_ml: "250" }));

    expect(upserts()[0]).toMatchObject({ quantidade_agua_ml: 750, bebeu_agua_meta: true });
  });

  it("incremento abaixo da meta grava bebeu_agua_meta = false", async () => {
    preparar({
      registro: { data: { quantidade_agua_ml: 500 }, error: null },
      meta: { data: { meta_hidratacao_litros_dia: 2 }, error: null },
    });

    await incrementarAgua(formulario({ incremento_ml: "250" }));

    expect(upserts()[0]).toMatchObject({ quantidade_agua_ml: 750, bebeu_agua_meta: false });
  });

  it("valor não finito no incremento é rejeitado antes de qualquer leitura", async () => {
    preparar();

    expect(await erroDe(incrementarAgua(formulario({ incremento_ml: "Infinity" })))).toBe(
      "Incremento inválido."
    );
    expect(upserts()).toHaveLength(0);
  });

  it("total que vira não finito é bloqueado: não grava", async () => {
    preparar({
      registro: { data: { quantidade_agua_ml: 1e308 }, error: null },
      meta: { data: null, error: null },
    });

    expect(await erroDe(incrementarAgua(formulario({ incremento_ml: "1e308" })))).toBe(MENSAGEM);
    expect(upserts()).toHaveLength(0);
  });

  it("sem campo 'data': lê e grava no dia de hoje", async () => {
    preparar({ registro: { data: null, error: null }, meta: { data: null, error: null } });

    await incrementarAgua(formulario({ incremento_ml: "250" }));

    expect(datasConsultadas().every((d) => d === hojeISO())).toBe(true);
  });

  it("com campo 'data' de um dia passado: lê e grava nesse dia, não em hoje", async () => {
    preparar({ registro: { data: null, error: null }, meta: { data: null, error: null } });

    await incrementarAgua(formulario({ incremento_ml: "250", data: "2026-09-20" }));

    expect(datasConsultadas().every((d) => d === "2026-09-20")).toBe(true);
    expect(upserts()[0]).toMatchObject({ data: "2026-09-20" });
  });

  it("data futura no campo 'data' é ignorada: cai em hoje", async () => {
    preparar({ registro: { data: null, error: null }, meta: { data: null, error: null } });

    await incrementarAgua(formulario({ incremento_ml: "250", data: "2099-01-01" }));

    expect(datasConsultadas().every((d) => d === hojeISO())).toBe(true);
  });
});

describe("ajustarAguaManual", () => {
  it("ajuste normal: grava o total informado e calcula bebeu_agua_meta", async () => {
    preparar({
      registro: { data: { quantidade_agua_ml: 100 }, error: null },
      meta: { data: { meta_hidratacao_litros_dia: 1 }, error: null },
    });

    expect(await erroDe(ajustarAguaManual(formulario({ valor_ml: "1200" })))).toBe("");
    expect(upserts()[0]).toMatchObject({ quantidade_agua_ml: 1200, bebeu_agua_meta: true });
  });

  it("falha ao ler o registro no ajuste: mensagem neutra e nenhum upsert", async () => {
    preparar({
      registro: { data: null, error: { message: "falha" } },
      meta: { data: { meta_hidratacao_litros_dia: 1 }, error: null },
    });

    expect(await erroDe(ajustarAguaManual(formulario({ valor_ml: "1200" })))).toBe(MENSAGEM);
    expect(upserts()).toHaveLength(0);
  });

  it("falha ao ler a meta no ajuste: não grava false como fallback", async () => {
    preparar({
      registro: { data: null, error: null },
      meta: { data: null, error: { message: "falha" } },
    });

    expect(await erroDe(ajustarAguaManual(formulario({ valor_ml: "2500" })))).toBe(MENSAGEM);
    expect(upserts()).toHaveLength(0);
  });

  it("com campo 'data' de um dia passado: lê e grava nesse dia, não em hoje", async () => {
    preparar({
      registro: { data: { quantidade_agua_ml: 100 }, error: null },
      meta: { data: null, error: null },
    });

    await ajustarAguaManual(formulario({ valor_ml: "1200", data: "2026-09-20" }));

    expect(datasConsultadas().every((d) => d === "2026-09-20")).toBe(true);
    expect(upserts()[0]).toMatchObject({ data: "2026-09-20", quantidade_agua_ml: 1200 });
  });

  it.each(["Infinity", "-Infinity", "abc", "-5"])(
    "valor '%s' é rejeitado e não grava",
    async (valor) => {
      preparar();

      expect(await erroDe(ajustarAguaManual(formulario({ valor_ml: valor })))).toBe(
        "Informe uma quantidade de água válida."
      );
      expect(upserts()).toHaveLength(0);
    }
  );
});
