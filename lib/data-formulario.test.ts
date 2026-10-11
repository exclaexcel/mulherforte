import { describe, expect, it } from "vitest";
import { lerDataObrigatoria, lerDataOpcional } from "./data-formulario";

const HOJE = "2026-10-05";

describe("lerDataObrigatoria", () => {
  it("vazio: erro com a mensagem informada", () => {
    expect(lerDataObrigatoria(null, "Informe a data.", HOJE)).toEqual({
      ok: false,
      erro: "Informe a data.",
    });
    expect(lerDataObrigatoria("   ", "Informe a data.", HOJE)).toEqual({
      ok: false,
      erro: "Informe a data.",
    });
  });

  it("fora do formato AAAA-MM-DD: data inválida", () => {
    expect(lerDataObrigatoria("05/10/2026", "Informe a data.", HOJE)).toEqual({
      ok: false,
      erro: "Data inválida.",
    });
  });

  it("formato certo mas dia inexistente no calendário: data inválida (não cai no banco)", () => {
    expect(lerDataObrigatoria("2026-02-30", "Informe a data.", HOJE)).toEqual({
      ok: false,
      erro: "Data inválida.",
    });
    expect(lerDataObrigatoria("2026-04-31", "Informe a data.", HOJE)).toEqual({
      ok: false,
      erro: "Data inválida.",
    });
  });

  it("data futura: mensagem padrão de data futura", () => {
    expect(lerDataObrigatoria("2026-10-06", "Informe a data.", HOJE)).toEqual({
      ok: false,
      erro: "A data não pode estar no futuro.",
    });
  });

  it("data válida (hoje ou passado): ok com o valor", () => {
    expect(lerDataObrigatoria("2026-10-05", "Informe a data.", HOJE)).toEqual({
      ok: true,
      valor: "2026-10-05",
    });
    expect(lerDataObrigatoria("2026-01-01", "Informe a data.", HOJE)).toEqual({
      ok: true,
      valor: "2026-01-01",
    });
  });
});

describe("lerDataOpcional", () => {
  it("vazio vira ausência (null), não erro", () => {
    expect(lerDataOpcional(null, HOJE)).toEqual({ ok: true, valor: null });
    expect(lerDataOpcional("  ", HOJE)).toEqual({ ok: true, valor: null });
  });

  it("preenchido segue a mesma regra de obrigatória", () => {
    expect(lerDataOpcional("2026-02-30", HOJE)).toEqual({ ok: false, erro: "Data inválida." });
    expect(lerDataOpcional("2026-10-06", HOJE)).toEqual({
      ok: false,
      erro: "A data não pode estar no futuro.",
    });
    expect(lerDataOpcional("2026-10-05", HOJE)).toEqual({ ok: true, valor: "2026-10-05" });
  });
});
