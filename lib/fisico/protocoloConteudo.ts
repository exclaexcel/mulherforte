/** Protocolo de coleta (PRD §3.2.1): referência estática, não muda no dia a dia. */

export const PROTOCOLO_FREQUENCIA = "Uma vez a cada 30 dias.";
export const PROTOCOLO_MOMENTO = "Pela manhã, em jejum completo, depois de esvaziar a bexiga.";
export const PROTOCOLO_POSTURA = "Em pé, abdômen relaxado, sem prender a respiração.";

export const PROTOCOLO_PONTOS: { regiao: string; onde: string }[] = [
  { regiao: "Cintura", onde: "Ponto mais estreito, dois dedos acima do umbigo." },
  { regiao: "Quadril", onde: "Maior circunferência dos glúteos." },
  { regiao: "Coxa", onde: "Ponto médio da coxa direita — sempre meça do mesmo lado." },
];

export const PROTOCOLO_DICAS = [
  "A fita deve ficar reta, sem apertar e sem ficar folgada.",
  "Use roupas leves ou íntimas, sem volume que atrapalhe a fita.",
  "Se puder, faça em frente ao espelho pra manter a fita reta.",
  "Anote as medidas no app logo em seguida.",
];

export const PROTOCOLO_LEMBRETE =
  "O mais importante é ser consistente: medir sempre do mesmo jeito facilita acompanhar a evolução de verdade.";
