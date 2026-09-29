const TIMEZONE = "America/Sao_Paulo";

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
