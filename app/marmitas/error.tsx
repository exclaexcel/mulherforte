"use client";

import { TelaErro } from "@/components/tela-erro";

/** Falha inesperada em Marmitas. O erro técnico não é exibido. */
export default function MarmitasError({ reset }: { reset: () => void }) {
  return <TelaErro reset={reset} />;
}
