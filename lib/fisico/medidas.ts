import { diasEntre } from "@/lib/date";

export type CandidataMedida = { data: string; valorCm: number };

/**
 * Seleciona a medida de referência pro sanity check de variação (PRD §3.2):
 * entre as candidatas da mesma região, pega a que está entre 21 e 45 dias
 * antes da data de referência ("mês anterior", com margem), mais próxima de
 * 30 dias. Em empate de distância, desempata pela mais recente. Sem nenhuma
 * candidata na janela, retorna null — não é falso-positivo, é "sem dado
 * comparável".
 */
export function selecionarMedidaReferencia(
  candidatas: CandidataMedida[],
  dataReferenciaISO: string
): CandidataMedida | null {
  const naJanela = candidatas
    .map((c) => ({ ...c, dias: diasEntre(c.data, dataReferenciaISO) }))
    .filter((c) => c.dias >= 21 && c.dias <= 45);

  if (naJanela.length === 0) {
    return null;
  }

  naJanela.sort((a, b) => {
    const distanciaA = Math.abs(a.dias - 30);
    const distanciaB = Math.abs(b.dias - 30);
    if (distanciaA !== distanciaB) {
      return distanciaA - distanciaB;
    }
    // Empate na distância pra 30 dias: desempata pela mais recente (menos dias atrás).
    return a.dias - b.dias;
  });

  const { data, valorCm } = naJanela[0];
  return { data, valorCm };
}

/**
 * Alerta de variação atípica (PRD §3.2): não bloqueia o registro, só avisa.
 * Sem valor anterior comparável, nunca é falso-positivo (retorna false).
 */
export function verificarVariacaoAtipica(
  valorNovo: number,
  valorAnterior: number | null,
  limiarCm: number = 3
): boolean {
  if (valorAnterior === null) {
    return false;
  }

  return Math.abs(valorNovo - valorAnterior) > limiarCm;
}
