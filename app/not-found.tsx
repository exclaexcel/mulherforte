import Link from "next/link";

export default function PaginaNaoEncontrada() {
  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-oliva">Página não encontrada</h1>
      <p className="text-sm text-stone-700">
        O endereço pode estar errado ou a página mudou de lugar.
      </p>
      <Link
        href="/"
        className="inline-flex h-11 items-center justify-center rounded-xl border border-oliva/70 bg-white px-4 text-sm font-medium text-oliva focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
