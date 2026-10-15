import Link from "next/link";
import { Pencil, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listarReceitasBiblioteca } from "@/lib/marmitas/consultas";
import { CATEGORIAS_RECEITA } from "@/lib/marmitas/receita";
import { excluirReceita } from "../actions";
import { BotaoAcao } from "@/components/botao-acao";
import { LinkInicio } from "@/components/link-inicio";

const ORDEM_CATEGORIAS = ["café da manhã", "lanche", "jantar", "sobremesa"];
const SEM_CATEGORIA = "sem categoria";

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

/** Pills de categoria (slicer): clicar filtra, sem dropdown — mesmo padrão do filtro de período do histórico. */
function SlicerCategoria({
  categoriaAtual,
  busca,
}: {
  categoriaAtual: string;
  busca: string;
}) {
  const opcoes = [
    { value: "todas", label: "Todas" },
    ...CATEGORIAS_RECEITA.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
    { value: SEM_CATEGORIA, label: "Sem categoria" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filtrar por categoria">
      {opcoes.map((o) => {
        const params = new URLSearchParams();
        if (o.value !== "todas") params.set("categoria", o.value);
        if (busca) params.set("busca", busca);
        const href = `/marmitas/receitas${params.toString() ? `?${params.toString()}` : ""}`;
        const ativo = o.value === categoriaAtual;
        return (
          <Link
            key={o.value}
            href={href}
            aria-current={ativo ? "true" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap border ${
              ativo ? "bg-oliva text-bege border-oliva" : "bg-white/80 text-oliva/85 border-oliva/20"
            }`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function ReceitasPage({
  searchParams,
}: {
  searchParams: {
    receita_salva?: string;
    receita_atualizada?: string;
    receita_excluida?: string;
    categoria?: string;
    busca?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: receitasTodas, error } = await listarReceitasBiblioteca(supabase, user.id);

  const categoriasValidas = [...CATEGORIAS_RECEITA, SEM_CATEGORIA] as string[];
  const categoriaAtual =
    searchParams?.categoria && categoriasValidas.includes(searchParams.categoria)
      ? searchParams.categoria
      : "todas";
  const busca = (searchParams?.busca ?? "").trim();

  const receitas = (receitasTodas ?? []).filter((r) => {
    const categoriaDaReceita = r.categoria ?? SEM_CATEGORIA;
    const passaCategoria = categoriaAtual === "todas" || categoriaDaReceita === categoriaAtual;
    const passaBusca = !busca || r.nome.toLowerCase().includes(busca.toLowerCase());
    return passaCategoria && passaBusca;
  });

  const grupos = agruparPorCategoria(receitas);
  const filtrando = categoriaAtual !== "todas" || busca !== "";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
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

      {!error && receitasTodas && receitasTodas.length > 0 ? (
        <div className="space-y-3">
          <form method="GET" className="flex gap-2">
            {categoriaAtual !== "todas" ? <input type="hidden" name="categoria" value={categoriaAtual} /> : null}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <input
                type="search"
                name="busca"
                defaultValue={busca}
                placeholder="Buscar por nome..."
                className="w-full h-10 rounded-xl border border-oliva/70 bg-white pl-9 pr-3 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
              />
            </div>
          </form>
          <SlicerCategoria categoriaAtual={categoriaAtual} busca={busca} />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700">Não foi possível carregar as receitas agora. Tente novamente.</p>
      ) : !receitasTodas || receitasTodas.length === 0 ? (
        <div className="space-y-3 rounded-2xl bg-white/80 border border-oliva/10 p-5">
          <p className="text-sm text-stone-600">Nenhuma receita cadastrada ainda.</p>
          <Link href="/marmitas/receitas/nova" className="text-sm text-oliva underline">
            Cadastrar a primeira receita
          </Link>
        </div>
      ) : receitas.length === 0 ? (
        <div className="space-y-3 rounded-2xl bg-white/80 border border-oliva/10 p-5">
          <p className="text-sm text-stone-600">
            Nenhuma receita encontrada {filtrando ? "com esse filtro" : ""}.
          </p>
          <Link href="/marmitas/receitas" className="text-sm text-oliva underline">
            Limpar filtro
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
                            className="inline-flex items-center gap-1 p-1 -m-1 text-xs text-oliva underline"
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
                            className="p-1 -m-1 text-xs text-red-700 underline"
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

      <LinkInicio aba="marmitas" />
    </main>
  );
}
