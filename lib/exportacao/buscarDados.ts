import type { createClient } from "@/lib/supabase/server";
import { REGIOES_MEDIDA, INDICADORES_META } from "@/lib/fisico/types";
import { GRUPOS_COMPRA } from "@/lib/marmitas/types";
import {
  ExportacaoIntegridadeErro,
  ExportacaoLeituraErro,
  type CronogramaExport,
  type DadosExportacao,
  type HabitoExport,
  type ItemCompraExport,
  type MedidaExport,
  type MetaExport,
  type PerfilExport,
  type PesoExport,
  type PreparoExport,
  type ReceitaExport,
  type TreinoExport,
} from "./tipos";
import { lerTodasAsLinhas, MENSAGEM_FALHA_GERACAO } from "./paginacao";

type ClienteSupabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Busca centralizada da exportação. O user.id chega sempre da sessão no servidor
 * (nunca de query, body ou URL), todas as consultas filtram por .eq("user_id") e
 * usam lista explícita de colunas. Só leitura: nenhum insert, update, upsert ou
 * delete. A RLS continua ativa por baixo.
 *
 * As listas são lidas por páginas (lerTodasAsLinhas), então o resultado não depende
 * do limite de linhas do Supabase. A ordem final é a funcional, feita pelos sorts
 * abaixo; o `id` ordena apenas a leitura paginada e não vai para o arquivo.
 * Perfil é leitura única: `user_id` é UNIQUE em perfil_usuario.
 */

const ORDEM_DIAS_SEMANA = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const ORDEM_REGIOES = REGIOES_MEDIDA.map((r) => r.value);
const ORDEM_INDICADORES = INDICADORES_META.map((i) => i.value);
const ORDEM_GRUPOS = GRUPOS_COMPRA.map((g) => g.value);

function posicao(ordem: readonly string[], valor: string): number {
  const i = ordem.indexOf(valor);
  return i === -1 ? ordem.length : i;
}

/** Numeric do Postgres pode chegar como string via PostgREST: sempre converter. */
export function numeroObrigatorio(valor: unknown, campo: string): number {
  if (valor === null || valor === undefined || valor === "") {
    throw new ExportacaoIntegridadeErro(`Valor numérico ausente em ${campo}. A exportação foi interrompida.`);
  }
  const n = Number(valor);
  if (!Number.isFinite(n)) {
    throw new ExportacaoIntegridadeErro(`Valor numérico inválido em ${campo}. A exportação foi interrompida.`);
  }
  return n;
}

export function numeroOpcional(valor: unknown, campo: string): number | null {
  if (valor === null || valor === undefined) return null;
  return numeroObrigatorio(valor, campo);
}

function timestampUTC(valor: unknown, campo: string): string {
  const data = new Date(String(valor));
  if (Number.isNaN(data.getTime())) {
    throw new ExportacaoIntegridadeErro(`Data inválida em ${campo}. A exportação foi interrompida.`);
  }
  return data.toISOString();
}

type Linha = Record<string, unknown>;

/**
 * Executa uma consulta única (perfil). Erro retornado ou exceção da biblioteca viram
 * ExportacaoLeituraErro, sem repassar a mensagem crua nem o nome da tabela.
 */
async function executarLeitura<T>(consulta: PromiseLike<{ data: unknown; error: unknown }>): Promise<T> {
  let resposta: { data: unknown; error: unknown };
  try {
    resposta = await consulta;
  } catch {
    throw new ExportacaoLeituraErro(MENSAGEM_FALHA_GERACAO);
  }
  if (resposta.error) {
    throw new ExportacaoLeituraErro(MENSAGEM_FALHA_GERACAO);
  }
  return resposta.data as T;
}

async function lerUm(consulta: PromiseLike<{ data: unknown; error: unknown }>): Promise<Linha | null> {
  const data = await executarLeitura<Linha | null>(consulta);
  return data ?? null;
}

export async function buscarDadosExportacao(
  supabase: ClienteSupabase,
  userId: string
): Promise<DadosExportacao> {
  const [perfilLinha, pesosL, medidasL, habitosL, treinosL, metasL, receitasL, preparosL, itensL, cronogramaL] =
    await Promise.all([
      lerUm(
        supabase
          .from("perfil_usuario")
          .select("nome, altura_cm, data_nascimento, cronograma_inicio_ciclo")
          .eq("user_id", userId)
          .maybeSingle()
      ),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("registros_peso")
          .select("id, data, peso_kg, percentual_gordura, percentual_massa_muscular, percentual_agua")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("medidas_corporais")
          .select("id, data, regiao, valor_cm")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("adesao_habitos")
          .select("id, data, quantidade_agua_ml, priorizou_proteina, bebeu_agua_meta")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("adesao_treino")
          .select("id, data, tipo, tipo_outro_descricao, realizado, duracao_minutos, calorias, obrigatorio")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("metas")
          .select(
            "id, indicador, fase, data_inicio, valor_referencia, valor_meta, unidade, prazo_estimado_semanas, meta_hidratacao_litros_dia, created_at"
          )
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("receitas")
          .select("id, nome, categoria, ingredientes, modo_preparo, dica_congelamento, selos, validade_congelado_dias, notas")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("preparos")
          .select("id, receita_id, data_preparo, dia_semana, semana_ciclo, quantidade_porcoes, observacoes, status, data_consumo")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("itens_compra")
          .select("id, grupo, item, tenho_em_casa, observacao")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
      lerTodasAsLinhas((cursor, tamanho) => {
        const consulta = supabase
          .from("cronograma_planejado")
          .select("id, semana_ciclo, dia_semana, proteina, base, legumes, receita_extra_texto")
          .eq("user_id", userId)
          .order("id", { ascending: true })
          .limit(tamanho);
        return cursor ? consulta.gt("id", cursor) : consulta;
      }),
    ]);

  const perfil: PerfilExport | null = perfilLinha
    ? {
        nome: (perfilLinha.nome as string | null) ?? null,
        altura_cm: numeroOpcional(perfilLinha.altura_cm, "altura_cm"),
        data_nascimento: (perfilLinha.data_nascimento as string | null) ?? null,
        cronograma_inicio_ciclo: (perfilLinha.cronograma_inicio_ciclo as string | null) ?? null,
      }
    : null;

  const pesos: PesoExport[] = pesosL
    .map((l) => ({
      data: l.data as string,
      peso_kg: numeroObrigatorio(l.peso_kg, "peso_kg"),
      percentual_gordura: numeroOpcional(l.percentual_gordura, "percentual_gordura"),
      percentual_massa_muscular: numeroOpcional(l.percentual_massa_muscular, "percentual_massa_muscular"),
      percentual_agua: numeroOpcional(l.percentual_agua, "percentual_agua"),
    }))
    .sort((a, b) => a.data.localeCompare(b.data));

  const medidas: MedidaExport[] = medidasL
    .map((l) => ({
      data: l.data as string,
      regiao: l.regiao as string,
      valor_cm: numeroObrigatorio(l.valor_cm, "valor_cm"),
    }))
    .sort((a, b) => a.data.localeCompare(b.data) || posicao(ORDEM_REGIOES, a.regiao) - posicao(ORDEM_REGIOES, b.regiao));

  const habitos: HabitoExport[] = habitosL
    .map((l) => ({
      data: l.data as string,
      quantidade_agua_ml: numeroObrigatorio(l.quantidade_agua_ml, "quantidade_agua_ml"),
      priorizou_proteina: l.priorizou_proteina === true,
      bebeu_agua_meta: l.bebeu_agua_meta === true,
    }))
    .sort((a, b) => a.data.localeCompare(b.data));

  const treinos: TreinoExport[] = treinosL
    .map((l) => ({
      data: l.data as string,
      tipo: l.tipo as string,
      tipo_outro_descricao: (l.tipo_outro_descricao as string | null) ?? null,
      realizado: l.realizado === true,
      duracao_minutos: numeroOpcional(l.duracao_minutos, "duracao_minutos"),
      calorias: numeroOpcional(l.calorias, "calorias"),
      obrigatorio: l.obrigatorio === true,
    }))
    .sort((a, b) => a.data.localeCompare(b.data));

  const metas: MetaExport[] = metasL
    .map((l) => ({
      indicador: l.indicador as string,
      fase: (l.fase as string | null) ?? null,
      data_inicio: l.data_inicio as string,
      valor_referencia: numeroOpcional(l.valor_referencia, "valor_referencia"),
      valor_meta: numeroOpcional(l.valor_meta, "valor_meta"),
      unidade: (l.unidade as string | null) ?? null,
      prazo_estimado_semanas: numeroOpcional(l.prazo_estimado_semanas, "prazo_estimado_semanas"),
      meta_hidratacao_litros_dia: numeroOpcional(l.meta_hidratacao_litros_dia, "meta_hidratacao_litros_dia"),
      created_at: timestampUTC(l.created_at, "created_at"),
    }))
    .sort((a, b) => posicao(ORDEM_INDICADORES, a.indicador) - posicao(ORDEM_INDICADORES, b.indicador));

  const receitas: ReceitaExport[] = receitasL
    .map((l) => ({
      id: l.id as string,
      nome: l.nome as string,
      categoria: (l.categoria as string | null) ?? null,
      ingredientes: (l.ingredientes as string | null) ?? null,
      modo_preparo: (l.modo_preparo as string | null) ?? null,
      dica_congelamento: (l.dica_congelamento as string | null) ?? null,
      selos: Array.isArray(l.selos) ? (l.selos as string[]) : [],
      validade_congelado_dias: numeroOpcional(l.validade_congelado_dias, "validade_congelado_dias"),
      notas: (l.notas as string | null) ?? null,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR") || a.id.localeCompare(b.id));

  const nomePorReceita = new Map(receitas.map((r) => [r.id, r.nome]));

  const preparos: PreparoExport[] = preparosL
    .map((l) => ({
      receita_id: l.receita_id as string,
      data_preparo: l.data_preparo as string,
      dia_semana: (l.dia_semana as string | null) ?? null,
      semana_ciclo: numeroOpcional(l.semana_ciclo, "semana_ciclo"),
      quantidade_porcoes: numeroObrigatorio(l.quantidade_porcoes, "quantidade_porcoes"),
      observacoes: (l.observacoes as string | null) ?? null,
      status: l.status as string,
      data_consumo: (l.data_consumo as string | null) ?? null,
    }))
    .sort(
      (a, b) =>
        a.data_preparo.localeCompare(b.data_preparo) ||
        (nomePorReceita.get(a.receita_id) ?? "").localeCompare(nomePorReceita.get(b.receita_id) ?? "", "pt-BR") ||
        (a.observacoes ?? "").localeCompare(b.observacoes ?? "", "pt-BR")
    );

  const itens_compra: ItemCompraExport[] = itensL
    .map((l) => ({
      grupo: l.grupo as string,
      item: l.item as string,
      tenho_em_casa: l.tenho_em_casa === true,
      observacao: (l.observacao as string | null) ?? null,
    }))
    .sort(
      (a, b) =>
        posicao(ORDEM_GRUPOS, a.grupo) - posicao(ORDEM_GRUPOS, b.grupo) ||
        a.item.localeCompare(b.item, "pt-BR")
    );

  const cronograma_marmitas: CronogramaExport[] = cronogramaL
    .map((l) => ({
      semana_ciclo: numeroObrigatorio(l.semana_ciclo, "semana_ciclo"),
      dia_semana: l.dia_semana as string,
      proteina: (l.proteina as string | null) ?? null,
      base: (l.base as string | null) ?? null,
      legumes: (l.legumes as string | null) ?? null,
      receita_extra_texto: (l.receita_extra_texto as string | null) ?? null,
    }))
    .sort(
      (a, b) =>
        a.semana_ciclo - b.semana_ciclo ||
        posicao(ORDEM_DIAS_SEMANA, a.dia_semana) - posicao(ORDEM_DIAS_SEMANA, b.dia_semana) ||
        a.dia_semana.localeCompare(b.dia_semana, "pt-BR")
    );

  return {
    perfil,
    pesos,
    medidas,
    habitos,
    treinos,
    metas,
    receitas,
    preparos,
    itens_compra,
    cronograma_marmitas,
  };
}

/**
 * Integridade receita → preparo. Chamada só depois de todas as páginas de receitas e
 * preparos terem sido lidas: sobre um conjunto parcial, a checagem daria falso órfão.
 * Preparo órfão interrompe a exportação: não é removido nem ignorado em silêncio, e a
 * mensagem não traz UUID nem conteúdo.
 */
export function validarReferenciasReceitas(dados: DadosExportacao): void {
  const idsReceitas = new Set(dados.receitas.map((r) => r.id));
  const orfao = dados.preparos.some((p) => !idsReceitas.has(p.receita_id));
  if (orfao) {
    throw new ExportacaoIntegridadeErro(
      "Há preparos ligados a receitas que não estão na exportação. A exportação foi interrompida; nenhum dado foi alterado."
    );
  }
}
