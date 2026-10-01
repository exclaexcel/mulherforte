import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fimDaSemana, hojeISO, inicioDaSemana } from "@/lib/date";
import { calcularScoreSemanal, metaHidratacaoValidaNaSemana } from "@/lib/fisico/score";

export default async function ScorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoje = hojeISO();
  const inicioSemana = inicioDaSemana(hoje);
  const fimSemana = fimDaSemana(hoje);

  const [{ data: habitos }, { data: treinos }, { data: metaHidratacao }] = await Promise.all([
    supabase
      .from("adesao_habitos")
      .select("data, priorizou_proteina, bebeu_agua_meta")
      .eq("user_id", user.id)
      .gte("data", inicioSemana)
      .lte("data", fimSemana),
    supabase
      .from("adesao_treino")
      .select("data, tipo, realizado")
      .eq("user_id", user.id)
      .gte("data", inicioSemana)
      .lte("data", fimSemana),
    supabase
      .from("metas")
      .select("meta_hidratacao_litros_dia, created_at")
      .eq("user_id", user.id)
      .eq("indicador", "hidratacao")
      .maybeSingle(),
  ]);

  const metaValidaNaSemana =
    (metaHidratacao?.meta_hidratacao_litros_dia ?? 0) > 0 &&
    metaHidratacaoValidaNaSemana(metaHidratacao?.created_at ?? null, inicioSemana);

  const resultado = calcularScoreSemanal({
    hojeISO: hoje,
    habitos: (habitos ?? []).map((h) => ({
      data: h.data,
      priorizouProteina: h.priorizou_proteina,
      bebeuAguaMeta: h.bebeu_agua_meta,
    })),
    treinos: (treinos ?? []).map((t) => ({ data: t.data, tipo: t.tipo, realizado: t.realizado })),
    metaHidratacaoValida: metaValidaNaSemana,
  });

  const temMetaHidratacaoConfigurada = (metaHidratacao?.meta_hidratacao_litros_dia ?? 0) > 0;

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Score da semana</h1>
        <p className="text-sm text-stone-500 mt-1">
          Segunda a domingo · {inicioSemana} a {fimSemana}
        </p>
      </header>

      {resultado.scoreBruto === null ? (
        <section className="rounded-2xl bg-stone-50 border border-stone-200 p-5">
          <p className="text-sm text-stone-600">
            Ainda não há nenhuma oportunidade concluída nesta semana.
          </p>
        </section>
      ) : (
        <section
          className={`rounded-2xl border p-5 space-y-2 ${
            resultado.semanaVencida
              ? "bg-green-50 border-green-200"
              : "bg-white/80 border-oliva/10"
          }`}
        >
          <p className="text-4xl font-bold text-oliva">{resultado.scoreExibicao}%</p>
          {resultado.semanaVencida ? (
            <p className="text-sm font-semibold text-green-800">Semana Vencida 🎉</p>
          ) : null}
          <p className="text-xs text-stone-500">
            {resultado.pontosObtidos} de {resultado.oportunidades} oportunidades cumpridas. O dia
            de hoje só conta o que já foi concluído.
          </p>
        </section>
      )}

      <section className="space-y-3">
        <div className="rounded-2xl bg-white/80 border border-oliva/10 p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700">Proteína priorizada</p>
          <p className="text-sm text-stone-500">
            {resultado.detalhePorCategoria.proteina.pontos}/
            {resultado.detalhePorCategoria.proteina.oportunidades}
          </p>
        </div>

        <div className="rounded-2xl bg-white/80 border border-oliva/10 p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700">Hidratação</p>
          {temMetaHidratacaoConfigurada && !metaValidaNaSemana ? (
            <p className="text-xs text-stone-500">Entra a partir da próxima segunda</p>
          ) : (
            <p className="text-sm text-stone-500">
              {resultado.detalhePorCategoria.hidratacao.pontos}/
              {resultado.detalhePorCategoria.hidratacao.oportunidades}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white/80 border border-oliva/10 p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700">Treino obrigatório</p>
          <p className="text-sm text-stone-500">
            {resultado.detalhePorCategoria.treino.pontos}/
            {resultado.detalhePorCategoria.treino.oportunidades}
          </p>
        </div>
      </section>

      {!temMetaHidratacaoConfigurada ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3">
          Hidratação não entra no score ainda porque não há meta configurada.{" "}
          <Link href="/fisico/metas" className="underline">
            Configurar meta
          </Link>
        </p>
      ) : null}

      {resultado.treinosOpcionaisRealizados.length > 0 ? (
        <p className="text-sm text-stone-600 bg-stone-50 border border-stone-200 rounded-2xl p-3">
          Atividade adicional além do calendário obrigatório:{" "}
          {resultado.treinosOpcionaisRealizados.join(", ")}.
        </p>
      ) : null}
    </main>
  );
}
