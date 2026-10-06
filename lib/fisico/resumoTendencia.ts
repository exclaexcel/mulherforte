import type { PontoTendenciaPeso } from "./tendenciaPeso";

/**
 * Resumo em texto da tendência, para quem não enxerga o gráfico. Lê apenas os
 * valores já calculados por calcularLinhaTendenciaPeso: não recalcula média e não
 * inventa valor. Ausência vira null, não zero.
 */
export type ResumoTendencia = {
  ultimoPeso: { pesoKg: number; data: string } | null;
  media7: { valorKg: number; pesagens: number; janelaCompleta: boolean } | null;
  media28: { valorKg: number; pesagens: number; janelaCompleta: boolean } | null;
  historicoSuficiente: boolean;
};

export function resumoTendencia(pontos: PontoTendenciaPeso[]): ResumoTendencia {
  if (pontos.length === 0) {
    return { ultimoPeso: null, media7: null, media28: null, historicoSuficiente: false };
  }

  // calcularLinhaTendenciaPeso devolve os pontos em ordem de data: o último é o mais recente.
  const ultimo = pontos[pontos.length - 1];

  return {
    ultimoPeso: { pesoKg: ultimo.pesoKg, data: ultimo.data },
    media7: {
      valorKg: ultimo.mediaMovel7d,
      pesagens: ultimo.quantidadeRegistros7d,
      janelaCompleta: ultimo.janela7dCompleta,
    },
    media28: {
      valorKg: ultimo.mediaMovel28d,
      pesagens: ultimo.quantidadeRegistros28d,
      janelaCompleta: ultimo.janela28dCompleta,
    },
    historicoSuficiente: pontos.length >= 2,
  };
}
