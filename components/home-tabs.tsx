"use client";

import { type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type TabCor = "oliva" | "rosa" | "neutro";

const TAB_ESTILO: Record<TabCor, { ativa: string; inativa: string }> = {
  oliva: {
    ativa: "bg-oliva text-bege border border-oliva",
    inativa: "bg-oliva/10 text-oliva border border-oliva/20",
  },
  rosa: {
    ativa: "bg-rosa text-oliva-dark border border-rosa font-semibold",
    inativa: "bg-rosa-soft/60 text-oliva-dark/70 border border-rosa/30",
  },
  neutro: {
    ativa: "bg-stone-300 text-stone-800 border border-stone-400 font-semibold",
    inativa: "bg-stone-100 text-stone-500 border border-stone-200",
  },
};

export function HomeTabs({
  groups,
}: {
  groups: { key: string; label: string; cor: TabCor; content: ReactNode }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const abaAtual = searchParams.get("aba");
  const indiceAtivo = Math.max(
    0,
    groups.findIndex((g) => g.key === abaAtual)
  );

  function selecionarAba(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("aba", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-6 mb-4 bg-bege/95 px-6 pb-2 pt-1 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto">
          {groups.map((g, i) => (
            <button
              key={g.key}
              type="button"
              onClick={() => selecionarAba(g.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                i === indiceAtivo ? TAB_ESTILO[g.cor].ativa : TAB_ESTILO[g.cor].inativa
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">{groups[indiceAtivo]?.content}</div>
    </div>
  );
}
