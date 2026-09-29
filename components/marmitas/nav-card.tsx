import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function NavCard({
  href,
  icon: Icon,
  titulo,
  descricao,
}: {
  href: string;
  icon: LucideIcon;
  titulo: string;
  descricao: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl bg-white/80 border border-oliva/10 p-4 shadow-sm hover:bg-bege transition-colors"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oliva/10 border border-oliva/20">
        <Icon className="h-5 w-5 text-oliva" />
      </span>
      <span>
        <p className="font-semibold text-oliva">{titulo}</p>
        <p className="text-sm text-stone-600">{descricao}</p>
      </span>
    </Link>
  );
}
