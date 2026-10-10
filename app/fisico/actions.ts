"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehDataFutura, hojeISO } from "@/lib/date";
import { treinoObrigatorioDoDia } from "@/lib/fisico/calendarioTreino";
import { selecionarMedidaReferencia, verificarVariacaoAtipica } from "@/lib/fisico/medidas";
import { REGIOES_MEDIDA, TIPOS_TREINO, type IndicadorMeta, type RegiaoMedida } from "@/lib/fisico/types";
import { lerNumeroObrigatorio, lerNumeroOpcional, type LeituraNumero } from "@/lib/numero-formulario";
import { MENSAGEM_DATA_FUTURA, type ResultadoAcao } from "@/lib/resultado-acao";

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

const MENSAGEM_PERCENTUAL = (rotulo: string) =>
  `O percentual de ${rotulo} deve ser um número entre 0 e 100.`;

const entre0e100 = (n: number) => n >= 0 && n <= 100;

export async function registrarPeso(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const data = String(formData.get("data") ?? "");
  const pesoKg = Number(formData.get("peso_kg"));

  if (!data) {
    return { ok: false, erro: "Informe a data do registro." };
  }

  if (ehDataFutura(data)) {
    return { ok: false, erro: MENSAGEM_DATA_FUTURA };
  }

  if (!Number.isFinite(pesoKg) || pesoKg <= 0) {
    return { ok: false, erro: "Informe um peso maior que zero." };
  }

  const gordura = lerNumeroOpcional(formData.get("percentual_gordura"), entre0e100, MENSAGEM_PERCENTUAL("gordura"));
  const massaMuscular = lerNumeroOpcional(
    formData.get("percentual_massa_muscular"),
    entre0e100,
    MENSAGEM_PERCENTUAL("massa muscular")
  );
  const agua = lerNumeroOpcional(formData.get("percentual_agua"), entre0e100, MENSAGEM_PERCENTUAL("água"));

  const leituras: LeituraNumero[] = [gordura, massaMuscular, agua];
  const falha = leituras.find((l) => !l.ok);
  if (falha && !falha.ok) {
    return { ok: false, erro: falha.erro };
  }

  const { error } = await supabase.from("registros_peso").upsert(
    {
      user_id: user.id,
      data,
      peso_kg: pesoKg,
      percentual_gordura: gordura.ok ? gordura.valor : null,
      percentual_massa_muscular: massaMuscular.ok ? massaMuscular.valor : null,
      percentual_agua: agua.ok ? agua.valor : null,
    },
    { onConflict: "user_id,data" }
  );

  if (error) {
    return { ok: false, erro: "Não foi possível salvar o peso. Tente novamente." };
  }

  revalidatePath("/fisico/peso");
  revalidatePath("/fisico/metas");
  revalidatePath("/fisico/indicadores");
  revalidatePath("/fisico/historico");

  // Editando hoje: continua na tela simples de registro. Corrigindo um dia
  // passado (a partir do histórico): volta pro histórico, pra confirmar a correção.
  const destino =
    data === hojeISO() ? "/fisico/peso?peso_salvo=1" : "/fisico/historico?aba=peso&peso_salvo=1";
  return { ok: true, destino };
}

/**
 * Exclui o registro de uma data específica de uma tabela da Jornada, filtrando por
 * user_id e data. Zero linhas apagadas não é sucesso: a tela informa que não há
 * registro para excluir.
 */
async function excluirRegistroPorData(
  tabela: "registros_peso" | "medidas_corporais" | "adesao_treino" | "adesao_habitos",
  dataAlvo: string,
  caminhosRevalidados: string[],
  destino: string,
  mensagemZeroLinhas: string
): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const { data, error } = await supabase
    .from(tabela)
    .delete()
    .eq("user_id", user.id)
    .eq("data", dataAlvo)
    .select("id");

  if (error) {
    return { ok: false, erro: "Não foi possível excluir o registro agora. Tente novamente." };
  }

  if (!data || data.length === 0) {
    return { ok: false, erro: mensagemZeroLinhas };
  }

  for (const caminho of caminhosRevalidados) {
    revalidatePath(caminho);
  }
  return { ok: true, destino };
}

/** Exclui o registro de hoje — atalho de `excluirRegistroPorData` usado pelas 4 telas de registro do dia. */
async function excluirRegistroDeHoje(
  tabela: "registros_peso" | "medidas_corporais" | "adesao_treino" | "adesao_habitos",
  caminhosRevalidados: string[],
  destino: string
): Promise<ResultadoAcao> {
  return excluirRegistroPorData(
    tabela,
    hojeISO(),
    caminhosRevalidados,
    destino,
    "Não há registro de hoje para excluir. Atualize a página."
  );
}

export async function excluirPesoHoje(): Promise<ResultadoAcao> {
  return excluirRegistroDeHoje(
    "registros_peso",
    ["/fisico/peso", "/fisico/metas", "/fisico/indicadores"],
    "/fisico/peso?registro_excluido=1"
  );
}

/** Exclui o peso de uma data específica (usado a partir do histórico, para corrigir um dia que não é hoje). */
export async function excluirPesoData(formData: FormData): Promise<ResultadoAcao> {
  const data = String(formData.get("data") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { ok: false, erro: "Data inválida. Atualize a página e tente de novo." };
  }

  return excluirRegistroPorData(
    "registros_peso",
    data,
    ["/fisico/peso", "/fisico/metas", "/fisico/indicadores", "/fisico/historico"],
    "/fisico/historico?aba=peso&registro_excluido=1",
    "Não há registro nessa data para excluir. Atualize a página."
  );
}

export async function registrarMedidas(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const data = String(formData.get("data") ?? "");

  if (!data) {
    return { ok: false, erro: "Informe a data das medidas." };
  }

  if (ehDataFutura(data)) {
    return { ok: false, erro: MENSAGEM_DATA_FUTURA };
  }

  const campos: { regiao: RegiaoMedida; raw: FormDataEntryValue | null }[] = [
    { regiao: "cintura", raw: formData.get("cintura_cm") },
    { regiao: "quadril", raw: formData.get("quadril_cm") },
    { regiao: "coxa", raw: formData.get("coxa_cm") },
    { regiao: "abdomen_inferior", raw: formData.get("abdomen_inferior_cm") },
  ];

  const registros: { user_id: string; data: string; regiao: RegiaoMedida; valor_cm: number }[] = [];
  for (const campo of campos) {
    const leitura = lerNumeroOpcional(
      campo.raw,
      (n) => n > 0,
      `Valor inválido para ${rotuloRegiao(campo.regiao)}. Use centímetros, maior que zero.`
    );
    if (!leitura.ok) {
      return { ok: false, erro: leitura.erro };
    }
    if (leitura.valor !== null) {
      registros.push({ user_id: user.id, data, regiao: campo.regiao, valor_cm: leitura.valor });
    }
  }

  if (registros.length === 0) {
    return { ok: false, erro: "Preencha pelo menos uma medida." };
  }

  // Sanity check de variação atípica (PRD §3.2): compara com a medida de
  // referência da mesma região, entre 21-45 dias atrás ("mês anterior", com
  // margem), a mais próxima de 30 dias. Não bloqueia o salvamento, só
  // sinaliza pra tela avisar depois do redirect.
  const regioesSendoSalvas = registros.map((r) => r.regiao);
  const { data: candidatas, error: erroCandidatas } = await supabase
    .from("medidas_corporais")
    .select("regiao, data, valor_cm")
    .eq("user_id", user.id)
    .in("regiao", regioesSendoSalvas)
    .neq("data", data);

  // Sem as medidas anteriores, o alerta não é calculado. O salvamento segue normalmente.
  const variacoesAtipicas = erroCandidatas
    ? []
    : registros
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
    return { ok: false, erro: "Não foi possível salvar as medidas. Tente novamente." };
  }

  revalidatePath("/fisico/medidas");
  revalidatePath("/fisico/metas");
  revalidatePath("/fisico/indicadores");
  revalidatePath("/fisico/historico");

  const aviso =
    variacoesAtipicas.length > 0
      ? `Atenção: ${variacoesAtipicas.map(rotuloRegiao).join(", ")} com diferença maior que 3 cm em relação à medição de referência. Confira o ponto de medição e, se necessário, registre novamente.`
      : undefined;

  const parametros = variacoesAtipicas.length > 0 ? `&variacao_atipica=${variacoesAtipicas.join(",")}` : "";

  // Editando hoje: continua na tela simples de registro. Corrigindo um dia
  // passado (a partir do histórico): volta pro histórico, pra confirmar a correção.
  const destino =
    data === hojeISO()
      ? `/fisico/medidas?medidas_salvas=1${parametros}`
      : `/fisico/historico?aba=medidas&medidas_salvas=1${parametros}`;
  return { ok: true, destino, aviso };
}

function rotuloRegiao(regiao: RegiaoMedida): string {
  return REGIOES_MEDIDA.find((r) => r.value === regiao)?.label ?? regiao;
}

export async function excluirMedidasHoje(): Promise<ResultadoAcao> {
  return excluirRegistroDeHoje(
    "medidas_corporais",
    ["/fisico/medidas", "/fisico/metas", "/fisico/indicadores"],
    "/fisico/medidas?registro_excluido=1"
  );
}

/**
 * Exclui todas as medidas de uma data específica (todas as regiões daquela visita
 * juntas — usado a partir do histórico, para corrigir um dia que não é hoje).
 */
export async function excluirMedidasData(formData: FormData): Promise<ResultadoAcao> {
  const data = String(formData.get("data") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { ok: false, erro: "Data inválida. Atualize a página e tente de novo." };
  }

  return excluirRegistroPorData(
    "medidas_corporais",
    data,
    ["/fisico/medidas", "/fisico/metas", "/fisico/indicadores", "/fisico/historico"],
    "/fisico/historico?aba=medidas&registro_excluido=1",
    "Não há registro nessa data para excluir. Atualize a página."
  );
}

export async function registrarTreino(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const data = String(formData.get("data") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const realizado = formData.get("realizado") === "on";
  const tipoOutroDescricao = String(formData.get("tipo_outro_descricao") ?? "").trim() || null;

  if (!data || !tipo) {
    return { ok: false, erro: "Informe a data e o tipo de treino." };
  }

  if (ehDataFutura(data)) {
    return { ok: false, erro: MENSAGEM_DATA_FUTURA };
  }

  if (!TIPOS_TREINO.some((t) => t.value === tipo)) {
    return { ok: false, erro: "Tipo de treino inválido. Escolha uma das opções da lista." };
  }

  if (tipo === "outro" && !tipoOutroDescricao) {
    return { ok: false, erro: 'Descreva qual atividade foi, já que o tipo é "Outro".' };
  }

  const duracao = lerNumeroOpcional(
    formData.get("duracao_minutos"),
    (n) => Number.isInteger(n) && n > 0,
    "A duração deve ser um número inteiro de minutos, maior que zero."
  );
  const calorias = lerNumeroOpcional(
    formData.get("calorias"),
    (n) => Number.isInteger(n) && n > 0,
    "As calorias devem ser um número inteiro, maior que zero."
  );

  const leituras = [duracao, calorias];
  const falha = leituras.find((l) => !l.ok);
  if (falha && !falha.ok) {
    return { ok: false, erro: falha.erro };
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
      duracao_minutos: duracao.ok ? duracao.valor : null,
      calorias: calorias.ok ? calorias.valor : null,
    },
    { onConflict: "user_id,data" }
  );

  if (error) {
    return { ok: false, erro: "Não foi possível salvar o treino. Tente novamente." };
  }

  revalidatePath("/fisico/treino");
  revalidatePath("/fisico/historico");

  // Editando hoje: continua na tela simples de registro. Corrigindo um dia
  // passado (a partir do histórico): volta pro histórico, pra confirmar a correção.
  const destino =
    data === hojeISO() ? "/fisico/treino?treino_salvo=1" : "/fisico/historico?aba=treino&treino_salvo=1";
  return { ok: true, destino };
}

export async function excluirTreinoHoje(): Promise<ResultadoAcao> {
  return excluirRegistroDeHoje("adesao_treino", ["/fisico/treino"], "/fisico/treino?registro_excluido=1");
}

/** Exclui o treino de uma data específica (usado a partir do histórico, para corrigir um dia que não é hoje). */
export async function excluirTreinoData(formData: FormData): Promise<ResultadoAcao> {
  const data = String(formData.get("data") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { ok: false, erro: "Data inválida. Atualize a página e tente de novo." };
  }

  return excluirRegistroPorData(
    "adesao_treino",
    data,
    ["/fisico/treino", "/fisico/historico"],
    "/fisico/historico?aba=treino&registro_excluido=1",
    "Não há registro nessa data para excluir. Atualize a página."
  );
}

const MENSAGEM_AGUA_INDISPONIVEL = "Não foi possível atualizar a água agora. Tente novamente.";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

type LeituraAgua = { ok: true; quantidadeMl: number } | { ok: false };

/**
 * Data do hábito a partir do formulário (campo `data`, opcional). Sem o campo, ou
 * com um valor inválido/futuro, cai em hoje — mantém o comportamento das telas que
 * não mandam esse campo (registro do dia atual).
 */
function resolverDataHabito(formData?: FormData): string {
  const hoje = hojeISO();
  const bruto = String(formData?.get("data") ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(bruto) && !ehDataFutura(bruto, hoje) ? bruto : hoje;
}

/**
 * Incremento somado ao total do dia. Erros previsíveis voltam como resultado; a
 * escrita só acontece depois de ler o total e a meta com sucesso.
 */
export async function incrementarAgua(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const incrementoMl = Number(formData.get("incremento_ml"));
  if (!Number.isFinite(incrementoMl) || incrementoMl <= 0) {
    return { ok: false, erro: "Incremento inválido." };
  }

  const data = resolverDataHabito(formData);
  const leitura = await lerQuantidadeAgua(supabase, user.id, data);
  if (!leitura.ok) {
    return { ok: false, erro: MENSAGEM_AGUA_INDISPONIVEL };
  }

  return salvarQuantidadeAgua(supabase, user.id, data, leitura.quantidadeMl + incrementoMl);
}

/**
 * Substitui o total do dia pelo valor informado. Campo vazio é inválido: sem essa
 * checagem, apagar o campo gravaria zero em silêncio.
 */
export async function ajustarAguaManual(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const bruto = String(formData.get("valor_ml") ?? "").trim();
  const valorMl = Number(bruto);
  if (bruto === "" || !Number.isFinite(valorMl) || valorMl < 0) {
    return { ok: false, erro: "Informe uma quantidade de água válida." };
  }

  // O ajuste substitui o total, mas a leitura confirma que o banco responde antes de gravar.
  const data = resolverDataHabito(formData);
  const leitura = await lerQuantidadeAgua(supabase, user.id, data);
  if (!leitura.ok) {
    return { ok: false, erro: MENSAGEM_AGUA_INDISPONIVEL };
  }

  return salvarQuantidadeAgua(supabase, user.id, data, valorMl);
}

/**
 * Lê o total de água do dia. Sem registro (consulta bem-sucedida) vale zero.
 * Erro de leitura não é zero: é falha, e a escrita não acontece.
 */
async function lerQuantidadeAgua(
  supabase: ClienteSupabase,
  userId: string,
  data: string
): Promise<LeituraAgua> {
  const { data: registro, error } = await supabase
    .from("adesao_habitos")
    .select("quantidade_agua_ml")
    .eq("user_id", userId)
    .eq("data", data)
    .maybeSingle();

  if (error) {
    return { ok: false };
  }

  return { ok: true, quantidadeMl: registro?.quantidade_agua_ml ?? 0 };
}

/**
 * Grava o total do dia e o snapshot de bebeu_agua_meta. Falha de leitura da meta
 * ou de gravação para antes do upsert: nada parcial e nenhum false de fallback.
 */
async function salvarQuantidadeAgua(
  supabase: ClienteSupabase,
  userId: string,
  data: string,
  quantidadeMl: number
): Promise<ResultadoAcao> {
  if (!Number.isFinite(quantidadeMl) || quantidadeMl < 0) {
    return { ok: false, erro: MENSAGEM_AGUA_INDISPONIVEL };
  }

  const { data: meta, error: erroMeta } = await supabase
    .from("metas")
    .select("meta_hidratacao_litros_dia")
    .eq("user_id", userId)
    .eq("indicador", "hidratacao")
    .maybeSingle();

  if (erroMeta) {
    return { ok: false, erro: MENSAGEM_AGUA_INDISPONIVEL };
  }

  const metaLitros = meta?.meta_hidratacao_litros_dia ?? null;
  // Sem meta válida (consulta concluída sem meta), a hidratação fica fora do score semanal.
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
    return { ok: false, erro: MENSAGEM_AGUA_INDISPONIVEL };
  }

  revalidatePath("/fisico/habitos");
  revalidatePath("/fisico/historico");
  return { ok: true, destino: "/fisico/habitos" };
}

/**
 * Inverte a proteína do dia a partir do valor gravado, não do valor do formulário.
 * Falha de leitura não grava: sem saber o estado atual, não há valor correto a gravar.
 * `formData` é opcional (o botão de hoje não manda campo nenhum); com um campo
 * `data`, atualiza o dia escolhido em vez de hoje.
 */
export async function alternarProteina(formData?: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();
  const data = resolverDataHabito(formData);

  const { data: registro, error: erroLeitura } = await supabase
    .from("adesao_habitos")
    .select("priorizou_proteina")
    .eq("user_id", user.id)
    .eq("data", data)
    .maybeSingle();

  if (erroLeitura) {
    return { ok: false, erro: "Não foi possível atualizar agora. Tente novamente." };
  }

  const priorizouAtual = registro?.priorizou_proteina === true;

  // O upsert só envia a proteína: a quantidade de água do dia não é alterada.
  const { error } = await supabase.from("adesao_habitos").upsert(
    {
      user_id: user.id,
      data,
      priorizou_proteina: !priorizouAtual,
    },
    { onConflict: "user_id,data" }
  );

  if (error) {
    return { ok: false, erro: "Não foi possível atualizar agora. Tente novamente." };
  }

  revalidatePath("/fisico/habitos");
  revalidatePath("/fisico/historico");
  return { ok: true, destino: "/fisico/habitos" };
}

export async function excluirHabitosHoje(): Promise<ResultadoAcao> {
  return excluirRegistroDeHoje("adesao_habitos", ["/fisico/habitos"], "/fisico/habitos?registro_excluido=1");
}

/** Exclui os hábitos de uma data específica (usado a partir do histórico, para corrigir um dia que não é hoje). */
export async function excluirHabitosData(formData: FormData): Promise<ResultadoAcao> {
  const data = String(formData.get("data") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { ok: false, erro: "Data inválida. Atualize a página e tente de novo." };
  }

  return excluirRegistroPorData(
    "adesao_habitos",
    data,
    ["/fisico/habitos", "/fisico/historico"],
    "/fisico/historico?aba=habitos&registro_excluido=1",
    "Não há registro nessa data para excluir. Atualize a página."
  );
}

const UNIDADE_POR_INDICADOR: Record<IndicadorMeta, "kg" | "cm" | null> = {
  peso: "kg",
  cintura: "cm",
  abdomen_inferior: "cm",
  hidratacao: null,
};

export async function salvarMeta(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const indicador = String(formData.get("indicador") ?? "") as IndicadorMeta;
  // data_inicio segue o comportamento atual: vem do formulário ou é hoje.
  const dataInicio = String(formData.get("data_inicio") ?? "") || hojeISO();
  const fase = String(formData.get("fase") ?? "").trim() || null;

  if (!indicador || !(indicador in UNIDADE_POR_INDICADOR)) {
    return { ok: false, erro: "Indicador inválido." };
  }

  if (ehDataFutura(dataInicio)) {
    return { ok: false, erro: MENSAGEM_DATA_FUTURA };
  }

  if (indicador === "hidratacao") {
    const metaHidratacao = lerNumeroObrigatorio(
      formData.get("meta_hidratacao_litros_dia"),
      (n) => n > 0,
      "Informe a meta diária de hidratação em litros, maior que zero."
    );
    if (!metaHidratacao.ok) {
      return { ok: false, erro: metaHidratacao.erro };
    }

    const { error } = await supabase.from("metas").upsert(
      {
        user_id: user.id,
        indicador,
        data_inicio: dataInicio,
        meta_hidratacao_litros_dia: metaHidratacao.valor,
      },
      { onConflict: "user_id,indicador" }
    );

    if (error) {
      return { ok: false, erro: "Não foi possível salvar a meta. Tente novamente." };
    }
  } else {
    const valorMeta = lerNumeroObrigatorio(
      formData.get("valor_meta"),
      (n) => n > 0,
      "Informe o valor da meta, maior que zero."
    );
    const valorReferencia = lerNumeroOpcional(
      formData.get("valor_referencia"),
      (n) => n >= 0,
      "O valor inicial deve ser um número maior ou igual a zero."
    );
    const prazo = lerNumeroOpcional(
      formData.get("prazo_estimado_semanas"),
      (n) => Number.isInteger(n) && n > 0,
      "O prazo deve ser um número inteiro de semanas, maior que zero."
    );

    const leituras = [valorMeta, valorReferencia, prazo];
    const falha = leituras.find((l) => !l.ok);
    if (falha && !falha.ok) {
      return { ok: false, erro: falha.erro };
    }

    const { error } = await supabase.from("metas").upsert(
      {
        user_id: user.id,
        indicador,
        data_inicio: dataInicio,
        fase,
        valor_referencia: valorReferencia.ok ? valorReferencia.valor : null,
        valor_meta: valorMeta.ok ? valorMeta.valor : null,
        unidade: UNIDADE_POR_INDICADOR[indicador],
        prazo_estimado_semanas: prazo.ok ? prazo.valor : null,
      },
      { onConflict: "user_id,indicador" }
    );

    if (error) {
      return { ok: false, erro: "Não foi possível salvar a meta. Tente novamente." };
    }
  }

  revalidatePath("/fisico/metas");
  return { ok: true, destino: "/fisico/metas?meta_salva=1" };
}

/** Exclui a meta de um indicador específico — item a item, não existe "excluir todas". */
export async function excluirMeta(formData: FormData): Promise<ResultadoAcao> {
  const { supabase, user } = await getUserOrRedirect();

  const indicador = String(formData.get("indicador") ?? "") as IndicadorMeta;
  if (!indicador || !(indicador in UNIDADE_POR_INDICADOR)) {
    return { ok: false, erro: "Indicador inválido." };
  }

  const { data, error } = await supabase
    .from("metas")
    .delete()
    .eq("user_id", user.id)
    .eq("indicador", indicador)
    .select("id");

  if (error) {
    return { ok: false, erro: "Não foi possível excluir a meta agora. Tente novamente." };
  }

  if (!data || data.length === 0) {
    return { ok: false, erro: "Não há meta cadastrada para esse indicador." };
  }

  revalidatePath("/fisico/metas");
  return { ok: true, destino: "/fisico/metas?meta_excluida=1" };
}
