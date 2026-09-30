"use client";

export default function FisicoError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <div className="rounded-2xl bg-red-50 border border-red-100 p-5 space-y-3">
        <p className="text-sm text-red-700">{error.message || "Algo deu errado."}</p>
        <button onClick={() => reset()} className="text-sm underline text-oliva">
          Tentar de novo
        </button>
      </div>
    </main>
  );
}
