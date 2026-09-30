export type RegiaoMedida = "cintura" | "quadril" | "coxa" | "abdomen_inferior";

export const REGIOES_MEDIDA: { value: RegiaoMedida; label: string }[] = [
  { value: "cintura", label: "Cintura" },
  { value: "quadril", label: "Quadril" },
  { value: "coxa", label: "Coxa" },
  { value: "abdomen_inferior", label: "Abdômen inferior" },
];

export type TipoTreino = "moves" | "zumba" | "outro";

export const TIPOS_TREINO: { value: TipoTreino; label: string }[] = [
  { value: "moves", label: "Move's" },
  { value: "zumba", label: "Zumba" },
  { value: "outro", label: "Outro" },
];

export type IndicadorMeta = "peso" | "cintura" | "abdomen_inferior" | "hidratacao";

export const INDICADORES_META: {
  value: IndicadorMeta;
  label: string;
  unidade: "kg" | "cm" | null;
}[] = [
  { value: "peso", label: "Peso", unidade: "kg" },
  { value: "cintura", label: "Cintura", unidade: "cm" },
  { value: "abdomen_inferior", label: "Abdômen inferior", unidade: "cm" },
  { value: "hidratacao", label: "Hidratação", unidade: null },
];

export const INCREMENTOS_AGUA_ML: { label: string; value: number }[] = [
  { label: "+200ml", value: 200 },
  { label: "+300ml", value: 300 },
  { label: "Copo (250ml)", value: 250 },
  { label: "Garrafa (500ml)", value: 500 },
];
