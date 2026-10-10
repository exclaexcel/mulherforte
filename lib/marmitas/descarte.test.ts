import { describe, expect, it } from "vitest";
import { CONFIRMACAO_DESCARTE, MOTIVOS_DESCARTE, motivoDescarteValido } from "./descarte";

describe("motivoDescarteValido", () => {
  it("aceita os três motivos previstos", () => {
    expect(motivoDescarteValido("vencido")).toBe(true);
    expect(motivoDescarteValido("estragado")).toBe(true);
    expect(motivoDescarteValido("outro")).toBe(true);
  });

  it("rejeita vazio e valores fora da lista", () => {
    expect(motivoDescarteValido("")).toBe(false);
    expect(motivoDescarteValido("mofou")).toBe(false);
  });
});

describe("MOTIVOS_DESCARTE", () => {
  it("tem exatamente os três motivos, cada um com rótulo", () => {
    expect(MOTIVOS_DESCARTE.map((m) => m.valor)).toEqual(["vencido", "estragado", "outro"]);
    for (const motivo of MOTIVOS_DESCARTE) {
      expect(motivo.rotulo.length).toBeGreaterThan(0);
    }
  });
});

describe("CONFIRMACAO_DESCARTE", () => {
  it("avisa que a ação é irreversível", () => {
    expect(CONFIRMACAO_DESCARTE.toLowerCase()).toMatch(/definitivo|não pode ser desfeito/);
  });
});
