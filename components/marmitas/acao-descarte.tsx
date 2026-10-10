"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { executarAcaoConfirmada } from "@/lib/acao-confirmada";
import { criarControladorEnvio } from "@/lib/envio-formulario";
import { MensagemFormulario } from "@/components/formulario-acao";
import { CONFIRMACAO_DESCARTE, MOTIVOS_DESCARTE } from "@/lib/marmitas/descarte";
import type { ResultadoAcao } from "@/lib/resultado-acao";

type Acao = (formData: FormData) => Promise<ResultadoAcao>;

/**
 * Descarte de preparo com prazo encerrado: pede o motivo antes de confirmar, com
 * aviso de que a ação não pode ser desfeita. Não reaproveita BotaoAcao porque
 * precisa de um campo escolhido na tela (motivo), não só valores fixos.
 */
export function AcaoDescarte({ acao, id }: { acao: Acao; id: string }) {
  const router = useRouter();
  const alertaRef = useRef<HTMLParagraphElement>(null);
  const [controlador] = useState(() => criarControladorEnvio(acao));
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (erro) {
      alertaRef.current?.focus();
    }
  }, [erro]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);

    const formData = new FormData();
    formData.set("id", id);
    formData.set("motivo_descarte", motivo);

    let resultado: Awaited<ReturnType<typeof executarAcaoConfirmada>>;
    try {
      resultado = await executarAcaoConfirmada({
        confirmacao: CONFIRMACAO_DESCARTE,
        confirmar: (mensagem) => window.confirm(mensagem),
        enviar: (f) => {
          setEnviando(true);
          return controlador.enviar(f);
        },
        formData,
      });
    } catch {
      // Sessão expirada: atualizar deixa o servidor redirecionar para o login.
      setEnviando(false);
      router.refresh();
      return;
    }

    if (resultado === "cancelado" || resultado === "ignorado") {
      return;
    }

    if (!resultado.ok) {
      setErro(resultado.erro);
      setEnviando(false);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="space-y-2 pt-2 border-t border-current/10">
      <div className="space-y-1">
        <label htmlFor={`motivo-descarte-${id}`} className="text-xs font-medium">
          Motivo do descarte
        </label>
        <select
          id={`motivo-descarte-${id}`}
          required
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-800"
        >
          <option value="" disabled>
            Selecione um motivo
          </option>
          {MOTIVOS_DESCARTE.map((item) => (
            <option key={item.valor} value={item.valor}>
              {item.rotulo}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline" size="sm" disabled={enviando} aria-disabled={enviando}>
        {enviando ? "Descartando…" : "Descartar"}
      </Button>
      <MensagemFormulario erro={erro} sucesso={null} alertaRef={alertaRef} />
    </form>
  );
}
