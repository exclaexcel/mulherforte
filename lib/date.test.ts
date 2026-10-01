import { describe, expect, it } from "vitest";
import { calcularIdadeAnos, diasEntre } from "./date";

describe("calcularIdadeAnos", () => {
  // Data de nascimento fictícia e neutra, só pra teste.
  const DATA_NASCIMENTO_TESTE = "1990-05-20";

  it("calcula idade completa quando o aniversário do ano já passou", () => {
    expect(calcularIdadeAnos(DATA_NASCIMENTO_TESTE, "2026-09-30")).toBe(36);
  });

  it("não soma o aniversário antes de acontecer no ano de referência", () => {
    expect(calcularIdadeAnos(DATA_NASCIMENTO_TESTE, "2026-05-19")).toBe(35);
  });

  it("conta o aniversário no dia exato", () => {
    expect(calcularIdadeAnos(DATA_NASCIMENTO_TESTE, "2026-05-20")).toBe(36);
  });
});

describe("diasEntre", () => {
  it("calcula a diferença em dias de calendário", () => {
    expect(diasEntre("2026-09-01", "2026-10-01")).toBe(30);
  });
});
