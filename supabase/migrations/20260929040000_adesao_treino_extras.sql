-- =============================================================
-- Etapa 4 — adesao_treino: extras (App Jornada)
-- Objetivo: campos pedidos pela Dany depois de testar a tela — descrição
-- livre quando tipo = 'outro', duração (min) e calorias do treino.
-- Pré-check: tabela adesao_treino já existe (migration
-- 20260929030000_jornada_fisica_nucleo.sql), 0 linhas no momento.
-- Rollback:
--   ALTER TABLE public.adesao_treino DROP COLUMN IF EXISTS tipo_outro_descricao;
--   ALTER TABLE public.adesao_treino DROP COLUMN IF EXISTS duracao_minutos;
--   ALTER TABLE public.adesao_treino DROP COLUMN IF EXISTS calorias;
-- =============================================================

ALTER TABLE public.adesao_treino
  ADD COLUMN IF NOT EXISTS tipo_outro_descricao text,
  ADD COLUMN IF NOT EXISTS duracao_minutos integer CHECK (duracao_minutos > 0),
  ADD COLUMN IF NOT EXISTS calorias integer CHECK (calorias > 0);
