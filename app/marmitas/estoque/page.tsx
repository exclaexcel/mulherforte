import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcularStatusValidade, type StatusValidade } from "@/lib/marmitas/estoque";
import { marcarConsumido } from "../actions";
import { Button } from "@/components/ui/button";

const STATUS_STYLE: Record<StatusValidade, string> = {
  verde: "bg-green-50 border-green-200 text-green-800",
  amarelo: "bg-yellow-50 border-yellow-200 text-yellow-800",
  vermelho: "bg-red-50 border-red-200 text-red-800",
};

const STATUS_LABEL: Record<StatusValidade, string> = {
  verde: "Dentro do prazo",
  amarelo: "Atenção — perto do prazo",
  vermelho: "Vencido ou quase vencendo",
};

type ReceitaRef = { nome: string; validade_congelado_dias: number } | null;

export default async function EstoquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: preparos, error } = await supabase
    .from("preparos")
    .select(
      "id, data_preparo, quantidade_porcoes, observacoes, receitas ( nome, validade_congelado_dias )"
    )
    .eq("status", "congelado")
    .order("data_preparo", { ascending: true });

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/" className="text-sm text-oliva/70">
          ← Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Estoque do congelador</h1>
      </header>

      {error ? (
        <p className="text-sm text-red-700">Erro ao carregar estoque: {error.message}</p>
      ) : !preparos || preparos.length === 0 ? (
        <p className="text-sm text-stone-600">Nada congelado no momento.</p>
      ) : (
        <ul className="space-y-3">
          {preparos.map((p) => {
            const receita = (
              Array.isArray(p.receitas) ? p.receitas[0] : p.receitas
            ) as ReceitaRef;
            const { diasDesdePreparo, diasRestantes, status } = calcularStatusValidade(
              p.data_preparo,
              receita?.validade_congelado_dias ?? 60
            );

            return (
              <li key={p.id} className={`rounded-2xl border p-4 space-y-2 ${STATUS_STYLE[status]}`}>
                <div>
                  <p className="font-semibold">{receita?.nome ?? "Receita removida"}</p>
                  <p className="text-xs opacity-80">
                    Preparado em {p.data_preparo} · {diasDesdePreparo} dia(s) atrás ·{" "}
                    {p.quantidade_porcoes} porção(ões)
                  </p>
                </div>
                <p className="text-xs font-medium">
                  {STATUS_LABEL[status]}{" "}
                  {diasRestantes >= 0
                    ? `— restam ${diasRestantes} dia(s)`
                    : `— venceu há ${Math.abs(diasRestantes)} dia(s)`}
                </p>
                <form action={marcarConsumido}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Marcar como consumido
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
