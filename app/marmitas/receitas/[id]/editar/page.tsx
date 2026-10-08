import Link from "next/link";
import { Home } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarReceita, excluirReceita } from "../../../actions";
import { FormularioAcao } from "@/components/formulario-acao";
import { BotaoAcao } from "@/components/botao-acao";
import { CamposReceita } from "@/components/marmitas/campos-receita";
import { buscarReceitaPorId } from "@/lib/marmitas/consultas";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";

export default async function EditarReceitaPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: receita, error } = await buscarReceitaPorId(supabase, user.id, params.id);

  if (houveFalhaDeConsulta({ error })) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
        <header>
          <Link href="/marmitas/receitas" className="inline-flex items-center gap-1 text-sm text-oliva/85">
            <Home className="h-4 w-4" />
            Biblioteca de receitas
          </Link>
          <h1 className="text-2xl font-bold text-oliva mt-1">Editar receita</h1>
        </header>
        <AvisoErroLeitura novaTentativaHref={`/marmitas/receitas/${params.id}/editar`} />
      </main>
    );
  }

  if (!receita) {
    notFound();
  }

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/marmitas/receitas" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Biblioteca de receitas
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Editar receita</h1>
      </header>

      <FormularioAcao
        acao={atualizarReceita}
        rotuloEnviar="Salvar alterações"
        rotuloEnviando="Salvando receita…"
        classeBotao="w-full"
        className="space-y-5 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <input type="hidden" name="id" value={receita.id} />
        <CamposReceita defaults={receita} />
      </FormularioAcao>

      <BotaoAcao
        acao={excluirReceita}
        campos={{ id: receita.id }}
        rotulo="Excluir receita"
        rotuloEnviando="Excluindo receita…"
        confirmacao={`Excluir a receita "${receita.nome}"? Essa ação não pode ser desfeita.`}
        destinoSucesso="/marmitas/receitas?receita_excluida=1"
        variante="outline"
        className="w-full text-red-700 border-red-200 hover:bg-red-50"
      />
    </main>
  );
}
