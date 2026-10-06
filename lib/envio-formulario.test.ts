import { describe, expect, it } from "vitest";
import { combinarSucesso, criarControladorEnvio } from "./envio-formulario";
import { MENSAGEM_SALVAR, type ResultadoAcao } from "./resultado-acao";

function fd(campos: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries(campos)) f.set(k, v);
  return f;
}

/** Action controlada pelo teste: resolve quando o teste mandar. */
function acaoManual() {
  let liberar: (r: ResultadoAcao) => void = () => {};
  let chamadas = 0;
  const acao = () => {
    chamadas += 1;
    return new Promise<ResultadoAcao>((resolve) => {
      liberar = resolve;
    });
  };
  return { acao, liberar: (r: ResultadoAcao) => liberar(r), chamadas: () => chamadas };
}

describe("combinarSucesso", () => {
  it("sem aviso, devolve só a mensagem de sucesso", () => {
    expect(combinarSucesso("Peso salvo.")).toBe("Peso salvo.");
  });

  it("com aviso, forma um único feedback de sucesso", () => {
    expect(combinarSucesso("Medidas salvas.", "Atenção: Cintura com diferença maior que 3 cm.")).toBe(
      "Medidas salvas. Atenção: Cintura com diferença maior que 3 cm."
    );
  });
});

describe("duplo envio", () => {
  it("segundo envio enquanto o primeiro está em curso não chama a action", async () => {
    const manual = acaoManual();
    const controlador = criarControladorEnvio(manual.acao);

    const primeiro = controlador.enviar(fd());
    const segundo = await controlador.enviar(fd());

    expect(segundo).toBe("ignorado");
    expect(manual.chamadas()).toBe(1);

    manual.liberar({ ok: true, destino: "/x" });
    expect(await primeiro).toEqual({ ok: true, destino: "/x" });
  });

  it("após concluir, um novo envio volta a funcionar", async () => {
    const manual = acaoManual();
    const controlador = criarControladorEnvio(manual.acao);

    const primeiro = controlador.enviar(fd());
    manual.liberar({ ok: false, erro: "Informe o nome." });
    await primeiro;

    const segundo = controlador.enviar(fd());
    manual.liberar({ ok: true, destino: "/y" });

    expect(await segundo).toEqual({ ok: true, destino: "/y" });
    expect(manual.chamadas()).toBe(2);
  });
});

describe("resultado das actions", () => {
  it("erro previsível volta como resultado, sem lançar exceção", async () => {
    const controlador = criarControladorEnvio(async () => ({ ok: false, erro: "Informe o nome." }));

    expect(await controlador.enviar(fd())).toEqual({ ok: false, erro: "Informe o nome." });
  });

  it("exceção inesperada vira mensagem neutra, sem detalhe técnico", async () => {
    const controlador = criarControladorEnvio(async () => {
      throw new Error("relation receitas pg_secret falhou");
    });

    const r = await controlador.enviar(fd());

    expect(r).toEqual({ ok: false, erro: MENSAGEM_SALVAR });
    expect(JSON.stringify(r)).not.toContain("pg_secret");
    expect(JSON.stringify(r)).not.toContain("receitas");
  });

  it("redirecionamento do Next (sessão expirada) é repassado, não vira erro", async () => {
    const redirecionamento = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/login;307;",
    });
    const controlador = criarControladorEnvio(async () => {
      throw redirecionamento;
    });

    await expect(controlador.enviar(fd())).rejects.toBe(redirecionamento);
  });

  it("libera o envio depois de uma exceção, para permitir nova tentativa", async () => {
    let falhar = true;
    const controlador = criarControladorEnvio(async () => {
      if (falhar) throw new Error("falha");
      return { ok: true, destino: "/z" };
    });

    await controlador.enviar(fd());
    falhar = false;

    expect(await controlador.enviar(fd())).toEqual({ ok: true, destino: "/z" });
  });
});
