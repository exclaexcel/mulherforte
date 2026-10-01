import { describe, expect, it } from "vitest";
import { calcularLinhaTendenciaPeso, type RegistroPeso } from "./tendenciaPeso";

describe("calcularLinhaTendenciaPeso — casos básicos", () => {
  it("array vazio retorna []", () => {
    expect(calcularLinhaTendenciaPeso([])).toEqual([]);
  });

  it("um único registro: médias iguais ao próprio valor, janelas parciais", () => {
    const resultado = calcularLinhaTendenciaPeso([{ data: "2026-02-01", pesoKg: 62.4 }]);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].pesoKg).toBe(62.4);
    expect(resultado[0].mediaMovel7d).toBe(62.4);
    expect(resultado[0].quantidadeRegistros7d).toBe(1);
    expect(resultado[0].janela7dCompleta).toBe(false);
    expect(resultado[0].mediaMovel28d).toBe(62.4);
    expect(resultado[0].quantidadeRegistros28d).toBe(1);
    expect(resultado[0].janela28dCompleta).toBe(false);
  });

  it("dois registros fictícios com 26 dias de intervalo: MM7 só o 2º, MM28 os dois", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-02-01", pesoKg: 62.4 },
      { data: "2026-02-27", pesoKg: 61.9 }, // 26 dias depois
    ];

    const resultado = calcularLinhaTendenciaPeso(registros);

    expect(resultado).toHaveLength(2); // nenhuma data intermediária criada

    const [primeiro, segundo] = resultado;
    expect(primeiro.quantidadeRegistros7d).toBe(1);
    expect(primeiro.mediaMovel7d).toBe(62.4);

    // MM7 do segundo ponto usa só o segundo registro (o primeiro está a 26 dias, fora da janela de 7).
    expect(segundo.quantidadeRegistros7d).toBe(1);
    expect(segundo.mediaMovel7d).toBe(61.9);

    // MM28 do segundo ponto usa os dois (26 dias cabe dentro da janela de 28).
    expect(segundo.quantidadeRegistros28d).toBe(2);
    expect(segundo.mediaMovel28d).toBeCloseTo((62.4 + 61.9) / 2, 10);
    expect(segundo.janela28dCompleta).toBe(false); // só 26 dias de histórico, ainda não completou 27
  });
});

describe("calcularLinhaTendenciaPeso — ordenação e imutabilidade", () => {
  it("aceita registros fora de ordem e devolve ordenado por data crescente", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-03-08", pesoKg: 62.0 },
      { data: "2026-03-01", pesoKg: 60.0 },
      { data: "2026-03-07", pesoKg: 61.0 },
    ];

    const resultado = calcularLinhaTendenciaPeso(registros);

    expect(resultado.map((p) => p.data)).toEqual(["2026-03-01", "2026-03-07", "2026-03-08"]);
  });

  it("não modifica o array original recebido", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-03-08", pesoKg: 62.0 },
      { data: "2026-03-01", pesoKg: 60.0 },
    ];
    const copiaOriginal = registros.map((r) => ({ ...r }));

    calcularLinhaTendenciaPeso(registros);

    expect(registros).toEqual(copiaOriginal);
  });
});

describe("calcularLinhaTendenciaPeso — fronteiras da janela de 7 dias", () => {
  const registros: RegistroPeso[] = [
    { data: "2026-03-01", pesoKg: 60.0 }, // A
    { data: "2026-03-07", pesoKg: 61.0 }, // B, 6 dias depois de A
    { data: "2026-03-08", pesoKg: 62.0 }, // C, 7 dias depois de A, 1 dia depois de B
  ];
  const resultado = calcularLinhaTendenciaPeso(registros);
  const [, pontoB, pontoC] = resultado;

  it("inclui um registro a exatamente 6 dias de distância (limite inclusivo)", () => {
    expect(pontoB.quantidadeRegistros7d).toBe(2); // A e B
    expect(pontoB.mediaMovel7d).toBeCloseTo((60.0 + 61.0) / 2, 10);
  });

  it("exclui um registro a exatamente 7 dias de distância", () => {
    // Pro ponto C, A está a 7 dias (fora), só B (1 dia) entra.
    expect(pontoC.quantidadeRegistros7d).toBe(2); // B e C, não A
    expect(pontoC.mediaMovel7d).toBeCloseTo((61.0 + 62.0) / 2, 10);
  });
});

describe("calcularLinhaTendenciaPeso — fronteiras da janela de 28 dias", () => {
  it("inclui um registro a exatamente 27 dias de distância (limite inclusivo) e marca janela completa", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-03-01", pesoKg: 60.0 },
      { data: "2026-03-28", pesoKg: 65.0 }, // 27 dias depois
    ];
    const [, ponto] = calcularLinhaTendenciaPeso(registros);

    expect(ponto.quantidadeRegistros28d).toBe(2);
    expect(ponto.mediaMovel28d).toBeCloseTo((60.0 + 65.0) / 2, 10);
    expect(ponto.janela28dCompleta).toBe(true);
  });

  it("exclui um registro a exatamente 28 dias de distância", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-03-01", pesoKg: 60.0 },
      { data: "2026-03-29", pesoKg: 66.0 }, // 28 dias depois
    ];
    const [, ponto] = calcularLinhaTendenciaPeso(registros);

    expect(ponto.quantidadeRegistros28d).toBe(1); // só ele mesmo
    expect(ponto.mediaMovel28d).toBe(66.0);
  });
});

describe("calcularLinhaTendenciaPeso — virada de mês e de ano", () => {
  it("calcula a janela corretamente atravessando a virada de mês", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-01-28", pesoKg: 70.0 },
      { data: "2026-02-02", pesoKg: 71.0 }, // 5 dias depois, atravessa jan->fev
    ];
    const [, ponto] = calcularLinhaTendenciaPeso(registros);

    expect(ponto.quantidadeRegistros7d).toBe(2);
    expect(ponto.mediaMovel7d).toBeCloseTo((70.0 + 71.0) / 2, 10);
  });

  it("calcula a janela corretamente atravessando a virada de ano", () => {
    const registros: RegistroPeso[] = [
      { data: "2025-12-29", pesoKg: 72.0 },
      { data: "2026-01-03", pesoKg: 73.0 }, // 5 dias depois, atravessa 2025->2026
    ];
    const [, ponto] = calcularLinhaTendenciaPeso(registros);

    expect(ponto.quantidadeRegistros7d).toBe(2);
    expect(ponto.mediaMovel7d).toBeCloseTo((72.0 + 73.0) / 2, 10);
  });
});

describe("calcularLinhaTendenciaPeso — precisão e janela parcial/completa", () => {
  it("mantém a precisão bruta da média, sem arredondar internamente (dízima)", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-04-01", pesoKg: 60.0 },
      { data: "2026-04-02", pesoKg: 60.0 },
      { data: "2026-04-03", pesoKg: 60.1 },
    ];
    const resultado = calcularLinhaTendenciaPeso(registros);
    const ultimo = resultado[resultado.length - 1];

    expect(ultimo.quantidadeRegistros7d).toBe(3);
    expect(ultimo.mediaMovel7d).toBeCloseTo(60.03333333333333, 10);
    expect(ultimo.mediaMovel7d).not.toBe(60.0);
    expect(ultimo.mediaMovel7d).not.toBe(60.03); // não arredonda pra 2 casas internamente
  });

  it("marca janela parcial quando o histórico total ainda é curto", () => {
    const [ponto] = calcularLinhaTendenciaPeso([{ data: "2026-05-01", pesoKg: 60.0 }]);

    expect(ponto.janela7dCompleta).toBe(false);
    expect(ponto.janela28dCompleta).toBe(false);
  });

  it("marca janela completa quando o histórico total já é longo o bastante", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-05-01", pesoKg: 60.0 },
      { data: "2026-05-29", pesoKg: 61.0 }, // 28 dias depois: 7d e 28d completas aqui
    ];
    const [, ponto] = calcularLinhaTendenciaPeso(registros);

    expect(ponto.janela7dCompleta).toBe(true);
    expect(ponto.janela28dCompleta).toBe(true);
  });
});

describe("calcularLinhaTendenciaPeso — defesa de dados inválidos", () => {
  it("converte com segurança um peso que chega como string (quirk do Postgres numeric via Supabase)", () => {
    const registros = [{ data: "2026-06-01", pesoKg: "61.9" as unknown as number }];
    const resultado = calcularLinhaTendenciaPeso(registros);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].pesoKg).toBe(61.9);
    expect(typeof resultado[0].pesoKg).toBe("number");
  });

  it("ignora defensivamente pesos inválidos sem contaminar as médias dos registros válidos", () => {
    const registros = [
      { data: "2026-06-01", pesoKg: 60.0 },
      { data: "2026-06-02", pesoKg: 0 }, // inválido: zero
      { data: "2026-06-03", pesoKg: -5 }, // inválido: negativo
      { data: "2026-06-04", pesoKg: "abc" as unknown as number }, // inválido: não numérico
      { data: "2026-06-05", pesoKg: 62.0 },
    ];

    const resultado = calcularLinhaTendenciaPeso(registros);

    expect(resultado).toHaveLength(2); // só os 2 válidos
    expect(resultado.map((p) => p.data)).toEqual(["2026-06-01", "2026-06-05"]);
    expect(resultado[1].quantidadeRegistros7d).toBe(2);
    expect(resultado[1].mediaMovel7d).toBeCloseTo((60.0 + 62.0) / 2, 10);
  });

  it("nenhuma data intermediária é criada mesmo com registros esparsos", () => {
    const registros: RegistroPeso[] = [
      { data: "2026-07-01", pesoKg: 60.0 },
      { data: "2026-07-20", pesoKg: 61.0 },
      { data: "2026-08-15", pesoKg: 62.0 },
    ];

    const resultado = calcularLinhaTendenciaPeso(registros);

    expect(resultado).toHaveLength(3);
    expect(resultado.map((p) => p.data)).toEqual(["2026-07-01", "2026-07-20", "2026-08-15"]);
  });
});
