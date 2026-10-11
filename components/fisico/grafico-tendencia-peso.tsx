"use client";

import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dataISOParaUTC, diasEntre } from "@/lib/date";
import type { PontoTendenciaPeso } from "@/lib/fisico/tendenciaPeso";

/**
 * Média de 7 dias: tracejada e em verde-oliva escuro, com 4,45:1 sobre branco (mínimo
 * para elemento gráfico: 3:1). O tracejado é o segundo sinal, além da cor, que separa
 * a média dos pontos de peso (pontos) e da média de 28 dias (linha contínua e grossa).
 */
export const COR_MEDIA_7 = "#6B7F3A";
export const TRACO_MEDIA_7 = "6 4";

const formatarPesoKg = (valor: number) =>
  `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(valor)} kg`;

const formatarDataCompleta = (dataISO: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dataISOParaUTC(dataISO)));

const formatarDataEixo = (timestamp: number) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(new Date(timestamp));

const formatarPesoEixo = (valor: number) => new Intl.NumberFormat("pt-BR").format(valor);

const formatarPesagens = (quantidade: number) =>
  `${quantidade} ${quantidade === 1 ? "pesagem" : "pesagens"}`;

type DadoGrafico = PontoTendenciaPeso & {
  timestamp: number;
  /** Igual a mediaMovel7d, exceto null quando a pesagem anterior foi há mais de 7 dias — a reta não liga pesagens distantes como se houvesse tendência contínua entre elas. */
  mediaMovel7dGrafico: number | null;
  /** Mesma ideia para a janela de 28 dias. */
  mediaMovel28dGrafico: number | null;
};

function TooltipPersonalizado({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DadoGrafico }[];
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const ponto = payload[0].payload;

  return (
    <div className="rounded-xl border border-oliva/20 bg-white px-3 py-2 text-xs shadow-sm space-y-1 max-w-[220px]">
      <p className="font-semibold text-oliva">{formatarDataCompleta(ponto.data)}</p>
      <p>Peso: {formatarPesoKg(ponto.pesoKg)}</p>
      <p>
        Média 7 dias: {formatarPesoKg(ponto.mediaMovel7d)} —{" "}
        {ponto.janela7dCompleta ? "janela completa" : "janela parcial"} (
        {formatarPesagens(ponto.quantidadeRegistros7d)})
      </p>
      <p>
        Média 28 dias: {formatarPesoKg(ponto.mediaMovel28d)} —{" "}
        {ponto.janela28dCompleta ? "janela completa" : "janela parcial"} (
        {formatarPesagens(ponto.quantidadeRegistros28d)})
      </p>
    </div>
  );
}

/**
 * Único componente client relacionado ao gráfico — recebe só dados já
 * calculados (nunca acessa Supabase). Peso bruto é Scatter (pontos soltos,
 * sem linha ligando pesagens). MM7/MM28 são Line com `connectNulls={false}`:
 * quando a pesagem anterior foi há mais dias que a própria janela (7 ou 28),
 * o ponto que chega depois do vão vira null só pro gráfico — a reta não liga
 * pesagens distantes como se fosse uma tendência contínua entre elas. O
 * tooltip e o resumo em texto continuam usando o valor real (nunca null),
 * então a informação não some, só a reta visual é que não se desenha ali.
 */
/**
 * Monta os dados do gráfico a partir dos pontos já calculados. Exportada à parte
 * pra ser testada sem precisar renderizar o Recharts (que exige layout real).
 */
export function construirDadosGrafico(pontos: PontoTendenciaPeso[]): DadoGrafico[] {
  return pontos.map((p, indice) => {
    const anterior = indice > 0 ? pontos[indice - 1] : null;
    const diasDoAnterior = anterior ? diasEntre(anterior.data, p.data) : null;

    return {
      ...p,
      timestamp: dataISOParaUTC(p.data),
      mediaMovel7dGrafico: diasDoAnterior !== null && diasDoAnterior > 7 ? null : p.mediaMovel7d,
      mediaMovel28dGrafico: diasDoAnterior !== null && diasDoAnterior > 28 ? null : p.mediaMovel28d,
    };
  });
}

export function GraficoTendenciaPeso({ pontos }: { pontos: PontoTendenciaPeso[] }) {
  const dados = construirDadosGrafico(pontos);
  const haJanelaParcial = pontos.some((p) => !p.janela28dCompleta);

  return (
    <div className="space-y-2">
      <div className="h-72 w-full rounded-2xl bg-white/80 border border-oliva/10 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatarDataEixo}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11 }}
              width={44}
              tickFormatter={formatarPesoEixo}
            />
            <Tooltip content={<TooltipPersonalizado />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Scatter name="Peso registrado" dataKey="pesoKg" fill="#6B7F3A" />
            <Line
              name="Média 7 dias"
              dataKey="mediaMovel7dGrafico"
              stroke={COR_MEDIA_7}
              strokeWidth={2}
              strokeDasharray={TRACO_MEDIA_7}
              dot={false}
              connectNulls={false}
              type="monotone"
            />
            <Line
              name="Média 28 dias"
              dataKey="mediaMovel28dGrafico"
              stroke="#4A5D23"
              strokeWidth={3}
              dot={false}
              connectNulls={false}
              type="monotone"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {haJanelaParcial ? (
        <p className="text-xs text-stone-600">
          Alguns pontos ainda têm histórico limitado — as médias desses pontos usam só as pesagens
          disponíveis até agora.
        </p>
      ) : null}
    </div>
  );
}
