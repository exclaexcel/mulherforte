import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MAPA_HORARIOS,
  REGRAS_SEGURANCA_USDA,
  FONTE_USDA,
  VALIDADE_NAO_INFORMADA_TEXTO,
  PRAZOS_ALERTA,
  PONTOS_ATENCAO,
  CHECKLIST_ANTES_DE_COZINHAR,
  BOAS_PRATICAS,
  REGRA_GERAL_DANY,
} from "@/lib/marmitas/planoConteudo";

const COR_BADGE: Record<string, string> = {
  verde: "bg-green-50 border-green-200 text-green-800",
  amarelo: "bg-yellow-50 border-yellow-200 text-yellow-800",
  vermelho: "bg-red-50 border-red-200 text-red-800",
};

export default async function PlanoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/?aba=planejamento" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Sobre o plano</h1>
        <p className="text-sm text-stone-500 mt-1">Referência fixa — não muda no dia a dia</p>
      </header>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-oliva">Mapa rápido do plano</h2>
        <ul className="space-y-2">
          {MAPA_HORARIOS.map((h) => (
            <li key={h.horario} className="flex gap-3 text-sm">
              <span className="font-semibold text-oliva shrink-0 w-14">{h.horario}</span>
              <span className="text-stone-700">{h.estrutura}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-oliva">Regras de segurança alimentar (USDA/FSIS)</h2>
        <ul className="space-y-1.5 text-sm text-stone-700 list-disc list-inside">
          {REGRAS_SEGURANCA_USDA.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="text-xs text-stone-500">{FONTE_USDA}</p>
      </section>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-oliva">Como o estoque mostra a validade</h2>
        <ul className="space-y-2">
          {PRAZOS_ALERTA.map((p) => (
            <li key={p.cor} className={`text-sm rounded-xl border px-3 py-2 ${COR_BADGE[p.cor]}`}>
              {p.texto}
            </li>
          ))}
        </ul>
        <p className="text-xs text-stone-500">{VALIDADE_NAO_INFORMADA_TEXTO}</p>
      </section>

      <section className="rounded-2xl bg-rosa-soft/50 border border-rosa/40 p-5 space-y-3">
        <h2 className="font-semibold text-oliva">Pontos de atenção do seu plano</h2>
        <ul className="space-y-1.5 text-sm text-stone-700 list-disc list-inside">
          {PONTOS_ATENCAO.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-oliva">Checklist antes de cozinhar</h2>
        <ul className="space-y-1.5 text-sm text-stone-700 list-disc list-inside">
          {CHECKLIST_ANTES_DE_COZINHAR.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-oliva">Boas práticas — vida real</h2>
        <ol className="space-y-1.5 text-sm text-stone-700 list-decimal list-inside">
          {BOAS_PRATICAS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl bg-oliva/10 border border-oliva/20 p-5">
        <p className="text-sm text-oliva font-medium">{REGRA_GERAL_DANY}</p>
      </section>
    </main>
  );
}
