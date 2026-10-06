import { describe, expect, it } from "vitest";
import { houveFalhaDeConsulta, MENSAGEM_ERRO_LEITURA } from "./leitura";

describe("houveFalhaDeConsulta", () => {
  it("consultas sem erro não são falha, mesmo sem dados", () => {
    expect(houveFalhaDeConsulta({ error: null })).toBe(false);
    expect(houveFalhaDeConsulta({ error: undefined })).toBe(false);
  });

  it("consulta com erro é falha", () => {
    expect(houveFalhaDeConsulta({ error: { message: "falha de rede" } })).toBe(true);
  });

  it("qualquer falha entre várias consultas conta como falha da página", () => {
    expect(houveFalhaDeConsulta({ error: null }, { error: null }, { error: { code: "500" } })).toBe(
      true
    );
    expect(houveFalhaDeConsulta({ error: null }, { error: null })).toBe(false);
  });

  it("sem consultas não há falha", () => {
    expect(houveFalhaDeConsulta()).toBe(false);
  });
});

describe("mensagem de falha de leitura", () => {
  it("usa o texto aprovado, em pt-BR e sem detalhe técnico", () => {
    expect(MENSAGEM_ERRO_LEITURA).toBe(
      "Não foi possível carregar estas informações. Tente novamente."
    );
    expect(MENSAGEM_ERRO_LEITURA.toLowerCase()).not.toMatch(/supabase|postgres|relation|tabela/);
  });
});
