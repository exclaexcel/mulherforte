import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  apresentarValidade,
  calcularValidade,
  formatarDataBR,
  ordenarEstoque,
  type TomValidade,
} from "@/lib/marmitas/estoque";
import { listarPreparosCongelados } from "@/lib/marmitas/consultas";
import { marcarConsumido } from "../actions";
import { BotaoAcao } from "@/components/botao-acao";
import { textoConfirmacaoConsumo } from "@/lib/marmitas/consumo";

const TOM_ESTILO: Record<TomValidade, string> = {
  urgente: "bg-red-50 border-red-200 text-red-800",
  atencao: "bg-yellow-50 border-yellow-200 text-yellow-800",
  ok: "bg-green-50 border-green-200 text-green-800",
  neutro: "bg-stone-50 border-stone-200 text-stone-700",
};

type ReceitaRef = { nome: string; validade_congelado_dias: number | null } | null;

export default async function EstoquePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: preparos, error } = await listarPreparosCongelados(supabase, user.id);

  const itens = ordenarEstoque(
    (preparos ?? []).map((p) => {
      const receita = (Array.isArray(p.receitas) ? p.receitas[0] : p.receitas) as ReceitaRef;
      return {
        id: p.id as string,
        dataPreparo: p.data_preparo as string,
        receitaNome: receita?.nome ?? "Receita removida",
        quantidade: p.quantidade_porcoes as number,
        validade: calcularValidade(
          p.data_preparo as string,
          receita?.validade_congelado_dias ?? null
        ),
      };
    })
  );

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/?aba=dia-a-dia" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Estoque do congelador</h1>
      </header>

      {error ? (
        <p className="text-sm text-red-700">Não foi possível carregar o estoque agora. Tente novamente.</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-stone-600">Nada congelado no momento.</p>
      ) : (
        <ul className="space-y-3">
          {itens.map((item) => {
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
                <p className="text-sm font-medium">{apresentacao.titulo}</p>
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
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
