"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MensagemFormulario } from "@/components/formulario-acao";
import {
  criarTravaCompartilhada,
  ehRedirecionamentoNext,
} from "@/lib/envio-formulario";
import { MENSAGEM_SALVAR, type ResultadoAcao } from "@/lib/resultado-acao";

type Acao = (formData: FormData) => Promise<ResultadoAcao>;

const MENSAGEM_AGUA_ATUALIZADA = "Quantidade de água atualizada.";

/**
 * Incrementos rápidos e ajuste manual de água na mesma tela. Uma trava compartilhada
 * garante uma gravação por vez: toques em botões diferentes não disparam ações
 * paralelas. O erro aparece aqui, com o formulário preservado; o sucesso só é
 * anunciado depois que a action confirma a gravação.
 */
export function ControleAgua({
  incrementos,
  acaoIncremento,
  acaoAjuste,
  quantidadeAtualMl,
}: {
  incrementos: { label: string; value: number }[];
  acaoIncremento: Acao;
  acaoAjuste: Acao;
  quantidadeAtualMl: number;
}) {
  const router = useRouter();
  const [trava] = useState(() => criarTravaCompartilhada());
  const [origem, setOrigem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const alertaRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (erro) {
      alertaRef.current?.focus();
    }
  }, [erro]);

  const enviando = origem !== null;

  async function enviar(
    chave: string,
    acao: Acao,
    formData: FormData,
    formulario?: HTMLFormElement
  ) {
    setErro(null);
    setSucesso(null);
    setOrigem(chave);

    let resultado: ResultadoAcao | "ignorado";
    try {
      resultado = await trava(() => acao(formData));
    } catch (excecao) {
      setOrigem(null);
      if (ehRedirecionamentoNext(excecao)) {
        // Sessão expirada: atualizar deixa o servidor levar ao login.
        router.refresh();
        return;
      }
      setErro(MENSAGEM_SALVAR);
      return;
    }

    if (resultado === "ignorado") {
      return;
    }

    setOrigem(null);

    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }

    formulario?.reset();
    setSucesso(MENSAGEM_AGUA_ATUALIZADA);
    router.refresh();
  }

  function incrementar(valor: number) {
    const formData = new FormData();
    formData.set("incremento_ml", String(valor));
    void enviar(`incremento-${valor}`, acaoIncremento, formData);
  }

  function ajustar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    void enviar("ajuste", acaoAjuste, new FormData(formulario), formulario);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {incrementos.map((inc) => {
          const ativo = origem === `incremento-${inc.value}`;
          return (
            <Button
              key={inc.value}
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => incrementar(inc.value)}
              disabled={enviando}
              aria-disabled={enviando}
            >
              {ativo ? "Salvando…" : inc.label}
            </Button>
          );
        })}
      </div>

      <details>
        <summary className="text-sm text-oliva/85 cursor-pointer">Ajustar manualmente</summary>
        <form onSubmit={ajustar} className="flex items-end gap-2 mt-3">
          <div className="space-y-2 flex-1">
            <Label htmlFor="valor_ml">Total de hoje (ml)</Label>
            <Input
              id="valor_ml"
              name="valor_ml"
              type="number"
              min={0}
              step="1"
              defaultValue={quantidadeAtualMl}
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={enviando} aria-disabled={enviando}>
            {origem === "ajuste" ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </details>

      <MensagemFormulario erro={erro} sucesso={sucesso} alertaRef={alertaRef} />
    </div>
  );
}
