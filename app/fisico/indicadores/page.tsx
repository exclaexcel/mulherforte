import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularIdadeAnos, hojeISO } from "@/lib/date";
import {
  calcularIMC,
  calcularRCEst,
  calcularRCQ,
  calcularRFM,
  calcularRelacaoCinturaCoxa,
  calcularTMB,
  type ResultadoComClassificacao,
} from "@/lib/fisico/indicadores";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";

type Tier = "boa" | "atencao" | "risco";

const TIER_STYLE: Record<Tier, string> = {
  boa: "bg-green-50 border-green-200 text-green-800",
  atencao: "bg-yellow-50 border-yellow-200 text-yellow-800",
  risco: "bg-red-50 border-red-200 text-red-800",
};

// Mapeia só as classificações atuais de RCEst/RCQ — os únicos dois
// indicadores com faixa clínica validada neste MVP. A cor representa apenas
// a faixa do indicador, nunca "sem risco" ou garantia de saúde.
const TIER_POR_CLASSIFICACAO: Record<string, Tier> = {
  "Abaixo do ponto de atenção para adiposidade central": "boa",
  "Adiposidade central aumentada": "atencao",
  "Adiposidade central elevada": "risco",
  "Faixa inferior de distribuição abdominal": "boa",
  "Faixa intermediária": "atencao",
  "Ponto de atenção para obesidade abdominal": "risco",
};

function CardComClassificacao({
  titulo,
  resultado,
  mensagemFaltante,
}: {
  titulo: string;
  resultado: ResultadoComClassificacao;
  mensagemFaltante: string;
}) {
  if (resultado.valorExibicao === null || resultado.classificacao === null) {
    return (
      <div className="rounded-2xl border bg-stone-50 border-stone-200 p-4 space-y-1">
        <p className="text-sm font-semibold text-stone-600">{titulo}</p>
        <p className="text-xs text-stone-500">{mensagemFaltante}</p>
      </div>
    );
  }

  const tier = TIER_POR_CLASSIFICACAO[resultado.classificacao] ?? "atencao";

  return (
    <div className={`rounded-2xl border p-4 space-y-1 ${TIER_STYLE[tier]}`}>
      <p className="text-sm font-semibold">{titulo}</p>
      <p className="text-2xl font-bold">{resultado.valorExibicao}</p>
      <p className="text-xs font-medium">{resultado.classificacao}</p>
    </div>
  );
}

function CardNeutro({
  titulo,
  valor,
  mensagemFaltante,
  rodape,
}: {
  titulo: string;
  valor: string | null;
  mensagemFaltante: string;
  rodape?: string;
}) {
  return (
    <div className="rounded-2xl border bg-stone-50 border-stone-200 p-4 space-y-1">
      <p className="text-sm font-semibold text-stone-600">{titulo}</p>
      {valor !== null ? (
        <p className="text-2xl font-bold text-stone-700">{valor}</p>
      ) : (
        <p className="text-xs text-stone-500">{mensagemFaltante}</p>
      )}
      {rodape ? <p className="text-xs text-stone-500">{rodape}</p> : null}
    </div>
  );
}

export default async function IndicadoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: perfil, error: erroPerfil },
    { data: medidas, error: erroMedidas },
    { data: ultimoPeso, error: erroPeso },
  ] = await Promise.all([
    supabase
      .from("perfil_usuario")
      .select("altura_cm, data_nascimento")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("medidas_corporais")
      .select("regiao, valor_cm, data")
      .eq("user_id", user.id)
      .in("regiao", ["cintura", "quadril", "coxa"])
      .order("data", { ascending: false }),
    supabase
      .from("registros_peso")
      .select("peso_kg")
      .eq("user_id", user.id)
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Todos os cards dependem de perfil, medidas ou peso. Sem essas leituras, não há cálculo honesto.
  if (houveFalhaDeConsulta({ error: erroPerfil }, { error: erroMedidas }, { error: erroPeso })) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
        <header>
          <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
            <Home className="h-4 w-4" />
            Início
          </Link>
          <h1 className="text-2xl font-bold text-oliva mt-1">Indicadores corporais estimados</h1>
        </header>
        <AvisoErroLeitura novaTentativaHref="/fisico/indicadores" />
      </main>
    );
  }

  const alturaCm = perfil?.altura_cm ?? null;
  const pesoKg = ultimoPeso?.peso_kg ?? null;

  const dataNascimentoValida =
    perfil?.data_nascimento && perfil.data_nascimento <= hojeISO();
  const idadeAnos = dataNascimentoValida ? calcularIdadeAnos(perfil!.data_nascimento) : null;

  const valorMedida = (regiao: "cintura" | "quadril" | "coxa"): number | null =>
    medidas?.find((m) => m.regiao === regiao)?.valor_cm ?? null;

  const cinturaCm = valorMedida("cintura");
  const quadrilCm = valorMedida("quadril");
  const coxaCm = valorMedida("coxa");

  const rcEst = calcularRCEst(cinturaCm, alturaCm);
  const rcq = calcularRCQ(cinturaCm, quadrilCm);
  const rfm = calcularRFM(alturaCm, cinturaCm);
  const cinturaCoxa = calcularRelacaoCinturaCoxa(cinturaCm, coxaCm);
  const imc = calcularIMC(pesoKg, alturaCm);
  const tmb = calcularTMB(pesoKg, alturaCm, idadeAnos);

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Indicadores corporais estimados</h1>
        <p className="text-sm text-stone-600 mt-2">
          O aplicativo calcula indicadores de acompanhamento corporal a partir das medidas
          registradas. Os resultados são estimativas informativas, não diagnósticos médicos.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-oliva/85 uppercase tracking-wide">
          Painel de evolução corporal
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <CardNeutro
            titulo="Circunferência da cintura"
            valor={cinturaCm !== null ? `${cinturaCm} cm` : null}
            mensagemFaltante="Registre a cintura para ver este valor."
          />
          <CardComClassificacao
            titulo="RCEst"
            resultado={rcEst}
            mensagemFaltante="Preencha cintura e altura (no perfil) para calcular."
          />
          <CardComClassificacao
            titulo="RCQ"
            resultado={rcq}
            mensagemFaltante="Preencha cintura e quadril para calcular."
          />
          <CardNeutro
            titulo="RFM feminina"
            valor={rfm.valorExibicao !== null ? `${rfm.valorExibicao}%` : null}
            mensagemFaltante="Preencha cintura e altura (no perfil) para calcular."
            rodape={
              rfm.valorExibicao !== null
                ? "Estimativa antropométrica. Não equivale a exame de composição corporal."
                : undefined
            }
          />
        </div>
        <p className="text-xs text-stone-600 italic">
          As faixas são determinadas pelo valor completo do cálculo. O número exibido é
          arredondado para facilitar a leitura.
        </p>
      </section>

      <section className="rounded-2xl bg-white/60 border border-oliva/10 p-4 space-y-1">
        <p className="text-sm font-semibold text-stone-600">IMC</p>
        <p className="text-xl font-bold text-stone-700">
          {imc.valorExibicao !== null ? imc.valorExibicao : "Preencha peso e altura (no perfil)."}
        </p>
        <p className="text-xs text-stone-500">
          Indicador informativo e complementar — não é o critério central de acompanhamento.
        </p>
      </section>

      <section className="rounded-2xl bg-white/60 border border-oliva/10 p-4 space-y-1">
        <p className="text-sm font-semibold text-stone-600">Metabolismo de repouso estimado (TMB)</p>
        <p className="text-xl font-bold text-stone-700">
          {tmb.valorExibicao !== null
            ? `${tmb.valorExibicao} kcal/dia`
            : "Preencha peso, altura e data de nascimento (no perfil)."}
        </p>
        <p className="text-xs text-stone-500">
          Estimativa da energia utilizada pelo organismo em repouso. Não corresponde ao gasto
          diário total nem define, sozinha, uma meta de alimentação.
        </p>
      </section>

      <section className="rounded-2xl bg-stone-50 border border-stone-200 p-4 space-y-1">
        <p className="text-sm font-semibold text-stone-600">Relação cintura-coxa</p>
        <p className="text-xl font-bold text-stone-700">
          {cinturaCoxa.valorExibicao !== null
            ? cinturaCoxa.valorExibicao
            : "Preencha cintura e coxa para calcular."}
        </p>
        <p className="text-xs text-stone-500">
          Indicador exploratório, sem faixa clínica validada para uso individual.
        </p>
      </section>
    </main>
  );
}
