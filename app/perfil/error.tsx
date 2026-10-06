"use client";

import { TelaErro } from "@/components/tela-erro";

/** Falha inesperada no Perfil. O erro técnico não é exibido. */
export default function PerfilError({ reset }: { reset: () => void }) {
  return <TelaErro reset={reset} />;
}
