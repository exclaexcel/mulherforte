import { describe, expect, it } from "vitest";
import { lerNumeroObrigatorio, lerNumeroOpcional } from "./numero-formulario";

const positivo = (n: number) => n > 0;
const naoNegativo = (n: number) => n >= 0;

describe("lerNumeroOpcional", () => {
  it("vazio vira null, sem erro", () => {
    expect(lerNumeroOpcional("", positivo, "erro")).toEqual({ ok: true, valor: null });
    expect(lerNumeroOpcional("   ", positivo, "erro")).toEqual({ ok: true, valor: null });
    expect(lerNumeroOpcional(null, positivo, "erro")).toEqual({ ok: true, valor: null });
  });

  it("zero é valor quando a regra aceita: não vira ausência", () => {
    expect(lerNumeroOpcional("0", naoNegativo, "erro")).toEqual({ ok: true, valor: 0 });
  });

  it.each(["abc", "Infinity", "-Infinity", "NaN"])("'%s' não finito: erro", (valor) => {
    expect(lerNumeroOpcional(valor, naoNegativo, "mensagem")).toEqual({ ok: false, erro: "mensagem" });
  });

  it("fora da regra: erro com a mensagem informada", () => {
    expect(lerNumeroOpcional("-1", naoNegativo, "mensagem")).toEqual({ ok: false, erro: "mensagem" });
  });

  it("valor válido é devolvido como número", () => {
    expect(lerNumeroOpcional("58,1".replace(",", "."), positivo, "erro")).toEqual({ ok: true, valor: 58.1 });
  });
});

describe("lerNumeroObrigatorio", () => {
  it("vazio é erro", () => {
    expect(lerNumeroObrigatorio("", positivo, "obrigatório")).toEqual({ ok: false, erro: "obrigatório" });
  });

  it("preenchido segue a regra", () => {
    expect(lerNumeroObrigatorio("0", positivo, "maior que zero")).toEqual({ ok: false, erro: "maior que zero" });
    expect(lerNumeroObrigatorio("2", positivo, "maior que zero")).toEqual({ ok: true, valor: 2 });
  });
});
