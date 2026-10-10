Dany, fiz a auditoria sem alterar arquivos. Foquei em usabilidade + CRUD, olhando código, migrations e validações.

**Provas Rodadas**
- `git status --short --branch`: `main...origin/main`; não rastreados: `.claude/`, `auditoriabl0.txt`, `revisao.txt`.
- `npm run lint`: passou, sem warnings.
- `npm run build`: passou em Next 14.2.35.
- `npm test`: não iniciou por erro de ambiente/permissão ao carregar `vitest.config.mts`: `Cannot read directory "../../../..": Access is denied`.
- Não fiz validação visual em navegador/mobile/leitor de tela; então UX visual fina ainda é hipótese.

**O Que Está Bom**
- RLS e defesa em profundidade: consultas filtram `user_id` além da RLS em [lib/marmitas/consultas.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/lib/marmitas/consultas.ts:5).
- CRUD físico usa `upsert` por data e exclusão filtrada por `user_id`, bom para “corrigir o dia” sem duplicar registros em [app/fisico/actions.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/fisico/actions.ts:63).
- Feedback de formulário, bloqueio de duplo envio e foco em erro estão bem encaminhados em [components/formulario-acao.tsx](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/components/formulario-acao.tsx:54).
- Exportação tem paginação própria e evita despejar dados técnicos/sessão, ponto forte para soberania dos dados.

**Achados Prioritários**
1. **Alto — CRUD de preparos está incompleto.**  
   O preparo cria, marca como consumido e descarta, mas não há fluxo para editar data/receita/quantidade/semana/observação nem excluir um preparo lançado errado. Evidência: criação em [app/marmitas/actions.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/marmitas/actions.ts:277), consumo em [app/marmitas/actions.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/marmitas/actions.ts:296), descarte em [app/marmitas/actions.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/marmitas/actions.ts:328).  
   Correção: criar histórico de preparos com editar/excluir/restaurar status, ou ao menos “corrigir preparo” a partir do estoque.

2. **Alto — lista de compras não tem delete nem mudança de grupo.**  
   Dá para criar item, alternar “tenho em casa” e corrigir nome, mas não remover item nem mover de grupo. Evidência: criação/edição/toggle em [app/marmitas/actions.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/marmitas/actions.ts:399) e UI em [app/marmitas/compras/page.tsx](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/marmitas/compras/page.tsx:108).  
   Correção: adicionar “editar item completo” com grupo + nome + observação + excluir.

3. **Alto — campos decimais são ruins para PT-BR.**  
   A UI usa `type="number"` para peso, medidas, metas e altura, mas os parsers usam `Number(raw)`, que não aceita vírgula decimal. Para Dany/Excel PT-BR, `72,5` tende a falhar ou nem entrar no FormData. Evidência: [lib/numero-formulario.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/lib/numero-formulario.ts:17), peso em [app/fisico/actions.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/fisico/actions.ts:35), inputs em [app/fisico/peso/page.tsx](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/fisico/peso/page.tsx:149).  
   Correção: trocar para input decimal amigável com `inputMode="decimal"` e parser que aceite vírgula/ponto.

4. **Moderado — histórico e listas não têm paginação/filtro.**  
   O histórico físico carrega quatro tabelas inteiras sem `limit`, e marmitas também lista tudo em algumas telas. Evidência: [app/fisico/historico/page.tsx](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/fisico/historico/page.tsx:146), receitas sem paginação em [lib/marmitas/consultas.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/lib/marmitas/consultas.ts:11).  
   Correção: filtros “últimos 30/90 dias”, busca, paginação simples e botão “ver mais”.

5. **Moderado — usabilidade de navegação depende de cards e `details`, sem busca.**  
   Home está organizada por abas, mas biblioteca de receitas vira uma lista expansível manual sem busca/filtro textual. Evidência: cards em [app/page.tsx](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/page.tsx:85), receitas em [app/marmitas/receitas/page.tsx](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/marmitas/receitas/page.tsx:102).  
   Correção: busca por nome/selo/categoria e ações rápidas visíveis: editar, preparar, duplicar.

6. **Moderado — validação de data é inconsistente.**  
   `ehDataFutura` declara que formato inválido deve ser validado pela action, mas várias actions só checam vazio/futuro e deixam o banco devolver erro genérico. Evidência: [lib/date.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/lib/date.ts:29), peso em [app/fisico/actions.ts](/C:/Users/daany/.vscode/Projeto/Repos/acompanhamento_dany/app/fisico/actions.ts:34).  
   Correção: centralizar `dataValidaISO` e usar em todas as actions com mensagem clara.

**Ordem Segura De Melhoria**
1. Corrigir parser decimal PT-BR + testes.
2. Completar CRUD de preparos.
3. Completar CRUD de compras.
4. Adicionar filtros/paginação no histórico.
5. Fazer validação visual real em mobile, contraste composto e fluxo CRUD ponta a ponta.