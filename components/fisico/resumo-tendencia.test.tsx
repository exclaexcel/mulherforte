import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumoTendenciaPeso } from "./resumo-tendencia";
import { resumoTendencia } from "@/lib/fisico/resumoTendencia";
import type { PontoTendenciaPeso } from "@/lib/fisico/tendenciaPeso";

function ponto(overrides: Partial<PontoTendenciaPeso> = {}): PontoTendenciaPeso {
  return {
    data: "2026-10-05",
    pesoKg: 58.1,
    mediaMovel7d: 58.4,
    quantidadeRegistros7d: 4,
    janela7dCompleta: true,
    mediaMovel28d: 59.0,
    quantidadeRegistros28d: 12,
    janela28dCompleta: true,
    ...overrides,
  };
}

const html = (pontos: PontoTendenciaPeso[]) =>
  renderToStaticMarkup(<ResumoTendenciaPeso resumo={resumoTendencia(pontos)} />);

describe("ResumoTendenciaPeso — dados completos", () => {
  const completo = html([ponto(), ponto({ data: "2026-10-06", pesoKg: 57.9 })]);

  it("é uma seção com título visível, ligada a um cabeçalho", () => {
    expect(completo).toContain("<section");
    expect(completo).toContain("Resumo da tendência");
    expect(completo).toContain('aria-labelledby="titulo-resumo-tendencia"');
  });

  it("mostra último peso, média de 7 e de 28 dias, e quantas pesagens entraram", () => {
    expect(completo).toContain("Último peso registrado");
    expect(completo).toContain("57,9 kg");
    expect(completo).toContain("Média de 7 dias");
    expect(completo).toContain("Média de 28 dias");
    expect(completo).toContain("4 pesagens consideradas");
    expect(completo).toContain("12 pesagens consideradas");
  });

  it("não marca janela parcial quando ela está completa", () => {
    expect(completo).not.toContain("Janela ainda parcial");
  });

  it("deixa claro que é estimativa, sem meta nem previsão", () => {
    expect(completo).toContain("sem meta nem previsão");
  });
});

describe("ResumoTendenciaPeso — casos parciais e vazios", () => {
  it("janela parcial aparece como texto, não só como ausência", () => {
    const parcial = html([ponto({ janela7dCompleta: false, quantidadeRegistros7d: 2 })]);

    expect(parcial).toContain("Janela ainda parcial: o histórico tem menos de 7 dias.");
    expect(parcial).toContain("2 pesagens consideradas");
  });

  it("com um único ponto, diz que o histórico ainda não basta para tendência", () => {
    expect(html([ponto()])).toContain("Ainda não há histórico suficiente para observar uma tendência.");
  });

  it("sem pontos, não renderiza nada (a página mostra o estado vazio)", () => {
    expect(html([])).toBe("");
  });

  it("nunca mostra valor inventado: média sem dado diz que não há dados", () => {
    const sem = renderToStaticMarkup(
      <ResumoTendenciaPeso
        resumo={{
          ultimoPeso: { pesoKg: 58.1, data: "2026-10-05" },
          media7: null,
          media28: null,
          historicoSuficiente: true,
        }}
      />
    );

    expect(sem).toContain("Sem dados suficientes para esta média.");
    expect(sem).not.toContain("0,0 kg");
  });
});
