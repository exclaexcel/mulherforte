# Ways of Working — App Jornada (Marmitas + Jornada Física)

Modelo de colaboração para as sessões de build com Claude Code, seguindo o mesmo padrão já
validado no ReForma.

---

## 1. Disciplina de escopo

- Não inventar nada fora do que está definido no PRD (`prd-jornada-app.md`) e no Backlog
  Fase 2 (`backlog-fase-2.md`)
- Nenhum item do Backlog Fase 2 entra durante o build do MVP, mesmo que pareça simples de
  adicionar "de brinde"
- Mudanças ficam limitadas exatamente ao que foi combinado na sessão — sem "melhorias"
  adicionais não solicitadas
- Em caso de ambiguidade de escopo, perguntar antes de agir — nunca assumir e seguir

## 2. Fonte da verdade

Os documentos abaixo são a referência oficial. Qualquer decisão de build deve estar
respaldada por eles:
- `prd-jornada-app.md` — problema, objetivo, escopo do MVP, modelo de dados, critério de pronto
- `backlog-fase-2.md` — o que fica para depois, e por quê

## 3. Segurança e dados sensíveis

Este app lida com dado de saúde pessoal (peso, medidas, composição corporal). Por isso:
- RLS (`auth.uid() = user_id`) obrigatório em toda tabela, desde a primeira migration —
  mesmo sendo uso pessoal de um único usuário
- Nenhuma chave, token ou credencial exposta no client — variáveis sensíveis só em
  `.env` / variáveis de ambiente do Vercel
- Qualquer mudança em autenticação, permissões ou schema do banco deve ser sinalizada
  explicitamente antes de aplicada, com risco e forma de reverter descritos
- Tabelas expostas à API usam grants mínimos: `anon` sem privilégio direto (o app exige
  login); `authenticated` só com SELECT, INSERT, UPDATE e DELETE. Nunca usar `GRANT ALL`
- Filtro explícito `.eq("user_id", user.id)` em toda leitura e em todo update/delete, além
  da RLS (defesa em profundidade, não substituição da policy)
- `user_id` sempre obtido da sessão no servidor (`supabase.auth.getUser()`); nunca aceito
  do cliente, do formulário ou da URL
- `service_role` não é usada no código da aplicação
- Fotos corporais permanecem fora de escopo até decisão explícita em contrário — ver
  Backlog Fase 2, item 2.6, para os requisitos de segurança se isso mudar

## 4. Formato de entrega de código

- Dany trabalha principalmente pelo celular — isso molda como a colaboração deve rodar
- Preferência por arquivos de código completos e prontos para copiar/colar, em vez de
  explicações fragmentadas ou trechos parciais
- Nenhum commit ou deploy não autorizado — commits e deploys acontecem só quando
  explicitamente pedidos

## 5. Definition of Done por etapa

Antes de considerar qualquer etapa concluída, confirmar:
- [ ] Código roda sem erro localmente
- [ ] RLS testado (sem login, nenhum dado deve ser acessível)
- [ ] Segue exatamente o modelo de dados do PRD — qualquer desvio precisa ser sinalizado
  e confirmado antes de seguir
- [ ] Nenhum item do Backlog Fase 2 foi implementado nesta etapa
- [ ] Ao implementar indicadores corporais estimados (RCEst, RCQ, RFM, Cintura-Coxa): sem
  hardcode de parâmetros do perfil, classificação sempre pelo valor bruto (arredondamento
  só na exibição), e validação de input contra divisão por zero/valor nulo — ver PRD
  seção 3.4.1

## 6. Auditorias

Assim como no ReForma, rodar auditoria nos marcos principais do projeto (meio do MVP e
conclusão do MVP), cobrindo: qualidade de código, segurança de tipos (TypeScript), RLS do
Supabase, e riscos de segurança — com relatório estruturado por severidade (crítico, alto,
moderado, baixo) e itens de ação priorizados.
