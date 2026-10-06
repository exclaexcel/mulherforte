/**
 * Confirmação antes de registrar um preparo como consumido. Linguagem neutra: não
 * recomenda consumir nem descartar. "Prazo encerrado" é o estado `vencido`; prazo
 * que termina hoje ainda não está encerrado.
 */
export const CONFIRMACAO_CONSUMO = "Confirmar que este preparo foi consumido?";

export const CONFIRMACAO_CONSUMO_PRAZO_ENCERRADO =
  "Este preparo está com o prazo informado encerrado. Deseja registrá-lo como consumido?";

export function textoConfirmacaoConsumo(situacao: string): string {
  return situacao === "vencido" ? CONFIRMACAO_CONSUMO_PRAZO_ENCERRADO : CONFIRMACAO_CONSUMO;
}
