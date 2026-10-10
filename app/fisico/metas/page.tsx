import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { salvarMeta, excluirMeta } from "../actions";
import { FormularioAcao } from "@/components/formulario-acao";
import { BotaoAcao } from "@/components/botao-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hojeISO } from "@/lib/date";
import { compararComMeta } from "@/lib/fisico/metas";
import { INDICADORES_META, type IndicadorMeta } from "@/lib/fisico/types";
import { formatarNumeroBR } from "@/lib/valor-exibicao";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";

export default async function MetasPage({
  searchParams,
}: {
  searchParams: { meta_salva?: string; meta_excluida?: string; indicador?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: metas, error: erroMetas },
    { data: ultimoPeso, error: erroPeso },
    { data: ultimasMedidas, error: erroMedidas },
  ] = await Promise.all([
    supabase.from("metas").select("*").eq("user_id", user.id),
    supabase
      .from("registros_peso")
      .select("peso_kg")
      .eq("user_id", user.id)
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("medidas_corporais")
      .select("regiao, valor_cm, data")
      .eq("user_id", user.id)
      .in("regiao", ["cintura", "abdomen_inferior"])
      .order("data", { ascending: false }),
  ]);

  // Cada meta compara com peso ou medida. Sem essas leituras, "Atual" e a diferença estariam errados.
  if (houveFalhaDeConsulta({ error: erroMetas }, { error: erroPeso }, { error: erroMedidas })) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
        <header>
          <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
            <Home className="h-4 w-4" />
            Início
          </Link>
          <h1 className="text-2xl font-bold text-oliva mt-1">Metas</h1>
        </header>
        <AvisoErroLeitura novaTentativaHref="/fisico/metas" />
      </main>
    );
  }

  const metaPorIndicador = (indicador: IndicadorMeta) =>
    metas?.find((m) => m.indicador === indicador) ?? null;

  const valorAtualPorIndicador = (indicador: IndicadorMeta): number | null => {
    if (indicador === "peso") {
      return ultimoPeso?.peso_kg ?? null;
    }
    if (indicador === "cintura" || indicador === "abdomen_inferior") {
      return ultimasMedidas?.find((m) => m.regiao === indicador)?.valor_cm ?? null;
    }
    return null;
  };

  const metaSalva = searchParams?.meta_salva === "1";
  const metaExcluida = searchParams?.meta_excluida === "1";
  const labelMetaExcluida = INDICADORES_META.find((ind) => ind.value === searchParams?.indicador)?.label;
  const hoje = hojeISO();

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Metas</h1>
      </header>

      {metaSalva ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Meta salva!
        </p>
      ) : null}

      {metaExcluida ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          {labelMetaExcluida ? `Meta de ${labelMetaExcluida} excluída.` : "Meta excluída."}
        </p>
      ) : null}

      {INDICADORES_META.map((ind) => {
        const meta = metaPorIndicador(ind.value);

        if (ind.value === "hidratacao") {
          return (
            <section
              key={ind.value}
              className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
            >
              <p className="font-semibold text-oliva">{ind.label}</p>
              <FormularioAcao
                acao={salvarMeta}
                rotuloEnviar="Salvar meta"
                rotuloEnviando="Salvando meta…"
                mensagemSucesso="Meta salva."
                variante="outline"
                classeBotao="w-full"
                className="space-y-4"
              >
                <input type="hidden" name="indicador" value={ind.value} />
                <input
                  type="hidden"
                  name="data_inicio"
                  value={meta?.data_inicio ?? hoje}
                />
                <div className="space-y-2">
                  <Label htmlFor="meta_hidratacao_litros_dia">Meta diária (litros)</Label>
                  <Input
                    id="meta_hidratacao_litros_dia"
                    name="meta_hidratacao_litros_dia"
                    type="number"
                    step="0.1"
                    min={0}
                    defaultValue={meta?.meta_hidratacao_litros_dia ?? undefined}
                    required
                  />
                </div>
              </FormularioAcao>
              {meta ? (
                <BotaoAcao
                  acao={excluirMeta}
                  campos={{ indicador: ind.value }}
                  rotulo="Excluir meta"
                  rotuloEnviando="Excluindo meta…"
                  confirmacao={`Excluir a meta de ${ind.label}?`}
                  destinoSucesso={`/fisico/metas?meta_excluida=1&indicador=${ind.value}`}
                  variante="outline"
                  tamanho="sm"
                  className="w-full text-red-700 border-red-200 hover:bg-red-50"
                />
              ) : null}
            </section>
          );
        }

        const valorAtual = valorAtualPorIndicador(ind.value);
        const comparacao = compararComMeta(
          valorAtual,
          meta?.valor_meta ?? null,
          ind.unidade as "kg" | "cm"
        );

        return (
          <section
            key={ind.value}
            className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
          >
            <div>
              <p className="font-semibold text-oliva">{ind.label}</p>
              <p className="text-sm text-stone-600 mt-1">
                Atual:{" "}
                {valorAtual !== null ? `${formatarNumeroBR(valorAtual)}${ind.unidade}` : "sem registro"}
                {meta?.valor_meta ? ` · Meta: ${formatarNumeroBR(meta.valor_meta)}${ind.unidade}` : ""}
              </p>
              <p className="text-sm text-oliva mt-1">{comparacao.texto}</p>
            </div>

            <FormularioAcao
              acao={salvarMeta}
              rotuloEnviar="Salvar meta"
              rotuloEnviando="Salvando meta…"
              mensagemSucesso="Meta salva."
              variante="outline"
              classeBotao="w-full"
              className="space-y-4"
            >
              <input type="hidden" name="indicador" value={ind.value} />
              <input type="hidden" name="data_inicio" value={meta?.data_inicio ?? hoje} />

              <div className="space-y-2">
                <Label htmlFor={`${ind.value}_valor_referencia`}>Valor inicial ({ind.unidade})</Label>
                <Input
                  id={`${ind.value}_valor_referencia`}
                  name="valor_referencia"
                  type="number"
                  step="0.1"
                  min={0}
                  defaultValue={meta?.valor_referencia ?? undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${ind.value}_valor_meta`}>Valor da meta ({ind.unidade})</Label>
                <Input
                  id={`${ind.value}_valor_meta`}
                  name="valor_meta"
                  type="number"
                  step="0.1"
                  min={0}
                  defaultValue={meta?.valor_meta ?? undefined}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${ind.value}_prazo`}>Prazo estimado (semanas)</Label>
                <Input
                  id={`${ind.value}_prazo`}
                  name="prazo_estimado_semanas"
                  type="number"
                  min={1}
                  defaultValue={meta?.prazo_estimado_semanas ?? undefined}
                />
              </div>

            </FormularioAcao>
            {meta ? (
              <BotaoAcao
                acao={excluirMeta}
                campos={{ indicador: ind.value }}
                rotulo="Excluir meta"
                rotuloEnviando="Excluindo meta…"
                confirmacao={`Excluir a meta de ${ind.label}?`}
                destinoSucesso={`/fisico/metas?meta_excluida=1&indicador=${ind.value}`}
                variante="outline"
                tamanho="sm"
                className="w-full text-red-700 border-red-200 hover:bg-red-50"
              />
            ) : null}
          </section>
        );
      })}
    </main>
  );
}
