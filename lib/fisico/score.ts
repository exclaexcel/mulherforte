import { listarDiasDaSemana, timestampParaDataLocalISO } from "@/lib/date";
import { arredondar } from "@/lib/number";
import { treinoObrigatorioDoDia } from "@/lib/fisico/calendarioTreino";

export type StatusDia = "passado" | "hoje" | "futuro";

/** Classifica dataISO em relação a hojeISO — usado pra aplicar a regra do dia atual. */
export function obterStatusDia(dataISO: string, hojeISO: string): StatusDia {
  if (dataISO < hojeISO) return "passado";
  if (dataISO === hojeISO) return "hoje";
  return "futuro";
}

/**
 * A meta de hidratação só participa do score a partir da segunda-feira
 * seguinte à sua criação — nunca na própria semana em que foi criada/editada.
 * Necessário porque `metas.created_at`/`updated_at` não são confiáveis pra
 * saber quando o VALOR atual passou a valer (sem trigger de updated_at no
 * banco, uma edição de valor não desloca created_at) — ver decisão de
 * produto da Etapa 6A. Sem meta nenhuma, retorna false.
 */
export function metaHidratacaoValidaNaSemana(
  metaCreatedAtISO: string | null,
  inicioDaSemanaISO: string
): boolean {
  if (!metaCreatedAtISO) {
    return false;
  }

  const dataCriacaoLocal = timestampParaDataLocalISO(metaCreatedAtISO);
  return dataCriacaoLocal < inicioDaSemanaISO;
}

/**
 * Compara pelo valor BRUTO (multiplicação cruzada, nunca percentual
 * arredondado) — pontosObtidos/oportunidades >= 85% sem usar ponto flutuante
 * na comparação de fronteira.
 */
export function semanaVencida(pontosObtidos: number, oportunidades: number): boolean {
  if (oportunidades === 0) {
    return false;
  }

  return pontosObtidos * 100 >= oportunidades * 85;
}

type HabitoDoDia = { data: string; priorizouProteina: boolean; bebeuAguaMeta: boolean };
type TreinoDoDia = { data: string; tipo: string; realizado: boolean };

type ContribuicaoCategoria = { pontos: number; oportunidades: number };

export type ResultadoScoreSemanal = {
  pontosObtidos: number;
  oportunidades: number;
  scoreBruto: number | null; // null = nenhuma oportunidade ainda (estado indisponível, nunca 0%)
  scoreExibicao: number | null; // arredondado só pra exibição
  semanaVencida: boolean;
  detalhePorCategoria: {
    proteina: ContribuicaoCategoria;
    hidratacao: ContribuicaoCategoria;
    treino: ContribuicaoCategoria;
  };
  treinosOpcionaisRealizados: string[]; // datas com atividade fora do calendário obrigatório
};

/**
 * Agrega a semana (segunda a domingo de hojeISO) a partir dos registros
 * brutos. `obrigatorio`/`tipo` da linha de `adesao_treino` não determinam o
 * score — só o calendário fixo (`treinoObrigatorioDoDia`) decide isso.
 * Dia passado sempre conta (0 ou 1 ponto, 1 oportunidade quando aplicável);
 * dia futuro nunca conta; dia de hoje só entra nos dois se já realizado,
 * senão fica fora dos dois até virar o dia.
 */
export function calcularScoreSemanal(params: {
  hojeISO: string;
  habitos: HabitoDoDia[];
  treinos: TreinoDoDia[];
  metaHidratacaoValida: boolean;
}): ResultadoScoreSemanal {
  const { hojeISO, habitos, treinos, metaHidratacaoValida } = params;

  const proteina: ContribuicaoCategoria = { pontos: 0, oportunidades: 0 };
  const hidratacao: ContribuicaoCategoria = { pontos: 0, oportunidades: 0 };
  const treino: ContribuicaoCategoria = { pontos: 0, oportunidades: 0 };
  const treinosOpcionaisRealizados: string[] = [];

  for (const dia of listarDiasDaSemana(hojeISO)) {
    const status = obterStatusDia(dia, hojeISO);
    if (status === "futuro") {
      continue;
    }

    const habito = habitos.find((h) => h.data === dia) ?? null;
    const registroTreino = treinos.find((t) => t.data === dia) ?? null;
    const diaComTreinoObrigatorio = treinoObrigatorioDoDia(dia) !== null;

    const proteinaRealizada = habito?.priorizouProteina === true;
    if (status === "passado") {
      proteina.oportunidades += 1;
      if (proteinaRealizada) proteina.pontos += 1;
    } else if (proteinaRealizada) {
      // status === "hoje": só entra nos dois se já realizado.
      proteina.oportunidades += 1;
      proteina.pontos += 1;
    }

    if (metaHidratacaoValida) {
      const hidratacaoRealizada = habito?.bebeuAguaMeta === true;
      if (status === "passado") {
        hidratacao.oportunidades += 1;
        if (hidratacaoRealizada) hidratacao.pontos += 1;
      } else if (hidratacaoRealizada) {
        hidratacao.oportunidades += 1;
        hidratacao.pontos += 1;
      }
    }

    const treinoRealizado = registroTreino?.realizado === true;
    if (diaComTreinoObrigatorio) {
      if (status === "passado") {
        treino.oportunidades += 1;
        if (treinoRealizado) treino.pontos += 1;
      } else if (treinoRealizado) {
        treino.oportunidades += 1;
        treino.pontos += 1;
      }
    } else if (treinoRealizado) {
      treinosOpcionaisRealizados.push(dia);
    }
  }

  const pontosObtidos = proteina.pontos + hidratacao.pontos + treino.pontos;
  const oportunidades = proteina.oportunidades + hidratacao.oportunidades + treino.oportunidades;
  const scoreBruto = oportunidades > 0 ? (pontosObtidos / oportunidades) * 100 : null;

  return {
    pontosObtidos,
    oportunidades,
    scoreBruto,
    scoreExibicao: arredondar(scoreBruto, 0),
    semanaVencida: semanaVencida(pontosObtidos, oportunidades),
    detalhePorCategoria: { proteina, hidratacao, treino },
    treinosOpcionaisRealizados,
  };
}
