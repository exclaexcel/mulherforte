import Link from "next/link";
import { Home, History } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarTreino, excluirTreinoHoje, excluirTreinoData } from "../actions";
import { FormularioAcao } from "@/components/formulario-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotaoAcao } from "@/components/botao-acao";
import { ehDataFutura, formatarDataExtensa, hojeISO } from "@/lib/date";
import { TIPOS_TREINO } from "@/lib/fisico/types";
import { TipoTreinoField } from "@/components/fisico/tipo-treino-field";
import { DataTreinoField } from "@/components/fisico/data-treino-field";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";

export default async function TreinoPage({
  searchParams,
}: {
  searchParams: { treino_salvo?: string; registro_excluido?: string; data?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoje = hojeISO();

  // ?data= vem do histórico, pra corrigir um dia específico. Qualquer valor
  // inválido ou futuro cai de volta em hoje — nunca abre um dia que não existe ainda.
  const dataParam = searchParams?.data ?? "";
  const dataSelecionada =
    /^\d{4}-\d{2}-\d{2}$/.test(dataParam) && !ehDataFutura(dataParam, hoje) ? dataParam : hoje;
  const editandoOutroDia = dataSelecionada !== hoje;

  const { data: treinoDoDia, error: erroTreinoDoDia } = await supabase
    .from("adesao_treino")
    .select("tipo, realizado, tipo_outro_descricao, duracao_minutos, calorias")
    .eq("user_id", user.id)
    .eq("data", dataSelecionada)
    .maybeSingle();

  // Sem leitura do dia, o formulário ficaria vazio e pareceria um novo cadastro.
  if (houveFalhaDeConsulta({ error: erroTreinoDoDia })) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
        <header>
          <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
            <Home className="h-4 w-4" />
            Início
          </Link>
          <h1 className="text-2xl font-bold text-oliva mt-1">Registrar treino</h1>
        </header>
        <AvisoErroLeitura novaTentativaHref="/fisico/treino" />
      </main>
    );
  }

  const treinoSalvo = searchParams?.treino_salvo === "1";
  const registroExcluido = searchParams?.registro_excluido === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Registrar treino</h1>
        <Link
          href="/fisico/historico?aba=treino"
          className="inline-flex items-center gap-1 text-xs text-oliva/85 underline mt-1"
        >
          <History className="h-3 w-3" />
          Ver histórico
        </Link>
      </header>

      {editandoOutroDia ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Corrigindo o treino de {formatarDataExtensa(dataSelecionada)}.{" "}
          <Link href="/fisico/treino" className="underline">
            Voltar para hoje
          </Link>
        </p>
      ) : null}

      {treinoSalvo ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Treino {editandoOutroDia ? "corrigido" : "registrado"}!
        </p>
      ) : null}

      {registroExcluido ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Treino excluído.
        </p>
      ) : null}

      <FormularioAcao
        acao={registrarTreino}
        rotuloEnviar={editandoOutroDia ? "Salvar correção" : "Salvar treino"}
        rotuloEnviando="Salvando treino…"
        mensagemSucesso={editandoOutroDia ? undefined : "Treino registrado."}
        classeBotao="w-full"
        className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <DataTreinoField defaultValue={dataSelecionada} max={hoje} />

        <TipoTreinoField
          tipos={TIPOS_TREINO}
          defaultTipo={treinoDoDia?.tipo ?? ""}
          defaultDescricao={treinoDoDia?.tipo_outro_descricao}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duracao_minutos">Duração (min)</Label>
            <Input
              id="duracao_minutos"
              name="duracao_minutos"
              type="number"
              min={1}
              defaultValue={treinoDoDia?.duracao_minutos ?? undefined}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calorias">Calorias (kcal)</Label>
            <Input
              id="calorias"
              name="calorias"
              type="number"
              min={1}
              defaultValue={treinoDoDia?.calorias ?? undefined}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="realizado"
            name="realizado"
            type="checkbox"
            defaultChecked={treinoDoDia?.realizado ?? false}
            className="h-5 w-5 rounded border-oliva/70 text-oliva focus-visible:ring-2 focus-visible:ring-oliva"
          />
          <Label htmlFor="realizado" className="cursor-pointer">
            Realizado
          </Label>
        </div>

      </FormularioAcao>

      {treinoDoDia && !editandoOutroDia ? (
        <BotaoAcao
          acao={excluirTreinoHoje}
          rotulo="Excluir registro de hoje"
          rotuloEnviando="Excluindo registro…"
          confirmacao="Excluir o registro de treino de hoje?"
          destinoSucesso="/fisico/treino?registro_excluido=1"
          variante="outline"
          className="w-full text-red-700 border-red-200 hover:bg-red-50"
        />
      ) : null}

      {treinoDoDia && editandoOutroDia ? (
        <BotaoAcao
          acao={excluirTreinoData}
          campos={{ data: dataSelecionada }}
          rotulo={`Excluir treino de ${formatarDataExtensa(dataSelecionada)}`}
          rotuloEnviando="Excluindo registro…"
          confirmacao={`Excluir o treino de ${formatarDataExtensa(dataSelecionada)}?`}
          destinoSucesso="/fisico/historico?aba=treino&registro_excluido=1"
          variante="outline"
          className="w-full text-red-700 border-red-200 hover:bg-red-50"
        />
      ) : null}
    </main>
  );
}
