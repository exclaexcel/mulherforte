/** Mensagem única para falha de consulta. Não traz detalhe técnico nem nome de tabela. */
export const MENSAGEM_ERRO_LEITURA = "Não foi possível carregar estas informações. Tente novamente.";

/**
 * True se pelo menos uma consulta devolveu erro. Consulta sem registro não é erro:
 * o Supabase devolve `error: null` com `data: null` nesse caso.
 * Use antes de interpretar `data` como vazio: sem isso, falha vira ausência de dados.
 */
export function houveFalhaDeConsulta(...consultas: { error: unknown }[]): boolean {
  return consultas.some((consulta) => consulta.error !== null && consulta.error !== undefined);
}
