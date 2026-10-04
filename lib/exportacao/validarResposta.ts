/**
 * Funções puras usadas pelo botão de exportação (lado do navegador). Não
 * importam nada de servidor nem a biblioteca de ZIP. Decidem, antes de qualquer
 * Blob ou download, se a resposta é um arquivo exportado de verdade.
 */

export type FormatoExportacao = {
  /** Media type esperado no Content-Type (sem parâmetros). */
  mime: string;
  /** Extensão exigida no nome do arquivo, em minúsculas. */
  extensao: string;
  /** Nome conhecido usado quando o cabeçalho traz um nome inválido. */
  nomeReserva: string;
};

export const FORMATOS = {
  planilhas: {
    mime: "application/zip",
    extensao: ".zip",
    nomeReserva: "mulher-forte-planilhas.zip",
  },
  json: {
    mime: "application/json",
    extensao: ".json",
    nomeReserva: "mulher-forte-backup.json",
  },
} as const satisfies Record<string, FormatoExportacao>;

/** Subconjunto de Response que a classificação precisa. */
export type RespostaLike = {
  ok: boolean;
  status: number;
  redirected: boolean;
  url: string;
  headers: { get(nome: string): string | null };
};

export type ResultadoResposta =
  | { tipo: "arquivo"; nome: string }
  | { tipo: "sessao_expirada" }
  | { tipo: "falha" }
  | { tipo: "contrato_invalido" };

const CAMINHO_LOGIN = "/login";

/** Nome base ASCII, sem separadores de caminho, sem caracteres de controle e sem URL. */
const NOME_VALIDO = /^[A-Za-z0-9._-]{1,120}$/;

function caminhoDe(url: string): string {
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return "";
  }
}

function mediaType(valor: string | null): string {
  return (valor ?? "").split(";")[0].trim().toLowerCase();
}

function extrairFilename(cabecalho: string): string | null {
  const entreAspas = /filename="([^"]*)"/i.exec(cabecalho);
  if (entreAspas) return entreAspas[1];
  const sem = /filename=([^;]+)/i.exec(cabecalho);
  return sem ? sem[1].trim() : null;
}

/**
 * Extrai o nome do Content-Disposition e só o aceita se for um nome base seguro.
 * Qualquer outra coisa (caminho, URL, caractere de controle, HTML, nome vazio ou
 * ausente) cai no nome de reserva conhecido.
 */
export function nomeSeguro(cabecalho: string | null, formato: FormatoExportacao): string {
  if (!cabecalho) return formato.nomeReserva;
  const bruto = extrairFilename(cabecalho);
  if (bruto === null || !NOME_VALIDO.test(bruto)) return formato.nomeReserva;
  return bruto;
}

/**
 * Decide o que fazer com a resposta. A ordem importa: primeiro identifica sessão
 * expirada (redirecionamento ao login ou HTML), depois falha de geração, e só então
 * valida o contrato do arquivo (Content-Type, Content-Disposition, extensão).
 */
export function classificarResposta(resposta: RespostaLike, formato: FormatoExportacao): ResultadoResposta {
  const caminho = caminhoDe(resposta.url);
  const tipo = mediaType(resposta.headers.get("Content-Type"));

  if (resposta.redirected && caminho === CAMINHO_LOGIN) {
    return { tipo: "sessao_expirada" };
  }
  if (resposta.status === 401) {
    return { tipo: "sessao_expirada" };
  }
  if (!resposta.ok) {
    return { tipo: "falha" };
  }
  if (tipo === "text/html") {
    return { tipo: "sessao_expirada" };
  }

  const disposicao = resposta.headers.get("Content-Disposition");
  if (!disposicao) {
    return caminho === CAMINHO_LOGIN ? { tipo: "sessao_expirada" } : { tipo: "contrato_invalido" };
  }
  if (!/^\s*attachment\b/i.test(disposicao)) {
    return { tipo: "contrato_invalido" };
  }
  if (tipo !== formato.mime) {
    return { tipo: "contrato_invalido" };
  }

  const nome = nomeSeguro(disposicao, formato);
  if (!nome.toLowerCase().endsWith(formato.extensao)) {
    return { tipo: "contrato_invalido" };
  }
  return { tipo: "arquivo", nome };
}
