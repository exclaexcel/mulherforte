import { MOTIVOS_DESCARTE, type MotivoDescarte } from "./descarte";

/**
 * Resumo de descartes (backlog 2.13 + extensão de análise): ajuda a decidir se vale
 * repetir uma receita ou trocar, não é só um log. Taxa por receita considera TODOS os
 * preparos daquela receita (não só os descartados) — por isso recebe a lista completa,
 * não uma lista já filtrada por status.
 */

export type PreparoParaResumo = {
  receitaNome: string;
  status: string;
  motivoDescarte: MotivoDescarte | null;
};

export type ItemDescartado = {
  receitaNome: string;
  dataPreparo: string;
  dataDescarte: string;
  motivo: MotivoDescarte;
  quantidadePorcoes: number;
};

export type ResumoPorMotivo = {
  motivo: MotivoDescarte;
  quantidade: number;
  percentual: number;
};

export type ResumoPorReceita = {
  receitaNome: string;
  totalPreparos: number;
  descartados: number;
  taxaDescarte: number;
};

export type ResumoDescartes = {
  totalDescartado: number;
  porMotivo: ResumoPorMotivo[];
  porReceita: ResumoPorReceita[];
};

/** Arredonda pra inteiro; 0 descartes não vira NaN, vira 0%. */
function percentual(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

export function resumoDescartes(preparos: PreparoParaResumo[]): ResumoDescartes {
  const descartados = preparos.filter((p) => p.status === "descartado");
  const totalDescartado = descartados.length;

  const porMotivo: ResumoPorMotivo[] = MOTIVOS_DESCARTE.map(({ valor }) => {
    const quantidade = descartados.filter((p) => p.motivoDescarte === valor).length;
    return { motivo: valor, quantidade, percentual: percentual(quantidade, totalDescartado) };
  });

  const porReceitaMapa = new Map<string, { total: number; descartados: number }>();
  for (const p of preparos) {
    const atual = porReceitaMapa.get(p.receitaNome) ?? { total: 0, descartados: 0 };
    atual.total += 1;
    if (p.status === "descartado") atual.descartados += 1;
    porReceitaMapa.set(p.receitaNome, atual);
  }

  const porReceita: ResumoPorReceita[] = Array.from(porReceitaMapa.entries())
    .map(([receitaNome, { total, descartados: qtdDescartados }]) => ({
      receitaNome,
      totalPreparos: total,
      descartados: qtdDescartados,
      taxaDescarte: percentual(qtdDescartados, total),
    }))
    .sort((a, b) => b.taxaDescarte - a.taxaDescarte || a.receitaNome.localeCompare(b.receitaNome, "pt-BR"));

  return { totalDescartado, porMotivo, porReceita };
}

/** Lista de descartados, mais recente primeiro. */
export function ordenarDescartados(itens: ItemDescartado[]): ItemDescartado[] {
  return [...itens].sort(
    (a, b) => b.dataDescarte.localeCompare(a.dataDescarte) || a.receitaNome.localeCompare(b.receitaNome, "pt-BR")
  );
}
