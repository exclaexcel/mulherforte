/**
 * Campo numérico opcional na tela. `null` ou `undefined` = não informado. Zero é um
 * valor registrado e precisa aparecer como tal. Não use verdade/falso para isso:
 * `0 ? … : …` esconderia um valor real.
 */
export function temValor(valor: number | null | undefined): valor is number {
  return valor !== null && valor !== undefined;
}

/**
 * Converte um número já calculado/arredondado pro texto que a usuária vê (vírgula
 * decimal, padrão PT-BR). O cálculo e o armazenamento continuam em ponto — isso é só
 * a camada de exibição. Os valores deste app já chegam aqui com no máximo 2 casas
 * (arredondados antes, na origem), então um teto de 2 casas nunca corta dado real.
 */
export function formatarNumeroBR(valor: number): string {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
