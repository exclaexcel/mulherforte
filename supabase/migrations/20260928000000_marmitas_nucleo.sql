-- =============================================================
-- Etapa 2 — Marmitas: núcleo (App Jornada)
-- Objetivo: tabelas receitas, preparos, itens_compra + RLS.
-- Pré-check: tabelas não existem ainda; perfil_usuario e auth.users já existem.
-- Rollback:
--   DROP TABLE IF EXISTS public.preparos;
--   DROP TABLE IF EXISTS public.itens_compra;
--   DROP TABLE IF EXISTS public.receitas;
-- =============================================================

-- receitas ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.receitas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text,
  ingredientes text,
  modo_preparo text,
  dica_congelamento text,
  selos text[] NOT NULL DEFAULT '{}',
  validade_congelado_dias integer NOT NULL CHECK (validade_congelado_dias > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "receitas: select próprio" ON public.receitas;
DROP POLICY IF EXISTS "receitas: insert próprio" ON public.receitas;
DROP POLICY IF EXISTS "receitas: update próprio" ON public.receitas;
DROP POLICY IF EXISTS "receitas: delete próprio" ON public.receitas;

CREATE POLICY "receitas: select próprio"
  ON public.receitas FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "receitas: insert próprio"
  ON public.receitas FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "receitas: update próprio"
  ON public.receitas FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "receitas: delete próprio"
  ON public.receitas FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas TO authenticated;

-- preparos --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.preparos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data_preparo date NOT NULL,
  dia_semana text,
  semana_ciclo smallint CHECK (semana_ciclo BETWEEN 1 AND 4),
  receita_id uuid NOT NULL REFERENCES public.receitas (id) ON DELETE RESTRICT,
  quantidade_porcoes integer NOT NULL CHECK (quantidade_porcoes > 0),
  observacoes text,
  status text NOT NULL DEFAULT 'congelado' CHECK (status IN ('congelado', 'consumido')),
  data_consumo date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.preparos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "preparos: select próprio" ON public.preparos;
DROP POLICY IF EXISTS "preparos: insert próprio" ON public.preparos;
DROP POLICY IF EXISTS "preparos: update próprio" ON public.preparos;
DROP POLICY IF EXISTS "preparos: delete próprio" ON public.preparos;

CREATE POLICY "preparos: select próprio"
  ON public.preparos FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "preparos: insert próprio"
  ON public.preparos FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "preparos: update próprio"
  ON public.preparos FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "preparos: delete próprio"
  ON public.preparos FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.preparos TO authenticated;

CREATE INDEX IF NOT EXISTS preparos_user_status_idx ON public.preparos (user_id, status);
CREATE INDEX IF NOT EXISTS preparos_receita_id_idx ON public.preparos (receita_id);

-- itens_compra ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.itens_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  grupo text NOT NULL CHECK (
    grupo IN ('proteinas', 'laticinios', 'carboidratos', 'vegetais', 'despensa')
  ),
  item text NOT NULL,
  tenho_em_casa boolean NOT NULL DEFAULT false,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.itens_compra ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "itens_compra: select próprio" ON public.itens_compra;
DROP POLICY IF EXISTS "itens_compra: insert próprio" ON public.itens_compra;
DROP POLICY IF EXISTS "itens_compra: update próprio" ON public.itens_compra;
DROP POLICY IF EXISTS "itens_compra: delete próprio" ON public.itens_compra;

CREATE POLICY "itens_compra: select próprio"
  ON public.itens_compra FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "itens_compra: insert próprio"
  ON public.itens_compra FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "itens_compra: update próprio"
  ON public.itens_compra FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "itens_compra: delete próprio"
  ON public.itens_compra FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_compra TO authenticated;
