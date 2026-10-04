import { REGIOES_MEDIDA, TIPOS_TREINO, INDICADORES_META } from "@/lib/fisico/types";
import { GRUPOS_COMPRA } from "@/lib/marmitas/types";
import { timestampParaDataLocalISO } from "@/lib/date";
import { ExportacaoIntegridadeErro, type DadosExportacao } from "./tipos";

const BOM = "﻿";
const CRLF = "\r\n";
const SEPARADOR = ";";

/** Caracteres que o Excel interpreta como início de fórmula (ou que escondem uma). */
const GATILHOS_FORMULA = ["=", "+", "-", "@", "\t", "\r"];

/**
 * Defesa contra CSV injection. Só muda a representação no arquivo — o banco
 * e o JSON continuam com o valor original.
 */
export function sanitizarTexto(valor: string): string {
  return GATILHOS_FORMULA.some((g) => valor.startsWith(g)) ? `'${valor}` : valor;
}

/** Texto entre aspas duplas, com sanitização e aspas internas duplicadas. */
export function celulaTexto(valor: string | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return `"${sanitizarTexto(valor).replace(/"/g, '""')}"`;
}

/** Número com vírgula decimal. Zero é preservado; null vira célula vazia. */
export function celulaNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return String(valor).replace(".", ",");
}

export function celulaBooleano(valor: boolean | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return valor ? "Sim" : "Não";
}

/** Converte AAAA-MM-DD para DD/MM/AAAA. Apresentação, não armazenamento. */
export function celulaData(iso: string | null | undefined): string {
  if (iso === null || iso === undefined) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    throw new ExportacaoIntegridadeErro("Data inválida na exportação. A exportação foi interrompida.");
  }
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function rotulo(lista: readonly { value: string; label: string }[], valor: string): string {
  return lista.find((i) => i.value === valor)?.label ?? valor;
}

export function montarCsv(cabecalho: string[], linhas: string[][]): string {
  const todas = [cabecalho.join(SEPARADOR), ...linhas.map((l) => l.join(SEPARADOR))];
  return BOM + todas.join(CRLF) + CRLF;
}

export function montarArquivosCsv(dados: DadosExportacao): Record<string, string> {
  const nomeReceita = new Map(dados.receitas.map((r) => [r.id, r.nome]));

  const perfilLinhas = dados.perfil
    ? [[
        celulaTexto(dados.perfil.nome),
        celulaNumero(dados.perfil.altura_cm),
        celulaData(dados.perfil.data_nascimento),
        celulaData(dados.perfil.cronograma_inicio_ciclo),
      ]]
    : [];

  return {
    "perfil.csv": montarCsv(
      ["Nome", "Altura em centímetros", "Data de nascimento", "Início do ciclo do cronograma"],
      perfilLinhas
    ),

    "pesos.csv": montarCsv(
      ["Data", "Peso em kg", "Gordura corporal (%)", "Massa muscular (%)", "Água corporal (%)"],
      dados.pesos.map((p) => [
        celulaData(p.data),
        celulaNumero(p.peso_kg),
        celulaNumero(p.percentual_gordura),
        celulaNumero(p.percentual_massa_muscular),
        celulaNumero(p.percentual_agua),
      ])
    ),

    "medidas.csv": montarCsv(
      ["Data", "Região", "Medida em centímetros"],
      dados.medidas.map((m) => [
        celulaData(m.data),
        celulaTexto(rotulo(REGIOES_MEDIDA, m.regiao)),
        celulaNumero(m.valor_cm),
      ])
    ),

    "habitos.csv": montarCsv(
      [
        "Data",
        "Quantidade de água em ml",
        "Proteína priorizada",
        "Meta de hidratação atingida no dia (snapshot do registro, não recalculado)",
      ],
      dados.habitos.map((h) => [
        celulaData(h.data),
        celulaNumero(h.quantidade_agua_ml),
        celulaBooleano(h.priorizou_proteina),
        celulaBooleano(h.bebeu_agua_meta),
      ])
    ),

    "treinos.csv": montarCsv(
      [
        "Data",
        "Tipo do treino",
        "Descrição do outro tipo",
        "Treino realizado",
        "Treino obrigatório previsto",
        "Duração em minutos",
        "Calorias",
      ],
      dados.treinos.map((t) => [
        celulaData(t.data),
        celulaTexto(rotulo(TIPOS_TREINO, t.tipo)),
        celulaTexto(t.tipo_outro_descricao),
        celulaBooleano(t.realizado),
        celulaBooleano(t.obrigatorio),
        celulaNumero(t.duracao_minutos),
        celulaNumero(t.calorias),
      ])
    ),

    "metas.csv": montarCsv(
      [
        "Indicador",
        "Fase",
        "Data de início",
        "Valor de referência",
        "Valor da meta",
        "Unidade",
        "Prazo estimado em semanas",
        "Meta de hidratação diária (litros)",
        "Data de criação",
      ],
      dados.metas.map((m) => [
        celulaTexto(rotulo(INDICADORES_META, m.indicador)),
        celulaTexto(m.fase),
        celulaData(m.data_inicio),
        celulaNumero(m.valor_referencia),
        celulaNumero(m.valor_meta),
        celulaTexto(m.unidade),
        celulaNumero(m.prazo_estimado_semanas),
        celulaNumero(m.meta_hidratacao_litros_dia),
        celulaData(timestampParaDataLocalISO(m.created_at)),
      ])
    ),

    "receitas.csv": montarCsv(
      [
        "Nome",
        "Categoria",
        "Ingredientes",
        "Modo de preparo",
        "Dica de congelamento",
        "Selos",
        "Validade congelada em dias",
        "Notas",
      ],
      dados.receitas.map((r) => [
        celulaTexto(r.nome),
        celulaTexto(r.categoria),
        celulaTexto(r.ingredientes),
        celulaTexto(r.modo_preparo),
        celulaTexto(r.dica_congelamento),
        celulaTexto(r.selos.join(" | ")),
        celulaNumero(r.validade_congelado_dias),
        celulaTexto(r.notas),
      ])
    ),

    "preparos.csv": montarCsv(
      [
        "Nome da receita",
        "Data do preparo",
        "Dia da semana",
        "Semana do ciclo",
        "Quantidade de porções",
        "Observações",
        "Status",
        "Data de consumo",
      ],
      dados.preparos.map((p) => {
        const nome = nomeReceita.get(p.receita_id);
        if (nome === undefined) {
          throw new ExportacaoIntegridadeErro("Preparo sem receita correspondente. A exportação foi interrompida.");
        }
        return [
          celulaTexto(nome),
          celulaData(p.data_preparo),
          celulaTexto(p.dia_semana),
          celulaNumero(p.semana_ciclo),
          celulaNumero(p.quantidade_porcoes),
          celulaTexto(p.observacoes),
          celulaTexto(p.status),
          celulaData(p.data_consumo),
        ];
      })
    ),

    "itens-compra.csv": montarCsv(
      ["Grupo", "Item", "Tenho em casa", "Observação"],
      dados.itens_compra.map((i) => [
        celulaTexto(rotulo(GRUPOS_COMPRA, i.grupo)),
        celulaTexto(i.item),
        celulaBooleano(i.tenho_em_casa),
        celulaTexto(i.observacao),
      ])
    ),

    "cronograma-marmitas.csv": montarCsv(
      ["Semana do ciclo", "Dia da semana", "Proteína", "Base", "Legumes", "Receita extra"],
      dados.cronograma_marmitas.map((c) => [
        celulaNumero(c.semana_ciclo),
        celulaTexto(c.dia_semana),
        celulaTexto(c.proteina),
        celulaTexto(c.base),
        celulaTexto(c.legumes),
        celulaTexto(c.receita_extra_texto),
      ])
    ),
  };
}
