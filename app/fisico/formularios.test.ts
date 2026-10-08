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

import { hojeISO } from "@/lib/date";
import {
  registrarMedidas,
  registrarPeso,
  registrarTreino,
  salvarMeta,
} from "./actions";

type Chamada = { metodo: string; args: unknown[] };
type Config = {
  leitura?: { data?: unknown; error?: unknown };
  escrita?: { error?: unknown };
};

const ESCRITAS = ["upsert", "insert", "update"];
let configs: Record<string, Config> = {};
let registros: { tabela: string; chamadas: Chamada[] }[] = [];

function criarBuilder(tabela: string) {
  const chamadas: Chamada[] = [];
  const builder: Record<string, unknown> = {};
  for (const metodo of ["select", "eq", "in", "neq", "maybeSingle", ...ESCRITAS]) {
    builder[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
    const cfg = configs[tabela] ?? {};
    const resultado = chamadas.some((c) => ESCRITAS.includes(c.metodo))
      ? { error: cfg.escrita?.error ?? null }
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

/** Payloads gravados numa tabela (cada item é uma linha). */
function gravacoes(tabela: string): Record<string, unknown>[] {
  return registros
    .filter((r) => r.tabela === tabela)
    .flatMap((r) => r.chamadas)
    .filter((c) => ESCRITAS.includes(c.metodo))
    .flatMap((c) => (Array.isArray(c.args[0]) ? (c.args[0] as Record<string, unknown>[]) : [c.args[0] as Record<string, unknown>]));
}

function temEq(tabela: string, coluna: string, valor: unknown) {
  return registros
    .filter((r) => r.tabela === tabela)
    .flatMap((r) => r.chamadas)
    .some((c) => c.metodo === "eq" && c.args[0] === coluna && c.args[1] === valor);
}

const FALHA_BANCO = { message: "violates check constraint pg_secret_percentual" };

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.from.mockReset();
  registros = [];
  configs = {};
});

describe("registrarPeso", () => {
  it("sem data: erro previsível, sem gravação", async () => {
    preparar();

    expect(await registrarPeso(formulario({ data: "", peso_kg: "58.1" }))).toEqual({
      ok: false,
      erro: "Informe a data do registro.",
    });
    expect(gravacoes("registros_peso")).toHaveLength(0);
  });

  it.each(["0", "abc", ""])("peso '%s' inválido: erro previsível, sem gravação", async (peso) => {
    preparar();

    expect(await registrarPeso(formulario({ data: "2026-10-05", peso_kg: peso }))).toEqual({
      ok: false,
      erro: "Informe um peso maior que zero.",
    });
    expect(gravacoes("registros_peso")).toHaveLength(0);
  });

  it.each([
    ["percentual_gordura", "120", "gordura"],
    ["percentual_massa_muscular", "abc", "massa muscular"],
    ["percentual_agua", "-1", "água"],
  ])("%s inválido: erro indica o campo, sem gravação", async (campo, valor, rotulo) => {
    preparar();

    const r = await registrarPeso(formulario({ data: "2026-10-05", peso_kg: "58.1", [campo]: valor }));

    expect(r).toEqual({
      ok: false,
      erro: `O percentual de ${rotulo} deve ser um número entre 0 e 100.`,
    });
    expect(gravacoes("registros_peso")).toHaveLength(0);
  });

  it("zero em percentual é valor, não ausência; vazio vira null", async () => {
    preparar();

    await registrarPeso(
      formulario({ data: "2026-10-05", peso_kg: "58.1", percentual_gordura: "0", percentual_agua: "" })
    );

    expect(gravacoes("registros_peso")[0]).toMatchObject({
      percentual_gordura: 0,
      percentual_agua: null,
      percentual_massa_muscular: null,
    });
  });

  it("falha de gravação: mensagem neutra, sem texto técnico", async () => {
    preparar({ registros_peso: { escrita: { error: FALHA_BANCO } } });

    const r = await registrarPeso(formulario({ data: "2026-10-05", peso_kg: "58.1" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar o peso. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_secret");
  });

  it("sucesso: grava com user_id da sessão e devolve o destino", async () => {
    preparar();

    const r = await registrarPeso(
      formulario({ data: hojeISO(), peso_kg: "58.1", user_id: OUTRA_USUARIA_ID })
    );

    expect(r).toEqual({ ok: true, destino: "/fisico/peso?peso_salvo=1" });
    expect(gravacoes("registros_peso")[0]).toMatchObject({ user_id: USER_ID, peso_kg: 58.1 });
  });

  it("correção de um dia passado: destino volta pro histórico", async () => {
    preparar();

    const r = await registrarPeso(formulario({ data: "2020-01-06", peso_kg: "58.1" }));

    expect(r).toEqual({ ok: true, destino: "/fisico/historico?aba=peso&peso_salvo=1" });
  });
});

describe("registrarMedidas", () => {
  it("sem data: erro previsível", async () => {
    preparar();

    expect(await registrarMedidas(formulario({ data: "", cintura_cm: "80" }))).toEqual({
      ok: false,
      erro: "Informe a data das medidas.",
    });
  });

  it("nenhuma medida preenchida: erro previsível, sem gravação", async () => {
    preparar();

    expect(await registrarMedidas(formulario({ data: "2026-10-05", cintura_cm: "  " }))).toEqual({
      ok: false,
      erro: "Preencha pelo menos uma medida.",
    });
    expect(gravacoes("medidas_corporais")).toHaveLength(0);
  });

  it.each([
    ["cintura_cm", "0", "Cintura"],
    ["quadril_cm", "abc", "Quadril"],
  ])("valor inválido em %s: erro com o nome da região, sem gravação", async (campo, valor, rotulo) => {
    preparar();

    const r = await registrarMedidas(formulario({ data: "2026-10-05", [campo]: valor }));

    expect(r).toEqual({
      ok: false,
      erro: `Valor inválido para ${rotulo}. Use centímetros, maior que zero.`,
    });
    expect(gravacoes("medidas_corporais")).toHaveLength(0);
  });

  it("sem histórico comparável: salva sem aviso", async () => {
    preparar({ medidas_corporais: { leitura: { data: [] } } });

    const r = await registrarMedidas(formulario({ data: hojeISO(), cintura_cm: "80" }));

    expect(r).toEqual({ ok: true, destino: "/fisico/medidas?medidas_salvas=1", aviso: undefined });
    expect(gravacoes("medidas_corporais")[0]).toMatchObject({ user_id: USER_ID, regiao: "cintura", valor_cm: 80 });
  });

  it("variação acima de 3 cm: salva e devolve aviso não bloqueante", async () => {
    preparar({
      medidas_corporais: { leitura: { data: [{ regiao: "cintura", data: "2026-09-06", valor_cm: 86 }] } },
    });

    const r = await registrarMedidas(formulario({ data: hojeISO(), cintura_cm: "80" }));

    expect(gravacoes("medidas_corporais")).toHaveLength(1);
    expect(r).toMatchObject({
      ok: true,
      destino: "/fisico/medidas?medidas_salvas=1&variacao_atipica=cintura",
      aviso: expect.stringContaining("Cintura"),
    });
  });

  it("falha ao ler o histórico: não bloqueia o salvamento e não traz aviso", async () => {
    preparar({
      medidas_corporais: { leitura: { error: { message: "falha" } } },
    });

    const r = await registrarMedidas(formulario({ data: hojeISO(), cintura_cm: "80" }));

    expect(gravacoes("medidas_corporais")).toHaveLength(1);
    expect(r).toEqual({ ok: true, destino: "/fisico/medidas?medidas_salvas=1", aviso: undefined });
  });

  it("falha de gravação: mensagem neutra", async () => {
    preparar({ medidas_corporais: { escrita: { error: FALHA_BANCO } } });

    const r = await registrarMedidas(formulario({ data: hojeISO(), cintura_cm: "80" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar as medidas. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_secret");
  });

  it("correção de um dia passado: destino volta pro histórico", async () => {
    preparar({ medidas_corporais: { leitura: { data: [] } } });

    const r = await registrarMedidas(formulario({ data: "2020-01-06", cintura_cm: "80" }));

    expect(r).toEqual({
      ok: true,
      destino: "/fisico/historico?aba=medidas&medidas_salvas=1",
      aviso: undefined,
    });
  });
});

describe("registrarTreino", () => {
  it("sem tipo: erro previsível", async () => {
    preparar();

    expect(await registrarTreino(formulario({ data: "2026-10-05", tipo: "" }))).toEqual({
      ok: false,
      erro: "Informe a data e o tipo de treino.",
    });
  });

  it("tipo fora da lista: erro previsível, sem gravação", async () => {
    preparar();

    const r = await registrarTreino(formulario({ data: "2026-10-05", tipo: "natacao" }));

    expect(r).toMatchObject({ ok: false, erro: expect.stringContaining("Tipo de treino inválido") });
    expect(gravacoes("adesao_treino")).toHaveLength(0);
  });

  it("Outro sem descrição: erro previsível, sem gravação", async () => {
    preparar();

    expect(await registrarTreino(formulario({ data: "2026-10-05", tipo: "outro" }))).toEqual({
      ok: false,
      erro: 'Descreva qual atividade foi, já que o tipo é "Outro".',
    });
    expect(gravacoes("adesao_treino")).toHaveLength(0);
  });

  it.each(["0", "1.5", "abc"])("duração '%s' inválida: erro previsível", async (duracao) => {
    preparar();

    expect(
      await registrarTreino(formulario({ data: "2026-10-05", tipo: "moves", duracao_minutos: duracao }))
    ).toEqual({
      ok: false,
      erro: "A duração deve ser um número inteiro de minutos, maior que zero.",
    });
    expect(gravacoes("adesao_treino")).toHaveLength(0);
  });

  it("calorias inválidas: erro previsível", async () => {
    preparar();

    expect(
      await registrarTreino(formulario({ data: "2026-10-05", tipo: "zumba", calorias: "-10" }))
    ).toEqual({
      ok: false,
      erro: "As calorias devem ser um número inteiro, maior que zero.",
    });
  });

  it("falha de gravação: mensagem neutra", async () => {
    preparar({ adesao_treino: { escrita: { error: FALHA_BANCO } } });

    const r = await registrarTreino(formulario({ data: "2026-10-05", tipo: "moves" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar o treino. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_secret");
  });

  it("sucesso: campos vazios viram null, user_id da sessão, destino correto", async () => {
    preparar();
    const hoje = hojeISO();

    const r = await registrarTreino(
      formulario({ data: hoje, tipo: "moves", realizado: "on", user_id: OUTRA_USUARIA_ID })
    );

    expect(r).toEqual({ ok: true, destino: "/fisico/treino?treino_salvo=1" });
    expect(gravacoes("adesao_treino")[0]).toMatchObject({
      user_id: USER_ID,
      tipo: "moves",
      realizado: true,
      duracao_minutos: null,
      calorias: null,
    });
    expect(temEq("adesao_treino", "user_id", USER_ID)).toBe(false);
  });

  it("data de hoje: destino continua na tela de registro", async () => {
    preparar();

    const r = await registrarTreino(formulario({ data: hojeISO(), tipo: "moves" }));

    expect(r).toEqual({ ok: true, destino: "/fisico/treino?treino_salvo=1" });
  });

  it("correção de um dia passado: destino volta pro histórico", async () => {
    preparar();

    // Segunda-feira certamente no passado, independente de quando o teste roda.
    const r = await registrarTreino(formulario({ data: "2020-01-06", tipo: "moves" }));

    expect(r).toEqual({ ok: true, destino: "/fisico/historico?aba=treino&treino_salvo=1" });
  });
});

describe("salvarMeta", () => {
  it("indicador inválido: erro previsível", async () => {
    preparar();

    expect(await salvarMeta(formulario({ indicador: "altura" }))).toEqual({
      ok: false,
      erro: "Indicador inválido.",
    });
  });

  it.each(["0", "abc", ""])("meta de hidratação '%s' inválida: erro previsível", async (meta) => {
    preparar();

    expect(
      await salvarMeta(formulario({ indicador: "hidratacao", meta_hidratacao_litros_dia: meta }))
    ).toEqual({ ok: false, erro: "Informe a meta diária de hidratação em litros, maior que zero." });
    expect(gravacoes("metas")).toHaveLength(0);
  });

  it("valor da meta zero: erro previsível, sem gravação", async () => {
    preparar();

    expect(await salvarMeta(formulario({ indicador: "peso", valor_meta: "0" }))).toEqual({
      ok: false,
      erro: "Informe o valor da meta, maior que zero.",
    });
    expect(gravacoes("metas")).toHaveLength(0);
  });

  it.each(["1.5", "0"])("prazo '%s' inválido: erro previsível", async (prazo) => {
    preparar();

    const r = await salvarMeta(
      formulario({ indicador: "cintura", valor_meta: "80", prazo_estimado_semanas: prazo })
    );

    expect(r).toEqual({
      ok: false,
      erro: "O prazo deve ser um número inteiro de semanas, maior que zero.",
    });
    expect(gravacoes("metas")).toHaveLength(0);
  });

  it("valor inicial negativo: erro previsível", async () => {
    preparar();

    expect(
      await salvarMeta(formulario({ indicador: "peso", valor_meta: "60", valor_referencia: "-1" }))
    ).toEqual({ ok: false, erro: "O valor inicial deve ser um número maior ou igual a zero." });
  });

  it("falha de gravação: mensagem neutra", async () => {
    preparar({ metas: { escrita: { error: FALHA_BANCO } } });

    const r = await salvarMeta(formulario({ indicador: "peso", valor_meta: "60" }));

    expect(r).toEqual({ ok: false, erro: "Não foi possível salvar a meta. Tente novamente." });
    expect(JSON.stringify(r)).not.toContain("pg_secret");
  });

  it("hidratação: mantém data_inicio do formulário e não envia created_at", async () => {
    preparar();

    const r = await salvarMeta(
      formulario({ indicador: "hidratacao", meta_hidratacao_litros_dia: "2.5", data_inicio: "2026-09-28" })
    );

    expect(r).toEqual({ ok: true, destino: "/fisico/metas?meta_salva=1" });
    const payload = gravacoes("metas")[0];
    expect(payload).toMatchObject({
      user_id: USER_ID,
      indicador: "hidratacao",
      data_inicio: "2026-09-28",
      meta_hidratacao_litros_dia: 2.5,
    });
    expect(payload).not.toHaveProperty("created_at");
  });

  it("cintura: grava unidade cm e prazo quando informado", async () => {
    preparar();

    await salvarMeta(formulario({ indicador: "cintura", valor_meta: "80", prazo_estimado_semanas: "12" }));

    expect(gravacoes("metas")[0]).toMatchObject({
      indicador: "cintura",
      unidade: "cm",
      valor_meta: 80,
      prazo_estimado_semanas: 12,
    });
  });
});
