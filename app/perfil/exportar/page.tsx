import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BotaoExportacao } from "@/components/exportacao/botao-exportacao";
import { FORMATOS } from "@/lib/exportacao/validarResposta";

const contagem = (resp: { count: number | null }) => resp.count ?? null;

const formatarGeradoEm = () =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

export default async function ExportarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Só contagem (head: true, sem trazer linhas) — leve, pra mostrar o que vai ser
  // exportado antes do download. Falha numa contagem não bloqueia a tela: a linha
  // correspondente simplesmente não aparece no resumo.
  const [pesos, medidas, habitos, treinos, metas, receitas, preparos, itensCompra] = await Promise.all([
    supabase.from("registros_peso").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("medidas_corporais").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("adesao_habitos").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("adesao_treino").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("metas").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("receitas").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("preparos").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("itens_compra").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const itensResumo = [
    { label: "Pesagens", valor: contagem(pesos) },
    { label: "Medidas", valor: contagem(medidas) },
    { label: "Dias de hábitos", valor: contagem(habitos) },
    { label: "Treinos", valor: contagem(treinos) },
    { label: "Metas", valor: contagem(metas) },
    { label: "Receitas", valor: contagem(receitas) },
    { label: "Preparos registrados", valor: contagem(preparos) },
    { label: "Itens na lista de compras", valor: contagem(itensCompra) },
  ].filter((i) => i.valor !== null);

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

      {itensResumo.length > 0 ? (
        <section className="space-y-2 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm">
          <p className="font-semibold text-oliva">O que vai ser exportado</p>
          <ul className="text-sm text-stone-700 space-y-1">
            {itensResumo.map((i) => (
              <li key={i.label}>
                {i.valor} {i.label.toLowerCase()}
              </li>
            ))}
          </ul>
          <p className="text-xs text-stone-500">Gerado em {formatarGeradoEm()}.</p>
        </section>
      ) : null}

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
