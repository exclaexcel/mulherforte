const TIMEZONE = "America/Sao_Paulo";
const MS_POR_DIA = 86_400_000;

function formatarDataLocal(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

/**
 * Data de hoje (YYYY-MM-DD) no fuso de Brasília, independente do fuso do servidor
 * (Vercel roda em UTC — usar new Date().toISOString() vira o dia errado à noite).
 */
export function hojeISO(): string {
  return formatarDataLocal(new Date());
}

/**
 * Converte um timestamp com fuso (ex: `created_at` do Postgres, UTC) pra data
 * local (YYYY-MM-DD) no fuso de Brasília — mesmo fuso de `hojeISO()`.
 */
export function timestampParaDataLocalISO(timestampISO: string): string {
  return formatarDataLocal(new Date(timestampISO));
}

export function dataISOParaUTC(dataISO: string): number {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function utcParaDataISO(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

/** Diferença em dias de calendário entre duas datas ISO (fim - início). */
export function diasEntre(dataInicioISO: string, dataFimISO: string): number {
  return Math.round((dataISOParaUTC(dataFimISO) - dataISOParaUTC(dataInicioISO)) / MS_POR_DIA);
}

/** Data ISO n dias depois de dataISO (n negativo para dias antes). */
export function somarDias(dataISO: string, n: number): string {
  return utcParaDataISO(dataISOParaUTC(dataISO) + n * MS_POR_DIA);
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

/** Dia da semana em UTC: 0=domingo, 1=segunda, ..., 6=sábado. Sem risco de D+1. */
export function obterDiaSemana(dataISO: string): number {
  return new Date(dataISOParaUTC(dataISO)).getUTCDay();
}

/** Segunda-feira (ISO) da semana que contém dataISO. */
export function inicioDaSemana(dataISO: string): string {
  const diaSemana = obterDiaSemana(dataISO);
  const diasDesdeSegunda = (diaSemana + 6) % 7; // segunda=0, terça=1, ..., domingo=6
  return utcParaDataISO(dataISOParaUTC(dataISO) - diasDesdeSegunda * MS_POR_DIA);
}

/** Domingo (ISO) da semana que contém dataISO. */
export function fimDaSemana(dataISO: string): string {
  return utcParaDataISO(dataISOParaUTC(inicioDaSemana(dataISO)) + 6 * MS_POR_DIA);
}

/** As 7 datas ISO da semana de dataISO, de segunda a domingo, em ordem. */
export function listarDiasDaSemana(dataISO: string): string[] {
  const inicio = dataISOParaUTC(inicioDaSemana(dataISO));
  return Array.from({ length: 7 }, (_, i) => utcParaDataISO(inicio + i * MS_POR_DIA));
}
