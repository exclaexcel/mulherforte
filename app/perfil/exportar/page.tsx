import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BotaoExportacao } from "@/components/exportacao/botao-exportacao";
import { FORMATOS } from "@/lib/exportacao/validarResposta";

export default async function ExportarPage() {
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
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Exportar meus dados</h1>
        <p className="text-sm text-stone-600 mt-2">
          Baixe uma cópia dos seus registros de perfil, evolução corporal, hábitos, treinos, metas
          e planejamento de marmitas.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <div>
          <p className="font-semibold text-oliva">Planilhas para o Excel</p>
          <p className="text-sm text-stone-600 mt-1">
            Um arquivo compactado com uma planilha para cada tipo de registro.
          </p>
        </div>
        <BotaoExportacao
          endpoint="/api/exportacao/planilhas"
          rotulo="Exportar para Excel"
          formato={FORMATOS.planilhas}
        />
      </section>

      <section className="space-y-3 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
        <div>
          <p className="font-semibold text-oliva">Backup completo</p>
          <p className="text-sm text-stone-600 mt-1">
            Uma cópia estruturada dos seus dados para guardar com segurança. A importação ainda não
            está disponível.
          </p>
        </div>
        <BotaoExportacao
          endpoint="/api/exportacao/json"
          rotulo="Baixar backup JSON"
          formato={FORMATOS.json}
        />
      </section>

      <section className="space-y-2 rounded-2xl bg-stone-50 border border-stone-200 p-4">
        <p className="text-xs text-stone-600">
          Os arquivos contêm informações pessoais sobre seu corpo e sua rotina. Guarde-os em um
          local seguro.
        </p>
        <p className="text-xs text-stone-600">
          O app gera o arquivo na hora e não o envia para terceiros.
        </p>
        <p className="text-xs text-stone-600">
          A exportação apresenta seus registros. Não é um diagnóstico nem um relatório médico.
        </p>
      </section>

      <Link href="/perfil" className="block text-center text-sm text-oliva underline">
        Voltar para o perfil
      </Link>
    </main>
  );
}
