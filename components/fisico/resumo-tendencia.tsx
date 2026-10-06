import type { ResumoTendencia } from "@/lib/fisico/resumoTendencia";

const formatarPesoKg = (valor: number) =>
  `${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor)} kg`;

const formatarDataCompleta = (dataISO: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${dataISO}T00:00:00Z`)
  );

const textoPesagens = (quantidade: number) =>
  quantidade === 1 ? "1 pesagem considerada" : `${quantidade} pesagens consideradas`;

/**
 * Alternativa em texto ao gráfico. Mostra os valores do último ponto com a quantidade
 * de pesagens e se a janela ainda é parcial. Sem tendência prevista, sem meta e sem
 * valor inventado: onde não há dado, a linha diz isso.
 */
export function ResumoTendenciaPeso({ resumo }: { resumo: ResumoTendencia }) {
  if (!resumo.ultimoPeso) {
    return null;
  }

  return (
    <section
      aria-labelledby="titulo-resumo-tendencia"
      className="rounded-2xl bg-white/80 border border-oliva/10 p-5 space-y-3"
    >
      <h2 id="titulo-resumo-tendencia" className="font-semibold text-oliva">
        Resumo da tendência
      </h2>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-stone-600">Último peso registrado</dt>
          <dd className="font-semibold text-stone-800">
            {formatarPesoKg(resumo.ultimoPeso.pesoKg)} em {formatarDataCompleta(resumo.ultimoPeso.data)}
          </dd>
        </div>

        <div>
          <dt className="text-stone-600">Média de 7 dias</dt>
          <dd className="text-stone-800">
            {resumo.media7 ? (
              <>
                {formatarPesoKg(resumo.media7.valorKg)} · {textoPesagens(resumo.media7.pesagens)}
                {resumo.media7.janelaCompleta ? null : (
                  <span className="block text-xs text-stone-600">
                    Janela ainda parcial: o histórico tem menos de 7 dias.
                  </span>
                )}
              </>
            ) : (
              "Sem dados suficientes para esta média."
            )}
          </dd>
        </div>

        <div>
          <dt className="text-stone-600">Média de 28 dias</dt>
          <dd className="text-stone-800">
            {resumo.media28 ? (
              <>
                {formatarPesoKg(resumo.media28.valorKg)} · {textoPesagens(resumo.media28.pesagens)}
                {resumo.media28.janelaCompleta ? null : (
                  <span className="block text-xs text-stone-600">
                    Janela ainda parcial: o histórico tem menos de 28 dias.
                  </span>
                )}
              </>
            ) : (
              "Sem dados suficientes para esta média."
            )}
          </dd>
        </div>
      </dl>

      {resumo.historicoSuficiente ? null : (
        <p className="text-sm text-stone-700">
          Ainda não há histórico suficiente para observar uma tendência.
        </p>
      )}

      <p className="text-xs text-stone-600">
        As médias usam só as pesagens registradas em cada período. São estimativas informativas, sem
        meta nem previsão.
      </p>
    </section>
  );
}
