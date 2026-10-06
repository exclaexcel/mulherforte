import type { ResultadoAcao } from "@/lib/resultado-acao";

/**
 * Executa uma ação só depois da confirmação. Se a pessoa cancelar, a ação não é
 * chamada. Quando há confirmação, ela vem antes de qualquer envio, então um clique
 * cancelado não deixa estado de "enviando" para trás.
 */
export async function executarAcaoConfirmada(opcoes: {
  confirmacao?: string;
  confirmar: (mensagem: string) => boolean;
  enviar: (formData: FormData) => Promise<ResultadoAcao | "ignorado">;
  formData: FormData;
}): Promise<ResultadoAcao | "cancelado" | "ignorado"> {
  if (opcoes.confirmacao && !opcoes.confirmar(opcoes.confirmacao)) {
    return "cancelado";
  }
  return opcoes.enviar(opcoes.formData);
}
