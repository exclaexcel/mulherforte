import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarItemCompra, alternarTenhoEmCasa } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GRUPOS_COMPRA } from "@/lib/marmitas/types";
import { listarItensCompra } from "@/lib/marmitas/consultas";

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: { item_salvo?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: itens } = await listarItensCompra(supabase, user.id);

  const porGrupo = GRUPOS_COMPRA.map((g) => ({
    ...g,
    itens: (itens ?? []).filter((i) => i.grupo === g.value),
  }));

  const itemSalvo = searchParams?.item_salvo === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/?aba=dia-a-dia" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Lista de compras</h1>
      </header>

      {itemSalvo ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Item salvo!
        </p>
      ) : null}

      <div className="space-y-5">
        {porGrupo.map((grupo) => (
          <section
            key={grupo.value}
            className="rounded-2xl bg-white/80 border border-oliva/10 p-4 shadow-sm"
          >
            <h2 className="font-semibold text-oliva mb-2">{grupo.label}</h2>
            {grupo.itens.length === 0 ? (
              <p className="text-xs text-stone-500">Nenhum item cadastrado.</p>
            ) : (
              <ul className="space-y-2">
                {grupo.itens.map((item) => (
                  <li key={item.id}>
                    <form action={alternarTenhoEmCasa}>
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        type="hidden"
                        name="tenho_em_casa"
                        value={String(item.tenho_em_casa)}
                      />
                      <button
                        type="submit"
                        className={`text-sm text-left ${
                          item.tenho_em_casa ? "line-through text-stone-400" : "text-stone-800"
                        }`}
                      >
                        {item.tenho_em_casa ? "✓" : "○"} {item.item}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <details className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <summary className="font-semibold text-oliva cursor-pointer">+ Novo item</summary>
        <form action={criarItemCompra} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo</Label>
            <select
              id="grupo"
              name="grupo"
              required
              className="flex h-11 w-full rounded-xl border border-oliva/20 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
            >
              {GRUPOS_COMPRA.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="item">Item</Label>
            <Input id="item" name="item" required />
          </div>
          <Button type="submit" variant="outline" className="w-full">
            Adicionar item
          </Button>
        </form>
      </details>
    </main>
  );
}
