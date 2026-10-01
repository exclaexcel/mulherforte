import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarMedidas, excluirMedidasHoje } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { hojeISO } from "@/lib/date";
import { REGIOES_MEDIDA, type RegiaoMedida } from "@/lib/fisico/types";

export default async function MedidasPage({
  searchParams,
}: {
  searchParams: {
    medidas_salvas?: string;
    registro_excluido?: string;
    variacao_atipica?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoje = hojeISO();

  const { data: todasMedidas } = await supabase
    .from("medidas_corporais")
    .select("data, regiao, valor_cm")
    .eq("user_id", user.id)
    .order("data", { ascending: false });

  const medidasHoje = todasMedidas?.filter((m) => m.data === hoje) ?? [];

  const valorAtual = (regiao: RegiaoMedida) =>
    medidasHoje.find((m) => m.regiao === regiao)?.valor_cm ?? undefined;

  const ultimaMedida = (regiao: RegiaoMedida) =>
    todasMedidas?.find((m) => m.regiao === regiao && m.data !== hoje) ?? null;

  const medidasSalvas = searchParams?.medidas_salvas === "1";
  const registroExcluido = searchParams?.registro_excluido === "1";
  const temMedidaHoje = medidasHoje.length > 0;

  const regioesAtipicas = (searchParams?.variacao_atipica ?? "")
    .split(",")
    .filter((r): r is RegiaoMedida => REGIOES_MEDIDA.some((regiao) => regiao.value === r));
  const labelsAtipicos = regioesAtipicas.map(
    (r) => REGIOES_MEDIDA.find((regiao) => regiao.value === r)?.label ?? r
  );

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Registrar medidas</h1>
      </header>

      {medidasSalvas ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Medidas salvas!
        </p>
      ) : null}

      {registroExcluido ? (
        <p className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Medidas de hoje excluídas.
        </p>
      ) : null}

      {labelsAtipicos.length > 0 ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3">
          {labelsAtipicos.join(", ")}: a medida foi registrada, mas a diferença foi maior que
          3 cm em relação à medição mensal de referência. Confira o ponto de medição e, se
          necessário, registre novamente.
        </p>
      ) : null}

      <form
        action={registrarMedidas}
        className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" defaultValue={hoje} required />
        </div>

        <p className="text-xs text-stone-500">Preencha só as medidas que for tirar hoje.</p>

        {REGIOES_MEDIDA.map((r) => {
          const ultima = ultimaMedida(r.value);
          return (
            <div key={r.value} className="space-y-2">
              <Label htmlFor={`${r.value}_cm`}>{r.label} (cm)</Label>
              <Input
                id={`${r.value}_cm`}
                name={`${r.value}_cm`}
                type="number"
                step="0.1"
                min={0}
                defaultValue={valorAtual(r.value)}
              />
              {ultima ? (
                <p className="text-xs text-stone-500">
                  Última: {ultima.valor_cm}cm em {ultima.data}
                </p>
              ) : null}
            </div>
          );
        })}

        <Button type="submit" className="w-full">
          Registrar medidas
        </Button>
      </form>

      {temMedidaHoje ? (
        <form action={excluirMedidasHoje}>
          <ConfirmSubmitButton
            type="submit"
            variant="outline"
            className="w-full text-red-700 border-red-200 hover:bg-red-50"
            confirmMessage="Excluir todas as medidas registradas hoje?"
          >
            Excluir medidas de hoje
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </main>
  );
}
