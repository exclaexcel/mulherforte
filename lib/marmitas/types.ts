export type GrupoCompra =
  | "proteinas"
  | "laticinios"
  | "carboidratos"
  | "vegetais"
  | "despensa";

export const GRUPOS_COMPRA: { value: GrupoCompra; label: string }[] = [
  { value: "proteinas", label: "Proteínas" },
  { value: "laticinios", label: "Laticínios" },
  { value: "carboidratos", label: "Carboidratos" },
  { value: "vegetais", label: "Vegetais" },
  { value: "despensa", label: "Despensa" },
];
