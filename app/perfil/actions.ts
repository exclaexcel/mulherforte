"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { lerDataOpcional } from "@/lib/data-formulario";
import { lerNumeroOpcional } from "@/lib/numero-formulario";
import type { ResultadoAcao } from "@/lib/resultado-acao";

export async function salvarPerfil(formData: FormData): Promise<ResultadoAcao> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nome = String(formData.get("nome") ?? "").trim();

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

  const dataNascimento = lerDataOpcional(formData.get("data_nascimento"));
  if (!dataNascimento.ok) {
    return { ok: false, erro: dataNascimento.erro };
  }

  // O upsert só envia as colunas do formulário. O início do ciclo do cronograma
  // não entra no payload, então não é alterado por este salvamento.
  const { error } = await supabase.from("perfil_usuario").upsert(
    {
      user_id: user.id,
      nome,
      altura_cm: altura.valor,
      data_nascimento: dataNascimento.valor,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { ok: false, erro: "Não foi possível salvar o perfil. Tente novamente." };
  }

  revalidatePath("/");
  return { ok: true, destino: "/?perfil_salvo=1" };
}
