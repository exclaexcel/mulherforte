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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { hojeISO } from "@/lib/date";
import { calcularProgressoAgua } from "@/lib/fisico/habitos";
import { INCREMENTOS_AGUA_ML } from "@/lib/fisico/types";

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

  const [{ data: habitoHoje }, { data: meta }] = await Promise.all([
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

  const quantidadeAguaMl = habitoHoje?.quantidade_agua_ml ?? 0;
  const priorizouProteina = habitoHoje?.priorizou_proteina ?? false;
  const metaLitros = meta?.meta_hidratacao_litros_dia ?? null;

  const progresso = calcularProgressoAgua(quantidadeAguaMl, metaLitros);
  const registroExcluido = searchParams?.registro_excluido === "1";
  const temRegistroHoje = Boolean(habitoHoje);

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Hábitos do dia</h1>
      </header>

      {registroExcluido ? (
        <p className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
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
              {progresso.atingiuMeta ? " · Meta batida! 🎉" : ""}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {INCREMENTOS_AGUA_ML.map((inc) => (
            <form key={inc.value} action={incrementarAgua}>
              <input type="hidden" name="incremento_ml" value={inc.value} />
              <Button type="submit" variant="outline" className="w-full">
                {inc.label}
              </Button>
            </form>
          ))}
        </div>

        <details>
          <summary className="text-sm text-oliva/70 cursor-pointer">Ajustar manualmente</summary>
          <form action={ajustarAguaManual} className="flex items-end gap-2 mt-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="valor_ml">Total de hoje (ml)</Label>
              <Input
                id="valor_ml"
                name="valor_ml"
                type="number"
                min={0}
                step="1"
                defaultValue={quantidadeAguaMl}
              />
            </div>
            <Button type="submit" variant="outline">
              Salvar
            </Button>
          </form>
        </details>
      </section>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <p className="font-semibold text-oliva mb-3">Proteína do dia</p>
        <form action={alternarProteina}>
          <input type="hidden" name="priorizou_proteina_atual" value={String(priorizouProteina)} />
          <Button type="submit" variant={priorizouProteina ? "default" : "outline"} className="w-full">
            {priorizouProteina ? "✓ Priorizei proteína hoje" : "Ainda não priorizei proteína hoje"}
          </Button>
        </form>
      </section>

      {temRegistroHoje ? (
        <form action={excluirHabitosHoje}>
          <ConfirmSubmitButton
            type="submit"
            variant="outline"
            className="w-full text-red-700 border-red-200 hover:bg-red-50"
            confirmMessage="Zerar hidratação e proteína de hoje?"
          >
            Zerar hábitos de hoje
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </main>
  );
}
