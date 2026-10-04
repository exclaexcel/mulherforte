"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { classificarResposta, type FormatoExportacao } from "@/lib/exportacao/validarResposta";

type Estado = "parado" | "gerando" | "concluido" | "erro" | "contrato_invalido" | "sessao_expirada";

const MENSAGENS: Record<Exclude<Estado, "parado" | "gerando" | "concluido">, string> = {
  erro: "Não foi possível gerar agora. Tente novamente.",
  contrato_invalido: "O arquivo recebido não está no formato esperado. Tente novamente.",
  sessao_expirada: "Sua sessão expirou. Entre novamente para exportar seus dados.",
};

/**
 * Cada instância tem o próprio estado: os dois botões da página são independentes.
 * O arquivo só vira Blob e objectURL depois de a resposta ser validada. Nada é
 * guardado em localStorage ou sessionStorage, e o objectURL é revogado após o clique.
 * Sessão expirada não redireciona sozinha: mostra um link para entrar de novo.
 */
export function BotaoExportacao({
  endpoint,
  rotulo,
  formato,
}: {
  endpoint: string;
  rotulo: string;
  formato: FormatoExportacao;
}) {
  const [estado, setEstado] = useState<Estado>("parado");

  async function baixar() {
    setEstado("gerando");

    let resposta: Response;
    try {
      resposta = await fetch(endpoint, { cache: "no-store" });
    } catch {
      setEstado("erro");
      return;
    }

    const resultado = classificarResposta(resposta, formato);

    if (resultado.tipo !== "arquivo") {
      if (resultado.tipo === "sessao_expirada") setEstado("sessao_expirada");
      else if (resultado.tipo === "contrato_invalido") setEstado("contrato_invalido");
      else setEstado("erro");
      return;
    }

    let blob: Blob;
    try {
      blob = await resposta.blob();
    } catch {
      setEstado("erro");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = resultado.nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    setEstado("concluido");
  }

  return (
    <div className="space-y-2">
      <Button type="button" className="w-full" onClick={baixar} disabled={estado === "gerando"}>
        {estado === "gerando" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {rotulo}
      </Button>

      {estado === "gerando" ? (
        <p className="text-xs text-stone-600" role="status">
          Preparando arquivo…
        </p>
      ) : null}

      {estado === "concluido" ? (
        <p className="text-xs text-green-800" role="status">
          Download iniciado
        </p>
      ) : null}

      {estado === "sessao_expirada" ? (
        <div className="space-y-1" role="alert">
          <p className="text-xs text-red-700">{MENSAGENS.sessao_expirada}</p>
          <Link href="/login" className="text-xs text-oliva underline">
            Entrar novamente
          </Link>
        </div>
      ) : null}

      {estado === "contrato_invalido" || estado === "erro" ? (
        <p className="text-xs text-red-700" role="alert">
          {MENSAGENS[estado]}
        </p>
      ) : null}
    </div>
  );
}
