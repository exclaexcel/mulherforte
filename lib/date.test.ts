import { describe, expect, it } from "vitest";
import {
  calcularIdadeAnos,
  diasEntre,
  fimDaSemana,
  inicioDaSemana,
  listarDiasDaSemana,
  obterDiaSemana,
  timestampParaDataLocalISO,
} from "./date";

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

describe("obterDiaSemana", () => {
  it("identifica 2026-09-30 como quarta-feira", () => {
    // Confere com o dado já registrado no projeto: cronograma_inicio_ciclo
    // 2026-09-28 é segunda-feira, então 30/09 (2 dias depois) é quarta.
    expect(obterDiaSemana("2026-09-30")).toBe(3);
  });

  it("identifica 2026-09-28 como segunda-feira (0=domingo, 1=segunda)", () => {
    expect(obterDiaSemana("2026-09-28")).toBe(1);
  });
});

describe("inicioDaSemana / fimDaSemana / listarDiasDaSemana", () => {
  it("encontra a segunda e o domingo de uma data no meio da semana", () => {
    expect(inicioDaSemana("2026-09-30")).toBe("2026-09-28");
    expect(fimDaSemana("2026-09-30")).toBe("2026-10-04");
  });

  it("retorna a própria data quando já é segunda-feira", () => {
    expect(inicioDaSemana("2026-09-28")).toBe("2026-09-28");
  });

  it("retorna a própria data quando já é domingo", () => {
    expect(fimDaSemana("2026-10-04")).toBe("2026-10-04");
    expect(inicioDaSemana("2026-10-04")).toBe("2026-09-28");
  });

  it("atravessa a virada de ano corretamente", () => {
    expect(inicioDaSemana("2026-01-01")).toBe("2025-12-29");
    expect(fimDaSemana("2026-01-01")).toBe("2026-01-04");
  });

  it("lista as 7 datas da semana, de segunda a domingo", () => {
    expect(listarDiasDaSemana("2026-09-30")).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });
});

describe("timestampParaDataLocalISO", () => {
  it("converte pra um dia anterior quando o horário UTC já virou o dia mas ainda não virou em Brasília", () => {
    expect(timestampParaDataLocalISO("2026-09-30T02:00:00.000Z")).toBe("2026-09-29");
  });

  it("mantém o mesmo dia quando não há virada entre os fusos", () => {
    expect(timestampParaDataLocalISO("2026-09-30T15:00:00.000Z")).toBe("2026-09-30");
  });
});
