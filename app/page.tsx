import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { NavCard } from "@/components/marmitas/nav-card";
import { HomeTabs } from "@/components/home-tabs";
import { redirect } from "next/navigation";
import {
  ChefHat,
  Refrigerator,
  ShoppingCart,
  Pencil,
  BookOpen,
  CalendarDays,
  Info,
  Scale,
  Ruler,
  Dumbbell,
  Droplet,
  Target,
  Activity,
  Trophy,
} from "lucide-react";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { perfil_salvo?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfil_usuario")
    .select("nome")
    .eq("user_id", user.id)
    .maybeSingle();

  const saudacao = perfil?.nome ? perfil.nome : user.email;
  const perfilSalvo = searchParams?.perfil_salvo === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-oliva/70">Olá, {saudacao}</p>
          <h1 className="text-2xl font-bold text-oliva">App Jornada</h1>
          <p className="text-sm text-stone-500 mt-1">Etapa 4 — jornada física: núcleo</p>
          <Link href="/perfil" className="inline-flex items-center gap-1 text-xs text-oliva/70 mt-2">
            <Pencil className="h-3 w-3" />
            Editar perfil
          </Link>
        </div>
        <LogoutButton />
      </header>

      {perfilSalvo ? (
        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3 mb-6">
          Perfil atualizado!
        </p>
      ) : null}

      <HomeTabs
        groups={[
          {
            key: "dia-a-dia",
            label: "Dia a dia",
            cor: "oliva",
            content: (
              <>
                <NavCard
                  href="/marmitas/preparo"
                  icon={ChefHat}
                  titulo="Registrar preparo"
                  descricao="Anotar o que foi cozinhado e congelado"
                />
                <NavCard
                  href="/marmitas/estoque"
                  icon={Refrigerator}
                  titulo="Estoque do congelador"
                  descricao="Ver o que tem e o alerta de validade"
                />
                <NavCard
                  href="/marmitas/compras"
                  icon={ShoppingCart}
                  titulo="Lista de compras"
                  descricao="Marcar o que já tem em casa"
                />
              </>
            ),
          },
          {
            key: "fisico",
            label: "Jornada física",
            cor: "rosa",
            content: (
              <>
                <NavCard
                  href="/fisico/peso"
                  icon={Scale}
                  titulo="Registrar peso"
                  descricao="Pesagem do dia, com bioimpedância opcional"
                />
                <NavCard
                  href="/fisico/medidas"
                  icon={Ruler}
                  titulo="Registrar medidas"
                  descricao="Cintura, quadril, coxa e abdômen inferior"
                />
                <NavCard
                  href="/fisico/treino"
                  icon={Dumbbell}
                  titulo="Registrar treino"
                  descricao="Move's, Zumba ou outra atividade do dia"
                />
                <NavCard
                  href="/fisico/habitos"
                  icon={Droplet}
                  titulo="Hábitos do dia"
                  descricao="Hidratação e proteína"
                />
                <NavCard
                  href="/fisico/metas"
                  icon={Target}
                  titulo="Metas"
                  descricao="Peso, cintura, abdômen e hidratação"
                />
                <NavCard
                  href="/fisico/indicadores"
                  icon={Activity}
                  titulo="Indicadores corporais"
                  descricao="Cintura, RCEst, RCQ e RFM — estimativas, não diagnóstico"
                />
                <NavCard
                  href="/fisico/score"
                  icon={Trophy}
                  titulo="Score da semana"
                  descricao="Proteína, hidratação e treino obrigatório, acumulado"
                />
              </>
            ),
          },
          {
            key: "planejamento",
            label: "Planejamento",
            cor: "neutro",
            content: (
              <>
                <NavCard
                  href="/marmitas/receitas"
                  icon={BookOpen}
                  titulo="Biblioteca de receitas"
                  descricao="As 16 receitas do guia, sem precisar abrir o PDF"
                />
                <NavCard
                  href="/marmitas/cronograma"
                  icon={CalendarDays}
                  titulo="Cronograma planejado"
                  descricao="O que preparar em cada semana do ciclo"
                />
                <NavCard
                  href="/marmitas/plano"
                  icon={Info}
                  titulo="Sobre o plano"
                  descricao="Horários, regras USDA e boas práticas"
                />
              </>
            ),
          },
        ]}
      />
    </main>
  );
}
