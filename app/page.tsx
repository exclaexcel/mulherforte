import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { NavCard } from "@/components/marmitas/nav-card";
import { redirect } from "next/navigation";
import {
  ChefHat,
  Refrigerator,
  ShoppingCart,
  Pencil,
  BookOpen,
  CalendarDays,
  Info,
} from "lucide-react";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { perfil_salvo?: string };
}) {
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
  const perfilSalvo = searchParams?.perfil_salvo === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-oliva/70">Olá, {saudacao}</p>
          <h1 className="text-2xl font-bold text-oliva">App Jornada</h1>
          <p className="text-sm text-stone-500 mt-1">Etapa 3 — marmitas: conteúdo e planejamento</p>
          <Link href="/perfil" className="inline-flex items-center gap-1 text-xs text-oliva/70 mt-2">
            <Pencil className="h-3 w-3" />
            Editar perfil
          </Link>
        </div>
        <LogoutButton />
      </header>

      {perfilSalvo ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3 mb-6">
          Perfil atualizado!
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-oliva/60 px-1">
          Dia a dia
        </h2>
        <NavCard
          href="/marmitas/preparo"
          icon={ChefHat}
          titulo="Registrar preparo"
          descricao="Anotar o que foi cozinhado e congelado"
        />
        <NavCard
          href="/marmitas/estoque"
          icon={Refrigerator}
          titulo="Estoque do congelador"
          descricao="Ver o que tem e o alerta de validade"
        />
        <NavCard
          href="/marmitas/compras"
          icon={ShoppingCart}
          titulo="Lista de compras"
          descricao="Marcar o que já tem em casa"
        />
      </section>

      <section className="space-y-3 mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-oliva/60 px-1">
          Planejamento e referência
        </h2>
        <NavCard
          href="/marmitas/receitas"
          icon={BookOpen}
          titulo="Biblioteca de receitas"
          descricao="As 16 receitas do guia, sem precisar abrir o PDF"
        />
        <NavCard
          href="/marmitas/cronograma"
          icon={CalendarDays}
          titulo="Cronograma planejado"
          descricao="O que preparar em cada semana do ciclo"
        />
        <NavCard
          href="/marmitas/plano"
          icon={Info}
          titulo="Sobre o plano"
          descricao="Horários, regras USDA e boas práticas"
        />
      </section>
    </main>
  );
}
