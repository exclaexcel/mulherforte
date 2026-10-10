import { formatarNumeroBR } from "@/lib/valor-exibicao";

/**
 * Comparação simples (subtração) entre o valor atual registrado e a meta — sem
 * fórmula clínica. RCEst/RCQ/RFM/Cintura-Coxa ficam para a Etapa 5.
 */
export function compararComMeta(
  valorAtual: number | null,
  valorMeta: number | null,
  unidade: "kg" | "cm"
): { diferenca: number | null; texto: string } {
  if (valorAtual === null) {
    return { diferenca: null, texto: "Ainda sem registro." };
  }

  if (valorMeta === null) {
    return { diferenca: null, texto: "Meta não configurada." };
  }

  const diferenca = Number((valorAtual - valorMeta).toFixed(2));

  if (diferenca <= 0) {
    return { diferenca, texto: "Meta batida!" };
  }

  return { diferenca, texto: `Faltam ${formatarNumeroBR(diferenca)}${unidade} para a meta` };
}
