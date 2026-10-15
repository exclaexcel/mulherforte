import Link from "next/link";
import { Home } from "lucide-react";

export function LinkInicio({ aba }: { aba?: "hoje" | "evolucao" | "marmitas" | "conta" }) {
  const href = aba ? `/?aba=${aba}` : "/";
  return (
    <div className="flex justify-center mt-8 pt-4 border-t border-oliva/10">
      <Link href={href} className="inline-flex items-center gap-1.5 text-sm text-oliva/85">
        <Home className="h-5 w-5" />
        Início
      </Link>
    </div>
  );
}
