import { describe, expect, it, vi } from "vitest";
import {
  listarCronograma,
  listarItensCompra,
  listarPreparosCongelados,
  listarReceitasBiblioteca,
  listarReceitasParaPreparo,
} from "./consultas";

const USER_ID = "00000000-0000-4000-8000-000000000001";

type Chamada = { metodo: string; args: unknown[] };

function criarBuilder(resultado: unknown = { data: [], error: null }) {
  const chamadas: Chamada[] = [];
  const builder: Record<string, unknown> = {};
  for (const metodo of ["select", "eq", "order", "in", "maybeSingle"]) {
    builder[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return builder;
    };
  }
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(resultado).then(resolve, reject);
  return { builder, chamadas };
}

function criarSupabase(resultado?: unknown) {
  const { builder, chamadas } = criarBuilder(resultado);
  const from = vi.fn(() => builder);
  return { supabase: { from } as unknown as Parameters<typeof listarReceitasBiblioteca>[0], from, chamadas };
}

function temFiltroUsuario(chamadas: Chamada[]) {
  return chamadas.some((c) => c.metodo === "eq" && c.args[0] === "user_id" && c.args[1] === USER_ID);
}

describe("consultas de Marmitas — filtro explícito por user_id", () => {
  it("receitas da biblioteca filtram pela usuária, mantêm colunas e ordem por nome", () => {
    const { supabase, from, chamadas } = criarSupabase();
    listarReceitasBiblioteca(supabase, USER_ID);

    expect(from).toHaveBeenCalledWith("receitas");
    expect(temFiltroUsuario(chamadas)).toBe(true);
    expect(chamadas).toContainEqual({
      metodo: "select",
      args: ["id, nome, categoria, ingredientes, modo_preparo, notas, selos"],
    });
    expect(chamadas).toContainEqual({ metodo: "order", args: ["nome"] });
  });

  it("receitas para preparo filtram pela usuária e selecionam só id e nome", () => {
    const { supabase, from, chamadas } = criarSupabase();
    listarReceitasParaPreparo(supabase, USER_ID);

    expect(from).toHaveBeenCalledWith("receitas");
    expect(temFiltroUsuario(chamadas)).toBe(true);
    expect(chamadas).toContainEqual({ metodo: "select", args: ["id, nome"] });
  });

  it("itens de compra filtram pela usuária e ordenam por item", () => {
    const { supabase, from, chamadas } = criarSupabase();
    listarItensCompra(supabase, USER_ID);

    expect(from).toHaveBeenCalledWith("itens_compra");
    expect(temFiltroUsuario(chamadas)).toBe(true);
    expect(chamadas).toContainEqual({
      metodo: "select",
      args: ["id, grupo, item, tenho_em_casa"],
    });
    expect(chamadas).toContainEqual({ metodo: "order", args: ["item"] });
  });

  it("cronograma filtra pela usuária e mantém a ordenação por semana e id", () => {
    const { supabase, from, chamadas } = criarSupabase();
    listarCronograma(supabase, USER_ID);

    expect(from).toHaveBeenCalledWith("cronograma_planejado");
    expect(temFiltroUsuario(chamadas)).toBe(true);
    expect(chamadas).toContainEqual({
      metodo: "select",
      args: ["id, semana_ciclo, dia_semana, proteina, base, legumes, receita_extra_texto"],
    });
    expect(chamadas.filter((c) => c.metodo === "order").map((c) => c.args[0])).toEqual([
      "semana_ciclo",
      "id",
    ]);
  });

  it("estoque filtra pela usuária, só congelados, ordenado por data de preparo ascendente", () => {
    const { supabase, from, chamadas } = criarSupabase();
    listarPreparosCongelados(supabase, USER_ID);

    expect(from).toHaveBeenCalledWith("preparos");
    expect(temFiltroUsuario(chamadas)).toBe(true);
    expect(chamadas).toContainEqual({ metodo: "eq", args: ["status", "congelado"] });
    expect(chamadas).toContainEqual({
      metodo: "order",
      args: ["data_preparo", { ascending: true }],
    });
  });

  it("não usa o user_id recebido para nenhum outro valor", () => {
    const { supabase, chamadas } = criarSupabase();
    listarItensCompra(supabase, USER_ID);

    const filtrosUsuario = chamadas.filter((c) => c.metodo === "eq" && c.args[0] === "user_id");
    expect(filtrosUsuario).toHaveLength(1);
    expect(filtrosUsuario[0].args[1]).toBe(USER_ID);
  });

  it("resolve com o resultado do Supabase (página continua recebendo data)", async () => {
    const linhas = [{ id: "a", nome: "Frango" }];
    const { supabase } = criarSupabase({ data: linhas, error: null });

    const { data, error } = await listarReceitasParaPreparo(supabase, USER_ID);

    expect(data).toEqual(linhas);
    expect(error).toBeNull();
  });
});
