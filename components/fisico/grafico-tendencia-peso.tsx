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
import { dataISOParaUTC } from "@/lib/date";
import type { PontoTendenciaPeso } from "@/lib/fisico/tendenciaPeso";

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

type DadoGrafico = PontoTendenciaPeso & { timestamp: number };

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
 * sem linha ligando pesagens); MM7/MM28 são Line sem `connectNulls`, já que
 * cada ponto sempre tem um valor de média (nunca é null nesta estrutura).
 */
export function GraficoTendenciaPeso({ pontos }: { pontos: PontoTendenciaPeso[] }) {
  const dados: DadoGrafico[] = pontos.map((p) => ({ ...p, timestamp: dataISOParaUTC(p.data) }));
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
              dataKey="mediaMovel7d"
              stroke="#E8B4B8"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              type="monotone"
            />
            <Line
              name="Média 28 dias"
              dataKey="mediaMovel28d"
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
        <p className="text-xs text-stone-500">
          Alguns pontos ainda têm histórico limitado — as médias desses pontos usam só as pesagens
          disponíveis até agora.
        </p>
      ) : null}
    </div>
  );
}
