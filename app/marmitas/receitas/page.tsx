import Link from "next/link";
import { Home, Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listarReceitasBiblioteca } from "@/lib/marmitas/consultas";
import { excluirReceita } from "../actions";
import { BotaoAcao } from "@/components/botao-acao";

const ORDEM_CATEGORIAS = ["café da manhã", "lanche", "jantar", "sobremesa"];

type Receita = {
  id: string;
  nome: string;
  categoria: string | null;
  ingredientes: string | null;
  modo_preparo: string | null;
  notas: string | null;
  selos: string[] | null;
  validade_congelado_dias: number | null;
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

export default async function ReceitasPage({
  searchParams,
}: {
  searchParams: { receita_salva?: string; receita_atualizada?: string; receita_excluida?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: receitas, error } = await listarReceitasBiblioteca(supabase, user.id);

  const grupos = receitas ? agruparPorCategoria(receitas) : [];

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/?aba=planejamento" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Biblioteca de receitas</h1>
        <Link
          href="/marmitas/receitas/nova"
          className="inline-flex items-center rounded-full bg-oliva text-bege px-4 py-2 text-sm font-medium mt-3"
        >
          + Nova receita
        </Link>
      </header>

      {searchParams?.receita_salva === "1" ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Receita salva!
        </p>
      ) : null}

      {searchParams?.receita_atualizada === "1" ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Receita atualizada!
        </p>
      ) : null}

      {searchParams?.receita_excluida === "1" ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Receita excluída.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700">Não foi possível carregar as receitas agora. Tente novamente.</p>
      ) : !receitas || receitas.length === 0 ? (
        <div className="space-y-3 rounded-2xl bg-white/80 border border-oliva/10 p-5">
          <p className="text-sm text-stone-600">Nenhuma receita cadastrada ainda.</p>
          <Link href="/marmitas/receitas/nova" className="text-sm text-oliva underline">
            Cadastrar a primeira receita
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <section key={grupo.categoria}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-oliva/85 px-1 mb-2">
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
                        <div>
                          <p className="font-medium text-oliva text-xs uppercase tracking-wide mb-1">
                            Prazo de congelamento
                          </p>
                          <p>
                            {r.validade_congelado_dias === null
                              ? "Prazo não informado"
                              : `${r.validade_congelado_dias} ${r.validade_congelado_dias === 1 ? "dia" : "dias"}`}
                          </p>
                        </div>

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

                        <div className="flex items-center gap-3 pt-2">
                          <Link
                            href={`/marmitas/receitas/${r.id}/editar`}
                            className="inline-flex items-center gap-1 text-xs text-oliva underline"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </Link>
                          <BotaoAcao
                            acao={excluirReceita}
                            campos={{ id: r.id }}
                            rotulo="Excluir"
                            rotuloEnviando="Excluindo…"
                            confirmacao={`Excluir a receita "${r.nome}"? Essa ação não pode ser desfeita.`}
                            estilo="nativo"
                            className="text-xs text-red-700 underline"
                          />
                        </div>
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
