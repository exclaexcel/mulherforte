"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TipoTreinoField({
  tipos,
  defaultTipo,
  defaultDescricao,
}: {
  tipos: { value: string; label: string }[];
  defaultTipo?: string;
  defaultDescricao?: string | null;
}) {
  const [tipo, setTipo] = useState(defaultTipo ?? "");

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="tipo">Tipo de treino</Label>
        <select
          id="tipo"
          name="tipo"
          required
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-oliva/20 bg-white px-3 py-2 text-sm text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
        >
          <option value="">Selecione...</option>
          {tipos.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {tipo === "outro" ? (
        <div className="space-y-2">
          <Label htmlFor="tipo_outro_descricao">Qual atividade?</Label>
          <Input
            id="tipo_outro_descricao"
            name="tipo_outro_descricao"
            placeholder="Ex: Caminhada, Pilates, descanso ativo"
            defaultValue={defaultDescricao ?? ""}
            required
          />
        </div>
      ) : null}
    </>
  );
}
