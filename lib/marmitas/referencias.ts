/**
 * Referências oficiais de conservação. Centralizadas aqui para o formulário de
 * receita e a página "Sobre o plano" usarem exatamente as mesmas URLs.
 * Nada é consultado nem extraído automaticamente dessas páginas.
 */

export const REFERENCIA_ANVISA_GUIA_16 = {
  url: "https://anvisalegis.datalegis.net/action/UrlPublicasAction.php?acao=abrirAtoPublico&num_ato=00000016&sgl_tipo=GUI&sgl_orgao=ANVISA/MS&vlr_ano=2025&seq_ato=222&cod_modulo=644&cod_menu=9483",
  texto: "Abrir Guia 16 da Anvisa",
  explicacao:
    "Referência brasileira sobre critérios e métodos para determinação do prazo de validade de alimentos.",
} as const;

export const REFERENCIA_USDA_CONGELAMENTO = {
  url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/freezing-and-food-safety",
  texto: "Consultar orientações do USDA/FSIS sobre congelamento",
  explicacao:
    "Referência complementar com orientações gerais sobre congelamento, armazenamento e conservação por tipo de alimento.",
} as const;

/** Atributos obrigatórios para links que abrem fontes externas em nova aba. */
export const ATRIBUTOS_LINK_EXTERNO = {
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

export const ROTULO_PRAZO_CONGELAMENTO = "Prazo de congelamento em dias, opcional";

/** Texto curto de ajuda no formulário. Não contém links nem sugestão de prazo. */
export const TEXTO_AJUDA_PRAZO = "Se não souber, deixe em branco.";

/** Explicação da seção "Referências gerais de conservação" (somente na página Sobre o plano). */
export const TEXTO_EXPLICACAO_REFERENCIAS = [
  "O prazo de congelamento pode variar conforme os ingredientes, o modo de preparo, a embalagem e a temperatura do freezer. As fontes abaixo apresentam orientações gerais e não determinam automaticamente o prazo exato de cada receita.",
  "Quando houver uma orientação específica da receita, dos ingredientes ou da embalagem, prefira essa informação. Se não souber qual prazo se aplica, deixe o campo sem informar.",
  "Depois de descongelar, siga as orientações de preparo e cozimento da receita antes de consumir. Congelar não dispensa essas etapas.",
] as const;

export const AVISO_REFERENCIAS =
  "As referências são orientações gerais e não representam garantia automática de segurança ou qualidade para todas as receitas.";
