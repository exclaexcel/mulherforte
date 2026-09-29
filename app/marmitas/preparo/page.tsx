import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarPreparo, criarReceita } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hojeISO } from "@/lib/date";

export default async function PreparoPage({
  searchParams,
}: {
  searchParams: { receita_salva?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: receitas } = await supabase
    .from("receitas")
    .select("id, nome")
    .order("nome");

  const hoje = hojeISO();
  const temReceitas = Boolean(receitas && receitas.length > 0);
  const receitaSalva = searchParams?.receita_salva === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/" className="text-sm text-oliva/70">
          ← Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Registrar preparo</h1>
      </header>

      {receitaSalva ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Receita salva! Já aparece na lista abaixo.
        </p>
      ) : null}

      {temReceitas ? (
        <form
          action={criarPreparo}
          className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="receita_id">Receita</Label>
            <select
              id="receita_id"
              name="receita_id"
              required
              className="flex h-11 w-full rounded-xl border border-oliva/20 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
            >
              <option value="">Selecione...</option>
              {receitas!.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_preparo">Data do preparo</Label>
            <Input id="data_preparo" name="data_preparo" type="date" defaultValue={hoje} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade_porcoes">Quantidade de porções</Label>
            <Input id="quantidade_porcoes" name="quantidade_porcoes" type="number" min={1} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="semana_ciclo">Semana do ciclo (1-4, opcional)</Label>
            <Input id="semana_ciclo" name="semana_ciclo" type="number" min={1} max={4} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Input id="observacoes" name="observacoes" />
          </div>

          <Button type="submit" className="w-full">
            Registrar preparo
          </Button>
        </form>
      ) : (
        <p className="text-sm text-stone-700 bg-rosa-soft/50 border border-rosa/40 rounded-2xl p-4">
          Nenhuma receita cadastrada ainda. Cadastre uma abaixo pra poder registrar um preparo.
        </p>
      )}

      <details className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <summary className="font-semibold text-oliva cursor-pointer">+ Nova receita rápida</summary>
        <form action={criarReceita} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validade_congelado_dias">Validade congelado (dias)</Label>
            <Input
              id="validade_congelado_dias"
              name="validade_congelado_dias"
              type="number"
              min={1}
              required
            />
          </div>
          <Button type="submit" variant="outline" className="w-full">
            Salvar receita
          </Button>
        </form>
      </details>
    </main>
  );
}
