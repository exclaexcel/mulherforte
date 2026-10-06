"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { executarAcaoConfirmada } from "@/lib/acao-confirmada";
import { criarControladorEnvio } from "@/lib/envio-formulario";
import { MensagemFormulario } from "@/components/formulario-acao";
import type { ResultadoAcao } from "@/lib/resultado-acao";

type Acao = (formData: FormData) => Promise<ResultadoAcao>;

/**
 * Botão que chama uma action sem formulário: para alternâncias, consumo e exclusões.
 * Pede confirmação quando informada, impede duplo clique, mostra erro na tela e só
 * atualiza ou navega depois de sucesso. Em erro, o estado da tela não muda.
 *
 * `destinoSucesso` navega (use quando o item some da tela após o sucesso). Sem ele,
 * a página é atualizada no lugar.
 */
export function BotaoAcao({
  acao,
  campos,
  rotulo,
  rotuloEnviando,
  confirmacao,
  destinoSucesso,
  mensagemSucesso,
  estilo = "ui",
  variante,
  tamanho,
  className,
}: {
  acao: Acao;
  campos?: Record<string, string>;
  rotulo: ReactNode;
  rotuloEnviando: ReactNode;
  confirmacao?: string;
  destinoSucesso?: string;
  mensagemSucesso?: string;
  /** "ui" usa o componente Button; "nativo" mantém o botão de texto da lista. */
  estilo?: "ui" | "nativo";
  variante?: ButtonProps["variant"];
  tamanho?: ButtonProps["size"];
  className?: string;
}) {
  const router = useRouter();
  const alertaRef = useRef<HTMLParagraphElement>(null);
  const [controlador] = useState(() => criarControladorEnvio(acao));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (erro) {
      alertaRef.current?.focus();
    }
  }, [erro]);

  async function clicar() {
    setErro(null);
    setSucesso(null);

    const formData = new FormData();
    for (const [nome, valor] of Object.entries(campos ?? {})) {
      formData.set(nome, valor);
    }

    let resultado: Awaited<ReturnType<typeof executarAcaoConfirmada>>;
    try {
      resultado = await executarAcaoConfirmada({
        confirmacao,
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

    // Cancelado (não confirmou) ou ignorado (já há envio em curso): nada muda na tela.
    if (resultado === "cancelado" || resultado === "ignorado") {
      return;
    }

    if (!resultado.ok) {
      setErro(resultado.erro);
      setEnviando(false);
      return;
    }

    if (destinoSucesso) {
      // Mantém o botão desabilitado até a navegação trocar a tela.
      router.push(destinoSucesso);
      return;
    }

    setSucesso(mensagemSucesso ?? null);
    setEnviando(false);
    router.refresh();
  }

  const bloqueado = enviando;
  const texto = bloqueado ? rotuloEnviando : rotulo;

  return (
    <div className="space-y-2">
      {estilo === "nativo" ? (
        <button
          type="button"
          onClick={clicar}
          disabled={bloqueado}
          aria-disabled={bloqueado}
          className={className}
        >
          {texto}
        </button>
      ) : (
        <Button
          type="button"
          variant={variante}
          size={tamanho}
          className={className}
          onClick={clicar}
          disabled={bloqueado}
          aria-disabled={bloqueado}
        >
          {texto}
        </Button>
      )}
      <MensagemFormulario erro={erro} sucesso={sucesso} alertaRef={alertaRef} />
    </div>
  );
}
