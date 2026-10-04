import { NextResponse } from "next/server";
import { ExportacaoIntegridadeErro, ExportacaoLeituraErro } from "./tipos";

/** Sem cache em nenhum caminho: o conteúdo é pessoal e sempre gerado na hora. */
const CABECALHOS_BASE: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const MENSAGEM_GENERICA = "Não foi possível gerar agora. Tente novamente.";

export function cabecalhosSeguros(extra: Record<string, string>): Record<string, string> {
  return { ...CABECALHOS_BASE, ...extra };
}

/** 401: somente ausência de sessão no Route Handler. */
export function respostaNaoAutenticado(): NextResponse {
  return NextResponse.json(
    { erro: "Sessão expirada. Entre novamente." },
    { status: 401, headers: cabecalhosSeguros({ "Content-Type": "application/json; charset=utf-8" }) }
  );
}

/**
 * Classificação dos erros da exportação:
 * - ExportacaoIntegridadeErro → 422: inconsistência validada nos dados lidos.
 * - ExportacaoLeituraErro → 500: falha de consulta, permissão ou indisponibilidade.
 * - qualquer outro erro → 500 genérico.
 * As mensagens são seguras para a tela: sem tabela, query, UUID ou payload.
 */
export function respostaErroExportacao(erro: unknown): NextResponse {
  const headers = cabecalhosSeguros({ "Content-Type": "application/json; charset=utf-8" });

  if (erro instanceof ExportacaoIntegridadeErro) {
    return NextResponse.json({ erro: erro.message }, { status: 422, headers });
  }

  if (erro instanceof ExportacaoLeituraErro) {
    return NextResponse.json({ erro: erro.message }, { status: 500, headers });
  }

  return NextResponse.json({ erro: MENSAGEM_GENERICA }, { status: 500, headers });
}
