/**
 * Arredondamento padrão (não truncamento) para n casas decimais. Null-safe:
 * propaga null em vez de lançar, pra funções de cálculo com entrada ausente
 * não precisarem tratar esse caso separadamente.
 */
export function arredondar(valor: number | null, casas: number): number | null {
  if (valor === null || !Number.isFinite(valor)) {
    return null;
  }

  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}
