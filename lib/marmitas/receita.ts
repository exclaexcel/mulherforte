export const CATEGORIAS_RECEITA = ["café da manhã", "lanche", "jantar", "sobremesa"] as const;

const LIMITE_TEXTO = 10000;

export type DadosReceita = {
  nome: string;
  categoria: string | null;
  ingredientes: string | null;
  modo_preparo: string | null;
  dica_congelamento: string | null;
  notas: string | null;
  selos: string[];
  /** null quando a usuária não sabe a validade (não é um padrão inventado). */
  validade_congelado_dias: number | null;
};

export type ResultadoReceita = { ok: true; dados: DadosReceita } | { ok: false; erro: string };

export const MENSAGEM_VALIDADE_INVALIDA =
  "A validade congelado precisa ser um número inteiro maior que zero, ou ficar em branco.";

export type ResultadoValidade = { ok: true; valor: number | null } | { ok: false; erro: string };

/**
 * Fonte única da regra de validade congelado (usada pelo formulário completo e pelo
 * cadastro rápido). Vazio, espaços, undefined e null viram null, sem padrão. Valor
 * preenchido precisa ser inteiro maior que zero; zero, negativo, decimal, texto
 * inválido, NaN e infinito são recusados.
 */
export function interpretarValidadeCongelado(valor: unknown): ResultadoValidade {
  if (valor === undefined || valor === null) {
    return { ok: true, valor: null };
  }

  let numero: number;
  if (typeof valor === "string") {
    const texto = valor.trim();
    if (texto === "") {
      return { ok: true, valor: null };
    }
    numero = Number(texto);
  } else if (typeof valor === "number") {
    numero = valor;
  } else {
    return { ok: false, erro: MENSAGEM_VALIDADE_INVALIDA };
  }

  if (!Number.isFinite(numero) || !Number.isInteger(numero) || numero <= 0) {
    return { ok: false, erro: MENSAGEM_VALIDADE_INVALIDA };
  }
  return { ok: true, valor: numero };
}

/** Texto livre de várias linhas: preserva as quebras e troca só \r\n por \n. */
function textoLongo(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").replace(/\r\n/g, "\n");
  return texto.trim() === "" ? null : texto.replace(/\s+$/, "");
}

function selosDe(valor: FormDataEntryValue | null): string[] {
  const partes = String(valor ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
  return Array.from(new Set(partes));
}

/**
 * Interpreta e valida o formulário completo de receita. Não grava nada: a
 * action chama esta função antes de qualquer insert. O texto longo é preservado
 * como digitado (quebras de linha inclusive).
 */
export function interpretarReceita(formData: FormData): ResultadoReceita {
  const nome = String(formData.get("nome") ?? "").trim();
  if (nome === "") {
    return { ok: false, erro: "Informe o nome da receita." };
  }

  const validade = interpretarValidadeCongelado(formData.get("validade_congelado_dias"));
  if (!validade.ok) {
    return { ok: false, erro: validade.erro };
  }

  const categoriaBruta = String(formData.get("categoria") ?? "").trim();
  const categoria = (CATEGORIAS_RECEITA as readonly string[]).includes(categoriaBruta)
    ? categoriaBruta
    : null;

  const campos = {
    ingredientes: textoLongo(formData.get("ingredientes")),
    modo_preparo: textoLongo(formData.get("modo_preparo")),
    dica_congelamento: textoLongo(formData.get("dica_congelamento")),
    notas: textoLongo(formData.get("notas")),
  };

  for (const valor of Object.values(campos)) {
    if (valor !== null && valor.length > LIMITE_TEXTO) {
      return { ok: false, erro: "Um dos textos está longo demais. Resuma ou divida em partes." };
    }
  }

  return {
    ok: true,
    dados: {
      nome,
      categoria,
      ...campos,
      selos: selosDe(formData.get("selos")),
      validade_congelado_dias: validade.valor,
    },
  };
}
