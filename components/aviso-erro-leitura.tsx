import Link from "next/link";
import { MENSAGEM_ERRO_LEITURA } from "@/lib/leitura";

/**
 * Estado de falha de consulta. Substitui o conteúdo que dependia dos dados, sem
 * mostrar vazio, zero ou pedido de cadastro. O link de nova tentativa recarrega a
 * própria página, que refaz as consultas.
 */
export function AvisoErroLeitura({ novaTentativaHref }: { novaTentativaHref: string }) {
  return (
    <section
      role="alert"
      className="rounded-2xl bg-red-50 border border-red-200 p-5 space-y-3"
    >
      <p className="text-sm font-medium text-red-800">{MENSAGEM_ERRO_LEITURA}</p>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href={novaTentativaHref} className="underline text-oliva">
          Tentar novamente
        </Link>
        <Link href="/" className="underline text-oliva">
          Voltar para o início
        </Link>
      </div>
    </section>
  );
}
