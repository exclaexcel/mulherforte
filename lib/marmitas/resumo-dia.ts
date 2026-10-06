/**
 * Resumo curto do dia no cronograma (proteína · base · legumes). Só entram os campos
 * preenchidos, na mesma ordem, sem separador no início, no fim ou duplicado.
 */
export function montarResumoDia(campos: Array<string | null | undefined>): string {
  return campos
    .map((campo) => (campo ?? "").trim())
    .filter((campo) => campo !== "")
    .join(" · ");
}
