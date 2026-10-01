import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarTreino, excluirTreinoHoje } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { hojeISO } from "@/lib/date";
import { TIPOS_TREINO } from "@/lib/fisico/types";
import { TipoTreinoField } from "@/components/fisico/tipo-treino-field";
import { DataTreinoField } from "@/components/fisico/data-treino-field";

export default async function TreinoPage({
  searchParams,
}: {
  searchParams: { treino_salvo?: string; registro_excluido?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoje = hojeISO();

  const { data: treinoHoje } = await supabase
    .from("adesao_treino")
    .select("tipo, realizado, tipo_outro_descricao, duracao_minutos, calorias")
    .eq("user_id", user.id)
    .eq("data", hoje)
    .maybeSingle();

  const treinoSalvo = searchParams?.treino_salvo === "1";
  const registroExcluido = searchParams?.registro_excluido === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Registrar treino</h1>
      </header>

      {treinoSalvo ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Treino registrado!
        </p>
      ) : null}

      {registroExcluido ? (
        <p className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Treino de hoje excluído.
        </p>
      ) : null}

      <form
        action={registrarTreino}
        className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <DataTreinoField defaultValue={hoje} />

        <TipoTreinoField
          tipos={TIPOS_TREINO}
          defaultTipo={treinoHoje?.tipo ?? ""}
          defaultDescricao={treinoHoje?.tipo_outro_descricao}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duracao_minutos">Duração (min)</Label>
            <Input
              id="duracao_minutos"
              name="duracao_minutos"
              type="number"
              min={1}
              defaultValue={treinoHoje?.duracao_minutos ?? undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calorias">Calorias (kcal)</Label>
            <Input
              id="calorias"
              name="calorias"
              type="number"
              min={1}
              defaultValue={treinoHoje?.calorias ?? undefined}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="realizado"
            name="realizado"
            type="checkbox"
            defaultChecked={treinoHoje?.realizado ?? false}
            className="h-5 w-5 rounded border-oliva/30 text-oliva focus-visible:ring-2 focus-visible:ring-oliva"
          />
          <Label htmlFor="realizado" className="cursor-pointer">
            Realizado
          </Label>
        </div>

        <Button type="submit" className="w-full">
          Salvar treino
        </Button>
      </form>

      {treinoHoje ? (
        <form action={excluirTreinoHoje}>
          <ConfirmSubmitButton
            type="submit"
            variant="outline"
            className="w-full text-red-700 border-red-200 hover:bg-red-50"
            confirmMessage="Excluir o registro de treino de hoje?"
          >
            Excluir registro de hoje
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </main>
  );
}
