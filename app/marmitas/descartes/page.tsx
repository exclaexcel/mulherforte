import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listarPreparosParaResumoDescartes } from "@/lib/marmitas/consultas";
import {
  ordenarDescartados,
  resumoDescartes,
  type ItemDescartado,
  type PreparoParaResumo,
} from "@/lib/marmitas/descartes";
import { MOTIVOS_DESCARTE, type MotivoDescarte } from "@/lib/marmitas/descarte";
import { formatarDataBR } from "@/lib/marmitas/estoque";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";

type ReceitaRef = { nome: string } | null;

type LinhaPreparo = {
  data_preparo: string;
  data_descarte: string | null;
  quantidade_porcoes: number;
  status: string;
  motivo_descarte: MotivoDescarte | null;
  receitas: ReceitaRef | ReceitaRef[];
};

const ROTULO_MOTIVO: Record<MotivoDescarte, string> = Object.fromEntries(
  MOTIVOS_DESCARTE.map((m) => [m.valor, m.rotulo])
) as Record<MotivoDescarte, string>;

function nomeReceita(receitas: LinhaPreparo["receitas"]): string {
  const receita = Array.isArray(receitas) ? receitas[0] : receitas;
  return receita?.nome ?? "Receita removida";
}

export default async function DescartesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await listarPreparosParaResumoDescartes(supabase, user.id);

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/marmitas/estoque" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Estoque
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Descartes</h1>
        <p className="text-sm text-stone-600 mt-1">
          O que foi descartado, por quê, e quais receitas vale repetir ou trocar.
        </p>
      </header>

      {houveFalhaDeConsulta({ error }) ? (
        <AvisoErroLeitura novaTentativaHref="/marmitas/descartes" />
      ) : (
        <ConteudoDescartes linhas={(data ?? []) as LinhaPreparo[]} />
      )}
    </main>
  );
}

function ConteudoDescartes({ linhas }: { linhas: LinhaPreparo[] }) {
  const paraResumo: PreparoParaResumo[] = linhas.map((l) => ({
    receitaNome: nomeReceita(l.receitas),
    status: l.status,
    motivoDescarte: l.motivo_descarte,
  }));

  const resumo = resumoDescartes(paraResumo);

  const itensDescartados: ItemDescartado[] = ordenarDescartados(
    linhas
      .filter((l): l is LinhaPreparo & { data_descarte: string; motivo_descarte: MotivoDescarte } =>
        l.status === "descartado" && l.data_descarte !== null && l.motivo_descarte !== null
      )
      .map((l) => ({
        receitaNome: nomeReceita(l.receitas),
        dataPreparo: l.data_preparo,
        dataDescarte: l.data_descarte,
        motivo: l.motivo_descarte,
        quantidadePorcoes: l.quantidade_porcoes,
      }))
  );

  if (resumo.totalDescartado === 0) {
    return (
      <p className="text-sm text-stone-600 rounded-2xl bg-white/80 border border-oliva/10 p-4">
        Nenhum preparo descartado até agora.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-oliva">Por motivo</h2>
        <ul className="grid grid-cols-3 gap-2">
          {resumo.porMotivo.map((m) => (
            <li
              key={m.motivo}
              className="rounded-2xl bg-white/80 border border-oliva/10 p-3 text-center space-y-1"
            >
              <p className="text-lg font-bold text-oliva">{m.quantidade}</p>
              <p className="text-xs text-stone-600">{ROTULO_MOTIVO[m.motivo]}</p>
              <p className="text-xs text-stone-500">{m.percentual}%</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-500">
          {resumo.totalDescartado} preparo(s) descartado(s) no total.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-oliva">Taxa de descarte por receita</h2>
        <p className="text-xs text-stone-500">
          Quanto maior a taxa, mais essa receita costuma ser descartada — sinal pra repensar
          porção, prazo ou trocar a receita.
        </p>
        <ul className="space-y-2">
          {resumo.porReceita.map((r) => (
            <li
              key={r.receitaNome}
              className="rounded-2xl bg-white/80 border border-oliva/10 p-3 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-medium text-oliva">{r.receitaNome}</p>
                <p className="text-xs text-stone-500">
                  {r.descartados} de {r.totalPreparos} preparo(s)
                </p>
              </div>
              <p
                className={`text-sm font-bold ${
                  r.taxaDescarte >= 50
                    ? "text-red-700"
                    : r.taxaDescarte > 0
                      ? "text-amber-700"
                      : "text-green-700"
                }`}
              >
                {r.taxaDescarte}%
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-oliva">Itens descartados</h2>
        <ul className="space-y-2">
          {itensDescartados.map((item, indice) => (
            <li
              key={`${item.receitaNome}-${item.dataDescarte}-${indice}`}
              className="rounded-2xl bg-white/80 border border-oliva/10 p-3 space-y-1"
            >
              <p className="text-sm font-medium text-oliva">{item.receitaNome}</p>
              <p className="text-xs text-stone-500">
                Preparado em {formatarDataBR(item.dataPreparo)} · descartado em{" "}
                {formatarDataBR(item.dataDescarte)} · {item.quantidadePorcoes} porção(ões)
              </p>
              <p className="text-xs text-stone-600">Motivo: {ROTULO_MOTIVO[item.motivo]}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
