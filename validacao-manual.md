# Validação Manual — Checklist Único de Consulta

**Objetivo:** todo item que só pode ser confirmado por um humano usando o app de verdade
(navegador, celular, leitor de tela) — nunca por `npm test`/lint/build — vive aqui, num
lugar só. Consolidado de três fontes: `prd-jornada-app.md` §8, `etapas-mvp.md`, e
`auditoria-ux-etapa7b.md`.

**Como usar:** marque `[x]` quando confirmar de verdade, e anote a data + o que viu (mesmo
que seja "testei e tá ok"). Caixa marcada sem essa nota é hipótese, não prova — regra sua.
Pode editar este arquivo direto, sem precisar de mim. Quando eu confirmar algo numa sessão,
eu mesma marco e anoto a fonte.

---

## 1. Acesso e infraestrutura

- [x] Login funciona no celular — **13/10/2026**, Galaxy A34, Chrome, "ok"
- [x] RLS testado — sem login, nenhum dado acessível — **13/10/2026**, Galaxy A34,
  tentou rota direta (`/fisico/peso`) sem login, redirecionou pro login, "ok"
- [x] App deployado e acessível via URL, não só local — **09/10/2026, celular, "tudo ok"**
- [x] Smoke test pós-deploy (navegar o app logo depois de publicar) — **13/10/2026**,
  roteiro completo de validação no celular depois do redeploy que corrigiu o
  incidente de banco (ver nota abaixo), "ok"

## 2. Marmitas

- [x] Registrar preparo → estoque atualiza sozinho — **10/10/2026**, print na sessão (Panqueca,
  depois Caldo e Pão proteico apareceram no estoque ao cadastrar)
- [x] Alerta de validade (verde/amarelo/vermelho) aparece correto — **10/10/2026**, print
  (amarelo "Prazo próximo do fim", verde "Dentro do prazo")
- [x] Cronograma planejado das 4 semanas — app indica o que preparar na semana, não só o
  que já foi preparado — **10/10/2026**, localhost, "cronograma de semana ok"
- [x] Exportação de dados (CSV/JSON) testada no celular e no Excel PT-BR —
  **13/10/2026**, Galaxy A34, "ok"
- [x] Preparos antigos conferidos — usam a validade atual da receita corretamente
  — **13/10/2026**, Galaxy A34, "ok"
- [x] Editar ou excluir um preparo lançado errado (A.1) — **11/10/2026**, notebook,
  testado em `/marmitas/estoque`: editar receita/data/quantidade e excluir
  funcionando; confirmado que não mexe na receita em si (isso continua em
  `/marmitas/receitas`)
- [x] Busca e filtro por categoria na Biblioteca de receitas (#8) — **11/10/2026**,
  notebook, "ficou bom"
- [x] Estoque em seções por urgência + filtro por situação (A.7) — **11/10/2026**,
  notebook, "ficou bonito"
- [x] Resumo mensal de descartes com slicer de mês (A.12) — **11/10/2026**, notebook,
  "ok"

## 3. Jornada Física

- [x] Registrar peso, medida, treino e hábito do dia em menos de 1 minuto cada —
  **13/10/2026**, Galaxy A34, "ok"
- [x] Hidratação por quantidade (ml) com indicador de progresso do dia até a meta —
  **13/10/2026**, Galaxy A34, "ok"
- [x] Indicadores corporais estimados (cintura, RCEst, RCQ, RFM) calculados e exibidos
  corretamente, com classificação só em RCEst/RCQ — **13/10/2026**, Galaxy A34, "ok"
- [x] Metas numéricas configuradas e comparáveis com o valor atual registrado —
  **13/10/2026**, Galaxy A34, "ok"
- [x] Protocolo de coleta (frequência, postura, posicionamento da fita) disponível como
  referência dentro do app — **13/10/2026**, implementado: tela nova em
  `/fisico/medidas/protocolo` (link "Como medir" em `/fisico/medidas`), com a imagem
  de referência enviada por ela + o mesmo conteúdo em texto (a11y). Validado por ela
  em `localhost`, "ficou ótimo". Falta só o teste no celular de verdade (pendência
  geral de mobile, não específica deste item).
- [x] Alerta de variação atípica (>3cm) funcionando ao registrar medida —
  **13/10/2026**, Galaxy A34, "ok"
- [x] Gráfico de tendência do peso não liga pesagens distantes como se fosse queda
  contínua — **10/10/2026**, achado seu em teste manual (vão real de 26 dias entre
  pesagens desenhava reta enganosa); corrigido (commit `354eab2`) e reconfirmado na
  tela depois do fix

## 4. Mobile e acessibilidade (Galaxy A34)

- [x] Larguras 320/390px, zoom 200% — **confirmado 08-09/10/2026** nas telas de histórico,
  receitas, compras e home (não cobre telas novas, ver abaixo)
- [x] Leitor de tela, telas de erro/404 — **confirmado 08-09/10/2026**, mesmo escopo acima
- [x] Botão de descarte em `/marmitas/estoque` e tela `/marmitas/descartes` —
  **13/10/2026**, Galaxy A34, Chrome. Achou bug real (ver nota de infraestrutura
  abaixo): descarte dava "Não foi possível registrar" e a tela de descartados
  não carregava. Causa: produção apontava pro banco antigo (`appreforma`), não
  pro `mulherforte`. Corrigido (env vars na Vercel + redeploy) e reconfirmado
  funcionando pelo celular depois do fix.
- [x] Exclusão de meta em `/fisico/metas` — **13/10/2026**, Galaxy A34, "ok"
- [x] Vírgula decimal nos campos numéricos (peso, medidas) — teclado do Android pode só
  mostrar ponto; testar em `/fisico/peso` — **13/10/2026**, Galaxy A34, "ok"
- [x] Toques em links secundários pequenos ("Editar", "Ver histórico", "Ver tendência") —
  conferir se não ficam difíceis de tocar — **13/10/2026**, Galaxy A34, "ok"
- [x] `backdrop-blur` da barra de abas da Home renderiza bem no navegador do celular —
  **13/10/2026**, Galaxy A34, "ok"
- [x] Texto do `window.confirm` (exclusões) não corta em tela pequena —
  **13/10/2026**, Galaxy A34, "ok"

---

## Itens que a auditoria classificou como "bloqueador/corrigir antes do deploy" — ação
é de código, não de validação manual, mas listo aqui pra não perder o fio:

- [x] Login: erro sem `role="alert"`, botão sem "Entrando…" — corrigido e validado —
  **10/10/2026**, commit `1a3a1b4`; testado com Playwright (texto do alerta, foco,
  texto do botão) e confirmado por você ("para entrar: ok")
- [x] Cronograma: vaza `error.message` do Supabase direto na tela — corrigido —
  **10/10/2026**, commit `79106f6`; confirmado por você na tela ("cronograma de
  semana ok")
- [x] `npm run build` validado nesta sessão — **10/10/2026**, commit `696eb5c`, passou

---

**Relacionado:** `auditoria-ux-etapa7b.md` (relatório completo dos achados, inclusive os de
Fase 2 que não exigem validação manual, só decisão de prioridade).

---

## Incidente — produção apontava pro banco Supabase errado (13/10/2026)

Achado durante a validação manual no celular: descarte de preparo e a tela
`/marmitas/descartes` falhavam em produção, mas funcionavam em `localhost`.
Causa raiz confirmada (grep no bundle JS publicado): as env vars do projeto
`mulherforte` na **Vercel** (`NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`) nunca
tinham sido trocadas na separação de banco de 09/10/2026 — só o `.env.local`
foi atualizado. Produção rodou contra o banco antigo (`appreforma`,
compartilhado com o ReForma) de 09/10 a 13/10/2026.

**Corrigido:** env vars atualizadas na Vercel (manual, pela Dany) + redeploy.
Confirmado pelo mesmo método (bundle JS publicado) que o endereço mudou pro
`mulherforte` certo, e reconfirmado funcionando no celular depois.

**Consequência:** dados cadastrados por engano no banco antigo durante essa
janela (ex.: preparos "Panqueca de queijo cottage", "Frango desfiado ao molho
de tomate") não existem no banco novo — ficaram pra trás no `appreforma`.
**Decisão da Dany (13/10/2026): deixar pra trás, não recadastrar.**

**Lição:** depois de qualquer separação/migração de banco, conferir as env
vars do projeto **na Vercel**, não só o `.env.local` — e validar em produção
de verdade (não só localhost), porque os dois podem estar apontando pra
bancos diferentes sem nenhum erro óbvio até alguém testar uma ação que
depende de uma coluna/migration que só existe num dos dois.
