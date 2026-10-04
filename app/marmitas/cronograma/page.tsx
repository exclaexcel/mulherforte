import Link from "next/link";
import { Home } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { salvarDiaCronograma } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularSemanaAtual } from "@/lib/marmitas/cronograma";
import { listarCronograma } from "@/lib/marmitas/consultas";

type DiaCronograma = {
  id: string;
  semana_ciclo: number;
  dia_semana: string;
  proteina: string | null;
  base: string | null;
  legumes: string | null;
  receita_extra_texto: string | null;
};

const ORDEM_DIAS_SEMANA = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

function ordenarPorDiaSemana(dias: DiaCronograma[]): DiaCronograma[] {
  return [...dias].sort((a, b) => {
    const ia = ORDEM_DIAS_SEMANA.indexOf(a.dia_semana);
    const ib = ORDEM_DIAS_SEMANA.indexOf(b.dia_semana);
    if (ia === -1 && ib === -1) return a.dia_semana.localeCompare(b.dia_semana);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function FormularioDia({
  semana,
  dia,
}: {
  semana: number;
  dia?: DiaCronograma;
}) {
  return (
    <form action={salvarDiaCronograma} className="space-y-3 mt-3">
      <input type="hidden" name="semana_ciclo" value={semana} />
      <div className="space-y-1.5">
        <Label htmlFor={`dia_semana-${semana}-${dia?.id ?? "novo"}`}>Dia</Label>
        <Input
          id={`dia_semana-${semana}-${dia?.id ?? "novo"}`}
          name="dia_semana"
          defaultValue={dia?.dia_semana ?? ""}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`proteina-${semana}-${dia?.id ?? "novo"}`}>Proteína</Label>
        <Input
          id={`proteina-${semana}-${dia?.id ?? "novo"}`}
          name="proteina"
          defaultValue={dia?.proteina ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`base-${semana}-${dia?.id ?? "novo"}`}>Base</Label>
        <Input id={`base-${semana}-${dia?.id ?? "novo"}`} name="base" defaultValue={dia?.base ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`legumes-${semana}-${dia?.id ?? "novo"}`}>Legumes</Label>
        <Input
          id={`legumes-${semana}-${dia?.id ?? "novo"}`}
          name="legumes"
          defaultValue={dia?.legumes ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`receita_extra_texto-${semana}-${dia?.id ?? "novo"}`}>
          Receita extra da semana (opcional)
        </Label>
        <Input
          id={`receita_extra_texto-${semana}-${dia?.id ?? "novo"}`}
          name="receita_extra_texto"
          defaultValue={dia?.receita_extra_texto ?? ""}
        />
      </div>
      <Button type="submit" variant="outline" size="sm" className="w-full">
        Salvar
      </Button>
    </form>
  );
}

export default async function CronogramaPage({
  searchParams,
}: {
  searchParams: { dia_salvo?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: dias, error } = await listarCronograma(supabase, user.id);

  const { data: perfil } = await supabase
    .from("perfil_usuario")
    .select("cronograma_inicio_ciclo")
    .eq("user_id", user.id)
    .maybeSingle();

  const semanaAtual = perfil?.cronograma_inicio_ciclo
    ? calcularSemanaAtual(perfil.cronograma_inicio_ciclo)
    : null;

  const semanas = [1, 2, 3, 4].map((semana) => ({
    semana,
    dias: ordenarPorDiaSemana((dias ?? []).filter((d) => d.semana_ciclo === semana)),
  }));

  const diaSalvo = searchParams?.dia_salvo === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-6">
      <header>
        <Link href="/?aba=planejamento" className="inline-flex items-center gap-1 text-sm text-oliva/70">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Cronograma planejado</h1>
        <p className="text-sm text-stone-500 mt-1">
          Rotação de 4 semanas — editável. Toque num dia pra ajustar.
        </p>
      </header>

      {diaSalvo ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Dia salvo!
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700">Erro ao carregar cronograma: {error.message}</p>
      ) : (
        <div className="space-y-5">
          {semanas.map((s) => (
            <section
              key={s.semana}
              id={`semana-${s.semana}`}
              className={`rounded-2xl bg-white/80 border p-4 shadow-sm scroll-mt-6 ${
                s.semana === semanaAtual ? "border-oliva ring-2 ring-oliva/30" : "border-oliva/10"
              }`}
            >
              <h2 className="font-semibold text-oliva mb-3 flex items-center gap-2">
                Semana {s.semana}
                {s.semana === semanaAtual ? (
                  <span className="text-xs font-semibold bg-oliva text-bege rounded-full px-2 py-0.5">
                    Semana atual
                  </span>
                ) : null}
              </h2>
              {s.dias.length === 0 ? (
                <p className="text-xs text-stone-500 mb-3">Nada planejado ainda.</p>
              ) : (
                <ul className="space-y-1">
                  {s.dias.map((d) => (
                    <li key={d.id} className="border-t border-oliva/10 pt-2 first:border-0 first:pt-0">
                      <details>
                        <summary className="cursor-pointer">
                          <span className="text-sm font-medium text-stone-800">{d.dia_semana}</span>
                          <span className="text-sm text-stone-600">
                            {" "}
                            — {d.proteina} · {d.base} · {d.legumes}
                          </span>
                          {d.receita_extra_texto ? (
                            <span className="block text-xs text-oliva mt-1">
                              + Receita da semana: {d.receita_extra_texto}
                            </span>
                          ) : null}
                        </summary>
                        <FormularioDia semana={s.semana} dia={d} />
                      </details>
                    </li>
                  ))}
                </ul>
              )}

              <details className="mt-3 border-t border-oliva/10 pt-3">
                <summary className="cursor-pointer text-sm text-oliva font-medium">
                  + Adicionar dia
                </summary>
                <FormularioDia semana={s.semana} />
              </details>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
