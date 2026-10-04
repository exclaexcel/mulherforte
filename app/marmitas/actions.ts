"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { diaSemanaFromData } from "@/lib/marmitas/preparo";
import { hojeISO } from "@/lib/date";
import { interpretarReceita, type DadosReceita } from "@/lib/marmitas/receita";

async function getUserOrRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user };
}

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Grava uma receita já validada. Recusa nome repetido para a mesma usuária
 * (sem diferenciar maiúsculas). Erro do banco vira mensagem genérica.
 */
async function inserirReceitaValidada(supabase: ClienteSupabase, userId: string, dados: DadosReceita) {
  const { data: existentes } = await supabase
    .from("receitas")
    .select("nome")
    .eq("user_id", userId);

  const jaExiste = (existentes ?? []).some(
    (r) => r.nome.trim().toLowerCase() === dados.nome.toLowerCase()
  );

  if (jaExiste) {
    throw new Error(
      `Já existe uma receita chamada "${dados.nome}". Selecione ela na lista, não precisa cadastrar de novo.`
    );
  }

  const { error } = await supabase.from("receitas").insert({
    user_id: userId,
    ...dados,
  });

  if (error) {
    throw new Error("Não foi possível salvar a receita. Tente novamente.");
  }
}

/** Cadastro rápido: mesma interpretação e mesmas mensagens do formulário completo. */
export async function criarReceita(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const resultado = interpretarReceita(formData);
  if (!resultado.ok) {
    throw new Error(resultado.erro);
  }

  await inserirReceitaValidada(supabase, user.id, resultado.dados);

  revalidatePath("/marmitas/preparo");
  redirect("/marmitas/preparo?receita_salva=1");
}

/** Cadastro completo de receita: todos os campos, validados antes de gravar. */
export async function criarReceitaCompleta(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const resultado = interpretarReceita(formData);
  if (!resultado.ok) {
    throw new Error(resultado.erro);
  }
  await inserirReceitaValidada(supabase, user.id, resultado.dados);

  revalidatePath("/marmitas/receitas");
  revalidatePath("/marmitas/preparo");
  redirect("/marmitas/receitas?receita_salva=1");
}

export async function criarPreparo(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const receitaId = String(formData.get("receita_id") ?? "");
  const dataPreparo = String(formData.get("data_preparo") ?? "");
  const quantidadePorcoes = Number(formData.get("quantidade_porcoes"));
  const semanaCicloRaw = formData.get("semana_ciclo");
  const semanaCiclo = semanaCicloRaw ? Number(semanaCicloRaw) : null;
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  if (!receitaId || !dataPreparo || !quantidadePorcoes || quantidadePorcoes <= 0) {
    throw new Error("Receita, data e quantidade de porções são obrigatórios.");
  }

  // A FK não passa pela RLS: sem esta checagem, um id de receita de outra
  // usuária seria aceito. Confere que a receita é da sessão atual.
  const { data: receitaDaUsuaria } = await supabase
    .from("receitas")
    .select("id")
    .eq("id", receitaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!receitaDaUsuaria) {
    throw new Error("Receita não encontrada. Atualize a página e tente de novo.");
  }

  const { error } = await supabase.from("preparos").insert({
    user_id: user.id,
    receita_id: receitaId,
    data_preparo: dataPreparo,
    dia_semana: diaSemanaFromData(dataPreparo),
    semana_ciclo: semanaCiclo,
    quantidade_porcoes: quantidadePorcoes,
    observacoes,
    status: "congelado",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/marmitas/estoque");
  redirect("/marmitas/estoque");
}

export async function marcarConsumido(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("Preparo inválido.");
  }

  const { error } = await supabase
    .from("preparos")
    .update({
      status: "consumido",
      data_consumo: hojeISO(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/marmitas/estoque");
}

export async function criarItemCompra(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const grupo = String(formData.get("grupo") ?? "");
  const item = String(formData.get("item") ?? "").trim();

  if (!grupo || !item) {
    throw new Error("Grupo e item são obrigatórios.");
  }

  const { data: existentes } = await supabase
    .from("itens_compra")
    .select("item")
    .eq("user_id", user.id)
    .eq("grupo", grupo);

  const jaExiste = (existentes ?? []).some(
    (i) => i.item.trim().toLowerCase() === item.toLowerCase()
  );

  if (jaExiste) {
    throw new Error(`"${item}" já está na lista desse grupo.`);
  }

  const { error } = await supabase.from("itens_compra").insert({
    user_id: user.id,
    grupo,
    item,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/marmitas/compras");
  redirect("/marmitas/compras?item_salvo=1");
}

export async function alternarTenhoEmCasa(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const id = String(formData.get("id") ?? "");
  const tenhoEmCasaAtual = formData.get("tenho_em_casa") === "true";

  if (!id) {
    throw new Error("Item inválido.");
  }

  const { error } = await supabase
    .from("itens_compra")
    .update({ tenho_em_casa: !tenhoEmCasaAtual })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/marmitas/compras");
}

export async function salvarDiaCronograma(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const semanaCiclo = Number(formData.get("semana_ciclo"));
  const diaSemana = String(formData.get("dia_semana") ?? "").trim();
  const proteina = String(formData.get("proteina") ?? "").trim() || null;
  const base = String(formData.get("base") ?? "").trim() || null;
  const legumes = String(formData.get("legumes") ?? "").trim() || null;
  const receitaExtraTexto = String(formData.get("receita_extra_texto") ?? "").trim() || null;

  if (!semanaCiclo || semanaCiclo < 1 || semanaCiclo > 4 || !diaSemana) {
    throw new Error("Semana (1-4) e dia são obrigatórios.");
  }

  const { error } = await supabase.from("cronograma_planejado").upsert(
    {
      user_id: user.id,
      semana_ciclo: semanaCiclo,
      dia_semana: diaSemana,
      proteina,
      base,
      legumes,
      receita_extra_texto: receitaExtraTexto,
    },
    { onConflict: "user_id,semana_ciclo,dia_semana" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/marmitas/cronograma");
  redirect(`/marmitas/cronograma?dia_salvo=1#semana-${semanaCiclo}`);
}
