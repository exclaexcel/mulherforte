/**
 * Resultado das actions de formulário. Erro previsível volta como `ok: false` com
 * texto pronto para a usuária, sem `throw`, para o formulário continuar na tela.
 * Sucesso traz o destino, usado quando o fluxo sai da página. `aviso` é uma
 * observação não bloqueante que acompanha o sucesso.
 */
export type ResultadoAcao =
  | { ok: true; destino: string; aviso?: string }
  | { ok: false; erro: string };

export const MENSAGEM_VALIDACAO_INDISPONIVEL =
  "Não foi possível validar os dados agora. Tente novamente.";

export const MENSAGEM_SALVAR = "Não foi possível salvar agora. Tente novamente.";

export const MENSAGEM_DATA_FUTURA = "A data não pode estar no futuro.";
