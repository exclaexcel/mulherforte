export type LeituraNumero = { ok: true; valor: number | null } | { ok: false; erro: string };

/**
 * Campo numérico opcional de formulário. Vazio vira `null` (ausência). Zero é valor
 * válido se a regra aceitar, e nunca vira ausência. Preenchido precisa ser finito e
 * passar na regra; caso contrário, devolve a mensagem para a usuária.
 */
export function lerNumeroOpcional(
  raw: FormDataEntryValue | null,
  valido: (n: number) => boolean,
  mensagem: string
): LeituraNumero {
  if (raw === null || String(raw).trim() === "") {
    return { ok: true, valor: null };
  }

  const n = Number(raw);
  if (!Number.isFinite(n) || !valido(n)) {
    return { ok: false, erro: mensagem };
  }
  return { ok: true, valor: n };
}

/** Campo numérico obrigatório: vazio, não finito ou fora da regra devolvem a mensagem. */
export function lerNumeroObrigatorio(
  raw: FormDataEntryValue | null,
  valido: (n: number) => boolean,
  mensagem: string
): LeituraNumero {
  if (raw === null || String(raw).trim() === "") {
    return { ok: false, erro: mensagem };
  }
  return lerNumeroOpcional(raw, valido, mensagem);
}
