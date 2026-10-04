import { describe, expect, it } from "vitest";
import { montarJson, VERSAO_EXPORTACAO } from "./montarJson";
import { buscarDadosExportacao } from "./buscarDados";
import { criarFakeSupabase, RECEITA_ID, USER_ID } from "./__testes__/fakeSupabase";
import { tabelasFicticias } from "./__testes__/dadosFicticios";
import type { DadosExportacao } from "./tipos";

const GERADO_EM = new Date("2026-10-03T15:00:00.000Z");

async function dadosFicticios(): Promise<DadosExportacao> {
  const fake = criarFakeSupabase(tabelasFicticias());
  return buscarDadosExportacao(fake.supabase as never, USER_ID);
}

async function json() {
  return JSON.parse(montarJson(await dadosFicticios(), GERADO_EM));
}

describe("estrutura versionada", () => {
  it("versão 1.0 e gerado_em em UTC com Z", async () => {
    const obj = await json();
    expect(VERSAO_EXPORTACAO).toBe("1.0");
    expect(obj.versao_exportacao).toBe("1.0");
    expect(obj.gerado_em).toBe("2026-10-03T15:00:00.000Z");
    expect(obj.gerado_em.endsWith("Z")).toBe(true);
  });

  it("tem as 10 chaves do domínio em snake_case, mais as duas de controle", async () => {
    const obj = await json();
    expect(Object.keys(obj).sort()).toEqual(
      [
        "versao_exportacao",
        "gerado_em",
        "perfil",
        "pesos",
        "medidas",
        "habitos",
        "treinos",
        "metas",
        "receitas",
        "preparos",
        "itens_compra",
        "cronograma_marmitas",
      ].sort()
    );
  });

  it("perfil é null quando a usuária não tem linha de perfil", () => {
    const dados: DadosExportacao = {
      perfil: null,
      pesos: [],
      medidas: [],
      habitos: [],
      treinos: [],
      metas: [],
      receitas: [],
      preparos: [],
      itens_compra: [],
      cronograma_marmitas: [],
    };
    const obj = JSON.parse(montarJson(dados, GERADO_EM));
    expect(obj.perfil).toBeNull();
    expect(obj.pesos).toEqual([]);
  });
});

describe("tipos e nulos", () => {
  it("números são number e booleanos são boolean", async () => {
    const obj = await json();
    expect(typeof obj.pesos[0].peso_kg).toBe("number");
    expect(obj.pesos[0].peso_kg).toBe(59);
    expect(typeof obj.habitos[0].priorizou_proteina).toBe("boolean");
    expect(typeof obj.treinos[0].realizado).toBe("boolean");
  });

  it("nulos permanecem null (não viram string vazia nem zero)", async () => {
    const obj = await json();
    expect(obj.pesos[0].percentual_gordura).toBeNull();
    expect(obj.receitas.find((r: { nome: string }) => r.nome === "Ovo fictício").ingredientes).toBeNull();
    expect(obj.treinos[0].duracao_minutos).toBeNull();
  });

  it("zero é preservado como 0", async () => {
    const obj = await json();
    expect(obj.habitos.find((h: { data: string }) => h.data === "2026-09-03").quantidade_agua_ml).toBe(0);
    expect(obj.treinos.find((t: { data: string }) => t.data === "2026-09-10").calorias).toBe(0);
  });

  it("datas funcionais em AAAA-MM-DD", async () => {
    const obj = await json();
    expect(obj.pesos[0].data).toBe("2026-09-03");
    expect(obj.preparos[0].data_preparo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("selos é array de texto", async () => {
    const obj = await json();
    const frango = obj.receitas.find((r: { nome: string }) => r.nome === "Frango, fictício");
    expect(frango.selos).toEqual(["air fryer", "congelável"]);
  });
});

describe("ordenação e conteúdo", () => {
  it("mantém a ordem recebida das listas (a ordenação é feita na busca)", async () => {
    const obj = await json();
    expect(obj.pesos.map((p: { data: string }) => p.data)).toEqual(["2026-09-03", "2026-09-10"]);
    expect(obj.itens_compra.map((i: { grupo: string }) => i.grupo)).toEqual(["proteinas", "despensa"]);
  });

  it("não aplica sanitização de CSV: o JSON guarda o valor original", async () => {
    const obj = await json();
    expect(obj.perfil.nome).toBe("=Teste Fórmula");
    expect(obj.preparos.find((p: { observacoes: string | null }) => p.observacoes === "=SOMA(A1)")).toBeDefined();
  });
});

describe("campos proibidos ausentes", () => {
  it("não contém user_id, updated_at, e-mail, token, cookie, sessão nem senha", async () => {
    const texto = montarJson(await dadosFicticios(), GERADO_EM);
    expect(texto).not.toContain('"user_id"');
    expect(texto).not.toContain('"updated_at"');
    expect(texto).not.toMatch(/"email"|"e-mail"|"token"|"cookie"|"session"|"sessao"|"password"|"senha"/i);
    expect(texto).not.toContain(USER_ID);
  });

  it("não contém nenhum e-mail", async () => {
    const texto = montarJson(await dadosFicticios(), GERADO_EM);
    expect(texto).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });
});

describe("IDs com função relacional preservados", () => {
  it("mantém receitas.id e preparos.receita_id, e eles se correspondem", async () => {
    const obj = await json();
    const ids = obj.receitas.map((r: { id: string }) => r.id);
    expect(ids).toContain(RECEITA_ID);
    for (const p of obj.preparos) {
      expect(ids).toContain(p.receita_id);
    }
  });

  it("mantém metas.created_at, habitos.bebeu_agua_meta, treinos.obrigatorio e perfil.cronograma_inicio_ciclo", async () => {
    const obj = await json();
    expect(obj.metas[0].created_at).toBe("2026-08-30T12:00:00.000Z");
    expect(typeof obj.habitos[0].bebeu_agua_meta).toBe("boolean");
    expect(typeof obj.treinos[0].obrigatorio).toBe("boolean");
    expect(obj.perfil.cronograma_inicio_ciclo).toBe("2026-09-28");
  });
});
