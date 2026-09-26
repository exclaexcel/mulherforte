import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("perfil_usuario")
    .select("altura_cm, data_nascimento")
    .eq("user_id", user.id)
    .maybeSingle();

  const perfilStatus = perfilError
    ? "tabela ainda não aplicada no banco (rode a migration)"
    : perfil
      ? `altura ${perfil.altura_cm ?? "—"} cm`
      : "ainda sem linha em perfil_usuario (preencher depois)";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-oliva/70">Olá</p>
          <h1 className="text-2xl font-bold text-oliva">App Jornada</h1>
          <p className="text-sm text-stone-500 mt-1">Etapa 1 — fundação pronta</p>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 space-y-3 shadow-sm">
        <h2 className="font-semibold text-oliva">Sessão</h2>
        <p className="text-sm text-stone-600 break-all">
          Logada como <span className="font-medium text-stone-900">{user.email}</span>
        </p>
        <p className="text-sm text-stone-600">Perfil: {perfilStatus}</p>
      </section>

      <section className="mt-6 rounded-2xl bg-rosa-soft/50 border border-rosa/40 p-5">
        <p className="text-sm text-stone-700 leading-relaxed">
          Próximo: Etapa 2 — marmitas (preparo, estoque e lista de compras).
        </p>
      </section>
    </main>
  );
}
