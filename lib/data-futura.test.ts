import { afterEach, describe, expect, it, vi } from "vitest";
import { ehDataFutura, hojeISO } from "./date";

afterEach(() => {
  vi.useRealTimers();
});

describe("ehDataFutura", () => {
  const hoje = "2026-10-05";

  it("hoje não é futuro", () => {
    expect(ehDataFutura("2026-10-05", hoje)).toBe(false);
  });

  it("ontem não é futuro", () => {
    expect(ehDataFutura("2026-10-04", hoje)).toBe(false);
  });

  it("amanhã é futuro", () => {
    expect(ehDataFutura("2026-10-06", hoje)).toBe(true);
  });

  it("virada de mês: 1º de outubro é futuro em 30 de setembro", () => {
    expect(ehDataFutura("2026-10-01", "2026-09-30")).toBe(true);
    expect(ehDataFutura("2026-09-30", "2026-09-30")).toBe(false);
  });

  it("virada de ano: 1º de janeiro é futuro em 31 de dezembro", () => {
    expect(ehDataFutura("2027-01-01", "2026-12-31")).toBe(true);
    expect(ehDataFutura("2026-12-31", "2026-12-31")).toBe(false);
  });

  it("formato inválido não é tratado como futuro (quem valida o formato é a action)", () => {
    expect(ehDataFutura("2026-1-5", hoje)).toBe(false);
    expect(ehDataFutura("", hoje)).toBe(false);
  });
});

describe("hojeISO usa o horário de Brasília, não UTC", () => {
  it("às 02:30 UTC do dia 1º ainda é 30 de setembro em Brasília", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T02:30:00Z"));

    expect(hojeISO()).toBe("2026-09-30");
    expect(ehDataFutura("2026-10-01")).toBe(true);
  });

  it("depois das 03:00 UTC já é o dia seguinte em Brasília", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-01T03:30:00Z"));

    expect(hojeISO()).toBe("2026-10-01");
    expect(ehDataFutura("2026-10-01")).toBe(false);
  });
});
