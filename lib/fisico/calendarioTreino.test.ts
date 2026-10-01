import { describe, expect, it } from "vitest";
import { treinoObrigatorioDoDia } from "./calendarioTreino";

describe("treinoObrigatorioDoDia", () => {
  it("segunda-feira (2026-09-28): Move's obrigatório", () => {
    expect(treinoObrigatorioDoDia("2026-09-28")).toBe("moves");
  });

  it("terça-feira (2026-09-29): Zumba obrigatória", () => {
    expect(treinoObrigatorioDoDia("2026-09-29")).toBe("zumba");
  });

  it("quarta-feira (2026-09-30): Move's obrigatório", () => {
    expect(treinoObrigatorioDoDia("2026-09-30")).toBe("moves");
  });

  it("quinta-feira (2026-10-01): Zumba obrigatória", () => {
    expect(treinoObrigatorioDoDia("2026-10-01")).toBe("zumba");
  });

  it("sexta-feira (2026-10-02): sem treino obrigatório", () => {
    expect(treinoObrigatorioDoDia("2026-10-02")).toBeNull();
  });

  it("sábado (2026-10-03): sem treino obrigatório", () => {
    expect(treinoObrigatorioDoDia("2026-10-03")).toBeNull();
  });

  it("domingo (2026-10-04): sem treino obrigatório", () => {
    expect(treinoObrigatorioDoDia("2026-10-04")).toBeNull();
  });
});
