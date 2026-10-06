/**
 * Campo numérico opcional na tela. `null` ou `undefined` = não informado. Zero é um
 * valor registrado e precisa aparecer como tal. Não use verdade/falso para isso:
 * `0 ? … : …` esconderia um valor real.
 */
export function temValor(valor: number | null | undefined): valor is number {
  return valor !== null && valor !== undefined;
}
