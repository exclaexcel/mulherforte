import { vi } from "vitest";

/**
 * Fake do cliente Supabase só para testes, com dados fictícios. Aplica os
 * filtros .eq de verdade, então um teste de isolamento falha se alguma
 * consulta esquecer o user_id. Registra todas as chamadas e qualquer tentativa
 * de escrita (que deve ser zero na exportação).
 */

export type Linha = Record<string, unknown>;

export type Chamada = { tabela: string; metodo: string; args: unknown[] };

export function criarFakeSupabase(
  tabelas: Record<string, Linha[]>,
  opcoes: { erroEm?: string; lancaEm?: string } = {}
) {
  const chamadas: Chamada[] = [];
  const escritas: Chamada[] = [];

  function criarConsulta(tabela: string) {
    const filtros: [string, unknown][] = [];
    const linhasDaTabela = tabelas[tabela] ?? [];

    const filtradas = () =>
      linhasDaTabela.filter((l) => filtros.every(([coluna, valor]) => l[coluna] === valor));

    const resultado = () =>
      opcoes.erroEm === tabela
        ? { data: null, error: { message: "erro simulado" } }
        : { data: filtradas(), error: null };

    const consulta: Record<string, unknown> = {};

    for (const metodo of ["select", "order"] as const) {
      consulta[metodo] = (...args: unknown[]) => {
        chamadas.push({ tabela, metodo, args });
        return consulta;
      };
    }

    consulta.eq = (coluna: string, valor: unknown) => {
      chamadas.push({ tabela, metodo: "eq", args: [coluna, valor] });
      filtros.push([coluna, valor]);
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

  return { supabase, chamadas, escritas };
}

export const USER_ID = "00000000-0000-4000-8000-0000000000aa";
export const OUTRA_USUARIA_ID = "00000000-0000-4000-8000-0000000000bb";
export const RECEITA_ID = "00000000-0000-4000-8000-0000000000c1";
export const RECEITA_ID_2 = "00000000-0000-4000-8000-0000000000c2";
