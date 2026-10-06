"use client";

import { TelaErro } from "@/components/tela-erro";

/** Falha inesperada na Jornada Física. O erro técnico não é exibido. */
export default function FisicoError({ reset }: { reset: () => void }) {
  return <TelaErro reset={reset} />;
}
