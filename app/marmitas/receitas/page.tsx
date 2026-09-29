import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ORDEM_CATEGORIAS = ["café da manhã", "lanche", "jantar", "sobremesa"];

type Receita = {
  id: string;
  nome: string;
  categoria: string | null;
  ingredientes: string | null;
  modo_preparo: string | null;
  notas: string | null;
  selos: string[] | null;
};

function agruparPorCategoria(receitas: Receita[]) {
  const categorias = Array.from(
    new Set(receitas.map((r) => r.categoria ?? "Sem categoria"))
  ).sort((a, b) => {
    const ia = ORDEM_CATEGORIAS.indexOf(a);
    const ib = ORDEM_CATEGORIAS.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  return categorias.map((categoria) => ({
    categoria,
    receitas: receitas.filter((r) => (r.categoria ?? "Sem categoria") === categoria),
  }));
}

export default async function ReceitasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: receitas, error } = await supabase
    .from("receitas")
    .select("id, nome, categoria, ingredientes, modo_preparo, notas, selos")
    .order("nome");

  const grupos = receitas ? agruparPorCategoria(receitas) : [];

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/" className="text-sm text-oliva/70">
          ← Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Biblioteca de receitas</h1>
      </header>

      {error ? (
        <p className="text-sm text-red-700">Erro ao carregar receitas: {error.message}</p>
      ) : !receitas || receitas.length === 0 ? (
        <p className="text-sm text-stone-600">Nenhuma receita cadastrada ainda.</p>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <section key={grupo.categoria}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-oliva/60 px-1 mb-2">
                {grupo.categoria} · {grupo.receitas.length}
              </h2>
              <ul className="space-y-3">
                {grupo.receitas.map((r) => (
                  <li key={r.id}>
                    <details className="rounded-2xl bg-white/80 border border-oliva/10 p-4 shadow-sm">
                      <summary className="cursor-pointer font-semibold text-oliva">
                        {r.nome}
                      </summary>

                      <div className="mt-3 space-y-3 text-sm text-stone-700">
                        {r.ingredientes ? (
                          <div>
                            <p className="font-medium text-oliva text-xs uppercase tracking-wide mb-1">
                              Ingredientes
                            </p>
                            <p className="whitespace-pre-line">{r.ingredientes}</p>
                          </div>
                        ) : null}

                        {r.modo_preparo ? (
                          <div>
                            <p className="font-medium text-oliva text-xs uppercase tracking-wide mb-1">
                              Modo de preparo
                            </p>
                            <p className="whitespace-pre-line">{r.modo_preparo}</p>
                          </div>
                        ) : null}

                        {r.notas ? (
                          <div className="bg-bege rounded-xl p-3">
                            <p className="font-medium text-oliva text-xs uppercase tracking-wide mb-1">
                              Leitura para o plano
                            </p>
                            <p>{r.notas}</p>
                          </div>
                        ) : null}

                        {r.selos && r.selos.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {r.selos.map((s) => (
                              <span
                                key={s}
                                className="text-xs bg-oliva/10 text-oliva rounded-full px-2 py-0.5"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
