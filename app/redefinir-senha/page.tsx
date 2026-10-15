"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alertaRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) {
      alertaRef.current?.focus();
    }
  }, [error]);

  async function handleRedefinir(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (senha !== confirmarSenha) {
      setError("As senhas não são iguais.");
      return;
    }

    if (senha.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password: senha });

    setLoading(false);

    if (authError) {
      setError(`Não deu pra salvar a senha nova${authError.message ? `: ${authError.message}` : "."}`);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-bege to-rosa-soft/40">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-oliva/10 border border-oliva/20">
            <Heart className="h-8 w-8 text-oliva fill-rosa" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-oliva">Criar senha nova</h1>
          </div>
        </div>

        <form onSubmit={handleRedefinir} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha">Senha nova</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmar_senha">Confirmar senha nova</Label>
            <Input
              id="confirmar_senha"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
            />
          </div>
          {error ? (
            <p
              ref={alertaRef}
              role="alert"
              tabIndex={-1}
              className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oliva"
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Salvando…" : "Salvar senha nova"}
          </Button>
        </form>
      </div>
    </div>
  );
}
