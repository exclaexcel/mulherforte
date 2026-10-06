import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  incrementarAgua,
  ajustarAguaManual,
  alternarProteina,
  excluirHabitosHoje,
} from "../actions";
import { BotaoAcao } from "@/components/botao-acao";
import { ControleAgua } from "@/components/fisico/controle-agua";
import { hojeISO } from "@/lib/date";
import { calcularProgressoAgua, mensagemAlternarProteina } from "@/lib/fisico/habitos";
import { INCREMENTOS_AGUA_ML } from "@/lib/fisico/types";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";

export default async function HabitosPage({
  searchParams,
}: {
  searchParams: { registro_excluido?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoje = hojeISO();

  const [
    { data: habitoHoje, error: erroHabito },
    { data: meta, error: erroMeta },
  ] = await Promise.all([
    supabase
      .from("adesao_habitos")
      .select("quantidade_agua_ml, priorizou_proteina")
      .eq("user_id", user.id)
      .eq("data", hoje)
      .maybeSingle(),
    supabase
      .from("metas")
      .select("meta_hidratacao_litros_dia")
      .eq("user_id", user.id)
      .eq("indicador", "hidratacao")
      .maybeSingle(),
  ]);

  // Sem leitura do dia ou da meta, água e proteína apareceriam como zero ou como "sem meta".
  if (houveFalhaDeConsulta({ error: erroHabito }, { error: erroMeta })) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
        <header>
          <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
            <Home className="h-4 w-4" />
            Início
          </Link>
          <h1 className="text-2xl font-bold text-oliva mt-1">Hábitos do dia</h1>
        </header>
        <AvisoErroLeitura novaTentativaHref="/fisico/habitos" />
      </main>
    );
  }

  const quantidadeAguaMl = habitoHoje?.quantidade_agua_ml ?? 0;
  const priorizouProteina = habitoHoje?.priorizou_proteina ?? false;
  // O ✓ é decorativo: o texto já diz o estado, então o leitor de tela não lê o símbolo.
  const rotuloProteina = priorizouProteina ? (
    <>
      <span aria-hidden="true">✓</span> Priorizei proteína hoje
    </>
  ) : (
    "Ainda não priorizei proteína hoje"
  );
  const metaLitros = meta?.meta_hidratacao_litros_dia ?? null;

  const progresso = calcularProgressoAgua(quantidadeAguaMl, metaLitros);
  const registroExcluido = searchParams?.registro_excluido === "1";
  const temRegistroHoje = Boolean(habitoHoje);

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Hábitos do dia</h1>
      </header>

      {registroExcluido ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Hábitos de hoje zerados.
        </p>
      ) : null}

      <section className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <div>
          <p className="font-semibold text-oliva">Hidratação</p>
          {progresso.metaLitros === null ? (
            <p className="text-sm text-stone-600 mt-1">
              Meta de hidratação ainda não configurada.{" "}
              <Link href="/fisico/metas" className="underline text-oliva">
                Configurar meta
              </Link>
            </p>
          ) : (
            <p className="text-sm text-stone-600 mt-1">
              {progresso.litros.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}L de{" "}
              {progresso.metaLitros.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}L
              {progresso.atingiuMeta ? (
                <>
                  {" · Meta batida! "}
                  <span aria-hidden="true">🎉</span>
                </>
              ) : null}
            </p>
          )}
        </div>

        <ControleAgua
          incrementos={INCREMENTOS_AGUA_ML}
          acaoIncremento={incrementarAgua}
          acaoAjuste={ajustarAguaManual}
          quantidadeAtualMl={quantidadeAguaMl}
        />
      </section>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <p className="font-semibold text-oliva mb-3">Proteína do dia</p>
        <BotaoAcao
          acao={alternarProteina}
          rotulo={rotuloProteina}
          rotuloEnviando={rotuloProteina}
          mensagemSucesso={mensagemAlternarProteina(priorizouProteina)}
          variante={priorizouProteina ? "default" : "outline"}
          className="w-full"
        />
      </section>

      {temRegistroHoje ? (
        <BotaoAcao
          acao={excluirHabitosHoje}
          rotulo="Zerar hábitos de hoje"
          rotuloEnviando="Zerando hábitos…"
          confirmacao="Zerar hidratação e proteína de hoje?"
          destinoSucesso="/fisico/habitos?registro_excluido=1"
          variante="outline"
          className="w-full text-red-700 border-red-200 hover:bg-red-50"
        />
      ) : null}
    </main>
  );
}
