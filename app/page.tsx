import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { redirect } from "next/navigation";
import { ChefHat, Refrigerator, ShoppingCart, Pencil } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfil_usuario")
    .select("nome")
    .eq("user_id", user.id)
    .maybeSingle();

  const saudacao = perfil?.nome ? perfil.nome : user.email;

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-oliva/70">Olá, {saudacao}</p>
          <h1 className="text-2xl font-bold text-oliva">App Jornada</h1>
          <p className="text-sm text-stone-500 mt-1">Etapa 2 — marmitas: núcleo</p>
          <Link href="/perfil" className="inline-flex items-center gap-1 text-xs text-oliva/70 mt-2">
            <Pencil className="h-3 w-3" />
            Editar perfil
          </Link>
        </div>
        <LogoutButton />
      </header>

      <section className="mt-6 space-y-3">
        <Link
          href="/marmitas/preparo"
          className="flex items-center gap-3 rounded-2xl bg-white/80 border border-oliva/10 p-4 shadow-sm hover:bg-bege transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oliva/10 border border-oliva/20">
            <ChefHat className="h-5 w-5 text-oliva" />
          </span>
          <span>
            <p className="font-semibold text-oliva">Registrar preparo</p>
            <p className="text-sm text-stone-600">Anotar o que foi cozinhado e congelado</p>
          </span>
        </Link>
        <Link
          href="/marmitas/estoque"
          className="flex items-center gap-3 rounded-2xl bg-white/80 border border-oliva/10 p-4 shadow-sm hover:bg-bege transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oliva/10 border border-oliva/20">
            <Refrigerator className="h-5 w-5 text-oliva" />
          </span>
          <span>
            <p className="font-semibold text-oliva">Estoque do congelador</p>
            <p className="text-sm text-stone-600">Ver o que tem e o alerta de validade</p>
          </span>
        </Link>
        <Link
          href="/marmitas/compras"
          className="flex items-center gap-3 rounded-2xl bg-white/80 border border-oliva/10 p-4 shadow-sm hover:bg-bege transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oliva/10 border border-oliva/20">
            <ShoppingCart className="h-5 w-5 text-oliva" />
          </span>
          <span>
            <p className="font-semibold text-oliva">Lista de compras</p>
            <p className="text-sm text-stone-600">Marcar o que já tem em casa</p>
          </span>
        </Link>
      </section>
    </main>
  );
}
