/**
 * Inconsistência validada nos dados já lidos (preparo sem receita, data ou número
 * presente no banco mas inválido para a exportação). Responde 422.
 * Mensagens nunca trazem UUID, conteúdo de registro ou payload.
 */
export class ExportacaoIntegridadeErro extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ExportacaoIntegridadeErro";
  }
}

/**
 * Falha ao ler do Supabase (indisponibilidade, permissão, erro inesperado).
 * Não é inconsistência dos dados. Responde 500 com mensagem genérica.
 */
export class ExportacaoLeituraErro extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ExportacaoLeituraErro";
  }
}

export type PerfilExport = {
  nome: string | null;
  altura_cm: number | null;
  data_nascimento: string | null;
  cronograma_inicio_ciclo: string | null;
};

export type PesoExport = {
  data: string;
  peso_kg: number;
  percentual_gordura: number | null;
  percentual_massa_muscular: number | null;
  percentual_agua: number | null;
};

export type MedidaExport = {
  data: string;
  regiao: string;
  valor_cm: number;
};

export type HabitoExport = {
  data: string;
  quantidade_agua_ml: number;
  priorizou_proteina: boolean;
  bebeu_agua_meta: boolean;
};

export type TreinoExport = {
  data: string;
  tipo: string;
  tipo_outro_descricao: string | null;
  realizado: boolean;
  duracao_minutos: number | null;
  calorias: number | null;
  obrigatorio: boolean;
};

export type MetaExport = {
  indicador: string;
  fase: string | null;
  data_inicio: string;
  valor_referencia: number | null;
  valor_meta: number | null;
  unidade: string | null;
  prazo_estimado_semanas: number | null;
  meta_hidratacao_litros_dia: number | null;
  created_at: string;
};

export type ReceitaExport = {
  id: string;
  nome: string;
  categoria: string | null;
  ingredientes: string | null;
  modo_preparo: string | null;
  dica_congelamento: string | null;
  selos: string[];
  validade_congelado_dias: number;
  notas: string | null;
};

export type PreparoExport = {
  receita_id: string;
  data_preparo: string;
  dia_semana: string | null;
  semana_ciclo: number | null;
  quantidade_porcoes: number;
  observacoes: string | null;
  status: string;
  data_consumo: string | null;
};

export type ItemCompraExport = {
  grupo: string;
  item: string;
  tenho_em_casa: boolean;
  observacao: string | null;
};

export type CronogramaExport = {
  semana_ciclo: number;
  dia_semana: string;
  proteina: string | null;
  base: string | null;
  legumes: string | null;
  receita_extra_texto: string | null;
};

export type DadosExportacao = {
  perfil: PerfilExport | null;
  pesos: PesoExport[];
  medidas: MedidaExport[];
  habitos: HabitoExport[];
  treinos: TreinoExport[];
  metas: MetaExport[];
  receitas: ReceitaExport[];
  preparos: PreparoExport[];
  itens_compra: ItemCompraExport[];
  cronograma_marmitas: CronogramaExport[];
};
