import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarReceitaCompleta } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORIAS_RECEITA } from "@/lib/marmitas/receita";
import { CampoPrazoCongelamento } from "@/components/marmitas/campo-prazo-congelamento";

const CAMPO_TEXTO =
  "flex w-full rounded-xl border border-oliva/20 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva";

export default async function NovaReceitaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/marmitas/receitas" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Biblioteca de receitas
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Nova receita</h1>
        <p className="text-sm text-stone-500 mt-1">
          Preencha o que souber. Só o nome é obrigatório.
        </p>
      </header>

      <form
        action={criarReceitaCompleta}
        className="space-y-5 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="nome">Nome da receita</Label>
          <Input id="nome" name="nome" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <select id="categoria" name="categoria" defaultValue="" className={`${CAMPO_TEXTO} h-11`}>
            <option value="">Sem categoria</option>
            {CATEGORIAS_RECEITA.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <CampoPrazoCongelamento />

        <div className="space-y-2">
          <Label htmlFor="ingredientes">Ingredientes</Label>
          <p className="text-xs text-stone-500">Um por linha, se preferir.</p>
          <textarea id="ingredientes" name="ingredientes" rows={6} className={CAMPO_TEXTO} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="modo_preparo">Modo de preparo</Label>
          <textarea id="modo_preparo" name="modo_preparo" rows={8} className={CAMPO_TEXTO} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dica_congelamento">Dica para congelar</Label>
          <textarea id="dica_congelamento" name="dica_congelamento" rows={3} className={CAMPO_TEXTO} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="selos">Marcadores</Label>
          <p className="text-xs text-stone-500">Separe por vírgula. Ex.: air fryer, congelável</p>
          <Input id="selos" name="selos" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notas">Observações</Label>
          <textarea id="notas" name="notas" rows={4} className={CAMPO_TEXTO} />
        </div>

        <Button type="submit" className="w-full">
          Salvar receita
        </Button>
      </form>
    </main>
  );
}
