import { describe, expect, it } from "vitest";
import { mensagemAlternarProteina } from "./habitos";

describe("mensagemAlternarProteina — descreve o estado final", () => {
  it("estava marcada: o resultado é desmarcada", () => {
    expect(mensagemAlternarProteina(true)).toBe("Proteína do dia desmarcada.");
  });

  it("não estava marcada: o resultado é marcada como priorizada", () => {
    expect(mensagemAlternarProteina(false)).toBe("Proteína do dia marcada como priorizada.");
  });
});
