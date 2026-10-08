import Link from "next/link";
import { Home, Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarItemCompra, alternarTenhoEmCasa } from "../actions";
import { BotaoAcao } from "@/components/botao-acao";
import { FormularioAcao } from "@/components/formulario-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GRUPOS_COMPRA } from "@/lib/marmitas/types";
import { listarItensCompra } from "@/lib/marmitas/consultas";
import { CorrigirItemCompra } from "@/components/marmitas/corrigir-item-compra";

/**
 * Rótulo do item na lista. O ✓ e o ○ são decorativos; o estado vai em texto oculto
 * visualmente, então quem usa leitor de tela também sabe se o item já está em casa.
 */
function rotuloItem(item: { tenho_em_casa: boolean; item: string }) {
  return (
    <>
      <span aria-hidden="true">{item.tenho_em_casa ? "✓" : "○"}</span>{" "}
      <span className="sr-only">{item.tenho_em_casa ? "Já tenho: " : "Preciso comprar: "}</span>
      {item.item}
    </>
  );
}

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: { item_salvo?: string; item_atualizado?: string };
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

  const itensParaCorrecao = porGrupo.flatMap((grupo) =>
    grupo.itens.map((item) => ({ id: item.id, item: item.item, grupoLabel: grupo.label }))
  );

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/?aba=dia-a-dia" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Lista de compras</h1>
      </header>

      {itemSalvo ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Item salvo!
        </p>
      ) : null}

      {searchParams?.item_atualizado === "1" ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Item atualizado!
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
              <ul className="space-y-3">
                {grupo.itens.map((item) => (
                  <li key={item.id}>
                    <BotaoAcao
                      acao={alternarTenhoEmCasa}
                      campos={{ id: item.id }}
                      rotulo={rotuloItem(item)}
                      rotuloEnviando={rotuloItem(item)}
                      estilo="nativo"
                      className={`text-sm text-left ${
                        item.tenho_em_casa ? "line-through text-stone-500" : "text-stone-800"
                      }`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <details className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <summary className="font-semibold text-oliva cursor-pointer">+ Novo item</summary>
        <FormularioAcao
          acao={criarItemCompra}
          rotuloEnviar="Adicionar item"
          rotuloEnviando="Adicionando item…"
          mensagemSucesso="Item adicionado à lista."
          variante="outline"
          classeBotao="w-full"
          className="space-y-4 mt-4"
        >
          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo</Label>
            <select
              id="grupo"
              name="grupo"
              required
              className="flex h-11 w-full rounded-xl border border-oliva/70 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
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
        </FormularioAcao>
      </details>

      {itensParaCorrecao.length > 0 ? (
        <details className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
          <summary className="inline-flex items-center gap-1 font-semibold text-oliva cursor-pointer">
            <Pencil className="h-4 w-4" />
            Corrigir nome de um item
          </summary>
          <CorrigirItemCompra itens={itensParaCorrecao} />
        </details>
      ) : null}
    </main>
  );
}
