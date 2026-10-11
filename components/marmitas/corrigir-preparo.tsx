"use client";

import { useState } from "react";
import { editarPreparo, excluirPreparoRegistro } from "@/app/marmitas/actions";
import { BotaoAcao } from "@/components/botao-acao";
import { FormularioAcao } from "@/components/formulario-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatarDataBR } from "@/lib/marmitas/estoque";

export type PreparoParaCorrecao = {
  id: string;
  receitaId: string;
  receitaNome: string;
  dataPreparo: string;
  quantidade: number;
  observacoes: string | null;
};

export type ReceitaOpcao = { id: string; nome: string };

const CAMPO_SELECT =
  "flex h-11 w-full rounded-xl border border-oliva/70 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva";

/**
 * Mesmo padrão de CorrigirItemCompra: um seletor só pra escolher qual preparo
 * corrigir, em vez de um bloco de edição aberto em cada item da lista (ficava
 * repetitivo com vários itens congelados). Escolher troca o formulário pra
 * edição daquele preparo; a key no FormularioAcao reseta erro/sucesso ao trocar.
 */
export function CorrigirPreparo({
  preparos,
  receitas,
  hoje,
}: {
  preparos: PreparoParaCorrecao[];
  receitas: ReceitaOpcao[];
  hoje: string;
}) {
  const [selecionadoId, setSelecionadoId] = useState("");
  const selecionado = preparos.find((p) => p.id === selecionadoId);

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="selecionar-preparo-correcao">Qual preparo?</Label>
        <select
          id="selecionar-preparo-correcao"
          value={selecionadoId}
          onChange={(e) => setSelecionadoId(e.target.value)}
          className={CAMPO_SELECT}
        >
          <option value="">Selecione...</option>
          {preparos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.receitaNome} — {formatarDataBR(p.dataPreparo)}
            </option>
          ))}
        </select>
        <p className="text-xs text-stone-500">
          Depois de escolher, dá pra corrigir receita, data, quantidade e observações, ou excluir
          o lançamento.
        </p>
      </div>

      {selecionado ? (
        <>
          <FormularioAcao
            key={selecionado.id}
            acao={editarPreparo}
            rotuloEnviar="Salvar correção"
            rotuloEnviando="Salvando…"
            mensagemSucesso="Preparo corrigido."
            variante="outline"
            className="space-y-4"
          >
            <input type="hidden" name="id" value={selecionado.id} />
            <div className="space-y-2">
              <Label htmlFor="receita_id-correcao">Receita</Label>
              <select
                id="receita_id-correcao"
                name="receita_id"
                defaultValue={selecionado.receitaId}
                required
                className={CAMPO_SELECT}
              >
                {receitas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_preparo-correcao">Data do preparo</Label>
              <Input
                id="data_preparo-correcao"
                name="data_preparo"
                type="date"
                defaultValue={selecionado.dataPreparo}
                max={hoje}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade_porcoes-correcao">Quantidade de porções</Label>
              <Input
                id="quantidade_porcoes-correcao"
                name="quantidade_porcoes"
                type="number"
                min={1}
                defaultValue={selecionado.quantidade}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes-correcao">Observações</Label>
              <Input
                id="observacoes-correcao"
                name="observacoes"
                defaultValue={selecionado.observacoes ?? ""}
              />
            </div>
          </FormularioAcao>
          <BotaoAcao
            key={`excluir-${selecionado.id}`}
            acao={excluirPreparoRegistro}
            campos={{ id: selecionado.id }}
            rotulo="Excluir este lançamento"
            rotuloEnviando="Excluindo…"
            confirmacao={`Excluir o lançamento de "${selecionado.receitaNome}"? Isso remove o registro — diferente de descartar, que é pra comida vencida jogada fora.`}
            variante="outline"
            tamanho="sm"
            className="w-full text-red-700 border-red-200 hover:bg-red-50"
          />
        </>
      ) : null}
    </div>
  );
}
