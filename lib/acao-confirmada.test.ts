import { describe, expect, it, vi } from "vitest";
import { executarAcaoConfirmada } from "./acao-confirmada";

function fd() {
  return new FormData();
}

describe("executarAcaoConfirmada", () => {
  it("sem confirmação exigida: envia direto", async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: true, destino: "/x" });

    const r = await executarAcaoConfirmada({ confirmar: vi.fn(), enviar, formData: fd() });

    expect(r).toEqual({ ok: true, destino: "/x" });
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it("cancelado na confirmação: não chama a action", async () => {
    const enviar = vi.fn();
    const confirmar = vi.fn().mockReturnValue(false);

    const r = await executarAcaoConfirmada({
      confirmacao: "Confirmar que este preparo foi consumido?",
      confirmar,
      enviar,
      formData: fd(),
    });

    expect(r).toBe("cancelado");
    expect(confirmar).toHaveBeenCalledWith("Confirmar que este preparo foi consumido?");
    expect(enviar).not.toHaveBeenCalled();
  });

  it("confirmado: envia uma vez", async () => {
    const enviar = vi.fn().mockResolvedValue({ ok: true, destino: "/y" });

    const r = await executarAcaoConfirmada({
      confirmacao: "Excluir?",
      confirmar: () => true,
      enviar,
      formData: fd(),
    });

    expect(r).toEqual({ ok: true, destino: "/y" });
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it("devolve 'ignorado' quando o envio já está em curso", async () => {
    const r = await executarAcaoConfirmada({
      confirmar: () => true,
      enviar: async () => "ignorado",
      formData: fd(),
    });

    expect(r).toBe("ignorado");
  });
});
