import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dataISOParaUTC, hojeISO, somarDias } from "@/lib/date";
import { calcularLinhaTendenciaPeso } from "@/lib/fisico/tendenciaPeso";
import { GraficoTendenciaPeso } from "@/components/fisico/grafico-tendencia-peso";
import { ResumoTendenciaPeso } from "@/components/fisico/resumo-tendencia";
import { resumoTendencia } from "@/lib/fisico/resumoTendencia";

const DIAS_JANELA_EXIBICAO = 90;

function formatarPesoKg(valor: number): string {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(valor)} kg`;
}

function formatarDataCompleta(dataISO: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dataISOParaUTC(dataISO)));
}

export default async function TendenciaPesoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: registros, error } = await supabase
    .from("registros_peso")
    .select("data, peso_kg")
    .eq("user_id", user.id)
    .order("data", { ascending: true });

  const cabecalho = (
    <header>
      <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
        <Home className="h-4 w-4" />
        Início
      </Link>
      <h1 className="text-2xl font-bold text-oliva mt-1">Tendência do peso</h1>
      <p className="text-sm text-stone-600 mt-2">
        Os pontos representam pesagens registradas. As linhas mostram médias calculadas somente
        com os registros disponíveis em cada janela. O peso de um único dia é um ponto — a
        tendência mostra o caminho.
      </p>
    </header>
  );

  if (error) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
        {cabecalho}
        <p className="text-sm text-stone-600 bg-stone-50 border border-stone-200 rounded-2xl p-4">
          Não foi possível carregar a tendência agora. Tente novamente em instantes.
        </p>
      </main>
    );
  }

  // Calcula sobre o histórico completo primeiro; o recorte dos últimos 90
  // dias acontece só depois, na exibição (as médias dos pontos visíveis
  // podem usar registros anteriores à janela exibida).
  const pontosCompletos = calcularLinhaTendenciaPeso(
    (registros ?? []).map((r) => ({ data: r.data, pesoKg: Number(r.peso_kg) }))
  );

  const inicioJanelaExibida = somarDias(hojeISO(), -(DIAS_JANELA_EXIBICAO - 1));
  const pontosExibidos = pontosCompletos.filter((p) => p.data >= inicioJanelaExibida);

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      {cabecalho}

      {pontosCompletos.length > 0 ? (
        <ResumoTendenciaPeso resumo={resumoTendencia(pontosCompletos)} />
      ) : null}

      {pontosExibidos.length === 0 ? (
        <section className="rounded-2xl bg-stone-50 border border-stone-200 p-5 space-y-2">
          <p className="text-sm text-stone-600">Ainda não há peso registrado.</p>
          <Link href="/fisico/peso" className="text-sm text-oliva underline">
            Registrar peso
          </Link>
        </section>
      ) : pontosExibidos.length === 1 ? (
        <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 space-y-1">
          <p className="text-2xl font-bold text-oliva">
            {formatarPesoKg(pontosExibidos[0].pesoKg)}
          </p>
          <p className="text-xs text-stone-500">
            {formatarDataCompleta(pontosExibidos[0].data)} — ainda não há histórico suficiente
            pra observar uma tendência.
          </p>
        </section>
      ) : (
        <>
          <GraficoTendenciaPeso pontos={pontosExibidos} />
          <p className="text-xs text-stone-600">
            Exibindo os últimos {DIAS_JANELA_EXIBICAO} dias. Estimativas informativas, sem meta
            nem previsão.
          </p>
        </>
      )}
    </main>
  );
}
