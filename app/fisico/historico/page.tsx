import Link from "next/link";
import { Home, Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  excluirPesoData,
  excluirMedidasData,
  excluirTreinoData,
  excluirHabitosData,
} from "../actions";
import { BotaoAcao } from "@/components/botao-acao";
import { HomeTabs } from "@/components/home-tabs";
import { formatarDataBR, formatarDataExtensa } from "@/lib/date";
import { agruparPorSemana, type GrupoSemana } from "@/lib/fisico/historico";
import { agruparMedidasPorDia, type RegistroMedidasDia } from "@/lib/fisico/historicoMedidas";
import {
  agruparTreinosPorSemana,
  classificarTreino,
  type RegistroTreino,
  type StatusTreino,
} from "@/lib/fisico/historicoTreino";
import { REGIOES_MEDIDA, TIPOS_TREINO, type TipoTreino } from "@/lib/fisico/types";
import { temValor, formatarNumeroBR } from "@/lib/valor-exibicao";
import { houveFalhaDeConsulta } from "@/lib/leitura";
import { AvisoErroLeitura } from "@/components/aviso-erro-leitura";
import type { ResultadoAcao } from "@/lib/resultado-acao";

type RegistroPeso = {
  data: string;
  pesoKg: number;
  percentualGordura: number | null;
  percentualMassaMuscular: number | null;
  percentualAgua: number | null;
};

type RegistroHabitos = {
  data: string;
  quantidadeAguaMl: number;
  priorizouProteina: boolean;
};

const ESTILO_STATUS_TREINO: Record<StatusTreino, { texto: string; className: string }> = {
  obrigatorio_cumprido: {
    texto: "Treino obrigatório cumprido",
    className: "bg-green-50 text-green-800 border border-green-200",
  },
  obrigatorio_nao_realizado: {
    texto: "Treino obrigatório não realizado",
    className: "bg-amber-50 text-amber-800 border border-amber-200",
  },
  extra_realizado: {
    texto: "Atividade extra realizada",
    className: "bg-rosa-soft/60 text-oliva-dark border border-rosa/30",
  },
  nao_realizado: {
    texto: "Não realizado",
    className: "bg-stone-100 text-stone-600 border border-stone-200",
  },
};

function rotuloTipoTreino(tipo: TipoTreino, descricaoOutro: string | null): string {
  if (tipo === "outro") {
    return descricaoOutro?.trim() || "Outro";
  }
  return TIPOS_TREINO.find((t) => t.value === tipo)?.label ?? tipo;
}

/** Card padrão de um item do histórico: data, conteúdo livre, editar e excluir. */
function CardHistorico({
  data,
  children,
  hrefEditar,
  acaoExcluir,
  confirmacaoExcluir,
}: {
  data: string;
  children: ReactNode;
  hrefEditar: string;
  acaoExcluir: (formData: FormData) => Promise<ResultadoAcao>;
  confirmacaoExcluir: string;
}) {
  return (
    <li className="rounded-2xl bg-white/80 border border-oliva/10 p-4 space-y-2 shadow-sm">
      <p className="font-semibold text-oliva">{formatarDataExtensa(data)}</p>
      {children}
      <div className="flex items-center gap-3 pt-1">
        <Link href={hrefEditar} className="inline-flex items-center gap-1 text-xs text-oliva underline">
          <Pencil className="h-3 w-3" />
          Editar
        </Link>
        <BotaoAcao
          acao={acaoExcluir}
          campos={{ data }}
          rotulo="Excluir"
          rotuloEnviando="Excluindo…"
          confirmacao={confirmacaoExcluir}
          estilo="nativo"
          className="text-xs text-red-700 underline"
        />
      </div>
    </li>
  );
}

function SemanaHeader({ grupo }: { grupo: Pick<GrupoSemana<unknown>, "inicioSemana" | "fimSemana"> }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-oliva/85 px-1">
      Semana de {formatarDataBR(grupo.inicioSemana)} a {formatarDataBR(grupo.fimSemana)}
    </h2>
  );
}

function ListaVazia({ texto, hrefRegistrar, rotuloRegistrar }: { texto: string; hrefRegistrar: string; rotuloRegistrar: string }) {
  return (
    <div className="space-y-3 rounded-2xl bg-white/80 border border-oliva/10 p-5">
      <p className="text-sm text-stone-600">{texto}</p>
      <Link href={hrefRegistrar} className="text-sm text-oliva underline">
        {rotuloRegistrar}
      </Link>
    </div>
  );
}

export default async function HistoricoFisicoPage({
  searchParams,
}: {
  searchParams: {
    aba?: string;
    peso_salvo?: string;
    medidas_salvas?: string;
    treino_salvo?: string;
    registro_excluido?: string;
    variacao_atipica?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [pesoResp, medidasResp, treinoResp, habitosResp] = await Promise.all([
    supabase
      .from("registros_peso")
      .select("data, peso_kg, percentual_gordura, percentual_massa_muscular, percentual_agua")
      .eq("user_id", user.id)
      .order("data", { ascending: false }),
    supabase
      .from("medidas_corporais")
      .select("data, regiao, valor_cm")
      .eq("user_id", user.id)
      .order("data", { ascending: false }),
    supabase
      .from("adesao_treino")
      .select("data, tipo, tipo_outro_descricao, realizado, duracao_minutos, calorias")
      .eq("user_id", user.id)
      .order("data", { ascending: false }),
    supabase
      .from("adesao_habitos")
      .select("data, quantidade_agua_ml, priorizou_proteina")
      .eq("user_id", user.id)
      .order("data", { ascending: false }),
  ]);

  const regioesAtipicas = (searchParams?.variacao_atipica ?? "")
    .split(",")
    .filter((r): r is (typeof REGIOES_MEDIDA)[number]["value"] =>
      REGIOES_MEDIDA.some((regiao) => regiao.value === r)
    );
  const labelsAtipicos = regioesAtipicas.map(
    (r) => REGIOES_MEDIDA.find((regiao) => regiao.value === r)?.label ?? r
  );

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto">
      <header className="mb-4">
        <Link href="/?aba=fisico" className="inline-flex items-center gap-1 text-sm text-oliva/85">
          <Home className="h-4 w-4" />
          Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Histórico da Jornada física</h1>
      </header>

      {searchParams?.peso_salvo === "1" ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3 mb-4">
          Peso corrigido!
        </p>
      ) : null}

      {searchParams?.medidas_salvas === "1" ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3 mb-4">
          Medidas corrigidas!
        </p>
      ) : null}

      {searchParams?.treino_salvo === "1" ? (
        <p role="status" className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-2xl p-3 mb-4">
          Treino corrigido!
        </p>
      ) : null}

      {searchParams?.registro_excluido === "1" ? (
        <p role="status" className="text-sm text-stone-700 bg-stone-100 border border-stone-200 rounded-2xl p-3 mb-4">
          Registro excluído.
        </p>
      ) : null}

      {labelsAtipicos.length > 0 ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-4">
          {labelsAtipicos.join(", ")}: a medida foi corrigida, mas a diferença foi maior que 3 cm em
          relação à medição de referência. Confira o ponto de medição.
        </p>
      ) : null}

      <HomeTabs
        groups={[
          {
            key: "peso",
            label: "Peso",
            cor: "rosa",
            content: renderizarPeso(pesoResp),
          },
          {
            key: "medidas",
            label: "Medidas",
            cor: "rosa",
            content: renderizarMedidas(medidasResp),
          },
          {
            key: "treino",
            label: "Treino",
            cor: "rosa",
            content: renderizarTreino(treinoResp),
          },
          {
            key: "habitos",
            label: "Hábitos",
            cor: "rosa",
            content: renderizarHabitos(habitosResp),
          },
        ]}
      />
    </main>
  );
}

function renderizarPeso(resp: { data: unknown; error: unknown }): ReactNode {
  if (houveFalhaDeConsulta({ error: resp.error })) {
    return <AvisoErroLeitura novaTentativaHref="/fisico/historico?aba=peso" />;
  }

  const linhas = (resp.data ?? []) as {
    data: string;
    peso_kg: number;
    percentual_gordura: number | null;
    percentual_massa_muscular: number | null;
    percentual_agua: number | null;
  }[];

  const registros: RegistroPeso[] = linhas.map((l) => ({
    data: l.data,
    pesoKg: Number(l.peso_kg),
    percentualGordura: l.percentual_gordura,
    percentualMassaMuscular: l.percentual_massa_muscular,
    percentualAgua: l.percentual_agua,
  }));

  if (registros.length === 0) {
    return (
      <ListaVazia
        texto="Nenhum peso registrado ainda."
        hrefRegistrar="/fisico/peso"
        rotuloRegistrar="Registrar o primeiro peso"
      />
    );
  }

  const grupos = agruparPorSemana(registros);

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.inicioSemana} className="space-y-3">
          <SemanaHeader grupo={grupo} />
          <ul className="space-y-3">
            {grupo.registros.map((registro) => (
              <CardHistorico
                key={registro.data}
                data={registro.data}
                hrefEditar={`/fisico/peso?data=${registro.data}`}
                acaoExcluir={excluirPesoData}
                confirmacaoExcluir={`Excluir o peso de ${formatarDataExtensa(registro.data)}?`}
              >
                <p className="text-sm text-stone-700">
                  {formatarNumeroBR(registro.pesoKg)}kg
                  {temValor(registro.percentualGordura)
                    ? ` · gordura ${formatarNumeroBR(registro.percentualGordura)}%`
                    : ""}
                  {temValor(registro.percentualMassaMuscular)
                    ? ` · massa muscular ${formatarNumeroBR(registro.percentualMassaMuscular)}%`
                    : ""}
                  {temValor(registro.percentualAgua)
                    ? ` · água ${formatarNumeroBR(registro.percentualAgua)}%`
                    : ""}
                </p>
              </CardHistorico>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function renderizarMedidas(resp: { data: unknown; error: unknown }): ReactNode {
  if (houveFalhaDeConsulta({ error: resp.error })) {
    return <AvisoErroLeitura novaTentativaHref="/fisico/historico?aba=medidas" />;
  }

  const linhas = (resp.data ?? []) as { data: string; regiao: (typeof REGIOES_MEDIDA)[number]["value"]; valor_cm: number }[];
  const registros: RegistroMedidasDia[] = agruparMedidasPorDia(
    linhas.map((l) => ({ data: l.data, regiao: l.regiao, valorCm: Number(l.valor_cm) }))
  );

  if (registros.length === 0) {
    return (
      <ListaVazia
        texto="Nenhuma medida registrada ainda."
        hrefRegistrar="/fisico/medidas"
        rotuloRegistrar="Registrar a primeira medida"
      />
    );
  }

  const grupos = agruparPorSemana(registros);

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.inicioSemana} className="space-y-3">
          <SemanaHeader grupo={grupo} />
          <ul className="space-y-3">
            {grupo.registros.map((registro) => (
              <CardHistorico
                key={registro.data}
                data={registro.data}
                hrefEditar={`/fisico/medidas?data=${registro.data}`}
                acaoExcluir={excluirMedidasData}
                confirmacaoExcluir={`Excluir todas as medidas registradas em ${formatarDataExtensa(registro.data)}?`}
              >
                <p className="text-sm text-stone-700">
                  {REGIOES_MEDIDA.filter((r) => registro.valoresPorRegiao[r.value] !== undefined)
                    .map((r) => `${r.label} ${formatarNumeroBR(registro.valoresPorRegiao[r.value]!)}cm`)
                    .join(" · ")}
                </p>
              </CardHistorico>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function renderizarTreino(resp: { data: unknown; error: unknown }): ReactNode {
  if (houveFalhaDeConsulta({ error: resp.error })) {
    return <AvisoErroLeitura novaTentativaHref="/fisico/historico?aba=treino" />;
  }

  const linhas = (resp.data ?? []) as {
    data: string;
    tipo: TipoTreino;
    tipo_outro_descricao: string | null;
    realizado: boolean;
    duracao_minutos: number | null;
    calorias: number | null;
  }[];

  const registros: RegistroTreino[] = linhas.map((l) => ({
    data: l.data,
    tipo: l.tipo,
    tipoOutroDescricao: l.tipo_outro_descricao,
    realizado: l.realizado,
    duracaoMinutos: l.duracao_minutos,
    calorias: l.calorias,
  }));

  if (registros.length === 0) {
    return (
      <ListaVazia
        texto="Nenhum treino registrado ainda."
        hrefRegistrar="/fisico/treino"
        rotuloRegistrar="Registrar o primeiro treino"
      />
    );
  }

  const grupos = agruparTreinosPorSemana(registros);

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.inicioSemana} className="space-y-3">
          <SemanaHeader grupo={grupo} />
          <ul className="space-y-3">
            {grupo.registros.map((registro) => {
              const status = ESTILO_STATUS_TREINO[classificarTreino(registro)];
              return (
                <CardHistorico
                  key={registro.data}
                  data={registro.data}
                  hrefEditar={`/fisico/treino?data=${registro.data}`}
                  acaoExcluir={excluirTreinoData}
                  confirmacaoExcluir={`Excluir o treino de ${formatarDataExtensa(registro.data)}?`}
                >
                  <span className="inline-block text-xs bg-oliva/10 text-oliva rounded-full px-2 py-0.5">
                    {rotuloTipoTreino(registro.tipo, registro.tipoOutroDescricao)}
                  </span>
                  <p className={`inline-block text-xs rounded-full px-2 py-0.5 ${status.className}`}>
                    {status.texto}
                  </p>
                  {registro.duracaoMinutos || registro.calorias ? (
                    <p className="text-xs text-stone-500">
                      {[
                        registro.duracaoMinutos ? `${registro.duracaoMinutos} min` : null,
                        registro.calorias ? `${registro.calorias} kcal` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </CardHistorico>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function renderizarHabitos(resp: { data: unknown; error: unknown }): ReactNode {
  if (houveFalhaDeConsulta({ error: resp.error })) {
    return <AvisoErroLeitura novaTentativaHref="/fisico/historico?aba=habitos" />;
  }

  const linhas = (resp.data ?? []) as {
    data: string;
    quantidade_agua_ml: number;
    priorizou_proteina: boolean;
  }[];

  const registros: RegistroHabitos[] = linhas.map((l) => ({
    data: l.data,
    quantidadeAguaMl: Number(l.quantidade_agua_ml),
    priorizouProteina: l.priorizou_proteina,
  }));

  if (registros.length === 0) {
    return (
      <ListaVazia
        texto="Nenhum hábito registrado ainda."
        hrefRegistrar="/fisico/habitos"
        rotuloRegistrar="Registrar o primeiro dia"
      />
    );
  }

  const grupos = agruparPorSemana(registros);

  return (
    <div className="space-y-6">
      {grupos.map((grupo) => (
        <section key={grupo.inicioSemana} className="space-y-3">
          <SemanaHeader grupo={grupo} />
          <ul className="space-y-3">
            {grupo.registros.map((registro) => (
              <CardHistorico
                key={registro.data}
                data={registro.data}
                hrefEditar={`/fisico/habitos?data=${registro.data}`}
                acaoExcluir={excluirHabitosData}
                confirmacaoExcluir={`Zerar hidratação e proteína de ${formatarDataExtensa(registro.data)}?`}
              >
                <p className="text-sm text-stone-700">
                  <span aria-hidden="true">💧</span>{" "}
                  {(registro.quantidadeAguaMl / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1 })}L
                  {registro.priorizouProteina ? " · Proteína priorizada" : ""}
                </p>
              </CardHistorico>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
