import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarPreparo, criarReceita } from "../actions";
import { FormularioAcao } from "@/components/formulario-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hojeISO } from "@/lib/date";
import { listarReceitasParaPreparo } from "@/lib/marmitas/consultas";
import { CampoPrazoCongelamento } from "@/components/marmitas/campo-prazo-congelamento";

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

  const { data: receitas } = await listarReceitasParaPreparo(supabase, user.id);

  const hoje = hojeISO();
  const temReceitas = Boolean(receitas && receitas.length > 0);
  const receitaSalva = searchParams?.receita_salva === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=dia-a-dia" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Registrar preparo</h1>
      </header>

      {receitaSalva ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Receita salva! Já aparece na lista abaixo.
        </p>
      ) : null}

      {temReceitas ? (
        <FormularioAcao
          acao={criarPreparo}
          rotuloEnviar="Registrar preparo"
          rotuloEnviando="Registrando preparo…"
          classeBotao="w-full"
          className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="receita_id">Receita</Label>
            <select
              id="receita_id"
              name="receita_id"
              required
              className="flex h-11 w-full rounded-xl border border-oliva/70 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
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
            <Input id="data_preparo" name="data_preparo" type="date" defaultValue={hoje} max={hoje} required />
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

        </FormularioAcao>
      ) : (
        <p className="text-sm text-stone-700 bg-rosa-soft/50 border border-rosa/40 rounded-2xl p-4">
          Nenhuma receita cadastrada ainda. Cadastre uma abaixo pra poder registrar um preparo.
        </p>
      )}

      <details className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <summary className="font-semibold text-oliva cursor-pointer">+ Nova receita rápida</summary>
        <FormularioAcao
          acao={criarReceita}
          rotuloEnviar="Salvar receita"
          rotuloEnviando="Salvando receita…"
          mensagemSucesso="Receita salva. Ela já aparece na lista de receitas do preparo."
          variante="outline"
          classeBotao="w-full"
          className="space-y-4 mt-4"
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <CampoPrazoCongelamento />
        </FormularioAcao>
      </details>
    </main>
  );
}
