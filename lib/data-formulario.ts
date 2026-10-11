import { dataISOValida, ehDataFutura, hojeISO } from "@/lib/date";
import { MENSAGEM_DATA_FUTURA } from "@/lib/resultado-acao";

const MENSAGEM_DATA_INVALIDA = "Data inválida.";

export type LeituraData = { ok: true; valor: string } | { ok: false; erro: string };
export type LeituraDataOpcional = { ok: true; valor: string | null } | { ok: false; erro: string };

/**
 * Campo de data obrigatório de formulário: rejeita vazio, formato fora de
 * AAAA-MM-DD, data de calendário inexistente (ex.: 30 de fevereiro) e data
 * futura — nessa ordem. Sem isso, uma data mal formada passava direto pro
 * banco e voltava como erro genérico do Postgres em vez de mensagem amigável.
 */
export function lerDataObrigatoria(
  raw: FormDataEntryValue | null,
  mensagemVazia: string,
  hoje: string = hojeISO()
): LeituraData {
  const valor = String(raw ?? "").trim();

  if (!valor) {
    return { ok: false, erro: mensagemVazia };
  }

  if (!dataISOValida(valor)) {
    return { ok: false, erro: MENSAGEM_DATA_INVALIDA };
  }

  if (ehDataFutura(valor, hoje)) {
    return { ok: false, erro: MENSAGEM_DATA_FUTURA };
  }

  return { ok: true, valor };
}

/** Campo de data opcional: vazio vira ausência (null); preenchido segue a mesma regra de lerDataObrigatoria. */
export function lerDataOpcional(
  raw: FormDataEntryValue | null,
  hoje: string = hojeISO()
): LeituraDataOpcional {
  const valor = String(raw ?? "").trim();

  if (!valor) {
    return { ok: true, valor: null };
  }

  return lerDataObrigatoria(raw, MENSAGEM_DATA_INVALIDA, hoje);
}
