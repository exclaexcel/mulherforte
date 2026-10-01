"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { treinoObrigatorioDoDia } from "@/lib/fisico/calendarioTreino";
import { TIPOS_TREINO } from "@/lib/fisico/types";

export function DataTreinoField({ defaultValue }: { defaultValue: string }) {
  const [data, setData] = useState(defaultValue);
  const tipoObrigatorio = treinoObrigatorioDoDia(data);
  const labelTipoObrigatorio = TIPOS_TREINO.find((t) => t.value === tipoObrigatorio)?.label;

  return (
    <div className="space-y-2">
      <Label htmlFor="data">Data</Label>
      <Input
        id="data"
        name="data"
        type="date"
        value={data}
        onChange={(e) => setData(e.target.value)}
        required
      />
      <p className="text-xs text-stone-500">
        {tipoObrigatorio
          ? `Treino previsto para esta data: ${labelTipoObrigatorio ?? tipoObrigatorio}`
          : "Atividade adicional: não havia treino obrigatório previsto para esta data."}
      </p>
    </div>
  );
}
