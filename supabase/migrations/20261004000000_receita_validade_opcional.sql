-- =============================================================
-- Marmitas — validade congelado da receita passa a ser opcional
-- Objetivo: permitir cadastrar receita sem saber os dias de congelamento.
--   - remove apenas o NOT NULL de receitas.validade_congelado_dias;
--   - o CHECK (validade_congelado_dias > 0) continua valendo para qualquer valor
--     preenchido (NULL passa no CHECK, como em qualquer CHECK do Postgres).
-- Não altera: policies RLS, grants, dados, schemas auth/storage, service_role.
-- Motivo: o estoque passa a usar a validade individual de cada receita. Sem valor
-- informado, não há vencimento calculado e nenhum padrão é aplicado.
-- Pré-check (registrar antes de aplicar):
--   - projeto: appreforma (bhsvvpvfbszrcitjwxxl);
--   - coluna atual: integer NOT NULL CHECK (validade_congelado_dias > 0);
--   - contagem de linhas de receitas e de nulos na coluna (ver relatório).
-- Rollback (não executar, salvo falha de pós-check):
--   - só é possível se NÃO houver NULL na coluna. Caso contrário, é preciso
--     decidir um valor para cada receita sem validade antes de recolocar o NOT NULL.
--   ALTER TABLE public.receitas ALTER COLUMN validade_congelado_dias SET NOT NULL;
--   Pré-rollback (deve retornar 0 antes de executar o rollback):
--   SELECT count(*) FROM public.receitas WHERE validade_congelado_dias IS NULL;
--   Se o resultado for maior que 0, NÃO executar: decidir valor por receita com a usuária
--   ou manter a coluna anulável. Nenhum valor é inventado automaticamente.
-- Pós-check (somente leitura, após aplicar):
--   - is_nullable = 'YES' para validade_congelado_dias;
--   - constraint receitas_validade_congelado_dias_check continua: CHECK ((validade_congelado_dias > 0));
--   - contagem de receitas igual à de antes (18 no pré-check);
--   - nenhum valor existente alterado (comparar com o pré-check).
-- =============================================================

BEGIN;

ALTER TABLE public.receitas
  ALTER COLUMN validade_congelado_dias DROP NOT NULL;

COMMIT;
