-- =============================================================
-- Etapa 4 — Jornada Física: núcleo (App Jornada)
-- Objetivo: tabelas registros_peso, medidas_corporais, adesao_treino,
-- adesao_habitos, metas + RLS. Sem cálculo clínico ainda (RCEst/RCQ/RFM/TMB
-- ficam pra Etapa 5) — só registro rápido e meta numérica comparável.
-- Pré-check: tabelas não existem ainda; perfil_usuario e auth.users já existem.
-- Rollback:
--   DROP TABLE IF EXISTS public.metas;
--   DROP TABLE IF EXISTS public.adesao_habitos;
--   DROP TABLE IF EXISTS public.adesao_treino;
--   DROP TABLE IF EXISTS public.medidas_corporais;
--   DROP TABLE IF EXISTS public.registros_peso;
-- =============================================================

-- registros_peso ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registros_peso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data date NOT NULL,
  peso_kg numeric(5,2) NOT NULL CHECK (peso_kg > 0),
  percentual_gordura numeric(5,2) CHECK (percentual_gordura BETWEEN 0 AND 100),
  massa_muscular numeric(5,2) CHECK (massa_muscular > 0),
  percentual_agua numeric(5,2) CHECK (percentual_agua BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT registros_peso_user_data_key UNIQUE (user_id, data)
);

ALTER TABLE public.registros_peso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registros_peso: select próprio" ON public.registros_peso;
DROP POLICY IF EXISTS "registros_peso: insert próprio" ON public.registros_peso;
DROP POLICY IF EXISTS "registros_peso: update próprio" ON public.registros_peso;
DROP POLICY IF EXISTS "registros_peso: delete próprio" ON public.registros_peso;

CREATE POLICY "registros_peso: select próprio"
  ON public.registros_peso FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "registros_peso: insert próprio"
  ON public.registros_peso FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "registros_peso: update próprio"
  ON public.registros_peso FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "registros_peso: delete próprio"
  ON public.registros_peso FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros_peso TO authenticated;

CREATE INDEX IF NOT EXISTS registros_peso_user_data_idx ON public.registros_peso (user_id, data DESC);

-- medidas_corporais ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medidas_corporais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data date NOT NULL,
  regiao text NOT NULL CHECK (regiao IN ('cintura', 'quadril', 'coxa', 'abdomen_inferior')),
  valor_cm numeric(5,2) NOT NULL CHECK (valor_cm > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medidas_corporais_user_data_regiao_key UNIQUE (user_id, data, regiao)
);

ALTER TABLE public.medidas_corporais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medidas_corporais: select próprio" ON public.medidas_corporais;
DROP POLICY IF EXISTS "medidas_corporais: insert próprio" ON public.medidas_corporais;
DROP POLICY IF EXISTS "medidas_corporais: update próprio" ON public.medidas_corporais;
DROP POLICY IF EXISTS "medidas_corporais: delete próprio" ON public.medidas_corporais;

CREATE POLICY "medidas_corporais: select próprio"
  ON public.medidas_corporais FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "medidas_corporais: insert próprio"
  ON public.medidas_corporais FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "medidas_corporais: update próprio"
  ON public.medidas_corporais FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "medidas_corporais: delete próprio"
  ON public.medidas_corporais FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medidas_corporais TO authenticated;

CREATE INDEX IF NOT EXISTS medidas_corporais_user_regiao_idx
  ON public.medidas_corporais (user_id, regiao, data DESC);

-- adesao_treino ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.adesao_treino (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('moves', 'zumba', 'outro')),
  obrigatorio boolean NOT NULL DEFAULT true,
  realizado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT adesao_treino_user_data_key UNIQUE (user_id, data)
);

ALTER TABLE public.adesao_treino ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "adesao_treino: select próprio" ON public.adesao_treino;
DROP POLICY IF EXISTS "adesao_treino: insert próprio" ON public.adesao_treino;
DROP POLICY IF EXISTS "adesao_treino: update próprio" ON public.adesao_treino;
DROP POLICY IF EXISTS "adesao_treino: delete próprio" ON public.adesao_treino;

CREATE POLICY "adesao_treino: select próprio"
  ON public.adesao_treino FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "adesao_treino: insert próprio"
  ON public.adesao_treino FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "adesao_treino: update próprio"
  ON public.adesao_treino FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "adesao_treino: delete próprio"
  ON public.adesao_treino FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.adesao_treino TO authenticated;

-- adesao_habitos ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.adesao_habitos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data date NOT NULL,
  bebeu_agua_meta boolean NOT NULL DEFAULT false,
  priorizou_proteina boolean NOT NULL DEFAULT false,
  quantidade_agua_ml integer NOT NULL DEFAULT 0 CHECK (quantidade_agua_ml >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT adesao_habitos_user_data_key UNIQUE (user_id, data)
);

ALTER TABLE public.adesao_habitos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "adesao_habitos: select próprio" ON public.adesao_habitos;
DROP POLICY IF EXISTS "adesao_habitos: insert próprio" ON public.adesao_habitos;
DROP POLICY IF EXISTS "adesao_habitos: update próprio" ON public.adesao_habitos;
DROP POLICY IF EXISTS "adesao_habitos: delete próprio" ON public.adesao_habitos;

CREATE POLICY "adesao_habitos: select próprio"
  ON public.adesao_habitos FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "adesao_habitos: insert próprio"
  ON public.adesao_habitos FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "adesao_habitos: update próprio"
  ON public.adesao_habitos FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "adesao_habitos: delete próprio"
  ON public.adesao_habitos FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.adesao_habitos TO authenticated;

-- metas ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data_inicio date NOT NULL,
  fase text,
  indicador text NOT NULL CHECK (indicador IN ('peso', 'cintura', 'abdomen_inferior', 'hidratacao')),
  valor_referencia numeric(6,2),
  valor_meta numeric(6,2),
  unidade text CHECK (unidade IN ('kg', 'cm')),
  prazo_estimado_semanas smallint CHECK (prazo_estimado_semanas > 0),
  meta_hidratacao_litros_dia numeric(4,2) CHECK (meta_hidratacao_litros_dia > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT metas_user_indicador_key UNIQUE (user_id, indicador)
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metas: select próprio" ON public.metas;
DROP POLICY IF EXISTS "metas: insert próprio" ON public.metas;
DROP POLICY IF EXISTS "metas: update próprio" ON public.metas;
DROP POLICY IF EXISTS "metas: delete próprio" ON public.metas;

CREATE POLICY "metas: select próprio"
  ON public.metas FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "metas: insert próprio"
  ON public.metas FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "metas: update próprio"
  ON public.metas FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "metas: delete próprio"
  ON public.metas FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas TO authenticated;
