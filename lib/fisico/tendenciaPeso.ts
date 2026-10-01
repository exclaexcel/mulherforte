import { diasEntre } from "@/lib/date";

export type RegistroPeso = { data: string; pesoKg: number };

export type PontoTendenciaPeso = {
  data: string;
  pesoKg: number;
  mediaMovel7d: number;
  quantidadeRegistros7d: number;
  janela7dCompleta: boolean;
  mediaMovel28d: number;
  quantidadeRegistros28d: number;
  janela28dCompleta: boolean;
};

type RegistroValido = { data: string; pesoKg: number };

function calcularJanela(
  ordenados: RegistroValido[],
  indiceAtual: number,
  diasJanela: number
): { media: number; quantidade: number; completa: boolean } {
  const dataAtual = ordenados[indiceAtual].data;

  const naJanela = ordenados.filter((r) => {
    const dias = diasEntre(r.data, dataAtual);
    return dias >= 0 && dias < diasJanela;
  });

  const soma = naJanela.reduce((acc, r) => acc + r.pesoKg, 0);
  const primeiraData = ordenados[0].data;
  const completa = diasEntre(primeiraData, dataAtual) >= diasJanela - 1;

  return { media: soma / naJanela.length, quantidade: naJanela.length, completa };
}

/**
 * Calcula a linha de tendência (bruto + médias móveis de 7 e 28 dias
 * corridos) a partir dos registros de peso. Nunca cria ponto pra dia sem
 * pesagem, nunca interpola, nunca carrega o último valor adiante — cada
 * média usa só as pesagens que realmente existem dentro da janela.
 *
 * Defesa de dados (sem migration, sem confiar no chamador): o Postgres
 * devolve colunas `numeric` como string via PostgREST/Supabase — por isso
 * `pesoKg` é convertido com `Number(...)` aqui dentro, não só na consulta.
 * Peso não-finito ou ≤0 é descartado silenciosamente, sem contaminar as
 * médias dos outros pontos e sem expor detalhe técnico pra interface.
 */
export function calcularLinhaTendenciaPeso(registros: RegistroPeso[]): PontoTendenciaPeso[] {
  const validos: RegistroValido[] = registros
    .map((r) => ({ data: r.data, pesoKg: Number(r.pesoKg) }))
    .filter((r) => Number.isFinite(r.pesoKg) && r.pesoKg > 0);

  if (validos.length === 0) {
    return [];
  }

  const ordenados = validos.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

  return ordenados.map((registro, indice) => {
    const janela7 = calcularJanela(ordenados, indice, 7);
    const janela28 = calcularJanela(ordenados, indice, 28);

    return {
      data: registro.data,
      pesoKg: registro.pesoKg,
      mediaMovel7d: janela7.media,
      quantidadeRegistros7d: janela7.quantidade,
      janela7dCompleta: janela7.completa,
      mediaMovel28d: janela28.media,
      quantidadeRegistros28d: janela28.quantidade,
      janela28dCompleta: janela28.completa,
    };
  });
}
