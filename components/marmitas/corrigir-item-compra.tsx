"use client";

import { useState } from "react";
import { atualizarItemCompra } from "@/app/marmitas/actions";
import { FormularioAcao } from "@/components/formulario-acao";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ItemParaCorrecao = { id: string; item: string; grupoLabel: string };

const CAMPO_SELECT =
  "flex h-11 w-full rounded-xl border border-oliva/70 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva";

/**
 * Um seletor só pra escolher qual item corrigir, em vez de um link por item na
 * lista (ficava grande demais com muitos itens). Escolher troca o formulário pra
 * edição daquele item; a key no FormularioAcao reseta erro/sucesso ao trocar.
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
      </div>

      {selecionado ? (
        <FormularioAcao
          key={selecionado.id}
          acao={atualizarItemCompra}
          rotuloEnviar="Salvar"
          rotuloEnviando="Salvando…"
          mensagemSucesso="Item atualizado."
          variante="outline"
          className="space-y-2"
        >
          <input type="hidden" name="id" value={selecionado.id} />
          <Label htmlFor="item-correcao" className="sr-only">
            Novo nome do item
          </Label>
          <Input id="item-correcao" name="item" defaultValue={selecionado.item} required />
        </FormularioAcao>
      ) : null}
    </div>
  );
}
