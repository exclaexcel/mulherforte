"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Tela de falha inesperada de uma área do app (Jornada, Marmitas, Perfil). Mostra só
 * texto neutro: nunca a mensagem técnica, a pilha ou o digest. Erros previsíveis
 * ficam dentro dos formulários e não chegam aqui.
 */
export function TelaErro({ reset }: { reset: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Leva o foco ao título, para quem usa teclado ou leitor de tela.
    titulo.current?.focus();
  }, []);

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <h1 ref={titulo} tabIndex={-1} className="text-xl font-bold text-oliva focus:outline-none">
        Não foi possível concluir esta ação. Tente novamente.
      </h1>
      <p className="text-sm text-stone-700">Se continuar, volte para o início.</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-oliva px-4 text-sm font-medium text-bege hover:bg-oliva-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-oliva/70 bg-white px-4 text-sm font-medium text-oliva focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
        >
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
