import { describe, expect, it } from "vitest";
import { montarResumoDia } from "./resumo-dia";

describe("montarResumoDia (cronograma)", () => {
  it("junta os três campos preenchidos na ordem", () => {
    expect(montarResumoDia(["Frango", "Arroz", "Brócolis"])).toBe("Frango · Arroz · Brócolis");
  });

  it("sem legumes: não deixa separador no fim", () => {
    expect(montarResumoDia(["Frango", "Arroz", null])).toBe("Frango · Arroz");
  });

  it("sem proteína: não deixa separador no início", () => {
    expect(montarResumoDia([null, "Arroz", "Brócolis"])).toBe("Arroz · Brócolis");
  });

  it("campo do meio vazio não gera separador duplicado", () => {
    expect(montarResumoDia(["Frango", "", "Brócolis"])).toBe("Frango · Brócolis");
  });

  it("espaços em branco contam como vazio", () => {
    expect(montarResumoDia(["  ", "Arroz", undefined])).toBe("Arroz");
  });

  it("um único campo não tem separador", () => {
    expect(montarResumoDia([undefined, "Feijão", null])).toBe("Feijão");
  });

  it("todos vazios: resumo vazio (a página não mostra o travessão)", () => {
    expect(montarResumoDia([null, "", "   "])).toBe("");
    expect(montarResumoDia([])).toBe("");
  });

  it("nunca produz ' · · ' nem começa ou termina com separador", () => {
    const casos = [
      ["a", null, null],
      [null, null, "c"],
      ["a", "", "c"],
      ["", "", ""],
    ];
    for (const caso of casos) {
      const r = montarResumoDia(caso);
      expect(r).not.toContain("· ·");
      expect(r.startsWith("·")).toBe(false);
      expect(r.endsWith("·")).toBe(false);
    }
  });
});
