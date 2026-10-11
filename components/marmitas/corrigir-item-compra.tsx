"use client";

import { useState } from "react";
import { atualizarItemCompra, excluirItemCompra } from "@/app/marmitas/actions";
import { BotaoAcao } from "@/components/botao-acao";
import { FormularioAcao } from "@/components/formulario-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GRUPOS_COMPRA } from "@/lib/marmitas/types";

export type ItemParaCorrecao = { id: string; item: string; grupo: string; grupoLabel: string };

const CAMPO_SELECT =
  "flex h-11 w-full rounded-xl border border-oliva/70 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva";

/**
 * Um seletor só pra escolher qual item editar, em vez de um link por item na
 * lista (ficava grande demais com muitos itens). Escolher troca o formulário pra
 * edição daquele item (nome, grupo) e mostra o botão de excluir; a key no
 * FormularioAcao reseta erro/sucesso ao trocar.
 */
export function CorrigirItemCompra({ itens }: { itens: ItemParaCorrecao[] }) {
  const [selecionadoId, setSelecionadoId] = useState("");
  const selecionado = itens.find((i) => i.id === selecionadoId);

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="selecionar-item-correcao">Qual item?</Label>
        <select
          id="selecionar-item-correcao"
          value={selecionadoId}
          onChange={(e) => setSelecionadoId(e.target.value)}
          className={CAMPO_SELECT}
        >
          <option value="">Selecione...</option>
          {itens.map((i) => (
            <option key={i.id} value={i.id}>
              {i.grupoLabel}: {i.item}
            </option>
          ))}
        </select>
        <p className="text-xs text-stone-500">
          Depois de escolher, dá pra corrigir o nome, trocar o grupo ou excluir o item.
        </p>
      </div>

      {selecionado ? (
        <>
          <FormularioAcao
            key={selecionado.id}
            acao={atualizarItemCompra}
            rotuloEnviar="Salvar"
            rotuloEnviando="Salvando…"
            mensagemSucesso="Item atualizado."
            variante="outline"
            className="space-y-4"
          >
            <input type="hidden" name="id" value={selecionado.id} />
            <div className="space-y-2">
              <Label htmlFor="item-correcao">Nome do item</Label>
              <Input id="item-correcao" name="item" defaultValue={selecionado.item} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grupo-correcao">Grupo</Label>
              <select
                id="grupo-correcao"
                name="grupo"
                defaultValue={selecionado.grupo}
                className={CAMPO_SELECT}
              >
                {GRUPOS_COMPRA.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </FormularioAcao>
          <BotaoAcao
            key={`excluir-${selecionado.id}`}
            acao={excluirItemCompra}
            campos={{ id: selecionado.id }}
            rotulo="Excluir item"
            rotuloEnviando="Excluindo item…"
            confirmacao={`Excluir "${selecionado.item}" da lista de compras?`}
            destinoSucesso="/marmitas/compras?item_excluido=1"
            variante="outline"
            tamanho="sm"
            className="w-full text-red-700 border-red-200 hover:bg-red-50"
          />
        </>
      ) : null}
    </div>
  );
}
