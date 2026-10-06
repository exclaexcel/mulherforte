"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ehDataFutura } from "@/lib/date";
import { lerNumeroOpcional } from "@/lib/numero-formulario";
import { MENSAGEM_DATA_FUTURA, type ResultadoAcao } from "@/lib/resultado-acao";

/** Data AAAA-MM-DD que existe de fato (rejeita 2026-02-30). */
function dataValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return false;
  }
  const data = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === iso;
}

export async function salvarPerfil(formData: FormData): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const dataNascimentoRaw = String(formData.get("data_nascimento") ?? "").trim();

  if (!nome) {
    return { ok: false, erro: "Informe seu nome." };
  }

  const altura = lerNumeroOpcional(
    formData.get("altura_cm"),
    (n) => n > 0,
    "Informe uma altura válida, em centímetros."
  );
  if (!altura.ok) {
    return { ok: false, erro: altura.erro };
  }

  if (dataNascimentoRaw && !dataValida(dataNascimentoRaw)) {
    return { ok: false, erro: "Informe uma data de nascimento válida." };
  }

  if (dataNascimentoRaw && ehDataFutura(dataNascimentoRaw)) {
    return { ok: false, erro: MENSAGEM_DATA_FUTURA };
  }

  // O upsert só envia as colunas do formulário. O início do ciclo do cronograma
  // não entra no payload, então não é alterado por este salvamento.
  const { error } = await supabase.from("perfil_usuario").upsert(
    {
      user_id: user.id,
      nome,
      altura_cm: altura.valor,
      data_nascimento: dataNascimentoRaw || null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { ok: false, erro: "Não foi possível salvar o perfil. Tente novamente." };
  }

  revalidatePath("/");
  return { ok: true, destino: "/?perfil_salvo=1" };
}
