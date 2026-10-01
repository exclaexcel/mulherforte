import { describe, expect, it } from "vitest";
import {
  calcularScoreSemanal,
  metaHidratacaoValidaNaSemana,
  obterStatusDia,
  semanaVencida,
} from "./score";

describe("semanaVencida", () => {
  it("17/20 = 85% -> true (fronteira exata, inclusiva)", () => {
    expect(semanaVencida(17, 20)).toBe(true);
  });

  it("16/20 = 80% -> false", () => {
    expect(semanaVencida(16, 20)).toBe(false);
  });

  it("15/18 = 83,33% -> false", () => {
    expect(semanaVencida(15, 18)).toBe(false);
  });

  it("16/18 = 88,89% -> true", () => {
    expect(semanaVencida(16, 18)).toBe(true);
  });

  it("0 oportunidades -> false", () => {
    expect(semanaVencida(0, 0)).toBe(false);
  });
});

describe("obterStatusDia", () => {
  it("classifica data anterior a hoje como passado", () => {
    expect(obterStatusDia("2026-09-28", "2026-09-30")).toBe("passado");
  });

  it("classifica a própria data de hoje como hoje", () => {
    expect(obterStatusDia("2026-09-30", "2026-09-30")).toBe("hoje");
  });

  it("classifica data posterior a hoje como futuro", () => {
    expect(obterStatusDia("2026-10-02", "2026-09-30")).toBe("futuro");
  });
});

describe("metaHidratacaoValidaNaSemana", () => {
  const INICIO_SEMANA = "2026-09-28"; // segunda-feira

  it("meta criada antes do início da semana: válida", () => {
    expect(metaHidratacaoValidaNaSemana("2026-09-20T10:00:00.000Z", INICIO_SEMANA)).toBe(true);
  });

  it("meta criada no próprio início da semana (segunda): ainda não válida", () => {
    expect(metaHidratacaoValidaNaSemana("2026-09-28T10:00:00.000Z", INICIO_SEMANA)).toBe(false);
  });

  it("meta criada no meio da semana: não válida nessa semana", () => {
    expect(metaHidratacaoValidaNaSemana("2026-09-30T10:00:00.000Z", INICIO_SEMANA)).toBe(false);
  });

  it("sem meta nenhuma: não válida", () => {
    expect(metaHidratacaoValidaNaSemana(null, INICIO_SEMANA)).toBe(false);
  });

  it("usa a data local (fuso Brasília), não a data UTC crua", () => {
    // 2026-09-28T02:00:00Z é, em Brasília (UTC-3), ainda 2026-09-27 (domingo) —
    // ou seja, ANTES da segunda-feira, mesmo com a string UTC já mostrando o dia 28.
    expect(metaHidratacaoValidaNaSemana("2026-09-28T02:00:00.000Z", INICIO_SEMANA)).toBe(true);
  });
});

describe("calcularScoreSemanal", () => {
  it("exemplo do desenho: hoje com proteína feita e hidratação/treino pendentes", () => {
    // hojeISO = segunda-feira da própria semana (Move's obrigatório) — nenhum dia
    // anterior dessa semana existe, só "hoje" entra em jogo.
    const resultado = calcularScoreSemanal({
      hojeISO: "2026-09-28",
      habitos: [{ data: "2026-09-28", priorizouProteina: true, bebeuAguaMeta: false }],
      treinos: [],
      metaHidratacaoValida: true,
    });

    expect(resultado.detalhePorCategoria.proteina).toEqual({ pontos: 1, oportunidades: 1 });
    expect(resultado.detalhePorCategoria.hidratacao).toEqual({ pontos: 0, oportunidades: 0 });
    expect(resultado.detalhePorCategoria.treino).toEqual({ pontos: 0, oportunidades: 0 });
    expect(resultado.pontosObtidos).toBe(1);
    expect(resultado.oportunidades).toBe(1);
    expect(resultado.scoreBruto).toBe(100);
  });

  it("agrega uma semana parcial com dias passados variados (seg a qui, hoje=qui)", () => {
    const resultado = calcularScoreSemanal({
      hojeISO: "2026-10-01", // quinta-feira (zumba obrigatória)
      habitos: [
        { data: "2026-09-28", priorizouProteina: true, bebeuAguaMeta: true },
        { data: "2026-09-29", priorizouProteina: false, bebeuAguaMeta: true },
        // 2026-09-30: sem registro (ausência)
        { data: "2026-10-01", priorizouProteina: true, bebeuAguaMeta: false }, // hoje
      ],
      treinos: [
        { data: "2026-09-28", tipo: "moves", realizado: true },
        { data: "2026-09-29", tipo: "zumba", realizado: false },
        // 2026-09-30: sem registro (ausência)
        // 2026-10-01 (hoje): sem registro ainda (pendente)
      ],
      metaHidratacaoValida: true,
    });

    // Proteína: passado 28(sim)/29(não)/30(ausência)=1 ponto de 3; hoje realizado soma +1/+1.
    expect(resultado.detalhePorCategoria.proteina).toEqual({ pontos: 2, oportunidades: 4 });
    // Hidratação: passado 28(sim)/29(sim)/30(ausência)=2 pontos de 3; hoje pendente fica fora.
    expect(resultado.detalhePorCategoria.hidratacao).toEqual({ pontos: 2, oportunidades: 3 });
    // Treino: passado 28(sim)/29(não)/30(ausência)=1 ponto de 3; hoje (zumba) pendente fica fora.
    expect(resultado.detalhePorCategoria.treino).toEqual({ pontos: 1, oportunidades: 3 });

    expect(resultado.pontosObtidos).toBe(5);
    expect(resultado.oportunidades).toBe(10);
    expect(resultado.scoreBruto).toBe(50);
    expect(resultado.semanaVencida).toBe(false);
  });

  it("ausência total de registro em dias passados conta como não realizado, não como indisponível", () => {
    const resultado = calcularScoreSemanal({
      hojeISO: "2026-10-04", // domingo — segunda a sábado inteiros são passado
      habitos: [],
      treinos: [],
      metaHidratacaoValida: true,
    });

    expect(resultado.detalhePorCategoria.proteina).toEqual({ pontos: 0, oportunidades: 6 });
    expect(resultado.detalhePorCategoria.hidratacao).toEqual({ pontos: 0, oportunidades: 6 });
    // Só seg/ter/qua/qui (4 dias) têm treino obrigatório dentro de seg-sáb.
    expect(resultado.detalhePorCategoria.treino).toEqual({ pontos: 0, oportunidades: 4 });
    expect(resultado.pontosObtidos).toBe(0);
    expect(resultado.oportunidades).toBe(16);
    expect(resultado.scoreBruto).toBe(0);
    expect(resultado.semanaVencida).toBe(false);
  });

  it("treino opcional realizado não soma ponto nem oportunidade, só aparece como informativo", () => {
    const resultado = calcularScoreSemanal({
      hojeISO: "2026-10-04", // domingo
      habitos: [],
      treinos: [{ data: "2026-10-02", tipo: "outro", realizado: true }], // sexta, sem obrigatoriedade
      metaHidratacaoValida: false,
    });

    expect(resultado.detalhePorCategoria.treino).toEqual({ pontos: 0, oportunidades: 4 });
    expect(resultado.treinosOpcionaisRealizados).toEqual(["2026-10-02"]);
  });

  it("hidratação fica inteiramente fora do cálculo quando a meta não é válida na semana", () => {
    const resultado = calcularScoreSemanal({
      hojeISO: "2026-09-29",
      habitos: [{ data: "2026-09-28", priorizouProteina: false, bebeuAguaMeta: true }],
      treinos: [],
      metaHidratacaoValida: false,
    });

    expect(resultado.detalhePorCategoria.hidratacao).toEqual({ pontos: 0, oportunidades: 0 });
  });

  it("sem nenhuma oportunidade na semana ainda: score indisponível (null), nunca 0%", () => {
    const resultado = calcularScoreSemanal({
      hojeISO: "2026-09-28", // segunda-feira, nada realizado ainda hoje
      habitos: [],
      treinos: [],
      metaHidratacaoValida: false,
    });

    expect(resultado.oportunidades).toBe(0);
    expect(resultado.scoreBruto).toBeNull();
    expect(resultado.scoreExibicao).toBeNull();
    expect(resultado.semanaVencida).toBe(false);
  });

  it("dias futuros nunca entram no cálculo", () => {
    const resultado = calcularScoreSemanal({
      hojeISO: "2026-09-28",
      habitos: [{ data: "2026-10-04", priorizouProteina: true, bebeuAguaMeta: true }], // domingo, futuro
      treinos: [],
      metaHidratacaoValida: true,
    });

    expect(resultado.pontosObtidos).toBe(0);
    expect(resultado.oportunidades).toBe(0);
  });
});
