-- =============================================================
-- Etapa 2 — perfil_usuario: campo nome (App Jornada)
-- Objetivo: permitir tela de cadastro/edição de perfil (nome, altura, nascimento).
-- Pré-check: coluna "nome" não existe ainda em perfil_usuario.
-- Rollback: ALTER TABLE public.perfil_usuario DROP COLUMN IF EXISTS nome;
-- =============================================================

ALTER TABLE public.perfil_usuario
  ADD COLUMN IF NOT EXISTS nome text;
