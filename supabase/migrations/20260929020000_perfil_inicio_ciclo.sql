-- =============================================================
-- Etapa 3 — perfil_usuario: campo cronograma_inicio_ciclo (App Jornada)
-- Objetivo: guardar a segunda-feira em que a Semana 1 do cronograma começou,
-- pra calcular automaticamente qual das 4 semanas é a atual.
-- Pré-check: coluna não existe ainda em perfil_usuario.
-- Rollback: ALTER TABLE public.perfil_usuario DROP COLUMN IF EXISTS cronograma_inicio_ciclo;
-- =============================================================

ALTER TABLE public.perfil_usuario
  ADD COLUMN IF NOT EXISTS cronograma_inicio_ciclo date;
