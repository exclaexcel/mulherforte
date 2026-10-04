import type { DadosExportacao } from "./tipos";

export const VERSAO_EXPORTACAO = "1.0";

/**
 * Backup JSON versionado. Campos são escolhidos um a um: user_id, e-mail,
 * sessão, tokens e updated_at nunca entram. Mantidos só os IDs que carregam
 * relação (receitas.id e preparos.receita_id) e os campos funcionais.
 */
export function montarJson(dados: DadosExportacao, geradoEm: Date): string {
  const payload = {
    versao_exportacao: VERSAO_EXPORTACAO,
    gerado_em: geradoEm.toISOString(),
    perfil: dados.perfil
      ? {
          nome: dados.perfil.nome,
          altura_cm: dados.perfil.altura_cm,
          data_nascimento: dados.perfil.data_nascimento,
          cronograma_inicio_ciclo: dados.perfil.cronograma_inicio_ciclo,
        }
      : null,
    pesos: dados.pesos.map((p) => ({
      data: p.data,
      peso_kg: p.peso_kg,
      percentual_gordura: p.percentual_gordura,
      percentual_massa_muscular: p.percentual_massa_muscular,
      percentual_agua: p.percentual_agua,
    })),
    medidas: dados.medidas.map((m) => ({
      data: m.data,
      regiao: m.regiao,
      valor_cm: m.valor_cm,
    })),
    habitos: dados.habitos.map((h) => ({
      data: h.data,
      quantidade_agua_ml: h.quantidade_agua_ml,
      priorizou_proteina: h.priorizou_proteina,
      bebeu_agua_meta: h.bebeu_agua_meta,
    })),
    treinos: dados.treinos.map((t) => ({
      data: t.data,
      tipo: t.tipo,
      tipo_outro_descricao: t.tipo_outro_descricao,
      realizado: t.realizado,
      duracao_minutos: t.duracao_minutos,
      calorias: t.calorias,
      obrigatorio: t.obrigatorio,
    })),
    metas: dados.metas.map((m) => ({
      indicador: m.indicador,
      fase: m.fase,
      data_inicio: m.data_inicio,
      valor_referencia: m.valor_referencia,
      valor_meta: m.valor_meta,
      unidade: m.unidade,
      prazo_estimado_semanas: m.prazo_estimado_semanas,
      meta_hidratacao_litros_dia: m.meta_hidratacao_litros_dia,
      created_at: m.created_at,
    })),
    receitas: dados.receitas.map((r) => ({
      id: r.id,
      nome: r.nome,
      categoria: r.categoria,
      ingredientes: r.ingredientes,
      modo_preparo: r.modo_preparo,
      dica_congelamento: r.dica_congelamento,
      selos: r.selos,
      validade_congelado_dias: r.validade_congelado_dias,
      notas: r.notas,
    })),
    preparos: dados.preparos.map((p) => ({
      receita_id: p.receita_id,
      data_preparo: p.data_preparo,
      dia_semana: p.dia_semana,
      semana_ciclo: p.semana_ciclo,
      quantidade_porcoes: p.quantidade_porcoes,
      observacoes: p.observacoes,
      status: p.status,
      data_consumo: p.data_consumo,
    })),
    itens_compra: dados.itens_compra.map((i) => ({
      grupo: i.grupo,
      item: i.item,
      tenho_em_casa: i.tenho_em_casa,
      observacao: i.observacao,
    })),
    cronograma_marmitas: dados.cronograma_marmitas.map((c) => ({
      semana_ciclo: c.semana_ciclo,
      dia_semana: c.dia_semana,
      proteina: c.proteina,
      base: c.base,
      legumes: c.legumes,
      receita_extra_texto: c.receita_extra_texto,
    })),
  };

  return JSON.stringify(payload, null, 2);
}
