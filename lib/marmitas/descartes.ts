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

export type ResumoMensal = {
  mes: string;
  totalPorcoesPerdidas: number;
  receitaMaisDescartada: { nome: string; quantidade: number } | null;
  motivoPredominante: { motivo: MotivoDescarte; quantidade: number } | null;
};

/** Meses (AAAA-MM) com pelo menos um descarte, mais recente primeiro. */
export function listarMesesComDescarte(itens: ItemDescartado[]): string[] {
  return Array.from(new Set(itens.map((i) => i.dataDescarte.slice(0, 7)))).sort((a, b) =>
    b.localeCompare(a)
  );
}

/**
 * Leitura mensal (backlog A.12): soma o que o resumo acumulado não mostra —
 * porções perdidas, receita e motivo predominantes num mês específico. `mes` no
 * formato AAAA-MM; sem descarte nesse mês, os campos de destaque vêm null.
 */
export function resumoMensal(itens: ItemDescartado[], mes: string): ResumoMensal {
  const doMes = itens.filter((i) => i.dataDescarte.startsWith(mes));

  const totalPorcoesPerdidas = doMes.reduce((soma, i) => soma + i.quantidadePorcoes, 0);

  const porReceita = new Map<string, number>();
  for (const i of doMes) porReceita.set(i.receitaNome, (porReceita.get(i.receitaNome) ?? 0) + 1);
  const receitaMaisDescartada = Array.from(porReceita.entries()).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR")
  )[0];

  const porMotivo = new Map<MotivoDescarte, number>();
  for (const i of doMes) porMotivo.set(i.motivo, (porMotivo.get(i.motivo) ?? 0) + 1);
  const motivoPredominante = Array.from(porMotivo.entries()).sort((a, b) => b[1] - a[1])[0];

  return {
    mes,
    totalPorcoesPerdidas,
    receitaMaisDescartada: receitaMaisDescartada
      ? { nome: receitaMaisDescartada[0], quantidade: receitaMaisDescartada[1] }
      : null,
    motivoPredominante: motivoPredominante
      ? { motivo: motivoPredominante[0], quantidade: motivoPredominante[1] }
      : null,
  };
}
