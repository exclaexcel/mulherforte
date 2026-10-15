import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { NavCard } from "@/components/marmitas/nav-card";
import { HomeBottomNav } from "@/components/home-bottom-nav";
import { houveFalhaDeConsulta, MENSAGEM_ERRO_LEITURA } from "@/lib/leitura";
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
  TrendingUp,
  Download,
  LogOut,
  CalendarCheck,
  CircleUser,
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

  const { data: perfil, error: erroPerfil } = await supabase
    .from("perfil_usuario")
    .select("nome")
    .eq("user_id", user.id)
    .maybeSingle();

  // A Home é o menu: a falha só troca a saudação. Os cartões seguem disponíveis.
  const falhouPerfil = houveFalhaDeConsulta({ error: erroPerfil });
  const saudacao = perfil?.nome ? perfil.nome : user.email;
  const perfilSalvo = searchParams?.perfil_salvo === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div>
          {falhouPerfil ? (
            <p className="text-sm text-stone-600">{MENSAGEM_ERRO_LEITURA}</p>
          ) : (
            <p className="text-sm text-oliva/85">Olá, {saudacao}</p>
          )}
          <h1 className="text-2xl font-bold text-oliva">Projeto Mulher Forte</h1>
        </div>
        <LogoutButton />
      </header>

      {perfilSalvo ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3 mb-6">
          Perfil atualizado!
        </p>
      ) : null}

      <HomeBottomNav
        groups={[
          {
            key: "hoje",
            label: "Hoje",
            cor: "rosa",
            icon: <CalendarCheck className="h-5 w-5" />,
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
              </>
            ),
          },
          {
            key: "evolucao",
            label: "Evolução",
            cor: "rosaSoft",
            icon: <TrendingUp className="h-5 w-5" />,
            content: (
              <>
                <NavCard
                  href="/fisico/peso/tendencia"
                  icon={TrendingUp}
                  titulo="Tendência do peso"
                  descricao="Pontos registrados e médias de 7/28 dias"
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
            key: "marmitas",
            label: "Marmitas",
            cor: "oliva",
            icon: <ChefHat className="h-5 w-5" />,
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
                <NavCard
                  href="/marmitas/receitas"
                  icon={BookOpen}
                  titulo="Biblioteca de receitas"
                  descricao="Acesse sua biblioteca de receitas para planejar as marmitas."
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
          {
            key: "conta",
            label: "Conta",
            cor: "neutro",
            icon: <CircleUser className="h-5 w-5" />,
            content: (
              <>
                <NavCard
                  href="/perfil"
                  icon={Pencil}
                  titulo="Editar perfil"
                  descricao="Nome e dados pessoais"
                />
                <NavCard
                  href="/perfil/exportar"
                  icon={Download}
                  titulo="Exportar meus dados"
                  descricao="Planilhas para o Excel e backup completo em JSON"
                />
                <div className="flex items-center gap-3 rounded-2xl bg-white/80 border border-oliva/10 p-4 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-oliva/10 border border-oliva/20">
                    <LogOut className="h-5 w-5 text-oliva" />
                  </span>
                  <span className="flex-1">
                    <p className="font-semibold text-oliva">Sair</p>
                    <p className="text-sm text-stone-600">Encerrar sua sessão neste dispositivo</p>
                  </span>
                  <LogoutButton />
                </div>
              </>
            ),
          },
        ]}
      />
    </main>
  );
}
