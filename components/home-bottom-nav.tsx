"use client";

import { type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type NavCor = "oliva" | "rosa" | "rosaSoft" | "neutro";

const NAV_ESTILO: Record<NavCor, { ativa: string; inativa: string }> = {
  oliva: {
    ativa: "bg-oliva text-bege border border-oliva",
    inativa: "bg-oliva/10 text-oliva border border-oliva/20",
  },
  rosa: {
    ativa: "bg-rosa text-oliva-dark border border-rosa font-semibold",
    inativa: "bg-rosa-soft/60 text-oliva-dark/85 border border-rosa/30",
  },
  rosaSoft: {
    ativa: "bg-rosa-soft text-oliva-dark border border-rosa-soft font-semibold",
    inativa: "bg-rosa-soft/30 text-oliva-dark/85 border border-rosa-soft/20",
  },
  neutro: {
    ativa: "bg-stone-300 text-stone-800 border border-stone-400 font-semibold",
    inativa: "bg-stone-100 text-stone-600 border border-stone-200",
  },
};

export function HomeBottomNav({
  groups,
}: {
  groups: { key: string; label: string; cor: NavCor; icon: ReactNode; content: ReactNode }[];
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
      <div className="space-y-3 pb-24">{groups[indiceAtivo]?.content}</div>

      <nav
        aria-label="Seções da Home"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-oliva/10 bg-bege/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-lg justify-between px-1 py-2">
          {groups.map((g, i) => {
            const ativa = i === indiceAtivo;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => selecionarAba(g.key)}
                aria-current={ativa ? "page" : undefined}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    ativa ? NAV_ESTILO[g.cor].ativa : NAV_ESTILO[g.cor].inativa
                  }`}
                >
                  {g.icon}
                </span>
                <span
                  className={`w-full truncate text-center text-[11px] leading-tight ${
                    ativa ? "font-semibold text-oliva-dark" : "text-stone-500"
                  }`}
                >
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
