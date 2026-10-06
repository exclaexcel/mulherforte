import { describe, expect, it } from "vitest";
import { temValor } from "./valor-exibicao";

describe("temValor (zero é valor, ausência é null)", () => {
  it("zero é valor registrado", () => {
    expect(temValor(0)).toBe(true);
  });

  it("null e undefined são ausência", () => {
    expect(temValor(null)).toBe(false);
    expect(temValor(undefined)).toBe(false);
  });

  it("valores comuns são valor", () => {
    expect(temValor(58.1)).toBe(true);
  });
});
