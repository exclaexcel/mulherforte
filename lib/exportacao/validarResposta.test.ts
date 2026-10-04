import { describe, expect, it } from "vitest";
import { classificarResposta, FORMATOS, nomeSeguro, type RespostaLike } from "./validarResposta";

const ZIP = FORMATOS.planilhas;
const JSON_BACKUP = FORMATOS.json;

const URL_OK = "http://localhost:3000/api/exportacao/planilhas";
const URL_LOGIN = "http://localhost:3000/login";

/** Monta uma resposta simulada. Cabeçalhos são case-insensitive, como em Response. */
function resposta(opcoes: {
  status?: number;
  redirected?: boolean;
  url?: string;
  headers?: Record<string, string>;
} = {}): RespostaLike {
  const status = opcoes.status ?? 200;
  const mapa = new Map(
    Object.entries(opcoes.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    ok: status >= 200 && status < 300,
    status,
    redirected: opcoes.redirected ?? false,
    url: opcoes.url ?? URL_OK,
    headers: { get: (nome: string) => mapa.get(nome.toLowerCase()) ?? null },
  };
}

const ZIP_VALIDO = {
  "Content-Type": "application/zip",
  "Content-Disposition": 'attachment; filename="mulher-forte-planilhas-2026-10-04.zip"',
};

const JSON_VALIDO = {
  "Content-Type": "application/json; charset=utf-8",
  "Content-Disposition": 'attachment; filename="mulher-forte-backup-2026-10-04.json"',
};

describe("sessão expirada — nunca vira download", () => {
  it("redirecionamento para /login é sessão expirada, mesmo com 200", () => {
    const r = resposta({ redirected: true, url: URL_LOGIN, headers: ZIP_VALIDO });
    expect(classificarResposta(r, ZIP)).toEqual({ tipo: "sessao_expirada" });
  });

  it("HTML 200 no lugar do ZIP é sessão expirada, não arquivo", () => {
    const r = resposta({ redirected: true, url: URL_LOGIN, headers: { "Content-Type": "text/html; charset=utf-8" } });
    expect(classificarResposta(r, ZIP).tipo).toBe("sessao_expirada");
  });

  it("HTML 200 no lugar do JSON é sessão expirada, não arquivo", () => {
    const r = resposta({ headers: { "Content-Type": "text/html" } });
    expect(classificarResposta(r, JSON_BACKUP).tipo).toBe("sessao_expirada");
  });

  it("401 é sessão expirada", () => {
    expect(classificarResposta(resposta({ status: 401 }), ZIP).tipo).toBe("sessao_expirada");
  });

  it("anexo ausente com URL de login é sessão expirada", () => {
    const r = resposta({ url: URL_LOGIN, headers: {} });
    expect(classificarResposta(r, ZIP).tipo).toBe("sessao_expirada");
  });

  it("redirecionamento para outra URL não é tratado como sessão", () => {
    const r = resposta({ redirected: true, url: "http://localhost:3000/outra", headers: { "Content-Type": "text/plain" } });
    expect(classificarResposta(r, ZIP).tipo).toBe("contrato_invalido");
  });
});

describe("falha de geração", () => {
  it("500 vira falha, sem arquivo", () => {
    expect(classificarResposta(resposta({ status: 500 }), ZIP).tipo).toBe("falha");
  });

  it("422 vira falha, sem arquivo", () => {
    expect(classificarResposta(resposta({ status: 422, headers: { "Content-Type": "application/json" } }), ZIP).tipo).toBe("falha");
  });
});

describe("contrato do arquivo", () => {
  it("ZIP válido vira arquivo com nome seguro", () => {
    expect(classificarResposta(resposta({ headers: ZIP_VALIDO }), ZIP)).toEqual({
      tipo: "arquivo",
      nome: "mulher-forte-planilhas-2026-10-04.zip",
    });
  });

  it("JSON válido vira arquivo com nome seguro", () => {
    expect(classificarResposta(resposta({ headers: JSON_VALIDO }), JSON_BACKUP)).toEqual({
      tipo: "arquivo",
      nome: "mulher-forte-backup-2026-10-04.json",
    });
  });

  it("Content-Type incorreto é falha de contrato", () => {
    const r = resposta({ headers: { ...ZIP_VALIDO, "Content-Type": "application/octet-stream" } });
    expect(classificarResposta(r, ZIP).tipo).toBe("contrato_invalido");
  });

  it("Content-Type de JSON recebido para o ZIP é falha de contrato", () => {
    const r = resposta({ headers: { ...ZIP_VALIDO, "Content-Type": "application/json" } });
    expect(classificarResposta(r, ZIP).tipo).toBe("contrato_invalido");
  });

  it("Content-Disposition ausente (sem sessão expirada) é falha de contrato", () => {
    const r = resposta({ headers: { "Content-Type": "application/zip" } });
    expect(classificarResposta(r, ZIP).tipo).toBe("contrato_invalido");
  });

  it("Content-Disposition sem attachment (inline) é falha de contrato", () => {
    const r = resposta({
      headers: { ...ZIP_VALIDO, "Content-Disposition": 'inline; filename="mulher-forte-planilhas-2026-10-04.zip"' },
    });
    expect(classificarResposta(r, ZIP).tipo).toBe("contrato_invalido");
  });

  it("extensão incorreta é falha de contrato", () => {
    const r = resposta({
      headers: { ...ZIP_VALIDO, "Content-Disposition": 'attachment; filename="mulher-forte-planilhas.html"' },
    });
    expect(classificarResposta(r, ZIP).tipo).toBe("contrato_invalido");
  });

  it("ok com cabeçalhos errados nunca produz arquivo", () => {
    const r = resposta({ headers: { "Content-Type": "text/plain", "Content-Disposition": "inline" } });
    expect(classificarResposta(r, ZIP).tipo).not.toBe("arquivo");
  });
});

describe("nomeSeguro — higienização do filename", () => {
  it("aceita nome base ASCII válido", () => {
    expect(nomeSeguro('attachment; filename="mulher-forte-backup-2026-10-04.json"', JSON_BACKUP)).toBe(
      "mulher-forte-backup-2026-10-04.json"
    );
  });

  it("filename com caminho cai no nome de reserva", () => {
    expect(nomeSeguro('attachment; filename="../../etc/x.zip"', ZIP)).toBe(ZIP.nomeReserva);
    expect(nomeSeguro('attachment; filename="pasta/x.zip"', ZIP)).toBe(ZIP.nomeReserva);
    expect(nomeSeguro('attachment; filename="pasta\\x.zip"', ZIP)).toBe(ZIP.nomeReserva);
  });

  it("filename com caractere de controle cai no nome de reserva", () => {
    expect(nomeSeguro('attachment; filename="x\u0001.zip"', ZIP)).toBe(ZIP.nomeReserva);
    expect(nomeSeguro('attachment; filename="x\u0007.zip"', ZIP)).toBe(ZIP.nomeReserva);
  });

  it("HTML no filename cai no nome de reserva", () => {
    expect(nomeSeguro('attachment; filename="<script>.zip"', ZIP)).toBe(ZIP.nomeReserva);
  });

  it("URL no filename cai no nome de reserva", () => {
    expect(nomeSeguro('attachment; filename="https://exemplo.com/x.zip"', ZIP)).toBe(ZIP.nomeReserva);
  });

  it("filename vazio ou ausente cai no nome de reserva", () => {
    expect(nomeSeguro('attachment; filename=""', ZIP)).toBe(ZIP.nomeReserva);
    expect(nomeSeguro("attachment", ZIP)).toBe(ZIP.nomeReserva);
    expect(nomeSeguro(null, ZIP)).toBe(ZIP.nomeReserva);
  });

  it("nome de reserva sempre tem a extensão do formato", () => {
    expect(ZIP.nomeReserva.endsWith(ZIP.extensao)).toBe(true);
    expect(JSON_BACKUP.nomeReserva.endsWith(JSON_BACKUP.extensao)).toBe(true);
  });

  it("filename inválido com ZIP válido ainda entrega arquivo, com o nome de reserva", () => {
    const r = resposta({
      headers: { ...ZIP_VALIDO, "Content-Disposition": 'attachment; filename="../x.zip"' },
    });
    expect(classificarResposta(r, ZIP)).toEqual({ tipo: "arquivo", nome: ZIP.nomeReserva });
  });
});
