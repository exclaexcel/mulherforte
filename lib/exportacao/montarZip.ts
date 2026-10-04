import { strToU8, zipSync } from "fflate";

/**
 * Empacota os CSVs em um ZIP gerado inteiramente em memória (zipSync).
 * Usado só no servidor, dentro do Route Handler. Não grava em disco.
 */
export function montarZip(arquivos: Record<string, string>): Uint8Array<ArrayBuffer> {
  const entradas: Record<string, Uint8Array> = {};
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    entradas[nome] = strToU8(conteudo);
  }
  return zipSync(entradas, { level: 6 });
}
