/** Progresso de hidratação do dia, comparado à meta diária em litros. */
export function calcularProgressoAgua(
  quantidadeMl: number,
  metaLitros: number | null
): {
  litros: number;
  metaLitros: number | null;
  percentual: number | null;
  atingiuMeta: boolean;
} {
  const litros = Number((quantidadeMl / 1000).toFixed(2));

  if (metaLitros === null || metaLitros <= 0) {
    return { litros, metaLitros: null, percentual: null, atingiuMeta: false };
  }

  const percentual = Math.min(100, Math.round((litros / metaLitros) * 100));

  return { litros, metaLitros, percentual, atingiuMeta: litros >= metaLitros };
}
