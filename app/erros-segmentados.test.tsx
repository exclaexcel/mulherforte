import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

import ErroFisico from "./fisico/error";
import ErroMarmitas from "./marmitas/error";
import ErroPerfil from "./perfil/error";

const RAIZ = join(process.cwd());
const telas = [
  { nome: "Jornada Física", componente: ErroFisico, arquivo: "app/fisico/error.tsx" },
  { nome: "Marmitas", componente: ErroMarmitas, arquivo: "app/marmitas/error.tsx" },
  { nome: "Perfil", componente: ErroPerfil, arquivo: "app/perfil/error.tsx" },
];

describe.each(telas)("tela de erro segmentada — $nome", ({ componente: Tela, arquivo }) => {
  const html = renderToStaticMarkup(<Tela reset={() => {}} />);

  it("é Client Component (começa com \"use client\")", () => {
    const fonte = readFileSync(join(RAIZ, arquivo), "utf8").trimStart();
    expect(fonte.startsWith('"use client"')).toBe(true);
  });

  it("não lê error.message, digest nem stack", () => {
    const fonte = readFileSync(join(RAIZ, arquivo), "utf8");
    expect(fonte).not.toMatch(/error\.message|\.digest|\.stack|error\.name/);
  });

  it("mostra a mensagem neutra em português", () => {
    expect(html).toContain("<h1");
    expect(html).toContain("Não foi possível concluir esta ação. Tente novamente.");
  });

  it("o HTML não contém termos técnicos", () => {
    expect(html.toLowerCase()).not.toMatch(/supabase|pg_|digest|stack|error:/);
  });

  it("tem botão Tentar novamente e link para a Home", () => {
    expect(html).toContain("<button");
    expect(html).toContain("Tentar novamente");
    expect(html).toContain('href="/"');
    expect(html).toContain("Voltar para o início");
  });

  it("o título recebe foco pelo código", () => {
    expect(html).toContain('tabindex="-1"');
  });
});
