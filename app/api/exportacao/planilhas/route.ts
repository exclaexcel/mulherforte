import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarDadosExportacao, validarReferenciasReceitas } from "@/lib/exportacao/buscarDados";
import { montarArquivosCsv } from "@/lib/exportacao/montarCsv";
import { montarZip } from "@/lib/exportacao/montarZip";
import { cabecalhoDownload, nomeArquivoPlanilhas } from "@/lib/exportacao/nomes";
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
    const zip = montarZip(montarArquivosCsv(dados));

    return new NextResponse(zip, {
      status: 200,
      headers: cabecalhosSeguros({
        "Content-Type": "application/zip",
        "Content-Disposition": cabecalhoDownload(nomeArquivoPlanilhas()),
      }),
    });
  } catch (erro) {
    return respostaErroExportacao(erro);
  }
}
