const TIMEZONE = "America/Sao_Paulo";
const MS_POR_DIA = 86_400_000;

/**
 * Data de hoje (YYYY-MM-DD) no fuso de Brasília, independente do fuso do servidor
 * (Vercel roda em UTC — usar new Date().toISOString() vira o dia errado à noite).
 */
export function hojeISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function dataISOParaUTC(dataISO: string): number {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

/** Diferença em dias de calendário entre duas datas ISO (fim - início). */
export function diasEntre(dataInicioISO: string, dataFimISO: string): number {
  return Math.round((dataISOParaUTC(dataFimISO) - dataISOParaUTC(dataInicioISO)) / MS_POR_DIA);
}

/** Idade em anos completos a partir da data de nascimento (ISO), numa data de referência (default hoje). */
export function calcularIdadeAnos(
  dataNascimentoISO: string,
  dataReferenciaISO: string = hojeISO()
): number {
  const [anoNasc, mesNasc, diaNasc] = dataNascimentoISO.split("-").map(Number);
  const [anoRef, mesRef, diaRef] = dataReferenciaISO.split("-").map(Number);

  let idade = anoRef - anoNasc;
  const aniversarioJaPassouEsteAno =
    mesRef > mesNasc || (mesRef === mesNasc && diaRef >= diaNasc);

  if (!aniversarioJaPassouEsteAno) {
    idade -= 1;
  }

  return idade;
}
