import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATRIBUTOS_LINK_EXTERNO,
  AVISO_REFERENCIAS,
  REFERENCIA_ANVISA_GUIA_16,
  REFERENCIA_USDA_CONGELAMENTO,
  ROTULO_PRAZO_CONGELAMENTO,
  TEXTO_AJUDA_PRAZO,
  TEXTO_EXPLICACAO_REFERENCIAS,
} from "./referencias";

const RAIZ = process.cwd();
const lerArquivo = (...partes: string[]) => readFileSync(join(RAIZ, ...partes), "utf8");

describe("URLs oficiais centralizadas", () => {
  it("Anvisa: URL exata do Guia 16", () => {
    expect(REFERENCIA_ANVISA_GUIA_16.url).toBe(
      "https://anvisalegis.datalegis.net/action/UrlPublicasAction.php?acao=abrirAtoPublico&num_ato=00000016&sgl_tipo=GUI&sgl_orgao=ANVISA/MS&vlr_ano=2025&seq_ato=222&cod_modulo=644&cod_menu=9483"
    );
    expect(REFERENCIA_ANVISA_GUIA_16.texto).toBe("Abrir Guia 16 da Anvisa");
  });

  it("USDA/FSIS: URL exata da página de congelamento", () => {
    expect(REFERENCIA_USDA_CONGELAMENTO.url).toBe(
      "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety"
    );
    expect(REFERENCIA_USDA_CONGELAMENTO.texto).toBe("Consultar orientações do USDA/FSIS sobre congelamento");
  });

  it("explicações curtas exatas de cada fonte", () => {
    expect(REFERENCIA_ANVISA_GUIA_16.explicacao).toBe(
      "Referência brasileira sobre critérios e métodos para determinação do prazo de validade de alimentos."
    );
    expect(REFERENCIA_USDA_CONGELAMENTO.explicacao).toBe(
      "Referência complementar com orientações gerais sobre congelamento, armazenamento e conservação por tipo de alimento."
    );
  });

  it("links externos usam target _blank e rel noopener noreferrer", () => {
    expect(ATRIBUTOS_LINK_EXTERNO).toEqual({ target: "_blank", rel: "noopener noreferrer" });
  });

  it("as URLs são https e não incluem nenhum prazo em dias", () => {
    for (const url of [REFERENCIA_ANVISA_GUIA_16.url, REFERENCIA_USDA_CONGELAMENTO.url]) {
      expect(url.startsWith("https://")).toBe(true);
    }
  });
});

describe("textos do formulário e da página", () => {
  it("rótulo e ajuda exatos", () => {
    expect(ROTULO_PRAZO_CONGELAMENTO).toBe("Prazo de congelamento em dias, opcional");
    expect(TEXTO_AJUDA_PRAZO).toBe("Se não souber, deixe em branco.");
  });

  it("explicação da seção Sobre o plano exata", () => {
    expect(TEXTO_EXPLICACAO_REFERENCIAS[0]).toBe(
      "O prazo de congelamento pode variar conforme os ingredientes, o modo de preparo, a embalagem e a temperatura do freezer. As fontes abaixo apresentam orientações gerais e não determinam automaticamente o prazo exato de cada receita."
    );
    expect(TEXTO_EXPLICACAO_REFERENCIAS[1]).toBe(
      "Quando houver uma orientação específica da receita, dos ingredientes ou da embalagem, prefira essa informação. Se não souber qual prazo se aplica, deixe o campo sem informar."
    );
    expect(TEXTO_EXPLICACAO_REFERENCIAS[2]).toBe(
      "Depois de descongelar, siga as orientações de preparo e cozimento da receita antes de consumir. Congelar não dispensa essas etapas."
    );
  });

  it("aviso exato: não é garantia automática de segurança ou qualidade", () => {
    expect(AVISO_REFERENCIAS).toBe(
      "As referências são orientações gerais e não representam garantia automática de segurança ou qualidade para todas as receitas."
    );
  });

  it("textos de referência não trazem 60 ou 90 dias como prazo", () => {
    const textos = [TEXTO_AJUDA_PRAZO, AVISO_REFERENCIAS].join(" ");
    expect(textos).not.toMatch(/\b(60|90)\b/);
  });
});

describe("garantias de implementação", () => {
  it("formulários não têm links externos e o campo nunca é preenchido pelo app", () => {
    const codigo = lerArquivo("components", "marmitas", "campo-prazo-congelamento.tsx");
    expect(codigo).not.toMatch(/<a\b|href=/);
    expect(codigo).not.toMatch(/\bvalue=|\bdefaultValue=/);
    expect(codigo).not.toContain("REFERENCIA_");
    expect(lerArquivo("app", "marmitas", "receitas", "nova", "page.tsx")).not.toMatch(/<a\b[^>]*href=/);
  });

  it("página Sobre o plano: links com target e rel corretos", () => {
    const codigo = lerArquivo("app", "marmitas", "plano", "page.tsx");
    expect(codigo).toContain("ATRIBUTOS_LINK_EXTERNO.target");
    expect(codigo).toContain("ATRIBUTOS_LINK_EXTERNO.rel");
    expect(codigo).toContain("Referências gerais de conservação");
  });

  it("formulário completo e cadastro rápido usam o mesmo componente", () => {
    expect(lerArquivo("app", "marmitas", "receitas", "nova", "page.tsx")).toContain("CampoPrazoCongelamento");
    expect(lerArquivo("app", "marmitas", "preparo", "page.tsx")).toContain("CampoPrazoCongelamento");
  });

  it("nenhum código de pesquisa automática ou extração de página externa", () => {
    const arquivos = [
      ["lib", "marmitas", "referencias.ts"],
      ["components", "marmitas", "campo-prazo-congelamento.tsx"],
    ];
    for (const partes of arquivos) {
      expect(lerArquivo(...partes)).not.toMatch(/\bfetch\(|\bcheerio\b|\bDOMParser\b/);
    }
  });
});
