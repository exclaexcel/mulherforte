import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  apresentarValidade,
  calcularValidade,
  formatarDataBR,
  ordenarEstoque,
  type SituacaoValidade,
  type TomValidade,
} from "@/lib/marmitas/estoque";
import { listarPreparosCongelados, listarReceitasParaPreparo } from "@/lib/marmitas/consultas";
import { marcarConsumido, descartarPreparo } from "../actions";
import { BotaoAcao } from "@/components/botao-acao";
import { AcaoDescarte } from "@/components/marmitas/acao-descarte";
import { CorrigirPreparo } from "@/components/marmitas/corrigir-preparo";
import { hojeISO } from "@/lib/date";
import { textoConfirmacaoConsumo } from "@/lib/marmitas/consumo";
import { LinkInicio } from "@/components/link-inicio";

const TOM_ESTILO: Record<TomValidade, string> = {
  urgente: "bg-red-50 border-red-200 text-red-800",
  atencao: "bg-yellow-50 border-yellow-200 text-yellow-800",
  ok: "bg-green-50 border-green-200 text-green-800",
  neutro: "bg-stone-50 border-stone-200 text-stone-700",
};

const ROTULO_SECAO: Record<SituacaoValidade, string> = {
  vencido: "Vencido",
  vence_hoje: "Vence hoje",
  proximo: "Próximo do vencimento",
  dentro: "Dentro do prazo",
  nao_informada: "Prazo não informado",
};

type ReceitaRef = { nome: string; validade_congelado_dias: number | null } | null;

type ItemEstoqueComValidade = {
  id: string;
  receitaId: string;
  dataPreparo: string;
  receitaNome: string;
  quantidade: number;
  observacoes: string | null;
  validade: ReturnType<typeof calcularValidade>;
};

/** Agrupa em seções por situação — itens já vêm ordenados por urgência (ordenarEstoque),
 * então itens da mesma situação já estão contíguos: não precisa reordenar aqui. */
function agruparPorSituacao(itens: ItemEstoqueComValidade[]) {
  const grupos: { situacao: SituacaoValidade; itens: ItemEstoqueComValidade[] }[] = [];
  for (const item of itens) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.situacao === item.validade.situacao) {
      ultimo.itens.push(item);
    } else {
      grupos.push({ situacao: item.validade.situacao, itens: [item] });
    }
  }
  return grupos;
}

/** Pills por situação (slicer): só mostra as que têm item, mesmo padrão dos outros filtros do app. */
function SlicerSituacao({
  gruposPorSituacao,
  situacaoAtual,
}: {
  gruposPorSituacao: { situacao: SituacaoValidade; itens: unknown[] }[];
  situacaoAtual: SituacaoValidade | "todas";
}) {
  const opcoes: { value: SituacaoValidade | "todas"; label: string }[] = [
    { value: "todas", label: "Todos" },
    ...gruposPorSituacao.map((g) => ({ value: g.situacao, label: ROTULO_SECAO[g.situacao] })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Filtrar por situação">
      {opcoes.map((o) => {
        const ativo = o.value === situacaoAtual;
        const href =
          o.value === "todas" ? "/marmitas/estoque" : `/marmitas/estoque?situacao=${o.value}`;
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

export default async function EstoquePage({
  searchParams,
}: {
  searchParams: { preparo_corrigido?: string; preparo_excluido?: string; situacao?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: preparos, error }, { data: receitas }] = await Promise.all([
    listarPreparosCongelados(supabase, user.id),
    listarReceitasParaPreparo(supabase, user.id),
  ]);

  const hoje = hojeISO();

  const itens = ordenarEstoque(
    (preparos ?? []).map((p) => {
      const receita = (Array.isArray(p.receitas) ? p.receitas[0] : p.receitas) as ReceitaRef;
      return {
        id: p.id as string,
        receitaId: p.receita_id as string,
        dataPreparo: p.data_preparo as string,
        receitaNome: receita?.nome ?? "Receita removida",
        quantidade: p.quantidade_porcoes as number,
        observacoes: p.observacoes as string | null,
        validade: calcularValidade(
          p.data_preparo as string,
          receita?.validade_congelado_dias ?? null
        ),
      };
    })
  );

  const gruposPorSituacao = agruparPorSituacao(itens);
  const situacoesValidas = gruposPorSituacao.map((g) => g.situacao) as string[];
  const situacaoAtual: SituacaoValidade | "todas" =
    searchParams?.situacao && situacoesValidas.includes(searchParams.situacao)
      ? (searchParams.situacao as SituacaoValidade)
      : "todas";
  const gruposExibidos =
    situacaoAtual === "todas"
      ? gruposPorSituacao
      : gruposPorSituacao.filter((g) => g.situacao === situacaoAtual);

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-oliva mt-1">Estoque do congelador</h1>
        <Link href="/marmitas/descartes" className="inline-block text-sm text-oliva underline mt-1">
          Ver descartados
        </Link>
      </header>

      {searchParams?.preparo_corrigido === "1" ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Preparo corrigido!
        </p>
      ) : null}

      {searchParams?.preparo_excluido === "1" ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Preparo excluído do registro.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700">Não foi possível carregar o estoque agora. Tente novamente.</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-stone-600">Nada congelado no momento.</p>
      ) : (
        <div className="space-y-5">
          {gruposPorSituacao.length > 1 ? (
            <SlicerSituacao gruposPorSituacao={gruposPorSituacao} situacaoAtual={situacaoAtual} />
          ) : null}
          {gruposExibidos.map((grupo) => (
            <section key={grupo.situacao} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-oliva/85 px-1">
                {ROTULO_SECAO[grupo.situacao]} · {grupo.itens.length}
              </h2>
              <ul className="space-y-3">
                {grupo.itens.map((item) => {
                  const apresentacao = apresentarValidade(item.validade);
                  return (
                    <li
                      key={item.id}
                      className={`rounded-2xl border p-4 space-y-2 ${TOM_ESTILO[apresentacao.tom]}`}
                    >
                      <div>
                        <p className="font-semibold">{item.receitaNome}</p>
                        <p className="text-xs opacity-80">
                          Preparado em {formatarDataBR(item.dataPreparo)} · {item.quantidade} porção(ões)
                        </p>
                      </div>
                      {apresentacao.detalhe ? <p className="text-xs">{apresentacao.detalhe}</p> : null}
                      <BotaoAcao
                        acao={marcarConsumido}
                        campos={{ id: item.id }}
                        rotulo="Marcar como consumido"
                        rotuloEnviando="Registrando consumo…"
                        confirmacao={textoConfirmacaoConsumo(item.validade.situacao)}
                        variante="outline"
                        tamanho="sm"
                      />
                      {item.validade.situacao === "vencido" ? (
                        <AcaoDescarte acao={descartarPreparo} id={item.id} />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {itens.length > 0 && receitas && receitas.length > 0 ? (
        <details className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
          <summary className="font-semibold text-oliva cursor-pointer">
            Editar ou excluir um preparo
          </summary>
          <CorrigirPreparo preparos={itens} receitas={receitas} hoje={hoje} />
        </details>
      ) : null}

      <LinkInicio aba="marmitas" />
    </main>
  );
}
