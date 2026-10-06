import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COR_MEDIA_7 } from "@/components/fisico/grafico-tendencia-peso";

/** Razão de contraste WCAG 2.x entre duas cores hex, com a superfície real (sem mistura de fundo). */
function hex(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
function luminancia([r, g, b]: [number, number, number]) {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}
function razao(a: [number, number, number], b: [number, number, number]) {
  const x = luminancia(a);
  const y = luminancia(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** Cor sólida resultante de uma cor com opacidade `alfa` sobre um fundo. */
function sobre(cor: string, alfa: number, fundo: [number, number, number]): [number, number, number] {
  const c = hex(cor);
  return c.map((v, i) => Math.round(alfa * v + (1 - alfa) * fundo[i])) as [number, number, number];
}

const BEGE = hex("#F7F3EB");
const BRANCO: [number, number, number] = [255, 255, 255];
const PAINEL = sobre("#FFFFFF", 0.8, BEGE); // bg-white/80 sobre o bege
const OLIVA = "#4A5D23";
const OLIVA_DARK = "#3A4A1C";
const ROSA_SOFT_60 = sobre("#F5D6D8", 0.6, BEGE); // bg-rosa-soft/60 sobre o bege

describe("contraste das combinações finais (superfície real)", () => {
  it("texto oliva/85 sobre o bege: ≥ 4,5:1", () => {
    expect(razao(sobre(OLIVA, 0.85, BEGE), BEGE)).toBeGreaterThanOrEqual(4.5);
  });

  it("texto oliva/85 sobre o painel branco/80: ≥ 4,5:1", () => {
    expect(razao(sobre(OLIVA, 0.85, PAINEL), PAINEL)).toBeGreaterThanOrEqual(4.5);
  });

  it("texto oliva/85 sobre branco (campos e cartões): ≥ 4,5:1", () => {
    expect(razao(sobre(OLIVA, 0.85, BRANCO), BRANCO)).toBeGreaterThanOrEqual(4.5);
  });

  it("texto oliva-dark/85 na aba inativa rosa: ≥ 4,5:1", () => {
    expect(razao(sobre(OLIVA_DARK, 0.85, ROSA_SOFT_60), ROSA_SOFT_60)).toBeGreaterThanOrEqual(4.5);
  });

  it("notas stone-600 sobre o bege: ≥ 4,5:1", () => {
    expect(razao(hex("#57534E"), BEGE)).toBeGreaterThanOrEqual(4.5);
  });

  it("placeholder stone-500 sobre campo branco: ≥ 4,5:1", () => {
    expect(razao(hex("#78716C"), BRANCO)).toBeGreaterThanOrEqual(4.5);
  });

  it("borda de campo oliva/70 sobre branco: ≥ 3:1 (não-texto)", () => {
    expect(razao(sobre(OLIVA, 0.7, BRANCO), BRANCO)).toBeGreaterThanOrEqual(3);
  });

  it("contorno do botão outline (oliva/70) sobre branco: ≥ 3:1", () => {
    expect(razao(sobre(OLIVA, 0.7, BRANCO), BRANCO)).toBeGreaterThanOrEqual(3);
  });

  it("linha da média de 7 dias sobre branco: ≥ 3:1 (elemento gráfico)", () => {
    expect(razao(hex(COR_MEDIA_7), BRANCO)).toBeGreaterThanOrEqual(3);
  });

  it("foco (anel oliva sólido) sobre branco: ≥ 3:1", () => {
    expect(razao(hex(OLIVA), BRANCO)).toBeGreaterThanOrEqual(3);
  });
});

/** Arquivos de interface e componentes (sem testes), para varredura de código. */
function arquivosDeInterface(dir: string, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      if (!["node_modules", ".next", ".git", "__testes__"].includes(nome)) arquivosDeInterface(caminho, acc);
    } else if (/\.tsx$/.test(nome) && !/\.test\./.test(nome)) {
      acc.push(caminho);
    }
  }
  return acc;
}

const RAIZ = process.cwd();
const ARQUIVOS = [...arquivosDeInterface(join(RAIZ, "app")), ...arquivosDeInterface(join(RAIZ, "components"))];

describe("usos problemáticos não voltaram", () => {
  it.each([["text-oliva/60"], ["text-oliva/70"], ["text-oliva-dark/70"], ["text-stone-400"]])(
    "%s não aparece em nenhuma tela ou componente",
    (classe) => {
      const achados = ARQUIVOS.filter((f) => readFileSync(f, "utf8").includes(classe));
      expect(achados).toEqual([]);
    }
  );

  it("campos (Input e selects) usam borda oliva/70, não oliva/20", () => {
    const campos = [
      "components/ui/input.tsx",
      "components/fisico/tipo-treino-field.tsx",
      "app/marmitas/compras/page.tsx",
      "app/marmitas/preparo/page.tsx",
      "app/marmitas/receitas/nova/page.tsx",
    ];
    for (const arquivo of campos) {
      const codigo = readFileSync(join(RAIZ, arquivo), "utf8");
      expect(codigo, arquivo).not.toContain("border-oliva/20");
    }
    expect(readFileSync(join(RAIZ, "components/ui/input.tsx"), "utf8")).toContain("border-oliva/70");
  });

  it("placeholders não usam stone-400", () => {
    for (const arquivo of ARQUIVOS) {
      expect(readFileSync(arquivo, "utf8"), arquivo).not.toContain("placeholder:text-stone-400");
    }
  });
});

describe("emojis decorativos ficam fora da leitura", () => {
  /** Emoji ou símbolo pictográfico, por code point (funciona no alvo ES5 do projeto). */
  const emoji = {
    test: (texto: string) =>
      Array.from(texto).some((ch) => {
        const cp = ch.codePointAt(0) ?? 0;
        return (cp >= 0x1f300 && cp <= 0x1faff) || (cp >= 0x2600 && cp <= 0x27bf);
      }),
  };

  it("toda linha com emoji ou símbolo decorativo está em aria-hidden", () => {
    const fora: string[] = [];
    for (const arquivo of [...ARQUIVOS, join(RAIZ, "lib/fisico/metas.ts")]) {
      readFileSync(arquivo, "utf8")
        .split("\n")
        .forEach((linha, i) => {
          // Comentários não são renderizados: só importa o texto da tela.
          const comentario = /^\s*(\/\/|\/\*|\*)/.test(linha);
          if (!comentario && emoji.test(linha) && !linha.includes("aria-hidden")) {
            fora.push(`${arquivo}:${i + 1}`);
          }
        });
    }
    expect(fora).toEqual([]);
  });

  it("a comparação de metas não traz emoji no texto (é lida pelo leitor)", () => {
    const codigo = readFileSync(join(RAIZ, "lib/fisico/metas.ts"), "utf8");
    expect(emoji.test(codigo)).toBe(false);
  });
});

describe("feedbacks de sucesso anunciam com role=status", () => {
  it.each([["text-green-800"], ["text-stone-700 bg-stone-100"]])(
    "todo banner de sucesso com %s tem role=status",
    (classe) => {
      const faltando: string[] = [];
      for (const arquivo of ARQUIVOS) {
        const linhas = readFileSync(arquivo, "utf8").split("\n");
        linhas.forEach((linha, i) => {
          if (!/<p[\s>]/.test(linha)) return;
          // A tag <p> pode quebrar em várias linhas: olha a abertura inteira.
          const abertura = linhas.slice(i, i + 4).join(" ").split(">")[0];
          // Banner de feedback: tem borda e cantos arredondados. Indicadores de estado da
          // página (ex.: "Semana Vencida") não são feedback de ação e ficam de fora.
          const banner = abertura.includes("border") && abertura.includes("rounded");
          if (banner && abertura.includes(classe) && !abertura.includes('role="status"')) {
            faltando.push(`${arquivo}:${i + 1}`);
          }
        });
      }
      expect(faltando).toEqual([]);
    }
  );
});
