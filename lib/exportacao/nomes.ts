import { hojeISO } from "@/lib/date";

/** Nomes ASCII com data AAAA-MM-DD (fuso de Brasília, via hojeISO). */
export function nomeArquivoPlanilhas(data: string = hojeISO()): string {
  return `mulher-forte-planilhas-${data}.zip`;
}

export function nomeArquivoBackup(data: string = hojeISO()): string {
  return `mulher-forte-backup-${data}.json`;
}

/** Content-Disposition de download. O nome já é ASCII por construção. */
export function cabecalhoDownload(nomeArquivo: string): string {
  return `attachment; filename="${nomeArquivo}"`;
}
