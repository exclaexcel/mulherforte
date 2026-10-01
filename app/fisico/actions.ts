"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/date";
import { treinoObrigatorioDoDia } from "@/lib/fisico/calendarioTreino";
import { selecionarMedidaReferencia, verificarVariacaoAtipica } from "@/lib/fisico/medidas";
import type { IndicadorMeta, RegiaoMedida } from "@/lib/fisico/types";

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

export async function registrarPeso(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const data = String(formData.get("data") ?? "");
  const pesoKg = Number(formData.get("peso_kg"));
  const percentualGorduraRaw = formData.get("percentual_gordura");
  const percentualMassaMuscularRaw = formData.get("percentual_massa_muscular");
  const percentualAguaRaw = formData.get("percentual_agua");

  if (!data || !pesoKg || pesoKg <= 0) {
    throw new Error("Data e peso são obrigatórios.");
  }

  const { error } = await supabase.from("registros_peso").upsert(
    {
      user_id: user.id,
      data,
      peso_kg: pesoKg,
      percentual_gordura: percentualGorduraRaw ? Number(percentualGorduraRaw) : null,
      percentual_massa_muscular: percentualMassaMuscularRaw
        ? Number(percentualMassaMuscularRaw)
        : null,
      percentual_agua: percentualAguaRaw ? Number(percentualAguaRaw) : null,
    },
    { onConflict: "user_id,data" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fisico/peso");
  revalidatePath("/fisico/metas");
  revalidatePath("/fisico/indicadores");
  redirect("/fisico/peso?peso_salvo=1");
}

export async function excluirPesoHoje() {
  const { supabase, user } = await getUserOrRedirect();

  const { error } = await supabase
    .from("registros_peso")
    .delete()
    .eq("user_id", user.id)
    .eq("data", hojeISO());

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fisico/peso");
  revalidatePath("/fisico/metas");
  revalidatePath("/fisico/indicadores");
  redirect("/fisico/peso?registro_excluido=1");
}

export async function registrarMedidas(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const data = String(formData.get("data") ?? "");

  if (!data) {
    throw new Error("Data é obrigatória.");
  }

  const campos: { regiao: RegiaoMedida; raw: FormDataEntryValue | null }[] = [
    { regiao: "cintura", raw: formData.get("cintura_cm") },
    { regiao: "quadril", raw: formData.get("quadril_cm") },
    { regiao: "coxa", raw: formData.get("coxa_cm") },
    { regiao: "abdomen_inferior", raw: formData.get("abdomen_inferior_cm") },
  ];

  const registros = campos
    .filter((c) => c.raw !== null && String(c.raw).trim() !== "")
    .map((c) => {
      const valorCm = Number(c.raw);
      if (!valorCm || valorCm <= 0) {
        throw new Error(`Valor inválido para ${c.regiao}.`);
      }
      return {
        user_id: user.id,
        data,
        regiao: c.regiao,
        valor_cm: valorCm,
      };
    });

  if (registros.length === 0) {
    throw new Error("Preencha pelo menos uma medida.");
  }

  // Sanity check de variação atípica (PRD §3.2): compara com a medida de
  // referência da mesma região, entre 21-45 dias atrás ("mês anterior", com
  // margem), a mais próxima de 30 dias. Não bloqueia o salvamento, só
  // sinaliza pra tela avisar depois do redirect.
  const regioesSendoSalvas = registros.map((r) => r.regiao);
  const { data: candidatas } = await supabase
    .from("medidas_corporais")
    .select("regiao, data, valor_cm")
    .eq("user_id", user.id)
    .in("regiao", regioesSendoSalvas)
    .neq("data", data);

  const variacoesAtipicas = registros
    .filter((registro) => {
      const candidatasRegiao = (candidatas ?? [])
        .filter((c) => c.regiao === registro.regiao)
        .map((c) => ({ data: c.data, valorCm: c.valor_cm }));

      const referencia = selecionarMedidaReferencia(candidatasRegiao, data);

      return referencia !== null && verificarVariacaoAtipica(registro.valor_cm, referencia.valorCm);
    })
    .map((registro) => registro.regiao);

  const { error } = await supabase
    .from("medidas_corporais")
    .upsert(registros, { onConflict: "user_id,data,regiao" });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fisico/medidas");
  revalidatePath("/fisico/metas");
  revalidatePath("/fisico/indicadores");

  const query =
    variacoesAtipicas.length > 0
      ? `medidas_salvas=1&variacao_atipica=${variacoesAtipicas.join(",")}`
      : "medidas_salvas=1";
  redirect(`/fisico/medidas?${query}`);
}

export async function excluirMedidasHoje() {
  const { supabase, user } = await getUserOrRedirect();

  const { error } = await supabase
    .from("medidas_corporais")
    .delete()
    .eq("user_id", user.id)
    .eq("data", hojeISO());

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fisico/medidas");
  revalidatePath("/fisico/metas");
  revalidatePath("/fisico/indicadores");
  redirect("/fisico/medidas?registro_excluido=1");
}

export async function registrarTreino(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const data = String(formData.get("data") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const realizado = formData.get("realizado") === "on";
  const tipoOutroDescricao = String(formData.get("tipo_outro_descricao") ?? "").trim() || null;
  const duracaoRaw = formData.get("duracao_minutos");
  const caloriasRaw = formData.get("calorias");

  if (!data || !tipo) {
    throw new Error("Data e tipo de treino são obrigatórios.");
  }

  if (tipo === "outro" && !tipoOutroDescricao) {
    throw new Error('Descreva qual atividade foi, já que o tipo é "Outro".');
  }

  // Obrigatoriedade vem só do calendário fixo (Etapa 6A) — nunca de um
  // controle manual. Persistida aqui por histórico/compatibilidade, mas o
  // score semanal (lib/fisico/score.ts) ignora esta coluna e lê o calendário
  // direto.
  const obrigatorio = treinoObrigatorioDoDia(data) !== null;

  const { error } = await supabase.from("adesao_treino").upsert(
    {
      user_id: user.id,
      data,
      tipo,
      obrigatorio,
      realizado,
      tipo_outro_descricao: tipo === "outro" ? tipoOutroDescricao : null,
      duracao_minutos: duracaoRaw ? Number(duracaoRaw) : null,
      calorias: caloriasRaw ? Number(caloriasRaw) : null,
    },
    { onConflict: "user_id,data" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fisico/treino");
  redirect("/fisico/treino?treino_salvo=1");
}

export async function excluirTreinoHoje() {
  const { supabase, user } = await getUserOrRedirect();

  const { error } = await supabase
    .from("adesao_treino")
    .delete()
    .eq("user_id", user.id)
    .eq("data", hojeISO());

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fisico/treino");
  redirect("/fisico/treino?registro_excluido=1");
}

export async function incrementarAgua(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const incrementoMl = Number(formData.get("incremento_ml"));
  if (!incrementoMl || incrementoMl <= 0) {
    throw new Error("Incremento inválido.");
  }

  const hoje = hojeISO();

  const { data: registroHoje } = await supabase
    .from("adesao_habitos")
    .select("quantidade_agua_ml")
    .eq("user_id", user.id)
    .eq("data", hoje)
    .maybeSingle();

  const novaQuantidade = (registroHoje?.quantidade_agua_ml ?? 0) + incrementoMl;

  await salvarQuantidadeAgua(user.id, hoje, novaQuantidade);

  revalidatePath("/fisico/habitos");
}

export async function ajustarAguaManual(formData: FormData) {
  const { user } = await getUserOrRedirect();

  const valorMl = Number(formData.get("valor_ml"));
  if (valorMl === null || valorMl < 0 || Number.isNaN(valorMl)) {
    throw new Error("Quantidade inválida.");
  }

  await salvarQuantidadeAgua(user.id, hojeISO(), valorMl);

  revalidatePath("/fisico/habitos");
}

async function salvarQuantidadeAgua(userId: string, data: string, quantidadeMl: number) {
  const supabase = await createClient();

  const { data: meta } = await supabase
    .from("metas")
    .select("meta_hidratacao_litros_dia")
    .eq("user_id", userId)
    .eq("indicador", "hidratacao")
    .maybeSingle();

  const metaLitros = meta?.meta_hidratacao_litros_dia ?? null;
  // Sem meta válida, a hidratação é excluída do score semanal.
  const bebeuAguaMeta = metaLitros ? quantidadeMl / 1000 >= metaLitros : false;

  const { error } = await supabase.from("adesao_habitos").upsert(
    {
      user_id: userId,
      data,
      quantidade_agua_ml: quantidadeMl,
      bebeu_agua_meta: bebeuAguaMeta,
    },
    { onConflict: "user_id,data" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function alternarProteina(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const priorizouAtual = formData.get("priorizou_proteina_atual") === "true";

  const { error } = await supabase.from("adesao_habitos").upsert(
    {
      user_id: user.id,
      data: hojeISO(),
      priorizou_proteina: !priorizouAtual,
    },
    { onConflict: "user_id,data" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fisico/habitos");
}

export async function excluirHabitosHoje() {
  const { supabase, user } = await getUserOrRedirect();

  const { error } = await supabase
    .from("adesao_habitos")
    .delete()
    .eq("user_id", user.id)
    .eq("data", hojeISO());

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/fisico/habitos");
  redirect("/fisico/habitos?registro_excluido=1");
}

const UNIDADE_POR_INDICADOR: Record<IndicadorMeta, "kg" | "cm" | null> = {
  peso: "kg",
  cintura: "cm",
  abdomen_inferior: "cm",
  hidratacao: null,
};

export async function salvarMeta(formData: FormData) {
  const { supabase, user } = await getUserOrRedirect();

  const indicador = String(formData.get("indicador") ?? "") as IndicadorMeta;
  const dataInicio = String(formData.get("data_inicio") ?? "") || hojeISO();
  const fase = String(formData.get("fase") ?? "").trim() || null;

  if (!indicador || !(indicador in UNIDADE_POR_INDICADOR)) {
    throw new Error("Indicador inválido.");
  }

  if (indicador === "hidratacao") {
    const metaHidratacao = Number(formData.get("meta_hidratacao_litros_dia"));
    if (!metaHidratacao || metaHidratacao <= 0) {
      throw new Error("Meta diária de hidratação é obrigatória.");
    }

    const { error } = await supabase.from("metas").upsert(
      {
        user_id: user.id,
        indicador,
        data_inicio: dataInicio,
        meta_hidratacao_litros_dia: metaHidratacao,
      },
      { onConflict: "user_id,indicador" }
    );

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const valorReferenciaRaw = formData.get("valor_referencia");
    const valorMeta = Number(formData.get("valor_meta"));
    const prazoRaw = formData.get("prazo_estimado_semanas");

    if (!valorMeta || valorMeta <= 0) {
      throw new Error("Valor da meta é obrigatório.");
    }

    const { error } = await supabase.from("metas").upsert(
      {
        user_id: user.id,
        indicador,
        data_inicio: dataInicio,
        fase,
        valor_referencia: valorReferenciaRaw ? Number(valorReferenciaRaw) : null,
        valor_meta: valorMeta,
        unidade: UNIDADE_POR_INDICADOR[indicador],
        prazo_estimado_semanas: prazoRaw ? Number(prazoRaw) : null,
      },
      { onConflict: "user_id,indicador" }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/fisico/metas");
  redirect("/fisico/metas?meta_salva=1");
}
