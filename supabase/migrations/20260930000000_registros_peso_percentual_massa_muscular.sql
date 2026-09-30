-- =============================================================
-- Etapa 4 — registros_peso: corrige massa_muscular para percentual (App Jornada)
-- Objetivo: a coluna foi criada como "kg absoluto", mas ao importar o
-- relatório real (balança OKOK) ficou claro que o dado é percentual do
-- peso corporal (ex: 34,6% num peso de 58,1kg — 34,6kg seria ~60% do
-- corpo, não bate). Renomeia e limita a faixa 0-100, igual aos outros
-- campos percentuais da mesma tabela.
-- Pré-check: coluna massa_muscular existe (migration
-- 20260929030000_jornada_fisica_nucleo.sql), 0 linhas até este momento.
-- Rollback:
--   ALTER TABLE public.registros_peso DROP CONSTRAINT IF EXISTS registros_peso_percentual_massa_muscular_check;
--   ALTER TABLE public.registros_peso RENAME COLUMN percentual_massa_muscular TO massa_muscular;
--   ALTER TABLE public.registros_peso ADD CONSTRAINT registros_peso_massa_muscular_check CHECK (massa_muscular > 0);
-- =============================================================

ALTER TABLE public.registros_peso
  RENAME COLUMN massa_muscular TO percentual_massa_muscular;

ALTER TABLE public.registros_peso
  DROP CONSTRAINT IF EXISTS registros_peso_massa_muscular_check;

ALTER TABLE public.registros_peso
  ADD CONSTRAINT registros_peso_percentual_massa_muscular_check
  CHECK (percentual_massa_muscular BETWEEN 0 AND 100);
