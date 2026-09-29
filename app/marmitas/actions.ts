"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { diaSemanaFromData } from "@/lib/marmitas/preparo";
import { hojeISO } from "@/lib/date";

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

export async function criarReceita(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const nome = String(formData.get("nome") ?? "").trim();
  const validadeDias = Number(formData.get("validade_congelado_dias"));

  if (!nome || !validadeDias || validadeDias <= 0) {
    throw new Error("Nome e validade (em dias) são obrigatórios.");
  }

  const { data: existentes } = await supabase
    .from("receitas")
    .select("nome")
    .eq("user_id", user.id);

  const jaExiste = (existentes ?? []).some(
    (r) => r.nome.trim().toLowerCase() === nome.toLowerCase()
  );

  if (jaExiste) {
    throw new Error(
      `Já existe uma receita chamada "${nome}". Selecione ela na lista, não precisa cadastrar de novo.`
    );
  }

  const { error } = await supabase.from("receitas").insert({
    user_id: user.id,
    nome,
    validade_congelado_dias: validadeDias,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/marmitas/preparo");
  redirect("/marmitas/preparo?receita_salva=1");
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
  const { supabase } = await getUserOrRedirect();

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
    .eq("id", id);

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

  const { error } = await supabase.from("itens_compra").insert({
    user_id: user.id,
    grupo,
    item,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/marmitas/compras");
}

export async function alternarTenhoEmCasa(formData: FormData) {
  const { supabase } = await getUserOrRedirect();

  const id = String(formData.get("id") ?? "");
  const tenhoEmCasaAtual = formData.get("tenho_em_casa") === "true";

  if (!id) {
    throw new Error("Item inválido.");
  }

  const { error } = await supabase
    .from("itens_compra")
    .update({ tenho_em_casa: !tenhoEmCasaAtual })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/marmitas/compras");
}
