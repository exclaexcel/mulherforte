import { hojeISO, diasEntre } from "@/lib/date";

export type StatusValidade = "verde" | "amarelo" | "vermelho";

/**
 * Corte fixo em dias desde o preparo, igual pra qualquer receita — conforme a regra
 * USDA/FSIS documentada pela Dany (aba "Informações Importantes" da planilha original):
 * verde até 60 dias, amarelo 61-90, vermelho acima de 90. São prazos de QUALIDADE, não de
 * segurança — mantido a -18°C o alimento é seguro indefinidamente.
 */
export function calcularStatusValidade(
  dataPreparo: string,
  dataHojeISO: string = hojeISO()
): {
  diasDesdePreparo: number;
  status: StatusValidade;
} {
  const diasDesdePreparo = diasEntre(dataPreparo, dataHojeISO);

  let status: StatusValidade = "verde";
  if (diasDesdePreparo > 90) {
    status = "vermelho";
  } else if (diasDesdePreparo > 60) {
    status = "amarelo";
  }

  return { diasDesdePreparo, status };
}
