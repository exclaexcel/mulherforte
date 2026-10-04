import { describe, expect, it } from "vitest";
import { cabecalhoDownload, nomeArquivoBackup, nomeArquivoPlanilhas } from "./nomes";

describe("nomes de arquivo", () => {
  it("ZIP de planilhas com data AAAA-MM-DD", () => {
    expect(nomeArquivoPlanilhas("2026-10-03")).toBe("mulher-forte-planilhas-2026-10-03.zip");
  });

  it("backup JSON com data AAAA-MM-DD", () => {
    expect(nomeArquivoBackup("2026-10-03")).toBe("mulher-forte-backup-2026-10-03.json");
  });

  it("sem data explícita, usa a data de hoje em AAAA-MM-DD", () => {
    expect(nomeArquivoPlanilhas()).toMatch(/^mulher-forte-planilhas-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(nomeArquivoBackup()).toMatch(/^mulher-forte-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("nomes são ASCII", () => {
    for (const nome of [nomeArquivoPlanilhas("2026-10-03"), nomeArquivoBackup("2026-10-03")]) {
      expect(nome).toMatch(/^[\x20-\x7e]+$/);
    }
  });

  it("Content-Disposition é attachment com filename ASCII entre aspas", () => {
    expect(cabecalhoDownload("mulher-forte-backup-2026-10-03.json")).toBe(
      'attachment; filename="mulher-forte-backup-2026-10-03.json"'
    );
  });
});
