"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2, Mail } from "lucide-react";

export default function CadastroPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cadastroEnviado, setCadastroEnviado] = useState(false);
  const alertaRef = useRef<HTMLParagraphElement>(null);
  const confirmacaoRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) {
      alertaRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (cadastroEnviado) {
      confirmacaoRef.current?.focus();
    }
  }, [cadastroEnviado]);

  async function handleCadastro(e: React.FormEvent) {
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
    const { error: authError } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/perfil`,
      },
    });

    setLoading(false);

    if (authError) {
      const msg = authError.message ?? "";
      if (/already registered|already exists/i.test(msg)) {
        setError("Já existe uma conta com esse e-mail. Tenta entrar em vez de cadastrar.");
      } else if (/rate limit/i.test(msg)) {
        setError("Muitas tentativas em pouco tempo. Espera um minuto e tenta de novo.");
      } else {
        setError(`Não deu pra criar a conta${msg ? `: ${msg}` : "."}`);
      }
      return;
    }

    setCadastroEnviado(true);
  }

  if (cadastroEnviado) {
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
            Mandamos um link de confirmação para <strong>{email}</strong>. Toque nele para ativar
            sua conta e entrar no app.
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
            <h1 className="text-2xl font-bold text-oliva">Criar conta</h1>
            <p className="text-sm text-stone-600 mt-1">Projeto Mulher Forte</p>
          </div>
        </div>

        <form onSubmit={handleCadastro} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
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
            <Label htmlFor="confirmar_senha">Confirmar senha</Label>
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
            {loading ? "Criando conta…" : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-stone-600">
          Já tem conta?{" "}
          <Link href="/login" className="text-oliva underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
