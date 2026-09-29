import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { salvarPerfil } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: perfil } = await supabase
    .from("perfil_usuario")
    .select("nome, altura_cm, data_nascimento")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-dvh px-6 py-10 max-w-lg mx-auto space-y-8">
      <header>
        <Link href="/" className="text-sm text-oliva/70">
          ← Início
        </Link>
        <h1 className="text-2xl font-bold text-oliva mt-1">Meu perfil</h1>
      </header>

      <form
        action={salvarPerfil}
        className="space-y-4 rounded-2xl bg-white/80 border border-oliva/10 p-5 shadow-sm"
      >
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" name="nome" defaultValue={perfil?.nome ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="altura_cm">Altura (cm)</Label>
          <Input
            id="altura_cm"
            name="altura_cm"
            type="number"
            step="0.1"
            min={0}
            defaultValue={perfil?.altura_cm ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data_nascimento">Data de nascimento</Label>
          <Input
            id="data_nascimento"
            name="data_nascimento"
            type="date"
            defaultValue={perfil?.data_nascimento ?? ""}
          />
        </div>
        <Button type="submit" className="w-full">
          Salvar
        </Button>
      </form>
    </main>
  );
}
