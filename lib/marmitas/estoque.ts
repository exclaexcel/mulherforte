import { hojeISO } from "@/lib/date";

export type StatusValidade = "verde" | "amarelo" | "vermelho";

const MS_POR_DIA = 86_400_000;

function dataISOParaUTC(dataISO: string): number {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

/**
 * Verde até 60% do prazo de congelamento consumido, amarelo 60-90%, vermelho acima de 90%.
 * Decisão da Dany: prazo é por receita (validade_congelado_dias), não um corte fixo em dias.
 *
 * Compara datas de calendário (via Date.UTC), não instantes — evita bug de "-1 dia" por
 * diferença de fuso entre o horário do servidor e o horário de Brasília.
 */
export function calcularStatusValidade(
  dataPreparo: string,
  validadeDias: number,
  dataHojeISO: string = hojeISO()
): {
  diasDesdePreparo: number;
  diasRestantes: number;
  status: StatusValidade;
} {
  const diasDesdePreparo = Math.round(
    (dataISOParaUTC(dataHojeISO) - dataISOParaUTC(dataPreparo)) / MS_POR_DIA
  );
  const diasRestantes = validadeDias - diasDesdePreparo;
  const percentualConsumido = diasDesdePreparo / validadeDias;

  let status: StatusValidade = "verde";
  if (percentualConsumido > 0.9) {
    status = "vermelho";
  } else if (percentualConsumido > 0.6) {
    status = "amarelo";
  }

  return { diasDesdePreparo, diasRestantes, status };
}
