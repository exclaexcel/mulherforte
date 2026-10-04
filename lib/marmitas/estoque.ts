import { diasEntre, hojeISO, somarDias } from "@/lib/date";

/**
 * Validade do estoque calculada pela validade informada em cada receita. Não há
 * corte fixo de dias igual para todas as receitas. Sem validade informada, o app
 * não calcula vencimento nem sugere prazo.
 */

export type SituacaoValidade = "vencido" | "vence_hoje" | "proximo" | "dentro" | "nao_informada";

/** Validade informada: tem data de vencimento e dias restantes sempre preenchidos. */
export type ValidadeInformada = {
  situacao: Exclude<SituacaoValidade, "nao_informada">;
  dataVencimento: string;
  diasRestantes: number;
};

/** Validade não informada: não há data, dias nem classificação. */
export type ValidadeNaoInformada = {
  situacao: "nao_informada";
  dataVencimento: null;
  diasRestantes: null;
};

export type ValidadeCalculada = ValidadeInformada | ValidadeNaoInformada;

/** Faltam até este número de dias: "Próximo do vencimento". */
export const DIAS_PROXIMO_VENCIMENTO = 7;

/**
 * Fluxo separado por validade. Null (ou undefined) nunca entra em data, soma ou
 * comparação: vai direto para "não informada". Valor informado usa a validade
 * individual da receita: data do preparo + dias.
 */
export function calcularValidade(
  dataPreparo: string,
  validadeDias: number | null | undefined,
  hoje: string = hojeISO()
): ValidadeCalculada {
  if (validadeDias === null || validadeDias === undefined) {
    return { situacao: "nao_informada", dataVencimento: null, diasRestantes: null };
  }

  const dataVencimento = somarDias(dataPreparo, validadeDias);
  const diasRestantes = diasEntre(hoje, dataVencimento);

  let situacao: ValidadeInformada["situacao"];
  if (diasRestantes < 0) {
    situacao = "vencido";
  } else if (diasRestantes === 0) {
    situacao = "vence_hoje";
  } else if (diasRestantes <= DIAS_PROXIMO_VENCIMENTO) {
    situacao = "proximo";
  } else {
    situacao = "dentro";
  }

  return { situacao, dataVencimento, diasRestantes };
}

/** Ordem de exibição: vencidos, vence hoje, próximos, dentro da validade, sem validade. */
const ORDEM_SITUACAO: Record<SituacaoValidade, number> = {
  vencido: 0,
  vence_hoje: 1,
  proximo: 2,
  dentro: 3,
  nao_informada: 4,
};

export type ItemEstoque = {
  id: string;
  dataPreparo: string;
  receitaNome: string;
  validade: ValidadeCalculada;
};

/**
 * Ordenação determinística. Dentro de cada grupo, a data de vencimento mais
 * próxima vem primeiro; sem validade, vale a data do preparo. Empates: data do
 * preparo, nome da receita e id.
 */
export function ordenarEstoque<T extends ItemEstoque>(itens: T[]): T[] {
  return [...itens].sort(
    (a, b) =>
      ORDEM_SITUACAO[a.validade.situacao] - ORDEM_SITUACAO[b.validade.situacao] ||
      (a.validade.dataVencimento ?? "").localeCompare(b.validade.dataVencimento ?? "") ||
      a.dataPreparo.localeCompare(b.dataPreparo) ||
      a.receitaNome.localeCompare(b.receitaNome, "pt-BR") ||
      a.id.localeCompare(b.id)
  );
}

/** AAAA-MM-DD para DD/MM/AAAA. Só apresentação. */
export function formatarDataBR(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export type TomValidade = "urgente" | "atencao" | "ok" | "neutro";

/** Textos e tom visual de cada situação. Sem linguagem de segurança do alimento. */
export function apresentarValidade(v: ValidadeCalculada): {
  titulo: string;
  detalhe: string | null;
  tom: TomValidade;
} {
  if (v.situacao === "nao_informada") {
    return { titulo: "Validade não informada", detalhe: null, tom: "neutro" };
  }

  // Daqui em diante v é ValidadeInformada: a data sempre existe, sem asserção.
  const vencimento = formatarDataBR(v.dataVencimento);

  switch (v.situacao) {
    case "vencido":
      return { titulo: "Vencido", detalhe: `Venceu em ${vencimento}`, tom: "urgente" };
    case "vence_hoje":
      return { titulo: "Vence hoje", detalhe: null, tom: "urgente" };
    case "proximo":
      return {
        titulo: "Próximo do vencimento",
        detalhe: `Faltam ${v.diasRestantes} dia(s) · vence em ${vencimento}`,
        tom: "atencao",
      };
    case "dentro":
      return { titulo: "Dentro da validade", detalhe: `Vence em ${vencimento}`, tom: "ok" };
  }
}
