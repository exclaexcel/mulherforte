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

## Etapa 5 — Indicadores corporais estimados
**Objetivo:** o Painel de evolução corporal (cintura, RCEst, RCQ, RFM feminina) funcionando
com precisão e linguagem não diagnóstica. Relação Cintura-Coxa fica fora do painel, como
indicador exploratório sem classificação.
- Funções de cálculo puras, separadas em bruto / classificação / formatação (sem hardcode
  de altura — lida de `perfil_usuario`)
- Classificação sempre a partir do valor bruto, nunca do valor já arredondado pra exibição
- Testes unitários com a massa de dados de setembro/2026 (cintura 77, quadril 96, coxa 60,
  altura 152 → RCEst 0,51 / RCQ 0,80 / RFM 36,5% / Cintura-Coxa 1,28, exploratório)
- Arredondamento só na exibição (2 casas RCEst/RCQ, 1 casa RFM, inteiro no metabolismo de
  repouso)
- Validação de input (vírgula/ponto, nulo/zero, altura/cintura/quadril/coxa/peso ≤0, data
  de nascimento ausente ou no futuro)
- Sanity check de variação >3cm nas medidas
- Badges de classificação só pra RCEst e RCQ, com linguagem neutra (sem "proteção máxima",
  "padrão-ouro", "gordura residual" ou qualquer leitura de "sem risco" em verde); RFM e
  Cintura-Coxa sem badge/classificação
- Mensagem fixa de estimativa informativa (não diagnóstico) junto ao painel
- Dashboard com o painel (cintura, RCEst, RCQ, RFM) em destaque no topo, IMC em posição
  secundária, Cintura-Coxa em seção exploratória à parte, metabolismo de repouso (TMB)
  renomeado na interface

**Pronto quando:**
- [ ] Cintura, RCEst, RCQ e RFM batem exatamente com os valores esperados no teste
  (RCEst=0,51)
- [ ] Nenhum valor hardcoded de altura no código
- [ ] Dashboard reflete a hierarquia (painel em destaque, Cintura-Coxa exploratória, IMC
  secundário) e nenhuma linguagem diagnóstica aparece na interface

---

## Etapa 6A — Score de hábitos semanal (concluída, 2026-10-01)
**Objetivo:** a camada de "constância" — premiar execução do hábito, não o número da balança.
- Calendário fixo de treino obrigatório centralizado em `lib/fisico/calendarioTreino.ts`
  (segunda/quarta Move's, terça/quinta Zumba, sexta-domingo sem obrigatoriedade)
- Score semanal (`lib/fisico/score.ts`) com regra do dia atual (pendente fica fora até
  virar o dia), ausência de registro conta como não realizado, "Semana Vencida" a partir
  de 85% do valor bruto (comparação por multiplicação cruzada)
- Meta de hidratação só participa a partir da segunda-feira seguinte à criação
- Interface de Registrar Treino sem checkbox manual de obrigatoriedade — texto automático
  calculado pelo calendário, coluna `obrigatorio` só persistida por histórico

**Pronto quando:**
- [x] Score calculado corretamente como acumulado semanal, nunca streak
- [x] Treino obrigatório decidido só pelo calendário fixo, nunca pela coluna `obrigatorio`
- [x] Dia de hoje nunca penaliza item pendente
- [x] `npm test`/`build`/`lint` passando

---

## Etapa 6B — Linha de tendência do peso (pendente)
**Objetivo:** a camada de "anti-sabotagem da balança".
- Gráfico de peso com média móvel de 7 e 28 dias (janela de dias corridos, não últimos N
  registros), usando Recharts (decisão já tomada, pacote ainda não instalado)
- Cálculo em `lib/fisico/tendenciaPeso.ts` (puro), componente client isolado só pra render
- Campos `janela7dCompleta`/`janela28dCompleta` + `quantidadeRegistros7d`/`28d` pra UI
  distinguir janela parcial de completa sem usar linguagem de "confiável"

**Pronto quando:**
- [ ] Gráfico de tendência exibindo média móvel sobre os registros brutos, sem interpolar
- [ ] Estado alternativo claro quando não houver dados suficientes

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
