import Link from "next/link";
import { Home, History } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarPeso, excluirPesoHoje, excluirPesoData } from "../actions";
import { FormularioAcao } from "@/components/formulario-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotaoAcao } from "@/components/botao-acao";
import { temValor } from "@/lib/valor-exibicao";
import { ehDataFutura, formatarDataExtensa, hojeISO } from "@/lib/date";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";

export default async function PesoPage({
  searchParams,
}: {
  searchParams: { peso_salvo?: string; registro_excluido?: string; data?: string };
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

  const { data: registroDoDia, error: erroRegistroDoDia } = await supabase
    .from("registros_peso")
    .select("peso_kg, percentual_gordura, percentual_massa_muscular, percentual_agua")
    .eq("user_id", user.id)
    .eq("data", dataSelecionada)
    .maybeSingle();

  const { data: ultimoRegistro, error: erroUltimoRegistro } = await supabase
    .from("registros_peso")
    .select("data, peso_kg, percentual_gordura, percentual_massa_muscular, percentual_agua")
    .eq("user_id", user.id)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Sem leitura confiável do dia, o formulário ficaria vazio e pareceria um novo cadastro.
  // Por isso o formulário não aparece nesse estado. A action de registro não muda.
  if (houveFalhaDeConsulta({ error: erroRegistroDoDia }, { error: erroUltimoRegistro })) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
        <header>
          <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
            <Home className="h-4 w-4" />
            Início
          </Link>
          <h1 className="text-2xl font-bold text-oliva mt-1">Registrar peso</h1>
        </header>
        <AvisoErroLeitura novaTentativaHref="/fisico/peso" />
      </main>
    );
  }

  const pesoSalvo = searchParams?.peso_salvo === "1";
  const registroExcluido = searchParams?.registro_excluido === "1";

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Registrar peso</h1>
        <div className="flex items-center gap-3 mt-1">
          <Link href="/fisico/peso/tendencia" className="text-xs text-oliva/85 underline">
            Ver tendência
          </Link>
          <Link
            href="/fisico/historico?aba=peso"
            className="inline-flex items-center gap-1 text-xs text-oliva/85 underline"
          >
            <History className="h-3 w-3" />
            Ver histórico
          </Link>
        </div>
      </header>

      {editandoOutroDia ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Corrigindo o peso de {formatarDataExtensa(dataSelecionada)}.{" "}
          <Link href="/fisico/peso" className="underline">
            Voltar para hoje
          </Link>
        </p>
      ) : null}

      {pesoSalvo ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Peso {editandoOutroDia ? "corrigido" : "salvo"}!
        </p>
      ) : null}

      {registroExcluido ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Registro de hoje excluído.
        </p>
      ) : null}

      {ultimoRegistro && ultimoRegistro.data !== hoje ? (
        <p className="text-xs text-stone-500 bg-stone-50 border border-stone-200 rounded-2xl p-3">
          Último registrado: {ultimoRegistro.peso_kg}kg em {ultimoRegistro.data}
          {temValor(ultimoRegistro.percentual_gordura)
            ? ` · gordura ${ultimoRegistro.percentual_gordura}%`
            : ""}
          {temValor(ultimoRegistro.percentual_massa_muscular)
            ? ` · massa muscular ${ultimoRegistro.percentual_massa_muscular}%`
            : ""}
          {temValor(ultimoRegistro.percentual_agua) ? ` · água ${ultimoRegistro.percentual_agua}%` : ""}
        </p>
      ) : null}

      <FormularioAcao
        acao={registrarPeso}
        rotuloEnviar={editandoOutroDia ? "Salvar correção" : "Registrar peso"}
        rotuloEnviando="Registrando peso…"
        mensagemSucesso={editandoOutroDia ? undefined : "Peso salvo."}
        classeBotao="w-full"
        className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" defaultValue={dataSelecionada} max={hoje} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="peso_kg">Peso (kg)</Label>
          <Input
            id="peso_kg"
            name="peso_kg"
            type="number"
            step="0.1"
            min={0}
            defaultValue={registroDoDia?.peso_kg ?? undefined}
            required
          />
        </div>


        <details className="pt-2" open>
          <summary className="font-semibold text-oliva cursor-pointer text-sm">
            Bioimpedância (opcional)
          </summary>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="percentual_gordura">Percentual de gordura (%)</Label>
              <Input
                id="percentual_gordura"
                name="percentual_gordura"
                type="number"
                step="0.1"
                min={0}
                max={100}
                defaultValue={registroDoDia?.percentual_gordura ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentual_massa_muscular">Massa muscular (%)</Label>
              <Input
                id="percentual_massa_muscular"
                name="percentual_massa_muscular"
                type="number"
                step="0.1"
                min={0}
                max={100}
                defaultValue={registroDoDia?.percentual_massa_muscular ?? undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentual_agua">Percentual de água (%)</Label>
              <Input
                id="percentual_agua"
                name="percentual_agua"
                type="number"
                step="0.1"
                min={0}
                max={100}
                defaultValue={registroDoDia?.percentual_agua ?? undefined}
              />
            </div>
          </div>
        </details>
      </FormularioAcao>

      {registroDoDia && !editandoOutroDia ? (
        <BotaoAcao
          acao={excluirPesoHoje}
          rotulo="Excluir registro de hoje"
          rotuloEnviando="Excluindo registro…"
          confirmacao="Excluir o registro de peso de hoje?"
          destinoSucesso="/fisico/peso?registro_excluido=1"
          variante="outline"
          className="w-full text-red-700 border-red-200 hover:bg-red-50"
        />
      ) : null}

      {registroDoDia && editandoOutroDia ? (
        <BotaoAcao
          acao={excluirPesoData}
          campos={{ data: dataSelecionada }}
          rotulo={`Excluir peso de ${formatarDataExtensa(dataSelecionada)}`}
          rotuloEnviando="Excluindo registro…"
          confirmacao={`Excluir o peso de ${formatarDataExtensa(dataSelecionada)}?`}
          destinoSucesso="/fisico/historico?aba=peso&registro_excluido=1"
          variante="outline"
          className="w-full text-red-700 border-red-200 hover:bg-red-50"
        />
      ) : null}
    </main>
  );
}
