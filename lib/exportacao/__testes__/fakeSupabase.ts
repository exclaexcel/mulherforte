import { vi } from "vitest";

/**
 * Fake do cliente Supabase só para testes, com dados fictícios. Aplica de verdade os
 * filtros .eq e .gt, a ordenação e o .limit, para simular a paginação por cursor.
 * Registra todas as chamadas e qualquer tentativa de escrita (que deve ser zero na
 * exportação).
 *
 * Opções:
 * - erroEm: toda consulta da tabela devolve erro.
 * - erroNaPagina: só a página N (contada por tabela, a partir de 1) devolve erro.
 * - lancaEm: a consulta lança exceção, como falha de rede.
 * - limiteServidor: corta cada resposta neste número de linhas, como o Max Rows do
 *   Supabase faria. A paginação precisa funcionar mesmo assim.
 */

export type Linha = Record<string, unknown>;

export type Chamada = { tabela: string; metodo: string; args: unknown[] };

type Filtro = { coluna: string; op: "eq" | "gt"; valor: unknown };

export function criarFakeSupabase(
  tabelas: Record<string, Linha[]>,
  opcoes: {
    erroEm?: string;
    erroNaPagina?: { tabela: string; pagina: number };
    lancaEm?: string;
    limiteServidor?: number;
  } = {}
) {
  const chamadas: Chamada[] = [];
  const escritas: Chamada[] = [];
  const paginasPorTabela: Record<string, number> = {};

  function criarConsulta(tabela: string) {
    paginasPorTabela[tabela] = (paginasPorTabela[tabela] ?? 0) + 1;
    const pagina = paginasPorTabela[tabela];

    const filtros: Filtro[] = [];
    let ordem: string | null = null;
    let limite: number | null = null;
    const linhasDaTabela = tabelas[tabela] ?? [];

    const resultadoDaConsulta = () => {
      let linhas = linhasDaTabela.filter((l) =>
        filtros.every((f) =>
          f.op === "eq" ? l[f.coluna] === f.valor : String(l[f.coluna]) > String(f.valor)
        )
      );
      if (ordem) {
        linhas = [...linhas].sort((a, b) => (String(a[ordem!]) < String(b[ordem!]) ? -1 : String(a[ordem!]) > String(b[ordem!]) ? 1 : 0));
      }
      const corte = Math.min(limite ?? Infinity, opcoes.limiteServidor ?? Infinity);
      return linhas.slice(0, corte === Infinity ? undefined : corte);
    };

    const resultado = () => {
      if (opcoes.erroEm === tabela) {
        return { data: null, error: { message: "erro simulado" } };
      }
      if (opcoes.erroNaPagina?.tabela === tabela && opcoes.erroNaPagina.pagina === pagina) {
        return { data: null, error: { message: "erro simulado na página" } };
      }
      return { data: resultadoDaConsulta(), error: null };
    };

    const consulta: Record<string, unknown> = {};

    consulta.select = (...args: unknown[]) => {
      chamadas.push({ tabela, metodo: "select", args });
      return consulta;
    };

    consulta.order = (coluna: string, ...resto: unknown[]) => {
      chamadas.push({ tabela, metodo: "order", args: [coluna, ...resto] });
      ordem = coluna;
      return consulta;
    };

    consulta.limit = (n: number) => {
      chamadas.push({ tabela, metodo: "limit", args: [n] });
      limite = n;
      return consulta;
    };

    consulta.eq = (coluna: string, valor: unknown) => {
      chamadas.push({ tabela, metodo: "eq", args: [coluna, valor] });
      filtros.push({ coluna, op: "eq", valor });
      return consulta;
    };

    consulta.gt = (coluna: string, valor: unknown) => {
      chamadas.push({ tabela, metodo: "gt", args: [coluna, valor] });
      filtros.push({ coluna, op: "gt", valor });
      return consulta;
    };

    consulta.maybeSingle = () => {
      chamadas.push({ tabela, metodo: "maybeSingle", args: [] });
      const r = resultado();
      return Promise.resolve({ data: r.data ? (r.data[0] ?? null) : null, error: r.error });
    };

    consulta.then = (resolver: (v: unknown) => unknown, rejeitar?: (e: unknown) => unknown) => {
      // lancaEm simula a biblioteca lançando exceção (ex.: falha de rede), não um `error` retornado.
      const base =
        opcoes.lancaEm === tabela
          ? Promise.reject(new Error("falha de rede com detalhe interno"))
          : Promise.resolve(resultado());
      return base.then(resolver, rejeitar);
    };

    for (const metodo of ["insert", "update", "upsert", "delete"] as const) {
      consulta[metodo] = (...args: unknown[]) => {
        const registro = { tabela, metodo, args };
        chamadas.push(registro);
        escritas.push(registro);
        throw new Error("escrita proibida na exportação");
      };
    }

    return consulta;
  }

  const supabase = {
    from: vi.fn((tabela: string) => criarConsulta(tabela)),
  };

  return { supabase, chamadas, escritas, paginasPorTabela };
}

export const USER_ID = "00000000-0000-4000-8000-0000000000aa";
export const OUTRA_USUARIA_ID = "00000000-0000-4000-8000-0000000000bb";
export const RECEITA_ID = "00000000-0000-4000-8000-0000000000c1";
export const RECEITA_ID_2 = "00000000-0000-4000-8000-0000000000c2";
