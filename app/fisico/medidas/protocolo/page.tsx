import Image from "next/image";
import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PROTOCOLO_FREQUENCIA,
  PROTOCOLO_MOMENTO,
  PROTOCOLO_POSTURA,
  PROTOCOLO_PONTOS,
  PROTOCOLO_DICAS,
  PROTOCOLO_LEMBRETE,
} from "@/lib/fisico/protocoloConteudo";

export default async function ProtocoloMedidasPage() {
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
        <Link href="/fisico/medidas" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Medidas
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Como tirar suas medidas</h1>
        <p className="text-sm text-stone-600 mt-1">
          Referência fixa — siga sempre o mesmo padrão para comparar sua evolução.
        </p>
      </header>

      <figure className="rounded-2xl overflow-hidden border border-oliva/10 shadow-sm">
        <Image
          src="/protocolo-medidas.png"
          alt="Guia ilustrado: fita métrica posicionada na cintura, no quadril e no meio da coxa direita."
          width={1222}
          height={1287}
          className="w-full h-auto"
          sizes="(max-width: 480px) 100vw, 480px"
          priority
        />
      </figure>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-oliva">Quando e como medir</h2>
        <ul className="space-y-2 text-sm text-stone-700">
          <li>
            <span className="font-medium text-oliva">Frequência:</span> {PROTOCOLO_FREQUENCIA}
          </li>
          <li>
            <span className="font-medium text-oliva">Momento:</span> {PROTOCOLO_MOMENTO}
          </li>
          <li>
            <span className="font-medium text-oliva">Postura:</span> {PROTOCOLO_POSTURA}
          </li>
        </ul>
      </section>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-oliva">Onde medir cada região</h2>
        <ul className="space-y-2 text-sm text-stone-700">
          {PROTOCOLO_PONTOS.map((p) => (
            <li key={p.regiao}>
              <span className="font-medium text-oliva">{p.regiao}:</span> {p.onde}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm space-y-3">
        <h2 className="font-semibold text-oliva">Dicas importantes</h2>
        <ul className="space-y-1.5 text-sm text-stone-700 list-disc list-inside">
          {PROTOCOLO_DICAS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-oliva/10 border border-oliva/20 p-5">
        <p className="text-sm text-oliva font-medium">{PROTOCOLO_LEMBRETE}</p>
      </section>
    </main>
  );
}
