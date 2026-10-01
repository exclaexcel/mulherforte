import { describe, expect, it } from "vitest";
import { selecionarMedidaReferencia, verificarVariacaoAtipica } from "./medidas";

const DATA_REFERENCIA = "2026-09-30";

/** Constrói uma data ISO N dias antes de DATA_REFERENCIA. */
function diasAntes(n: number): string {
  const data = new Date(Date.UTC(2026, 8, 30));
  data.setUTCDate(data.getUTCDate() - n);
  return data.toISOString().slice(0, 10);
}

describe("selecionarMedidaReferencia", () => {
  it("ignora candidata a 20 dias (fora da janela, abaixo do limite)", () => {
    const resultado = selecionarMedidaReferencia(
      [{ data: diasAntes(20), valorCm: 77 }],
      DATA_REFERENCIA
    );
    expect(resultado).toBeNull();
  });

  it("aceita candidata a 21 dias (dentro da janela, limite inferior)", () => {
    const resultado = selecionarMedidaReferencia(
      [{ data: diasAntes(21), valorCm: 77 }],
      DATA_REFERENCIA
    );
    expect(resultado).toEqual({ data: diasAntes(21), valorCm: 77 });
  });

  it("aceita candidata a 30 dias (referência ideal)", () => {
    const resultado = selecionarMedidaReferencia(
      [{ data: diasAntes(30), valorCm: 77 }],
      DATA_REFERENCIA
    );
    expect(resultado).toEqual({ data: diasAntes(30), valorCm: 77 });
  });

  it("aceita candidata a 45 dias (dentro da janela, limite superior)", () => {
    const resultado = selecionarMedidaReferencia(
      [{ data: diasAntes(45), valorCm: 77 }],
      DATA_REFERENCIA
    );
    expect(resultado).toEqual({ data: diasAntes(45), valorCm: 77 });
  });

  it("ignora candidata a 46 dias (fora da janela, acima do limite)", () => {
    const resultado = selecionarMedidaReferencia(
      [{ data: diasAntes(46), valorCm: 77 }],
      DATA_REFERENCIA
    );
    expect(resultado).toBeNull();
  });

  it("com múltiplos registros na janela, seleciona o mais próximo de 30 dias", () => {
    const resultado = selecionarMedidaReferencia(
      [
        { data: diasAntes(22), valorCm: 70 }, // distância 8
        { data: diasAntes(29), valorCm: 75 }, // distância 1 — vence
        { data: diasAntes(40), valorCm: 80 }, // distância 10
      ],
      DATA_REFERENCIA
    );
    expect(resultado).toEqual({ data: diasAntes(29), valorCm: 75 });
  });

  it("em empate na distância pra 30 dias, seleciona o registro mais recente", () => {
    const resultado = selecionarMedidaReferencia(
      [
        { data: diasAntes(25), valorCm: 70 }, // distância 5, mais recente
        { data: diasAntes(35), valorCm: 80 }, // distância 5, mais antigo
      ],
      DATA_REFERENCIA
    );
    expect(resultado).toEqual({ data: diasAntes(25), valorCm: 70 });
  });

  it("sem nenhuma candidata, retorna null (sem referência, sem alerta)", () => {
    expect(selecionarMedidaReferencia([], DATA_REFERENCIA)).toBeNull();
  });
});

describe("verificarVariacaoAtipica", () => {
  it("retorna false sem valor anterior (nunca falso-positivo na primeira medida)", () => {
    expect(verificarVariacaoAtipica(77, null)).toBe(false);
  });

  it("não alerta quando a diferença é exatamente igual a 3 cm", () => {
    expect(verificarVariacaoAtipica(77, 74)).toBe(false);
    expect(verificarVariacaoAtipica(77, 80)).toBe(false);
  });

  it("alerta quando a diferença é superior a 3 cm", () => {
    expect(verificarVariacaoAtipica(77, 73.9)).toBe(true);
  });

  it("alerta quando a diferença negativa é superior a 3 cm em valor absoluto", () => {
    expect(verificarVariacaoAtipica(70, 74)).toBe(true);
  });

  it("respeita um limiar customizado", () => {
    expect(verificarVariacaoAtipica(77, 76, 0.5)).toBe(true);
  });
});

describe("ausência de valor anterior para uma região específica", () => {
  it("não alerta essa região quando ela não tem nenhuma candidata na janela", () => {
    const referencia = selecionarMedidaReferencia([], DATA_REFERENCIA);
    expect(referencia).toBeNull();
    expect(verificarVariacaoAtipica(77, referencia?.valorCm ?? null)).toBe(false);
  });
});
