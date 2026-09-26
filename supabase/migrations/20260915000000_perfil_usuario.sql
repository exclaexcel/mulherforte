-- =============================================================
-- Etapa 1 — perfil_usuario + RLS (App Jornada)
-- Objetivo: tabela mínima para Auth + dados de perfil (altura/idade).
-- Pré-check: tabela não existe ainda.
-- Rollback: DROP TABLE IF EXISTS public.perfil_usuario;
-- =============================================================

CREATE TABLE IF NOT EXISTS public.perfil_usuario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  altura_cm numeric(5, 2),
  data_nascimento date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT perfil_usuario_user_id_key UNIQUE (user_id)
);

ALTER TABLE public.perfil_usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfil_usuario: select próprio" ON public.perfil_usuario;
DROP POLICY IF EXISTS "perfil_usuario: insert próprio" ON public.perfil_usuario;
DROP POLICY IF EXISTS "perfil_usuario: update próprio" ON public.perfil_usuario;
DROP POLICY IF EXISTS "perfil_usuario: delete próprio" ON public.perfil_usuario;

CREATE POLICY "perfil_usuario: select próprio"
  ON public.perfil_usuario
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "perfil_usuario: insert próprio"
  ON public.perfil_usuario
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "perfil_usuario: update próprio"
  ON public.perfil_usuario
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "perfil_usuario: delete próprio"
  ON public.perfil_usuario
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfil_usuario TO authenticated;
