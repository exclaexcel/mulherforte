"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function salvarPerfil(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const alturaRaw = formData.get("altura_cm");
  const alturaCm = alturaRaw ? Number(alturaRaw) : null;
  const dataNascimento = String(formData.get("data_nascimento") ?? "").trim() || null;

  if (!nome) {
    throw new Error("Nome é obrigatório.");
  }

  const { error } = await supabase.from("perfil_usuario").upsert(
    {
      user_id: user.id,
      nome,
      altura_cm: alturaCm,
      data_nascimento: dataNascimento,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  redirect("/");
}
