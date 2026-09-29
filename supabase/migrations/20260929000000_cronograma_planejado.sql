-- =============================================================
-- Etapa 3 — cronograma_planejado (App Jornada)
-- Objetivo: template das 4 semanas de rotação (proteína/base/legumes por dia),
-- separado do histórico real em "preparos".
-- Formato real (não é 1 receita por dia): cada dia tem proteína/base/legumes
-- descritos em texto, e ocasionalmente uma "receita extra" catalogada na semana
-- (às vezes mais de uma, por isso texto livre, não FK).
-- Pré-check: tabela não existe ainda.
-- Rollback: DROP TABLE IF EXISTS public.cronograma_planejado;
-- =============================================================

CREATE TABLE IF NOT EXISTS public.cronograma_planejado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  semana_ciclo smallint NOT NULL CHECK (semana_ciclo BETWEEN 1 AND 4),
  dia_semana text NOT NULL,
  proteina text,
  base text,
  legumes text,
  receita_extra_texto text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cronograma_planejado_semana_dia_key UNIQUE (user_id, semana_ciclo, dia_semana)
);

ALTER TABLE public.cronograma_planejado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cronograma_planejado: select próprio" ON public.cronograma_planejado;
DROP POLICY IF EXISTS "cronograma_planejado: insert próprio" ON public.cronograma_planejado;
DROP POLICY IF EXISTS "cronograma_planejado: update próprio" ON public.cronograma_planejado;
DROP POLICY IF EXISTS "cronograma_planejado: delete próprio" ON public.cronograma_planejado;

CREATE POLICY "cronograma_planejado: select próprio"
  ON public.cronograma_planejado FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "cronograma_planejado: insert próprio"
  ON public.cronograma_planejado FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "cronograma_planejado: update próprio"
  ON public.cronograma_planejado FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "cronograma_planejado: delete próprio"
  ON public.cronograma_planejado FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cronograma_planejado TO authenticated;
