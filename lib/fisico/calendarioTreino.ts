import { obterDiaSemana } from "@/lib/date";
import type { TipoTreino } from "@/lib/fisico/types";

/**
 * Calendário fixo de treino obrigatório do MVP (decisão de produto, Etapa 6A)
 * — única fonte de verdade pro denominador do score semanal. O campo
 * `obrigatorio` persistido em `adesao_treino` é só informativo/histórico,
 * nunca usado pra decidir o score. Mudar a rotina exige editar esta
 * constante e fazer novo deploy — não é configurável pela interface no MVP.
 */
export const TREINO_OBRIGATORIO_POR_DIA: Record<number, TipoTreino | null> = {
  0: null, // domingo
  1: "moves", // segunda
  2: "zumba", // terça
  3: "moves", // quarta
  4: "zumba", // quinta
  5: null, // sexta
  6: null, // sábado
};

/** Tipo de treino obrigatório pelo calendário fixo nessa data, ou null se não há. */
export function treinoObrigatorioDoDia(dataISO: string): TipoTreino | null {
  return TREINO_OBRIGATORIO_POR_DIA[obterDiaSemana(dataISO)];
}
