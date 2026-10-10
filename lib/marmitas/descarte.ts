/**
 * Descarte de preparo com prazo encerrado (backlog 2.13). Diferente de consumo:
 * tem ação e status próprios, pra não misturar "comi" com "joguei fora" no
 * histórico. Ação irreversível: o aviso de confirmação é explícito sobre isso.
 */
export const CONFIRMACAO_DESCARTE =
  "Descartar este preparo é definitivo e não pode ser desfeito. Confirmar descarte?";

export type MotivoDescarte = "vencido" | "estragado" | "outro";

export const MOTIVOS_DESCARTE: { valor: MotivoDescarte; rotulo: string }[] = [
  { valor: "vencido", rotulo: "Vencido" },
  { valor: "estragado", rotulo: "Estragado" },
  { valor: "outro", rotulo: "Outro motivo" },
];

export function motivoDescarteValido(valor: string): valor is MotivoDescarte {
  return MOTIVOS_DESCARTE.some((m) => m.valor === valor);
}
