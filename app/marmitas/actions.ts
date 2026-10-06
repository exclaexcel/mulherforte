"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { diaSemanaFromData } from "@/lib/marmitas/preparo";
import { ehDataFutura, hojeISO } from "@/lib/date";
import { interpretarReceita, type DadosReceita } from "@/lib/marmitas/receita";
import { GRUPOS_COMPRA } from "@/lib/marmitas/types";
import {
  MENSAGEM_DATA_FUTURA,
  MENSAGEM_SALVAR,
  MENSAGEM_VALIDACAO_INDISPONIVEL,
  type ResultadoAcao,
} from "@/lib/resultado-acao";

const DIAS_CRONOGRAMA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

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

/** Compara dia da semana ignorando maiúsculas e acentos ("terça" = "Terça"). */
function normalizarDia(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Grava uma receita já validada. Recusa nome repetido para a mesma usuária (sem
 * diferenciar maiúsculas). Se a leitura de duplicidade falha, não grava: sem
 * conferir, não há como afirmar que a receita é nova.
 */
async function inserirReceitaValidada(
  supabase: ClienteSupabase,
  userId: string,
  dados: DadosReceita,
  destino: string
): Promise<ResultadoAcao> {
  const { data: existentes, error: erroLeitura } = await supabase
    .from("receitas")
    .select("nome")
    .eq("user_id", userId);

  if (erroLeitura) {
    return { ok: false, erro: MENSAGEM_VALIDACAO_INDISPONIVEL };
  }

  const jaExiste = (existentes ?? []).some(
    (r) => r.nome.trim().toLowerCase() === dados.nome.toLowerCase()
  );

  if (jaExiste) {
    return {
      ok: false,
      erro: `Já existe uma receita chamada "${dados.nome}". Selecione ela na lista, não precisa cadastrar de novo.`,
    };
  }

  const { error } = await supabase.from("receitas").insert({
    user_id: userId,
    ...dados,
  });

  if (error) {
    return { ok: false, erro: "Não foi possível salvar a receita. Tente novamente." };
  }

  return { ok: true, destino };
}

/** Cadastro rápido: mesma interpretação e mesmas mensagens do formulário completo. */
export async function criarReceita(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const resultado = interpretarReceita(formData);
  if (!resultado.ok) {
    return { ok: false, erro: resultado.erro };
  }

  const gravado = await inserirReceitaValidada(
    supabase,
    user.id,
    resultado.dados,
    "/marmitas/preparo?receita_salva=1"
  );

  if (gravado.ok) {
    revalidatePath("/marmitas/preparo");
  }
  return gravado;
}

/** Cadastro completo de receita: todos os campos, validados antes de gravar. */
export async function criarReceitaCompleta(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const resultado = interpretarReceita(formData);
  if (!resultado.ok) {
    return { ok: false, erro: resultado.erro };
  }

  const gravado = await inserirReceitaValidada(
    supabase,
    user.id,
    resultado.dados,
    "/marmitas/receitas?receita_salva=1"
  );

  if (gravado.ok) {
    revalidatePath("/marmitas/receitas");
    revalidatePath("/marmitas/preparo");
  }
  return gravado;
}

export async function criarPreparo(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const receitaId = String(formData.get("receita_id") ?? "");
  const dataPreparo = String(formData.get("data_preparo") ?? "");
  const quantidadePorcoes = Number(formData.get("quantidade_porcoes"));
  const semanaCicloRaw = formData.get("semana_ciclo");
  const semanaCiclo = semanaCicloRaw ? Number(semanaCicloRaw) : null;
  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  if (!receitaId || !dataPreparo) {
    return { ok: false, erro: "Escolha a receita e a data do preparo." };
  }

  if (!Number.isInteger(quantidadePorcoes) || quantidadePorcoes <= 0) {
    return { ok: false, erro: "Informe uma quantidade de porções maior que zero." };
  }

  if (ehDataFutura(dataPreparo)) {
    return { ok: false, erro: MENSAGEM_DATA_FUTURA };
  }

  if (semanaCiclo !== null && (!Number.isInteger(semanaCiclo) || semanaCiclo < 1 || semanaCiclo > 4)) {
    return { ok: false, erro: "A semana do ciclo deve ser de 1 a 4." };
  }

  // A FK não passa pela RLS: sem esta checagem, um id de receita de outra
  // usuária seria aceito. Confere que a receita é da sessão atual.
  const { data: receitaDaUsuaria, error: erroReceita } = await supabase
    .from("receitas")
    .select("id")
    .eq("id", receitaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (erroReceita) {
    return { ok: false, erro: MENSAGEM_VALIDACAO_INDISPONIVEL };
  }

  if (!receitaDaUsuaria) {
    return { ok: false, erro: "Receita não encontrada. Atualize a página e tente de novo." };
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
    return { ok: false, erro: "Não foi possível registrar o preparo. Tente novamente." };
  }

  revalidatePath("/marmitas/estoque");
  return { ok: true, destino: "/marmitas/estoque" };
}

export async function marcarConsumido(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, erro: "Preparo inválido. Atualize a página e tente de novo." };
  }

  // select após update confirma que alguma linha foi alterada: sem isso, zero linhas
  // pareceria sucesso.
  const { data, error } = await supabase
    .from("preparos")
    .update({
      status: "consumido",
      data_consumo: hojeISO(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return { ok: false, erro: "Não foi possível registrar o consumo agora. Tente novamente." };
  }

  if (!data || data.length === 0) {
    return { ok: false, erro: "Preparo não encontrado. Atualize a página e tente de novo." };
  }

  revalidatePath("/marmitas/estoque");
  return { ok: true, destino: "/marmitas/estoque" };
}

export async function criarItemCompra(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const grupo = String(formData.get("grupo") ?? "");
  const item = String(formData.get("item") ?? "").trim();

  if (!grupo || !item) {
    return { ok: false, erro: "Grupo e item são obrigatórios." };
  }

  if (!GRUPOS_COMPRA.some((g) => g.value === grupo)) {
    return { ok: false, erro: "Grupo inválido. Escolha uma das opções da lista." };
  }

  // Sem a leitura, não dá para afirmar que o item é novo: bloqueia a criação.
  const { data: existentes, error: erroLeitura } = await supabase
    .from("itens_compra")
    .select("item")
    .eq("user_id", user.id)
    .eq("grupo", grupo);

  if (erroLeitura) {
    return { ok: false, erro: MENSAGEM_VALIDACAO_INDISPONIVEL };
  }

  const jaExiste = (existentes ?? []).some(
    (i) => i.item.trim().toLowerCase() === item.toLowerCase()
  );

  if (jaExiste) {
    return { ok: false, erro: `"${item}" já está na lista desse grupo.` };
  }

  const { error } = await supabase.from("itens_compra").insert({
    user_id: user.id,
    grupo,
    item,
  });

  if (error) {
    return { ok: false, erro: "Não foi possível salvar o item. Tente novamente." };
  }

  revalidatePath("/marmitas/compras");
  return { ok: true, destino: "/marmitas/compras?item_salvo=1" };
}

/**
 * Inverte "tenho em casa" a partir do valor gravado, não do valor que veio no
 * formulário: uma tela antiga não grava o estado errado. Leitura com erro, item
 * ausente ou zero linhas alteradas não gravam nada.
 */
export async function alternarTenhoEmCasa(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { ok: false, erro: "Item inválido. Atualize a página e tente de novo." };
  }

  const { data: atual, error: erroLeitura } = await supabase
    .from("itens_compra")
    .select("tenho_em_casa")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (erroLeitura) {
    return { ok: false, erro: "Não foi possível atualizar o item agora. Tente novamente." };
  }

  if (!atual) {
    return { ok: false, erro: "Item não encontrado. Atualize a página e tente de novo." };
  }

  const { data, error } = await supabase
    .from("itens_compra")
    .update({ tenho_em_casa: !atual.tenho_em_casa })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error || !data || data.length === 0) {
    return { ok: false, erro: "Não foi possível atualizar o item agora. Tente novamente." };
  }

  revalidatePath("/marmitas/compras");
  return { ok: true, destino: "/marmitas/compras" };
}

export async function salvarDiaCronograma(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const semanaCiclo = Number(formData.get("semana_ciclo"));
  const diaBruto = String(formData.get("dia_semana") ?? "").trim();
  const proteina = String(formData.get("proteina") ?? "").trim() || null;
  const base = String(formData.get("base") ?? "").trim() || null;
  const legumes = String(formData.get("legumes") ?? "").trim() || null;
  const receitaExtraTexto = String(formData.get("receita_extra_texto") ?? "").trim() || null;

  if (!Number.isInteger(semanaCiclo) || semanaCiclo < 1 || semanaCiclo > 4) {
    return { ok: false, erro: "A semana do ciclo deve ser de 1 a 4." };
  }

  if (!diaBruto) {
    return { ok: false, erro: "Informe o dia da semana." };
  }

  // Grava o nome padrão do dia, para não criar "segunda" e "Segunda" como dias diferentes.
  const diaSemana = DIAS_CRONOGRAMA.find((d) => normalizarDia(d) === normalizarDia(diaBruto));
  if (!diaSemana) {
    return { ok: false, erro: "Dia da semana inválido. Use um dia de segunda a domingo." };
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
    return { ok: false, erro: MENSAGEM_SALVAR };
  }

  revalidatePath("/marmitas/cronograma");
  return { ok: true, destino: `/marmitas/cronograma?dia_salvo=1#semana-${semanaCiclo}` };
}
