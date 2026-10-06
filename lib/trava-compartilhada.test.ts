import { describe, expect, it } from "vitest";
import { criarTravaCompartilhada, ehRedirecionamentoNext } from "./envio-formulario";

function adiado<T>() {
  let liberar: (v: T) => void = () => {};
  const promessa = new Promise<T>((resolve) => {
    liberar = resolve;
  });
  return { promessa, liberar };
}

describe("criarTravaCompartilhada", () => {
  it("enquanto uma ação roda, outra chamada do grupo é ignorada", async () => {
    const trava = criarTravaCompartilhada();
    const primeira = adiado<string>();
    let chamadasSegunda = 0;

    const emCurso = trava(() => primeira.promessa);
    const segunda = await trava(async () => {
      chamadasSegunda += 1;
      return "x";
    });

    expect(segunda).toBe("ignorado");
    expect(chamadasSegunda).toBe(0);
    primeira.liberar("ok");
    expect(await emCurso).toBe("ok");
  });

  it("depois de terminar (com sucesso ou erro), aceita nova tentativa", async () => {
    const trava = criarTravaCompartilhada();

    await expect(trava(async () => { throw new Error("falha"); })).rejects.toThrow("falha");
    expect(await trava(async () => "nova tentativa")).toBe("nova tentativa");
  });

  it("devolve o resultado da ação sem alterá-lo", async () => {
    const trava = criarTravaCompartilhada();

    expect(await trava(async () => ({ ok: false, erro: "Quantidade inválida." }))).toEqual({
      ok: false,
      erro: "Quantidade inválida.",
    });
  });
});

describe("ehRedirecionamentoNext", () => {
  it("reconhece o digest de redirecionamento do Next", () => {
    expect(ehRedirecionamentoNext({ digest: "NEXT_REDIRECT;replace;/login;307;" })).toBe(true);
  });

  it("não confunde erro comum com redirecionamento", () => {
    expect(ehRedirecionamentoNext(new Error("falha"))).toBe(false);
    expect(ehRedirecionamentoNext(null)).toBe(false);
  });
});
