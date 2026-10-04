import type { createClient } from "@/lib/supabase/server";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Consultas de leitura do módulo Marmitas. Todas recebem o user.id obtido da
 * sessão no servidor e aplicam .eq("user_id") explicitamente — a RLS continua
 * ativa, mas o filtro não depende só dela (defesa em profundidade).
 */

export function listarReceitasBiblioteca(supabase: ClienteSupabase, userId: string) {
  return supabase
    .from("receitas")
    .select("id, nome, categoria, ingredientes, modo_preparo, notas, selos, validade_congelado_dias")
    .eq("user_id", userId)
    .order("nome");
}

export function listarReceitasParaPreparo(supabase: ClienteSupabase, userId: string) {
  return supabase
    .from("receitas")
    .select("id, nome")
    .eq("user_id", userId)
    .order("nome");
}

export function listarItensCompra(supabase: ClienteSupabase, userId: string) {
  return supabase
    .from("itens_compra")
    .select("id, grupo, item, tenho_em_casa")
    .eq("user_id", userId)
    .order("item");
}

export function listarCronograma(supabase: ClienteSupabase, userId: string) {
  return supabase
    .from("cronograma_planejado")
    .select("id, semana_ciclo, dia_semana, proteina, base, legumes, receita_extra_texto")
    .eq("user_id", userId)
    .order("semana_ciclo")
    .order("id");
}

export function listarPreparosCongelados(supabase: ClienteSupabase, userId: string) {
  return supabase
    .from("preparos")
    .select("id, data_preparo, quantidade_porcoes, observacoes, receitas ( nome, validade_congelado_dias )")
    .eq("user_id", userId)
    .eq("status", "congelado")
    .order("data_preparo", { ascending: true });
}
