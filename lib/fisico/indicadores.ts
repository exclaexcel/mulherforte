import { arredondar } from "@/lib/number";

/**
 * Para indicadores com faixa clínica (RCEst, RCQ): valorBruto é a razão
 * exata, sem arredondamento — é o que deve ser usado pra classificar.
 * valorExibicao é só pra mostrar na tela (nunca usar pra classificar).
 */
export type ResultadoComClassificacao = {
  valorBruto: number | null;
  valorExibicao: number | null;
  classificacao: string | null;
};

/**
 * Para indicadores sem classificação clínica no MVP (RFM, Cintura-Coxa, IMC,
 * metabolismo de repouso) — só valor bruto e valor de exibição, sem faixa.
 */
export type ResultadoSemClassificacao = {
  valorBruto: number | null;
  valorExibicao: number | null;
};

/** Nunca calcula com numerador ou denominador ausente, zero ou negativo. */
function divisaoSegura(numerador: number | null, denominador: number | null): number | null {
  if (numerador === null || denominador === null || numerador <= 0 || denominador <= 0) {
    return null;
  }

  return numerador / denominador;
}

// ---------------------------------------------------------------------------
// RCEst (relação cintura-estatura) = cintura ÷ altura
// ---------------------------------------------------------------------------

export function calcularRCEstBruto(
  cinturaCm: number | null,
  alturaCm: number | null
): number | null {
  return divisaoSegura(cinturaCm, alturaCm);
}

/** Classifica a partir do valor BRUTO — nunca do valor já arredondado pra exibição. */
export function classificarRCEst(valorBruto: number): string {
  if (valorBruto < 0.5) return "Abaixo do ponto de atenção para adiposidade central";
  if (valorBruto < 0.6) return "Adiposidade central aumentada";
  return "Adiposidade central elevada";
}

/** Arredonda só pra exibição (2 casas) — nunca usar este valor pra classificar. */
export function formatarRCEst(valorBruto: number | null): number | null {
  return arredondar(valorBruto, 2);
}

export function calcularRCEst(
  cinturaCm: number | null,
  alturaCm: number | null
): ResultadoComClassificacao {
  const valorBruto = calcularRCEstBruto(cinturaCm, alturaCm);
  return {
    valorBruto,
    valorExibicao: formatarRCEst(valorBruto),
    classificacao: valorBruto === null ? null : classificarRCEst(valorBruto),
  };
}

// ---------------------------------------------------------------------------
// RCQ (relação cintura-quadril) = cintura ÷ quadril
// ---------------------------------------------------------------------------

export function calcularRCQBruto(
  cinturaCm: number | null,
  quadrilCm: number | null
): number | null {
  return divisaoSegura(cinturaCm, quadrilCm);
}

/** Classifica a partir do valor BRUTO — nunca do valor já arredondado pra exibição. */
export function classificarRCQ(valorBruto: number): string {
  if (valorBruto < 0.8) return "Faixa inferior de distribuição abdominal";
  if (valorBruto < 0.85) return "Faixa intermediária";
  return "Ponto de atenção para obesidade abdominal";
}

export function formatarRCQ(valorBruto: number | null): number | null {
  return arredondar(valorBruto, 2);
}

export function calcularRCQ(
  cinturaCm: number | null,
  quadrilCm: number | null
): ResultadoComClassificacao {
  const valorBruto = calcularRCQBruto(cinturaCm, quadrilCm);
  return {
    valorBruto,
    valorExibicao: formatarRCQ(valorBruto),
    classificacao: valorBruto === null ? null : classificarRCQ(valorBruto),
  };
}

// ---------------------------------------------------------------------------
// RFM feminina (relative fat mass) = 76 - (20 × altura ÷ cintura)
// Decisão de produto (2026-10-01): sem classificação clínica no MVP — só o
// número e uma mensagem de contexto, exibidos pela camada de UI.
// ---------------------------------------------------------------------------

export function calcularRFMBruto(
  alturaCm: number | null,
  cinturaCm: number | null
): number | null {
  const razao = divisaoSegura(alturaCm, cinturaCm);
  return razao === null ? null : 76 - 20 * razao;
}

export function formatarRFM(valorBruto: number | null): number | null {
  return arredondar(valorBruto, 1);
}

export function calcularRFM(
  alturaCm: number | null,
  cinturaCm: number | null
): ResultadoSemClassificacao {
  const valorBruto = calcularRFMBruto(alturaCm, cinturaCm);
  return { valorBruto, valorExibicao: formatarRFM(valorBruto) };
}

// ---------------------------------------------------------------------------
// Relação Cintura-Coxa = cintura ÷ coxa
// Decisão de produto (2026-10-01): indicador exploratório, fora do painel
// principal, sem classificação clínica. Dados históricos nunca são excluídos.
// ---------------------------------------------------------------------------

export function calcularRelacaoCinturaCoxaBruto(
  cinturaCm: number | null,
  coxaCm: number | null
): number | null {
  return divisaoSegura(cinturaCm, coxaCm);
}

export function formatarRelacaoCinturaCoxa(valorBruto: number | null): number | null {
  return arredondar(valorBruto, 2);
}

export function calcularRelacaoCinturaCoxa(
  cinturaCm: number | null,
  coxaCm: number | null
): ResultadoSemClassificacao {
  const valorBruto = calcularRelacaoCinturaCoxaBruto(cinturaCm, coxaCm);
  return { valorBruto, valorExibicao: formatarRelacaoCinturaCoxa(valorBruto) };
}

// ---------------------------------------------------------------------------
// IMC — informativo, sem classificação (PRD §3.4: não é mais critério de sucesso).
// ---------------------------------------------------------------------------

export function calcularIMCBruto(pesoKg: number | null, alturaCm: number | null): number | null {
  if (pesoKg === null || alturaCm === null || pesoKg <= 0 || alturaCm <= 0) {
    return null;
  }

  const alturaM = alturaCm / 100;
  return pesoKg / (alturaM * alturaM);
}

export function formatarIMC(valorBruto: number | null): number | null {
  return arredondar(valorBruto, 1);
}

export function calcularIMC(
  pesoKg: number | null,
  alturaCm: number | null
): ResultadoSemClassificacao {
  const valorBruto = calcularIMCBruto(pesoKg, alturaCm);
  return { valorBruto, valorExibicao: formatarIMC(valorBruto) };
}

// ---------------------------------------------------------------------------
// Metabolismo de repouso estimado (sigla "TMB" mantida só por compatibilidade
// interna). Fórmula de Mifflin-St Jeor, versão feminina — decisão de produto
// de 2026-09-30, já que o app não tem campo de sexo e é voltado a uma usuária
// mulher.
// ---------------------------------------------------------------------------

export function calcularTMBBruto(
  pesoKg: number | null,
  alturaCm: number | null,
  idadeAnos: number | null
): number | null {
  if (
    pesoKg === null ||
    alturaCm === null ||
    idadeAnos === null ||
    pesoKg <= 0 ||
    alturaCm <= 0 ||
    idadeAnos < 0
  ) {
    return null;
  }

  return 10 * pesoKg + 6.25 * alturaCm - 5 * idadeAnos - 161;
}

/** Exibido como número inteiro (kcal/dia). */
export function formatarTMB(valorBruto: number | null): number | null {
  return arredondar(valorBruto, 0);
}

export function calcularTMB(
  pesoKg: number | null,
  alturaCm: number | null,
  idadeAnos: number | null
): ResultadoSemClassificacao {
  const valorBruto = calcularTMBBruto(pesoKg, alturaCm, idadeAnos);
  return { valorBruto, valorExibicao: formatarTMB(valorBruto) };
}
