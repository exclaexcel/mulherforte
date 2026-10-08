import { agruparPorSemana, type GrupoSemana } from "@/lib/fisico/historico";
import { treinoObrigatorioDoDia } from "@/lib/fisico/calendarioTreino";
import type { TipoTreino } from "@/lib/fisico/types";

export type RegistroTreino = {
  data: string;
  tipo: TipoTreino;
  tipoOutroDescricao: string | null;
  realizado: boolean;
  duracaoMinutos: number | null;
  calorias: number | null;
};

export type StatusTreino =
  | "obrigatorio_cumprido"
  | "obrigatorio_nao_realizado"
  | "extra_realizado"
  | "nao_realizado";

/** Classifica pelo calendário fixo do dia (nunca pela coluna `obrigatorio` salva). */
export function classificarTreino(registro: Pick<RegistroTreino, "data" | "realizado">): StatusTreino {
  const obrigatorio = treinoObrigatorioDoDia(registro.data) !== null;

  if (obrigatorio) {
    return registro.realizado ? "obrigatorio_cumprido" : "obrigatorio_nao_realizado";
  }

  return registro.realizado ? "extra_realizado" : "nao_realizado";
}

export type GrupoSemanaTreino = GrupoSemana<RegistroTreino>;

/** Agrupa treinos por semana — ver `agruparPorSemana` em `lib/fisico/historico.ts`. */
export function agruparTreinosPorSemana(registros: RegistroTreino[]): GrupoSemanaTreino[] {
  return agruparPorSemana(registros);
}
