-- =============================================================
-- Etapa 3 — receitas: campo notas (App Jornada)
-- Objetivo: guardar o texto "Leitura para o plano" (contexto nutricional) de cada
-- receita do guia, separado de dica_congelamento (que é especificamente sobre congelar).
-- Pré-check: coluna "notas" não existe ainda em receitas.
-- Rollback: ALTER TABLE public.receitas DROP COLUMN IF EXISTS notas;
-- =============================================================

ALTER TABLE public.receitas
  ADD COLUMN IF NOT EXISTS notas text;
