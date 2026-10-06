import { beforeEach, describe, expect, it, vi } from "vitest";
import { unzipSync } from "fflate";
import { criarFakeSupabase, OUTRA_USUARIA_ID, RECEITA_ID, USER_ID } from "./__testes__/fakeSupabase";
import { tabelasFicticias } from "./__testes__/dadosFicticios";

const mocks = vi.hoisted(() => ({
  supabase: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => mocks.supabase,
}));

import { GET as getPlanilhas } from "@/app/api/exportacao/planilhas/route";
import { GET as getJson } from "@/app/api/exportacao/json/route";
import * as rotaPlanilhas from "@/app/api/exportacao/planilhas/route";
import * as rotaJson from "@/app/api/exportacao/json/route";

const NOTAS_SEGURANCA = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

function prepararSessao(
  usuario: { id: string } | null,
  tabelas: Record<string, Record<string, unknown>[]> = tabelasFicticias(),
  opcoes: { erroEm?: string; lancaEm?: string } = {}
) {
  const fake = criarFakeSupabase(tabelas, opcoes);
  mocks.supabase = {
    auth: { getUser: vi.fn(async () => ({ data: { user: usuario } })) },
    from: fake.supabase.from,
  };
  return fake;
}

beforeEach(() => {
  mocks.supabase = null;
});

describe("sessão obrigatória", () => {
  it("planilhas sem sessão responde 401 e não consulta nenhuma tabela", async () => {
    const fake = prepararSessao(null);
    const res = await getPlanilhas();

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(fake.chamadas).toEqual([]);
  });

  it("json sem sessão responde 401 e não consulta nenhuma tabela", async () => {
    const fake = prepararSessao(null);
    const res = await getJson();

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(fake.chamadas).toEqual([]);
  });

  it("a mensagem de 401 não traz dados nem identificadores", async () => {
    prepararSessao(null);
    const texto = await (await getJson()).text();
    expect(texto).not.toContain(USER_ID);
  });
});

describe("planilhas (ZIP)", () => {
  it("responde 200 com ZIP, download e cabeçalhos de segurança", async () => {
    prepararSessao({ id: USER_ID });
    const res = await getPlanilhas();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/zip");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="mulher-forte-planilhas-\d{4}-\d{2}-\d{2}\.zip"$/
    );
    expect(res.headers.get("Cache-Control")).toBe(NOTAS_SEGURANCA["Cache-Control"]);
    expect(res.headers.get("X-Content-Type-Options")).toBe(NOTAS_SEGURANCA["X-Content-Type-Options"]);
  });

  it("o corpo é um ZIP com os 10 CSVs", async () => {
    prepararSessao({ id: USER_ID });
    const res = await getPlanilhas();
    const aberto = unzipSync(new Uint8Array(await res.arrayBuffer()));

    expect(Object.keys(aberto).sort()).toEqual(
      [
        "perfil.csv",
        "pesos.csv",
        "medidas.csv",
        "habitos.csv",
        "treinos.csv",
        "metas.csv",
        "receitas.csv",
        "preparos.csv",
        "itens-compra.csv",
        "cronograma-marmitas.csv",
      ].sort()
    );
  });

  it("o ZIP não contém user_id nem UUID de usuária", async () => {
    prepararSessao({ id: USER_ID });
    const res = await getPlanilhas();
    const aberto = unzipSync(new Uint8Array(await res.arrayBuffer()));
    for (const bytes of Object.values(aberto)) {
      const texto = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
      expect(texto).not.toContain(USER_ID);
      expect(texto.toLowerCase()).not.toContain("user_id");
    }
  });
});

describe("backup JSON", () => {
  it("responde 200 com JSON versionado e cabeçalhos corretos", async () => {
    prepararSessao({ id: USER_ID });
    const res = await getJson();

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="mulher-forte-backup-\d{4}-\d{2}-\d{2}\.json"$/
    );
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");

    const obj = JSON.parse(await res.text());
    expect(obj.versao_exportacao).toBe("1.0");
    expect(obj.gerado_em.endsWith("Z")).toBe(true);
  });

  it("o JSON não contém user_id, e-mail nem UUID de usuária", async () => {
    prepararSessao({ id: USER_ID });
    const texto = await (await getJson()).text();
    expect(texto).not.toContain(USER_ID);
    expect(texto).not.toContain('"user_id"');
    expect(texto).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  it("mantém os IDs relacionais de receita", async () => {
    prepararSessao({ id: USER_ID });
    const obj = JSON.parse(await (await getJson()).text());
    expect(obj.receitas.map((r: { id: string }) => r.id)).toContain(RECEITA_ID);
  });
});

describe("isolamento pela sessão", () => {
  it("todas as consultas usam o id da sessão e nenhuma usa outra usuária", async () => {
    const fake = prepararSessao({ id: USER_ID });
    await getPlanilhas();
    await getJson();

    const valores = fake.chamadas
      .filter((c) => c.metodo === "eq" && c.args[0] === "user_id")
      .map((c) => c.args[1]);
    expect(valores.length).toBeGreaterThan(0);
    expect(new Set(valores)).toEqual(new Set([USER_ID]));
    expect(valores).not.toContain(OUTRA_USUARIA_ID);
  });

  it("o conteúdo não traz linhas da outra usuária", async () => {
    prepararSessao({ id: USER_ID });
    const texto = await (await getJson()).text();
    expect(texto).not.toContain("Outra Pessoa");
    expect(texto).not.toContain("Não deve aparecer");
  });

  it("nenhuma escrita é feita durante a exportação", async () => {
    const fake = prepararSessao({ id: USER_ID });
    await getPlanilhas();
    await getJson();
    expect(fake.escritas).toEqual([]);
  });
});

describe("erros seguros", () => {
  it("preparo órfão responde 422 com mensagem sem UUID", async () => {
    const tabelas = tabelasFicticias();
    tabelas.receitas = [];
    prepararSessao({ id: USER_ID }, tabelas);

    const res = await getJson();
    expect(res.status).toBe(422);
    const corpo = await res.text();
    expect(corpo).toContain("nenhum dado foi alterado");
    expect(corpo).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it("falha de leitura do Supabase responde 500 (não 422), com mensagem segura", async () => {
    prepararSessao({ id: USER_ID }, tabelasFicticias(), { erroEm: "metas" });
    const res = await getPlanilhas();
    expect(res.status).toBe(500);
    const corpo = await res.text();
    expect(corpo).toContain("Não foi possível gerar o arquivo agora");
    expect(corpo).not.toContain("erro simulado");
    expect(corpo).not.toContain("metas");
  });

  it("exceção da biblioteca do Supabase responde 500 sem vazar a mensagem crua", async () => {
    prepararSessao({ id: USER_ID }, tabelasFicticias(), { lancaEm: "receitas" });
    const res = await getJson();
    expect(res.status).toBe(500);
    const corpo = await res.text();
    expect(corpo).not.toContain("falha de rede");
    expect(corpo).not.toContain("receitas");
  });

  it("falha inesperada na autenticação responde 500, não 401", async () => {
    mocks.supabase = {
      auth: {
        getUser: vi.fn(async () => {
          throw new Error("auth indisponível");
        }),
      },
      from: () => ({}),
    };
    const res = await getPlanilhas();
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("auth indisponível");
  });

  it("erro inesperado responde 500 com mensagem genérica", async () => {
    mocks.supabase = {
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: USER_ID } } })) },
      from: () => {
        throw new Error("falha interna com detalhe que não deve vazar");
      },
    };
    const res = await getJson();
    expect(res.status).toBe(500);
    const corpo = await res.text();
    expect(corpo).toContain("Não foi possível gerar agora. Tente novamente.");
    expect(corpo).not.toContain("detalhe que não deve vazar");
  });
});

describe("configuração das rotas", () => {
  it("ambas são força-dinâmicas, sem cache estático", () => {
    expect(rotaPlanilhas.dynamic).toBe("force-dynamic");
    expect(rotaJson.dynamic).toBe("force-dynamic");
  });
});
