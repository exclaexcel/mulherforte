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
- [ ] Cronograma planejado das 4 semanas — app indica o que preparar na semana, não só o
  que já foi preparado
- [ ] Exportação de dados (CSV/JSON) testada no celular e no Excel PT-BR
- [ ] Preparos antigos conferidos — usam a validade atual da receita corretamente

## 3. Jornada Física

- [ ] Registrar peso, medida, treino e hábito do dia em menos de 1 minuto cada
- [ ] Hidratação por quantidade (ml) com indicador de progresso do dia até a meta
- [ ] Indicadores corporais estimados (cintura, RCEst, RCQ, RFM) calculados e exibidos
  corretamente, com classificação só em RCEst/RCQ
- [ ] Metas numéricas configuradas e comparáveis com o valor atual registrado
- [ ] Protocolo de coleta (frequência, postura, posicionamento da fita) disponível como
  referência dentro do app
- [ ] Alerta de variação atípica (>3cm) funcionando ao registrar medida

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

- [ ] Login: erro sem `role="alert"`, botão sem "Entrando…" — corrigir
- [ ] Cronograma: vaza `error.message` do Supabase direto na tela — corrigir
- [x] `npm run build` validado nesta sessão — **10/10/2026**, commit `696eb5c`, passou

---

**Relacionado:** `auditoria-ux-etapa7b.md` (relatório completo dos achados, inclusive os de
Fase 2 que não exigem validação manual, só decisão de prioridade).
