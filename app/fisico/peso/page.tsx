import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarPeso, excluirPesoHoje } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { hojeISO } from "@/lib/date";

export default async function PesoPage({
  searchParams,
}: {
  searchParams: { peso_salvo?: string; registro_excluido?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoje = hojeISO();

  const { data: registroHoje } = await supabase
    .from("registros_peso")
    .select("peso_kg, percentual_gordura, percentual_massa_muscular, percentual_agua")
    .eq("user_id", user.id)
    .eq("data", hoje)
    .maybeSingle();

  const { data: ultimoRegistro } = await supabase
    .from("registros_peso")
    .select("data, peso_kg, percentual_gordura, percentual_massa_muscular, percentual_agua")
    .eq("user_id", user.id)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();

  const pesoSalvo = searchParams?.peso_salvo === "1";
  const registroExcluido = searchParams?.registro_excluido === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Registrar peso</h1>
      </header>

      {pesoSalvo ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Peso salvo!
        </p>
      ) : null}

      {registroExcluido ? (
        <p className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Registro de hoje excluído.
        </p>
      ) : null}

      {ultimoRegistro && ultimoRegistro.data !== hoje ? (
        <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-2xl p-3">
          Último registrado: {ultimoRegistro.peso_kg}kg em {ultimoRegistro.data}
          {ultimoRegistro.percentual_gordura ? ` · gordura ${ultimoRegistro.percentual_gordura}%` : ""}
          {ultimoRegistro.percentual_massa_muscular
            ? ` · massa muscular ${ultimoRegistro.percentual_massa_muscular}%`
            : ""}
          {ultimoRegistro.percentual_agua ? ` · água ${ultimoRegistro.percentual_agua}%` : ""}
        </p>
      ) : null}

      <form
        action={registrarPeso}
        className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" defaultValue={hoje} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="peso_kg">Peso (kg)</Label>
          <Input
            id="peso_kg"
            name="peso_kg"
            type="number"
            step="0.1"
            min={0}
            defaultValue={registroHoje?.peso_kg ?? undefined}
            required
          />
        </div>

        <Button type="submit" className="w-full">
          Registrar peso
        </Button>

        <details className="pt-2">
          <summary className="font-semibold text-oliva cursor-pointer text-sm">
            + Registrar bioimpedância (opcional)
          </summary>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="percentual_gordura">Percentual de gordura (%)</Label>
              <Input
                id="percentual_gordura"
                name="percentual_gordura"
                type="number"
                step="0.1"
                min={0}
                max={100}
                defaultValue={registroHoje?.percentual_gordura ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentual_massa_muscular">Massa muscular (%)</Label>
              <Input
                id="percentual_massa_muscular"
                name="percentual_massa_muscular"
                type="number"
                step="0.1"
                min={0}
                max={100}
                defaultValue={registroHoje?.percentual_massa_muscular ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentual_agua">Percentual de água (%)</Label>
              <Input
                id="percentual_agua"
                name="percentual_agua"
                type="number"
                step="0.1"
                min={0}
                max={100}
                defaultValue={registroHoje?.percentual_agua ?? undefined}
              />
            </div>
          </div>
        </details>
      </form>

      {registroHoje ? (
        <form action={excluirPesoHoje}>
          <ConfirmSubmitButton
            type="submit"
            variant="outline"
            className="w-full text-red-700 border-red-200 hover:bg-red-50"
            confirmMessage="Excluir o registro de peso de hoje?"
          >
            Excluir registro de hoje
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </main>
  );
}
