import { fimDaSemana, inicioDaSemana } from "@/lib/date";

export type GrupoSemana<T> = {
  inicioSemana: string;
  fimSemana: string;
  registros: T[];
};

/**
 * Agrupa qualquer lista com campo `data` por semana (segunda a domingo), semana mais
 * recente primeiro. Os registros dentro de cada semana também ficam em ordem
 * decrescente por data. Usado pelas telas de histórico da Jornada Física.
 */
export function agruparPorSemana<T extends { data: string }>(registros: T[]): GrupoSemana<T>[] {
  const ordenados = [...registros].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));

  const grupos: GrupoSemana<T>[] = [];
  for (const registro of ordenados) {
    const inicioSemana = inicioDaSemana(registro.data);
    const grupoAtual = grupos[grupos.length - 1];

    if (grupoAtual && grupoAtual.inicioSemana === inicioSemana) {
      grupoAtual.registros.push(registro);
    } else {
      grupos.push({ inicioSemana, fimSemana: fimDaSemana(registro.data), registros: [registro] });
    }
  }

  return grupos;
}
