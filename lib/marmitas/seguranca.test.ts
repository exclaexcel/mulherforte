import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = process.cwd();

function listarArquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return listarArquivos(caminho);
    return caminho.endsWith(".ts") || caminho.endsWith(".tsx") ? [caminho] : [];
  });
}

const arquivosDeAplicacao = ["app", "lib", "components"]
  .flatMap((pasta) => listarArquivos(join(RAIZ, pasta)))
  .filter((arq) => !arq.endsWith(".test.ts") && !arq.endsWith(".test.tsx"));

const paginasMarmitas = listarArquivos(join(RAIZ, "app", "marmitas")).filter((arq) =>
  arq.endsWith("page.tsx")
);

describe("hardening de Marmitas — guardas estáticas", () => {
  it("nenhum arquivo da aplicação referencia service_role", () => {
    const ocorrencias = arquivosDeAplicacao.filter((arq) =>
      /service_role|SERVICE_ROLE/i.test(readFileSync(arq, "utf8"))
    );
    expect(ocorrencias.map((arq) => relative(RAIZ, arq))).toEqual([]);
  });

  it("páginas de Marmitas não consultam as tabelas do módulo diretamente (usam lib/marmitas/consultas)", () => {
    const tabelasDoModulo = /\.from\(\s*"(receitas|preparos|itens_compra|cronograma_planejado)"/;
    const comConsultaDireta = paginasMarmitas.filter((arq) =>
      tabelasDoModulo.test(readFileSync(arq, "utf8"))
    );
    expect(comConsultaDireta.map((arq) => relative(RAIZ, arq))).toEqual([]);
  });

  it("toda página de Marmitas que lê dados passa pelo módulo de consultas", () => {
    const lendoDados = paginasMarmitas.filter((arq) =>
      /listar[A-Z]\w+\(/.test(readFileSync(arq, "utf8"))
    );
    expect(lendoDados.length).toBeGreaterThanOrEqual(5);
    for (const arq of lendoDados) {
      expect(readFileSync(arq, "utf8")).toContain('from "@/lib/marmitas/consultas"');
    }
  });

  it("todo update e delete em actions de Marmitas filtra por user_id na mesma operação", () => {
    const arquivo = join(RAIZ, "app", "marmitas", "actions.ts");
    const linhas = readFileSync(arquivo, "utf8").split("\n");
    const semFiltro: number[] = [];

    linhas.forEach((linha, i) => {
      if (/\.(update|delete)\(/.test(linha)) {
        const janela = linhas.slice(i, i + 8).join("\n");
        if (!janela.includes('"user_id"')) semFiltro.push(i + 1);
      }
    });

    expect(semFiltro).toEqual([]);
  });
});
