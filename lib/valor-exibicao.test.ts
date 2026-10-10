import { describe, expect, it } from "vitest";
import { formatarNumeroBR, temValor } from "./valor-exibicao";

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

describe("formatarNumeroBR (vírgula decimal, nunca ponto)", () => {
  it("uma casa decimal: troca ponto por vírgula", () => {
    expect(formatarNumeroBR(58.1)).toBe("58,1");
  });

  it("duas casas decimais (RCEst/RCQ)", () => {
    expect(formatarNumeroBR(0.51)).toBe("0,51");
  });

  it("número inteiro: sem vírgula nem zero à toa", () => {
    expect(formatarNumeroBR(93)).toBe("93");
  });

  it("zero é exibido, não vira string vazia", () => {
    expect(formatarNumeroBR(0)).toBe("0");
  });

  it("nunca corta pra mais de 2 casas (teto de segurança)", () => {
    expect(formatarNumeroBR(1 / 3)).toBe("0,33");
  });
});
