import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarDadosExportacao, validarReferenciasReceitas } from "@/lib/exportacao/buscarDados";
import { montarJson } from "@/lib/exportacao/montarJson";
import { cabecalhoDownload, nomeArquivoBackup } from "@/lib/exportacao/nomes";
import {
  cabecalhosSeguros,
  respostaErroExportacao,
  respostaNaoAutenticado,
} from "@/lib/exportacao/respostas";

// Gerado sob demanda a partir da sessão atual: nunca estático nem em cache.
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return respostaNaoAutenticado();
    }

    const dados = await buscarDadosExportacao(supabase, user.id);
    validarReferenciasReceitas(dados);
    const json = montarJson(dados, new Date());

    return new NextResponse(json, {
      status: 200,
      headers: cabecalhosSeguros({
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": cabecalhoDownload(nomeArquivoBackup()),
      }),
    });
  } catch (erro) {
    return respostaErroExportacao(erro);
  }
}
