import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { criarReceitaCompleta } from "../../actions";
import { FormularioAcao } from "@/components/formulario-acao";
import { CamposReceita } from "@/components/marmitas/campos-receita";

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
        <Link href="/marmitas/receitas" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Biblioteca de receitas
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Nova receita</h1>
        <p className="text-sm text-stone-600 mt-1">
          Preencha o que souber. Só o nome é obrigatório.
        </p>
      </header>

      <FormularioAcao
        acao={criarReceitaCompleta}
        rotuloEnviar="Salvar receita"
        rotuloEnviando="Salvando receita…"
        classeBotao="w-full"
        className="space-y-5 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <CamposReceita />
      </FormularioAcao>
    </main>
  );
}
