import { describe, expect, it } from "vitest";
import { calcularIdadeAnos } from "../date";
import {
  calcularIMC,
  calcularRCEst,
  calcularRCQ,
  calcularRFM,
  calcularRelacaoCinturaCoxa,
  calcularTMB,
  classificarRCEst,
  classificarRCQ,
  formatarRCEst,
} from "./indicadores";

// Massa de teste oficial: cintura=77, quadril=96, coxa=60, altura=152.
const MASSA_TESTE = { cintura: 77, quadril: 96, coxa: 60, altura: 152 };

describe("RCEst", () => {
  it("77/152 exibe 0,51 e classifica como adiposidade central aumentada", () => {
    const resultado = calcularRCEst(MASSA_TESTE.cintura, MASSA_TESTE.altura);
    expect(resultado.valorExibicao).toBe(0.51);
    expect(resultado.classificacao).toBe("Adiposidade central aumentada");
  });

  it("não trunca: o valor exibido vem de arredondamento padrão (0,5066 -> 0,51)", () => {
    expect(formatarRCEst(0.506578947368421)).toBe(0.51);
  });

  it("mantém o valor bruto com precisão completa, sem arredondar", () => {
    const resultado = calcularRCEst(MASSA_TESTE.cintura, MASSA_TESTE.altura);
    expect(resultado.valorBruto).toBeCloseTo(0.506578947368421, 10);
  });

  it("classifica 0,499 na primeira faixa", () => {
    expect(classificarRCEst(0.499)).toBe("Abaixo do ponto de atenção para adiposidade central");
  });

  it("classifica 0,500 na segunda faixa (fronteira inclusiva pra cima)", () => {
    expect(classificarRCEst(0.5)).toBe("Adiposidade central aumentada");
  });

  it("classifica 0,600 na terceira faixa (fronteira inclusiva pra cima)", () => {
    expect(classificarRCEst(0.6)).toBe("Adiposidade central elevada");
  });

  it("classifica pelo valor BRUTO, não pelo valor já arredondado pra exibição", () => {
    // cintura=49,96 / altura=100 -> bruto=0,4996 (abaixo de 0,5) mas arredonda pra 0,50
    const abaixoDaFronteira = calcularRCEst(49.96, 100);
    expect(abaixoDaFronteira.valorExibicao).toBe(0.5);
    expect(abaixoDaFronteira.classificacao).toBe(
      "Abaixo do ponto de atenção para adiposidade central"
    );

    // cintura=50,04 / altura=100 -> bruto=0,5004 (acima de 0,5) também arredonda pra 0,50
    const acimaDaFronteira = calcularRCEst(50.04, 100);
    expect(acimaDaFronteira.valorExibicao).toBe(0.5);
    expect(acimaDaFronteira.classificacao).toBe("Adiposidade central aumentada");
  });

  it("não calcula com altura ausente, zero ou negativa", () => {
    expect(calcularRCEst(77, null)).toEqual({
      valorBruto: null,
      valorExibicao: null,
      classificacao: null,
    });
    expect(calcularRCEst(77, 0).valorBruto).toBeNull();
    expect(calcularRCEst(77, -10).valorBruto).toBeNull();
  });

  it("não calcula com cintura ausente, zero ou negativa", () => {
    expect(calcularRCEst(null, 152).valorBruto).toBeNull();
    expect(calcularRCEst(0, 152).valorBruto).toBeNull();
    expect(calcularRCEst(-5, 152).valorBruto).toBeNull();
  });
});

describe("RCQ", () => {
  it("77/96 exibe 0,80", () => {
    const resultado = calcularRCQ(MASSA_TESTE.cintura, MASSA_TESTE.quadril);
    expect(resultado.valorExibicao).toBe(0.8);
  });

  it("apesar da exibição 0,80, classifica como faixa intermediária (bruto 0,802083... >= 0,80)", () => {
    const resultado = calcularRCQ(MASSA_TESTE.cintura, MASSA_TESTE.quadril);
    expect(resultado.valorBruto).toBeCloseTo(0.802083333333, 10);
    expect(resultado.classificacao).toBe("Faixa intermediária");
  });

  it("classifica 0,799 na primeira faixa", () => {
    expect(classificarRCQ(0.799)).toBe("Faixa inferior de distribuição abdominal");
  });

  it("classifica 0,800 na faixa intermediária", () => {
    expect(classificarRCQ(0.8)).toBe("Faixa intermediária");
  });

  it('classifica 0,850 em "Ponto de atenção para obesidade abdominal"', () => {
    expect(classificarRCQ(0.85)).toBe("Ponto de atenção para obesidade abdominal");
  });

  it("não calcula com quadril ausente, zero ou negativo", () => {
    expect(calcularRCQ(77, null).valorBruto).toBeNull();
    expect(calcularRCQ(77, 0).valorBruto).toBeNull();
    expect(calcularRCQ(77, -5).valorBruto).toBeNull();
  });

  it("não calcula com cintura ausente, zero ou negativa", () => {
    expect(calcularRCQ(null, 96).valorBruto).toBeNull();
    expect(calcularRCQ(0, 96).valorBruto).toBeNull();
  });
});

describe("RFM feminina", () => {
  it("altura 152 e cintura 77 resultam em 36,5%", () => {
    const resultado = calcularRFM(MASSA_TESTE.altura, MASSA_TESTE.cintura);
    expect(resultado.valorExibicao).toBe(36.5);
  });

  it("mantém o valor bruto com precisão completa", () => {
    const resultado = calcularRFM(MASSA_TESTE.altura, MASSA_TESTE.cintura);
    expect(resultado.valorBruto).toBeCloseTo(36.51948051948052, 10);
  });

  it("não possui campo de classificação clínica", () => {
    const resultado = calcularRFM(MASSA_TESTE.altura, MASSA_TESTE.cintura);
    expect(resultado).not.toHaveProperty("classificacao");
  });

  it("não calcula com cintura ausente, zero ou negativa (divisão por zero)", () => {
    expect(calcularRFM(152, null).valorBruto).toBeNull();
    expect(calcularRFM(152, 0).valorBruto).toBeNull();
    expect(calcularRFM(152, -1).valorBruto).toBeNull();
  });

  it("não calcula com altura ausente, zero ou negativa", () => {
    expect(calcularRFM(null, 77).valorBruto).toBeNull();
    expect(calcularRFM(0, 77).valorBruto).toBeNull();
  });
});

describe("Relação Cintura-Coxa (exploratório, sem classificação)", () => {
  it("77/60 exibe 1,28", () => {
    const resultado = calcularRelacaoCinturaCoxa(MASSA_TESTE.cintura, MASSA_TESTE.coxa);
    expect(resultado.valorExibicao).toBe(1.28);
  });

  it("não possui campo de classificação clínica", () => {
    const resultado = calcularRelacaoCinturaCoxa(MASSA_TESTE.cintura, MASSA_TESTE.coxa);
    expect(resultado).not.toHaveProperty("classificacao");
  });

  it("não calcula com coxa ausente, zero ou negativa", () => {
    expect(calcularRelacaoCinturaCoxa(77, null).valorBruto).toBeNull();
    expect(calcularRelacaoCinturaCoxa(77, 0).valorBruto).toBeNull();
  });
});

describe("IMC (informativo, sem classificação)", () => {
  it("calcula a partir de peso e altura", () => {
    expect(calcularIMC(58.1, 152).valorExibicao).toBe(25.1);
  });

  it("não calcula com peso ou altura ausentes, zero ou negativos", () => {
    expect(calcularIMC(null, 152).valorBruto).toBeNull();
    expect(calcularIMC(58.1, null).valorBruto).toBeNull();
    expect(calcularIMC(0, 152).valorBruto).toBeNull();
    expect(calcularIMC(58.1, 0).valorBruto).toBeNull();
  });
});

describe("Metabolismo de repouso estimado (Mifflin-St Jeor feminina)", () => {
  it("calcula peso 58,1kg, altura 152cm, idade 35 anos -> 1195 kcal/dia", () => {
    // 10*58,1 + 6,25*152 - 5*35 - 161 = 581 + 950 - 175 - 161 = 1195
    expect(calcularTMB(58.1, 152, 35).valorExibicao).toBe(1195);
  });

  it("usa a idade correta considerando se o aniversário já ocorreu no ano", () => {
    // Data de nascimento fictícia e neutra, só pra teste.
    const dataNascimento = "1990-05-20";
    const idadeAntesDoAniversario = calcularIdadeAnos(dataNascimento, "2026-05-19");
    const idadeDepoisDoAniversario = calcularIdadeAnos(dataNascimento, "2026-05-21");

    expect(idadeAntesDoAniversario).toBe(35);
    expect(idadeDepoisDoAniversario).toBe(36);
    expect(calcularTMB(58.1, 152, idadeAntesDoAniversario).valorExibicao).not.toBe(
      calcularTMB(58.1, 152, idadeDepoisDoAniversario).valorExibicao
    );
  });

  it("não calcula sem peso, altura ou idade", () => {
    expect(calcularTMB(null, 152, 35).valorBruto).toBeNull();
    expect(calcularTMB(58.1, null, 35).valorBruto).toBeNull();
    expect(calcularTMB(58.1, 152, null).valorBruto).toBeNull();
  });

  it("não calcula com peso ou altura zero/negativos", () => {
    expect(calcularTMB(0, 152, 35).valorBruto).toBeNull();
    expect(calcularTMB(-10, 152, 35).valorBruto).toBeNull();
    expect(calcularTMB(58.1, 0, 35).valorBruto).toBeNull();
  });

  it("não calcula com idade negativa (data de nascimento no futuro)", () => {
    const idadeFutura = calcularIdadeAnos("2030-01-01", "2026-09-30");
    expect(idadeFutura).toBeLessThan(0);
    expect(calcularTMB(58.1, 152, idadeFutura).valorBruto).toBeNull();
  });
});
