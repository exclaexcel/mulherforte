import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ExportacaoLeituraErro } from "./tipos";
import { lerTodasAsLinhas, MENSAGEM_FALHA_GERACAO, TAMANHO_PAGINA } from "./paginacao";

type Linha = { id: string; valor: number };

/**
 * Servidor simulado: ordena por id, aplica o cursor (gt) e o limite pedido. Pode
 * cortar cada resposta em `limiteServidor`, como o Max Rows do Supabase faz. Pode
 * falhar em chamadas específicas (número da chamada, a partir de 1).
 */
function criarServidor(
  linhas: Linha[],
  opcoes: { limiteServidor?: number; falhaNaChamada?: number; lancaNaChamada?: number } = {}
) {
  const ordenadas = [...linhas].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const cursoresRecebidos: (string | null)[] = [];
  const tamanhosRecebidos: number[] = [];
  let chamada = 0;

  const consultaDaPagina = async (cursor: string | null, tamanho: number) => {
    chamada += 1;
    cursoresRecebidos.push(cursor);
    tamanhosRecebidos.push(tamanho);

    if (opcoes.lancaNaChamada === chamada) {
      throw new Error("falha de rede com detalhe interno");
    }
    if (opcoes.falhaNaChamada === chamada) {
      return { data: null, error: { message: "erro simulado com detalhe interno" } };
    }

    const restantes = ordenadas.filter((l) => cursor === null || l.id > cursor);
    const corte = Math.min(tamanho, opcoes.limiteServidor ?? Infinity);
    return { data: restantes.slice(0, corte), error: null };
  };

  return { consultaDaPagina, cursoresRecebidos, tamanhosRecebidos, chamadas: () => chamada };
}

function linhas(n: number): Linha[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `id-${String(i + 1).padStart(6, "0")}`,
    valor: i,
  }));
}

describe("lerTodasAsLinhas — quantidades e bordas de página", () => {
  it.each([
    [0],
    [1],
    [10],
    [TAMANHO_PAGINA - 1],
    [TAMANHO_PAGINA],
    [TAMANHO_PAGINA + 1],
    [1000],
    [1001],
    [1200],
  ])("%i registros voltam todos, sem perda", async (n) => {
    const servidor = criarServidor(linhas(n));

    const resultado = await lerTodasAsLinhas(servidor.consultaDaPagina);

    expect(resultado).toHaveLength(n);
  });

  it("exatamente uma página cheia exige uma página extra vazia para confirmar o fim", async () => {
    const servidor = criarServidor(linhas(TAMANHO_PAGINA));

    await lerTodasAsLinhas(servidor.consultaDaPagina);

    expect(servidor.chamadas()).toBe(2);
  });

  it("página curta não encerra sozinha: só uma página vazia encerra", async () => {
    const servidor = criarServidor(linhas(10));

    await lerTodasAsLinhas(servidor.consultaDaPagina);

    expect(servidor.chamadas()).toBe(2);
  });
});

describe("lerTodasAsLinhas — cursor, ordem e ausência de duplicidade", () => {
  it("cada página recebe o último id da anterior como cursor", async () => {
    const servidor = criarServidor(linhas(1001));

    await lerTodasAsLinhas(servidor.consultaDaPagina);

    expect(servidor.cursoresRecebidos[0]).toBeNull();
    expect(servidor.cursoresRecebidos[1]).toBe(`id-${String(TAMANHO_PAGINA).padStart(6, "0")}`);
    expect(servidor.cursoresRecebidos[2]).toBe(`id-${String(TAMANHO_PAGINA * 2).padStart(6, "0")}`);
  });

  it("o tamanho pedido é sempre o tamanho fixo da página", async () => {
    const servidor = criarServidor(linhas(1001));

    await lerTodasAsLinhas(servidor.consultaDaPagina);

    expect(new Set(servidor.tamanhosRecebidos)).toEqual(new Set([TAMANHO_PAGINA]));
  });

  it("ordem preservada e sem duplicidade entre páginas", async () => {
    const servidor = criarServidor(linhas(1201));

    const resultado = await lerTodasAsLinhas(servidor.consultaDaPagina);

    const ids = resultado.map((l) => l.id as string);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
  });

  it("não perde registros quando o servidor corta a página abaixo do tamanho pedido", async () => {
    // Simula Max Rows = 100 com página pedida de 500: a paginação não depende disso.
    const servidor = criarServidor(linhas(350), { limiteServidor: 100 });

    const resultado = await lerTodasAsLinhas(servidor.consultaDaPagina);

    expect(resultado).toHaveLength(350);
  });

  it("linha sem id válido interrompe a leitura", async () => {
    const semId = [{ valor: 1 } as unknown as Linha];
    const servidor = criarServidor(semId);

    await expect(lerTodasAsLinhas(servidor.consultaDaPagina)).rejects.toBeInstanceOf(ExportacaoLeituraErro);
  });

  it("cursor que não avança interrompe a leitura (evita loop infinito)", async () => {
    const repetido = async () => ({ data: [{ id: "mesmo", valor: 1 }], error: null });

    await expect(lerTodasAsLinhas(repetido)).rejects.toBeInstanceOf(ExportacaoLeituraErro);
  });
});

describe("lerTodasAsLinhas — erros nunca viram resultado parcial", () => {
  it("erro na primeira página: falha, sem dados", async () => {
    const servidor = criarServidor(linhas(1001), { falhaNaChamada: 1 });

    await expect(lerTodasAsLinhas(servidor.consultaDaPagina)).rejects.toMatchObject({
      message: MENSAGEM_FALHA_GERACAO,
    });
  });

  it("erro em página intermediária: falha total, nenhum resultado parcial", async () => {
    const servidor = criarServidor(linhas(1501), { falhaNaChamada: 2 });

    let resultado: unknown = null;
    await lerTodasAsLinhas(servidor.consultaDaPagina)
      .then((r) => (resultado = r))
      .catch(() => {});

    expect(resultado).toBeNull();
  });

  it("erro na última página (a confirmação de fim): também falha", async () => {
    const servidor = criarServidor(linhas(TAMANHO_PAGINA), { falhaNaChamada: 2 });

    await expect(lerTodasAsLinhas(servidor.consultaDaPagina)).rejects.toBeInstanceOf(ExportacaoLeituraErro);
  });

  it("exceção da biblioteca vira ExportacaoLeituraErro", async () => {
    const servidor = criarServidor(linhas(10), { lancaNaChamada: 1 });

    await expect(lerTodasAsLinhas(servidor.consultaDaPagina)).rejects.toBeInstanceOf(ExportacaoLeituraErro);
  });

  it("a mensagem não expõe tabela, página, range, UUID nem detalhe do banco", async () => {
    const servidor = criarServidor(linhas(10), { falhaNaChamada: 1 });

    const erro = await lerTodasAsLinhas(servidor.consultaDaPagina).catch((e) => e);

    expect(erro.message).toBe("Não foi possível gerar o arquivo agora. Tente novamente.");
    expect(erro.message).not.toMatch(/erro simulado|detalhe interno|range|página|registros_/);
  });
});

describe("paginacao.ts e buscarDados.ts não registram payload pessoal", () => {
  it.each(["paginacao.ts", "buscarDados.ts"])("%s não usa console", (arquivo) => {
    const codigo = readFileSync(join(__dirname, arquivo), "utf8");
    expect(codigo).not.toMatch(/console\./);
  });
});
