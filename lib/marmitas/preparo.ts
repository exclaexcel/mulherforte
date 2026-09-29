const DIAS_SEMANA = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

export function diaSemanaFromData(dataISO: string): string {
  const data = new Date(`${dataISO}T00:00:00Z`);
  return DIAS_SEMANA[data.getUTCDay()];
}
