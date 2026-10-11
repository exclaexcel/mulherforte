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

- [ ] Login funciona no celular
- [ ] RLS testado — sem login, nenhum dado acessível
- [x] App deployado e acessível via URL, não só local — **09/10/2026, celular, "tudo ok"**
- [ ] Smoke test pós-deploy (navegar o app logo depois de publicar)

## 2. Marmitas

- [x] Registrar preparo → estoque atualiza sozinho — **10/10/2026**, print na sessão (Panqueca,
  depois Caldo e Pão proteico apareceram no estoque ao cadastrar)
- [x] Alerta de validade (verde/amarelo/vermelho) aparece correto — **10/10/2026**, print
  (amarelo "Prazo próximo do fim", verde "Dentro do prazo")
- [x] Cronograma planejado das 4 semanas — app indica o que preparar na semana, não só o
  que já foi preparado — **10/10/2026**, localhost, "cronograma de semana ok"
- [ ] Exportação de dados (CSV/JSON) testada no celular e no Excel PT-BR
- [ ] Preparos antigos conferidos — usam a validade atual da receita corretamente
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

- [ ] Registrar peso, medida, treino e hábito do dia em menos de 1 minuto cada
- [ ] Hidratação por quantidade (ml) com indicador de progresso do dia até a meta
- [ ] Indicadores corporais estimados (cintura, RCEst, RCQ, RFM) calculados e exibidos
  corretamente, com classificação só em RCEst/RCQ
- [ ] Metas numéricas configuradas e comparáveis com o valor atual registrado
- [ ] Protocolo de coleta (frequência, postura, posicionamento da fita) disponível como
  referência dentro do app
- [ ] Alerta de variação atípica (>3cm) funcionando ao registrar medida
- [x] Gráfico de tendência do peso não liga pesagens distantes como se fosse queda
  contínua — **10/10/2026**, achado seu em teste manual (vão real de 26 dias entre
  pesagens desenhava reta enganosa); corrigido (commit `354eab2`) e reconfirmado na
  tela depois do fix

## 4. Mobile e acessibilidade (Galaxy A34)

- [x] Larguras 320/390px, zoom 200% — **confirmado 08-09/10/2026** nas telas de histórico,
  receitas, compras e home (não cobre telas novas, ver abaixo)
- [x] Leitor de tela, telas de erro/404 — **confirmado 08-09/10/2026**, mesmo escopo acima
- [ ] As telas novas de hoje ainda não passaram por esse teste: `/marmitas/descartes`,
  botão de descarte em `/marmitas/estoque`, exclusão de meta em `/fisico/metas`
- [ ] Vírgula decimal nos campos numéricos (peso, medidas) — teclado do Android pode só
  mostrar ponto; testar em `/fisico/peso`
- [ ] Toques em links secundários pequenos ("Editar", "Ver histórico", "Ver tendência") —
  conferir se não ficam difíceis de tocar
- [ ] `backdrop-blur` da barra de abas da Home renderiza bem no navegador do celular
- [ ] Texto do `window.confirm` (exclusões) não corta em tela pequena

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
