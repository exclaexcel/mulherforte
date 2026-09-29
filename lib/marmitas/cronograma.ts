import { hojeISO, diasEntre } from "@/lib/date";

/**
 * Semana do ciclo (1-4) a partir da data de início (uma segunda-feira), girando
 * 1→2→3→4→1 a cada 7 dias corridos. Antes do início, ainda conta como se fosse o
 * ciclo anterior (wrap negativo), só pra nunca dar um número fora de 1-4.
 */
export function calcularSemanaAtual(
  inicioCicloISO: string,
  dataHojeISO: string = hojeISO()
): number {
  const dias = diasEntre(inicioCicloISO, dataHojeISO);
  const semanasDesdeInicio = Math.floor(dias / 7);
  return (((semanasDesdeInicio % 4) + 4) % 4) + 1;
}
