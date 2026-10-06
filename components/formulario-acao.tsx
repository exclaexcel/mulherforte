"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { combinarSucesso, criarControladorEnvio } from "@/lib/envio-formulario";
import type { ResultadoAcao } from "@/lib/resultado-acao";

type Acao = (formData: FormData) => Promise<ResultadoAcao>;

/**
 * Formulário que envia por uma action sem recarregar a página. Erro previsível fica
 * na própria tela, com os campos preenchidos. Enquanto envia, o botão fica
 * desabilitado e mostra progresso. Sucesso tem um único feedback: a mensagem local
 * (`mensagemSucesso`) ou a navegação para o destino da action.
 */
export function FormularioAcao({
  acao,
  rotuloEnviar,
  rotuloEnviando,
  mensagemSucesso,
  className,
  classeBotao,
  variante,
  tamanho,
  children,
}: {
  acao: Acao;
  rotuloEnviar: string;
  rotuloEnviando: string;
  /** Quando informado, o formulário fica na página: mostra a mensagem, limpa os campos e atualiza os dados. */
  mensagemSucesso?: string;
  className?: string;
  classeBotao?: string;
  variante?: ButtonProps["variant"];
  tamanho?: ButtonProps["size"];
  children: ReactNode;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const alertaRef = useRef<HTMLParagraphElement>(null);
  const [controlador] = useState(() => criarControladorEnvio(acao));
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  useEffect(() => {
    if (erro) {
      alertaRef.current?.focus();
    }
  }, [erro]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (concluido) {
      return;
    }

    setErro(null);
    setSucesso(null);
    setEnviando(true);

    let resultado: ResultadoAcao | "ignorado";
    try {
      resultado = await controlador.enviar(new FormData(evento.currentTarget));
    } catch {
      // Sessão expirada: atualizar deixa o servidor redirecionar para o login.
      setEnviando(false);
      router.refresh();
      return;
    }

    if (resultado === "ignorado") {
      return;
    }

    if (!resultado.ok) {
      setErro(resultado.erro);
      setEnviando(false);
      return;
    }

    if (mensagemSucesso) {
      formRef.current?.reset();
      setSucesso(combinarSucesso(mensagemSucesso, resultado.aviso));
      setEnviando(false);
      router.refresh();
      return;
    }

    setConcluido(true);
    router.push(resultado.destino);
  }

  return (
    <form ref={formRef} onSubmit={enviar} className={className}>
      {children}
      <MensagemFormulario erro={erro} sucesso={sucesso} alertaRef={alertaRef} />
      <BotaoEnvio
        enviando={enviando || concluido}
        rotulo={rotuloEnviar}
        rotuloEnviando={rotuloEnviando}
        variante={variante}
        tamanho={tamanho}
        className={classeBotao}
      />
    </form>
  );
}

/** Erro com role="alert" e sucesso com role="status". Texto visível, sem depender de cor. */
export function MensagemFormulario({
  erro,
  sucesso,
  alertaRef,
}: {
  erro: string | null;
  sucesso: string | null;
  alertaRef?: RefObject<HTMLParagraphElement>;
}) {
  if (erro) {
    return (
      <p
        ref={alertaRef}
        role="alert"
        tabIndex={-1}
        className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
      >
        {erro}
      </p>
    );
  }

  if (sucesso) {
    return (
      <p
        role="status"
        className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-3 py-2"
      >
        {sucesso}
      </p>
    );
  }

  return null;
}

/** Botão de envio: desabilitado e com texto de progresso enquanto envia. */
export function BotaoEnvio({
  enviando,
  rotulo,
  rotuloEnviando,
  variante,
  tamanho,
  className,
}: {
  enviando: boolean;
  rotulo: string;
  rotuloEnviando: string;
  variante?: ButtonProps["variant"];
  tamanho?: ButtonProps["size"];
  className?: string;
}) {
  return (
    <Button
      type="submit"
      variant={variante}
      size={tamanho}
      className={className}
      disabled={enviando}
      aria-disabled={enviando}
    >
      {enviando ? rotuloEnviando : rotulo}
    </Button>
  );
}
