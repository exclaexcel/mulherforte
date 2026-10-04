-- =============================================================
-- Hardening — privilégios mínimos nas tabelas do App Jornada
-- Objetivo:
--   - remover todos os privilégios diretos de anon (o app exige login);
--   - revogar de authenticated TRUNCATE, REFERENCES e TRIGGER, que o app não usa;
--   - manter SELECT, INSERT, UPDATE e DELETE para authenticated.
-- Não altera: policies RLS, schemas auth/storage, dados, service_role.
-- Pré-check (registrado antes da aplicação):
--   - projeto: appreforma (bhsvvpvfbszrcitjwxxl), 10/10 tabelas encontradas;
--   - dono das tabelas: postgres; RLS ativa e sem FORCE em 10/10;
--   - 4 policies por tabela (40 no total), todas TO authenticated;
--   - grants atuais: anon, authenticated e service_role com
--     DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE.
-- Uso no código (auditoria): só SELECT, INSERT, UPDATE e DELETE
-- (inclusive upsert, que usa INSERT + UPDATE). Nenhum rpc, nenhum trigger
-- criado pelo app, nenhum DDL em runtime.
-- Rollback: ver bloco comentado no fim deste arquivo. Só restaura os grants
-- removidos aqui. Executar apenas se pós-checks ou testes falharem.
-- =============================================================

BEGIN;

REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE
    public.perfil_usuario,
    public.registros_peso,
    public.medidas_corporais,
    public.adesao_treino,
    public.adesao_habitos,
    public.metas,
    public.receitas,
    public.preparos,
    public.itens_compra,
    public.cronograma_planejado
  FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON TABLE
    public.perfil_usuario,
    public.registros_peso,
    public.medidas_corporais,
    public.adesao_treino,
    public.adesao_habitos,
    public.metas,
    public.receitas,
    public.preparos,
    public.itens_compra,
    public.cronograma_planejado
  FROM authenticated;

COMMIT;

-- =============================================================
-- ROLLBACK (não executar, salvo falha de pós-check ou de teste):
--
-- GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
--   ON TABLE
--     public.perfil_usuario,
--     public.registros_peso,
--     public.medidas_corporais,
--     public.adesao_treino,
--     public.adesao_habitos,
--     public.metas,
--     public.receitas,
--     public.preparos,
--     public.itens_compra,
--     public.cronograma_planejado
--   TO anon;
--
-- GRANT TRUNCATE, REFERENCES, TRIGGER
--   ON TABLE
--     public.perfil_usuario,
--     public.registros_peso,
--     public.medidas_corporais,
--     public.adesao_treino,
--     public.adesao_habitos,
--     public.metas,
--     public.receitas,
--     public.preparos,
--     public.itens_compra,
--     public.cronograma_planejado
--   TO authenticated;
-- =============================================================
