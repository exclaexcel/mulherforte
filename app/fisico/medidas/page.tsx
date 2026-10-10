import Link from "next/link";
import { Home, History } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registrarMedidas, excluirMedidasHoje, excluirMedidasData } from "../actions";
import { FormularioAcao } from "@/components/formulario-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BotaoAcao } from "@/components/botao-acao";
import { ehDataFutura, formatarDataExtensa, hojeISO } from "@/lib/date";
import { REGIOES_MEDIDA, type RegiaoMedida } from "@/lib/fisico/types";
import { formatarNumeroBR } from "@/lib/valor-exibicao";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";

export default async function MedidasPage({
  searchParams,
}: {
  searchParams: {
    medidas_salvas?: string;
    registro_excluido?: string;
    variacao_atipica?: string;
    data?: string;
  };
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

  const { data: todasMedidas, error: erroMedidas } = await supabase
    .from("medidas_corporais")
    .select("data, regiao, valor_cm")
    .eq("user_id", user.id)
    .order("data", { ascending: false });

  // Sem leitura confiável, o formulário ficaria vazio e pareceria um novo cadastro.
  if (houveFalhaDeConsulta({ error: erroMedidas })) {
    return (
      <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
        <header>
          <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
            <Home className="h-4 w-4" />
            Início
          </Link>
          <h1 className="text-2xl font-bold text-oliva mt-1">Registrar medidas</h1>
        </header>
        <AvisoErroLeitura novaTentativaHref="/fisico/medidas" />
      </main>
    );
  }

  const medidasDoDia = todasMedidas?.filter((m) => m.data === dataSelecionada) ?? [];

  const valorAtual = (regiao: RegiaoMedida) =>
    medidasDoDia.find((m) => m.regiao === regiao)?.valor_cm ?? undefined;

  const ultimaMedida = (regiao: RegiaoMedida) =>
    todasMedidas?.find((m) => m.regiao === regiao && m.data !== dataSelecionada) ?? null;

  const medidasSalvas = searchParams?.medidas_salvas === "1";
  const registroExcluido = searchParams?.registro_excluido === "1";
  const temMedidaDoDia = medidasDoDia.length > 0;

  const regioesAtipicas = (searchParams?.variacao_atipica ?? "")
    .split(",")
    .filter((r): r is RegiaoMedida => REGIOES_MEDIDA.some((regiao) => regiao.value === r));
  const labelsAtipicos = regioesAtipicas.map(
    (r) => REGIOES_MEDIDA.find((regiao) => regiao.value === r)?.label ?? r
  );

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Registrar medidas</h1>
        <Link
          href="/fisico/historico?aba=medidas"
          className="inline-flex items-center gap-1 text-xs text-oliva/85 underline mt-1"
        >
          <History className="h-3 w-3" />
          Ver histórico
        </Link>
      </header>

      {editandoOutroDia ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Corrigindo as medidas de {formatarDataExtensa(dataSelecionada)}.{" "}
          <Link href="/fisico/medidas" className="underline">
            Voltar para hoje
          </Link>
        </p>
      ) : null}

      {medidasSalvas ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3">
          Medidas {editandoOutroDia ? "corrigidas" : "salvas"}!
        </p>
      ) : null}

      {registroExcluido ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3">
          Medidas excluídas.
        </p>
      ) : null}

      {labelsAtipicos.length > 0 ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3">
          {labelsAtipicos.join(", ")}: a medida foi registrada, mas a diferença foi maior que
          3 cm em relação à medição mensal de referência. Confira o ponto de medição e, se
          necessário, registre novamente.
        </p>
      ) : null}

      <FormularioAcao
        acao={registrarMedidas}
        rotuloEnviar={editandoOutroDia ? "Salvar correção" : "Registrar medidas"}
        rotuloEnviando="Registrando medidas…"
        mensagemSucesso={editandoOutroDia ? undefined : "Medidas salvas."}
        classeBotao="w-full"
        className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" name="data" type="date" defaultValue={dataSelecionada} max={hoje} required />
        </div>

        <p className="text-xs text-stone-500">Preencha só as medidas que for tirar nesse dia.</p>

        {REGIOES_MEDIDA.map((r) => {
          const ultima = ultimaMedida(r.value);
          return (
            <div key={r.value} className="space-y-2">
              <Label htmlFor={`${r.value}_cm`}>{r.label} (cm)</Label>
              <Input
                id={`${r.value}_cm`}
                name={`${r.value}_cm`}
                type="number"
                step="0.1"
                min={0}
                defaultValue={valorAtual(r.value)}
              />
              {ultima ? (
                <p className="text-xs text-stone-500">
                  Última: {formatarNumeroBR(ultima.valor_cm)}cm em {ultima.data}
                </p>
              ) : null}
            </div>
          );
        })}

      </FormularioAcao>

      {temMedidaDoDia && !editandoOutroDia ? (
        <BotaoAcao
          acao={excluirMedidasHoje}
          rotulo="Excluir medidas de hoje"
          rotuloEnviando="Excluindo medidas…"
          confirmacao="Excluir todas as medidas registradas hoje?"
          destinoSucesso="/fisico/medidas?registro_excluido=1"
          variante="outline"
          className="w-full text-red-700 border-red-200 hover:bg-red-50"
        />
      ) : null}

      {temMedidaDoDia && editandoOutroDia ? (
        <BotaoAcao
          acao={excluirMedidasData}
          campos={{ data: dataSelecionada }}
          rotulo={`Excluir medidas de ${formatarDataExtensa(dataSelecionada)}`}
          rotuloEnviando="Excluindo medidas…"
          confirmacao={`Excluir todas as medidas registradas em ${formatarDataExtensa(dataSelecionada)}?`}
          destinoSucesso="/fisico/historico?aba=medidas&registro_excluido=1"
          variante="outline"
          className="w-full text-red-700 border-red-200 hover:bg-red-50"
        />
      ) : null}
    </main>
  );
}
