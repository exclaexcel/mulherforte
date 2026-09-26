# Etapas de Build — App Jornada (MVP)
**Como usar:** cada etapa é um incremento funcional e testável. Não passa para a próxima
sem fechar o checklist da atual. Trabalhar com Cursor + Claude uma etapa de cada vez evita
abrir muita frente ao mesmo tempo e mantém o RLS/segurança sob controle desde o início.

---

## Etapa 1 — Fundação
**Objetivo:** projeto rodando, autenticado, vazio, mas seguro.
- Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Projeto Supabase criado, Auth configurado (login único, Dany)
- Tabela `perfil_usuario` criada com RLS
- Deploy inicial no Vercel (mesmo que só com tela de login)

**Pronto quando:**
- [ ] Login funciona
- [ ] RLS testado — sem login, nenhum dado acessível
- [ ] Deploy acessível via URL

---

## Etapa 2 — Marmitas: núcleo
**Objetivo:** parar de depender do Excel para preparo/estoque/compras.
- Tabelas: `receitas`, `preparos`, `itens_compra` (com RLS)
- Tela de registro de preparo
- Tela de estoque calculado (alerta verde/amarelo/vermelho por validade)
- Tela de lista de compras

**Pronto quando:**
- [ ] Consegue registrar um preparo e ver o estoque atualizar sozinho
- [ ] Alerta de validade aparece corretamente
- [ ] Lista de compras funcional

---

## Etapa 3 — Marmitas: conteúdo e planejamento
**Objetivo:** "tudo num lugar só" — abandonar o PDF/planilha de vez.
- Biblioteca de receitas populada com as 16 receitas do guia original
- Tabela `cronograma_planejado` (template das 4 semanas)
- Telas de referência estática: plano alimentar (horários), boas práticas/regras USDA

**Pronto quando:**
- [ ] Biblioteca de receitas completa, sem precisar abrir o PDF
- [ ] App indica o que preparar na semana (não só o histórico)

---

## Etapa 4 — Jornada Física: núcleo
**Objetivo:** registrar o essencial da rotina física, sem cálculo ainda.
- Tabelas: `registros_peso`, `medidas_corporais`, `adesao_treino`, `adesao_habitos`, `metas`
  (com RLS)
- Telas de registro rápido (peso, medida, treino, hábito do dia)
- Meta numérica configurável (peso, cintura, abdômen inferior)

**Pronto quando:**
- [ ] Consegue registrar peso, medida, treino e hábito do dia em menos de 1 minuto cada
- [ ] Metas numéricas configuradas e comparáveis com valor atual

---

## Etapa 5 — Indicadores clínicos
**Objetivo:** a "bússola oficial" (RCEst, RCQ, RFM, Cintura-Coxa) funcionando com precisão.
- Funções de cálculo puras (sem hardcode de estatura — lida de `perfil_usuario`)
- Testes unitários com a massa de dados de setembro/2026 (cintura 77, quadril 96, coxa 60,
  estatura 152 → RCEst 0,50 / RCQ 0,80 / RFM 36,5% / Cintura-Coxa 1,28)
- Arredondamento padronizado (2 casas RCEst/RCQ, 1 casa RFM)
- Validação de input (vírgula/ponto, nulo/zero)
- Sanity check de variação >3cm nas medidas
- Badges de classificação por faixa de corte
- Dashboard com o quarteto em destaque no topo, IMC em posição secundária

**Pronto quando:**
- [ ] Todos os 4 indicadores batem exatamente com os valores esperados no teste
- [ ] Nenhum valor hardcoded de estatura no código
- [ ] Dashboard reflete a hierarquia (quarteto em destaque, IMC secundário)

---

## Etapa 6 — Score de hábitos e linha de tendência
**Objetivo:** as camadas de "constância" e "anti-sabotagem da balança".
- Score de hábitos semanal (checklist de 3 itens, acumulado — nunca streak que zera,
  ≥85% = "Semana Vencida")
- Gráfico de peso com média móvel de 7 e 28 dias

**Pronto quando:**
- [ ] Score calculado corretamente como acumulado semanal
- [ ] Gráfico de tendência exibindo média móvel sobre os registros brutos

---

## Etapa 7 — Exportação e polimento final
**Objetivo:** fechar os últimos itens de segurança/soberania de dados e acabamento visual.
- Exportação CSV/JSON de todas as tabelas
- Protocolo de coleta como tela de referência (se ainda não incluído na Etapa 3)
- Revisão visual final: paleta, tipografia, padrão de card conforme guia de referência

**Pronto quando:**
- [ ] Exportação funcionando para todas as tabelas
- [ ] Todos os 19 itens da seção 8 do PRD marcados como concluídos

---

## Observação sobre prioridade real

Se o tempo for curto amanhã, as **Etapas 1-4 já entregam o valor original**: sair do Excel
e começar a registrar tudo no app. As **Etapas 5-7** são o refinamento clínico e
comportamental que vieram das rodadas de aprofundamento de hoje — valiosas, mas a jornada
física básica já funciona sem elas (só sem os cálculos avançados, o score e a exportação).
