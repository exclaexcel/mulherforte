"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2, Mail } from "lucide-react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const alertaRef = useRef<HTMLParagraphElement>(null);
  const confirmacaoRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) {
      alertaRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (enviado) {
      confirmacaoRef.current?.focus();
    }
  }, [enviado]);

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/redefinir-senha`,
    });

    setLoading(false);

    if (authError) {
      const msg = authError.message ?? "";
      if (/rate limit/i.test(msg)) {
        setError("Muitas tentativas em pouco tempo. Espera um minuto e tenta de novo.");
      } else {
        setError(`Não deu pra enviar o e-mail${msg ? `: ${msg}` : "."}`);
      }
      return;
    }

    // Por segurança, a mesma mensagem aparece mesmo se o e-mail não existir
    // na base — assim não dá pra descobrir quais e-mails têm conta no app.
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-bege to-rosa-soft/40">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-oliva/10 border border-oliva/20">
              <Mail className="h-8 w-8 text-oliva" />
            </div>
            <h1 className="text-xl font-bold text-oliva">Confira seu e-mail</h1>
          </div>
          <p ref={confirmacaoRef} role="status" tabIndex={-1} className="text-sm text-stone-600">
            Se houver uma conta com o e-mail <strong>{email}</strong>, mandamos um link pra você
            criar uma senha nova. Toque nele quando chegar.
          </p>
          <Link href="/login" className="inline-block text-sm text-oliva underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-gradient-to-b from-bege to-rosa-soft/40">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-oliva/10 border border-oliva/20">
            <Heart className="h-8 w-8 text-oliva fill-rosa" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-oliva">Recuperar senha</h1>
            <p className="text-sm text-stone-600 mt-1">
              Digite o e-mail da sua conta e mandamos um link pra criar uma senha nova.
            </p>
          </div>
        </div>

        <form onSubmit={handleRecuperar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Enviando…" : "Enviar link"}
          </Button>
        </form>

        <p className="text-center text-sm text-stone-600">
          Lembrou a senha?{" "}
          <Link href="/login" className="text-oliva underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
