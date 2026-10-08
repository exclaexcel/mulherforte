import type { RegiaoMedida } from "@/lib/fisico/types";

export type LinhaMedida = { data: string; regiao: RegiaoMedida; valorCm: number };

export type RegistroMedidasDia = {
  data: string;
  valoresPorRegiao: Partial<Record<RegiaoMedida, number>>;
};

/**
 * No banco, cada região é uma linha (uma visita de medição gera várias linhas com a
 * mesma data). Para o histórico, juntamos as linhas da mesma data num registro só —
 * é a mesma visita, editada e excluída em conjunto.
 */
export function agruparMedidasPorDia(linhas: LinhaMedida[]): RegistroMedidasDia[] {
  const porData = new Map<string, RegistroMedidasDia>();

  for (const linha of linhas) {
    const atual = porData.get(linha.data) ?? { data: linha.data, valoresPorRegiao: {} };
    atual.valoresPorRegiao[linha.regiao] = linha.valorCm;
    porData.set(linha.data, atual);
  }

  return Array.from(porData.values());
}
