"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Falha inesperada da aplicação. Não mostra o erro técnico (mensagem, pilha ou
 * digest): o texto é neutro. Erros previsíveis já são tratados dentro de cada
 * formulário e não passam por aqui.
 */
export default function ErroGlobal({ reset }: { reset: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Leva o foco ao título da tela de erro, para quem usa teclado ou leitor de tela.
    titulo.current?.focus();
  }, []);

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <h1 ref={titulo} tabIndex={-1} className="text-2xl font-bold text-oliva focus:outline-none">
        Não foi possível abrir esta tela
      </h1>
      <p className="text-sm text-stone-700">
        Algo não saiu como esperado. Tente novamente. Se continuar, volte para o início.
      </p>
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
