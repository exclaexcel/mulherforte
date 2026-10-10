-- Objetivo: permitir descartar um preparo com prazo encerrado sem contar como
-- consumido no histórico, registrando o motivo (backlog 2.13).
-- Só adiciona: nenhuma coluna ou linha existente é removida ou alterada.

ALTER TABLE public.preparos
  DROP CONSTRAINT IF EXISTS preparos_status_check;

ALTER TABLE public.preparos
  ADD CONSTRAINT preparos_status_check
  CHECK (status IN ('congelado', 'consumido', 'descartado'));

ALTER TABLE public.preparos
  ADD COLUMN IF NOT EXISTS data_descarte date,
  ADD COLUMN IF NOT EXISTS motivo_descarte text
    CHECK (motivo_descarte IS NULL OR motivo_descarte IN ('vencido', 'estragado', 'outro'));
