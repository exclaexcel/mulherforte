import { MENSAGEM_SALVAR, type ResultadoAcao } from "@/lib/resultado-acao";

type Acao = (formData: FormData) => Promise<ResultadoAcao>;

/**
 * Controla um envio por vez. Um segundo envio enquanto o primeiro está em curso
 * não chama a action de novo. Redirecionamento do Next (sessão expirada) é
 * repassado para quem chamou. Qualquer outra exceção vira mensagem neutra, sem
 * detalhe técnico.
 */
export function criarControladorEnvio(acao: Acao) {
  let emCurso = false;

  return {
    async enviar(formData: FormData): Promise<ResultadoAcao | "ignorado"> {
      if (emCurso) {
        return "ignorado";
      }

      emCurso = true;
      try {
        return await acao(formData);
      } catch (erro) {
        if (ehRedirecionamentoNext(erro)) {
          throw erro;
        }
        return { ok: false, erro: MENSAGEM_SALVAR };
      } finally {
        emCurso = false;
      }
    },
  };
}

/** Texto de sucesso único, com o aviso não bloqueante no mesmo feedback quando houver. */
export function combinarSucesso(mensagem: string, aviso?: string): string {
  return aviso ? `${mensagem} ${aviso}` : mensagem;
}

/** Redirecionamento do Next (ex.: sessão expirada). Não é erro: deve seguir para quem chamou. */
export function ehRedirecionamentoNext(erro: unknown): boolean {
  const digest = (erro as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/**
 * Trava compartilhada por um grupo de botões: enquanto uma ação roda, qualquer
 * outra chamada do grupo é ignorada. Assim, dois botões diferentes não disparam
 * duas gravações da mesma tela ao mesmo tempo.
 */
export function criarTravaCompartilhada() {
  let ocupada = false;

  return async function executar<T>(fn: () => Promise<T>): Promise<T | "ignorado"> {
    if (ocupada) {
      return "ignorado";
    }
    ocupada = true;
    try {
      return await fn();
    } finally {
      ocupada = false;
    }
  };
}
