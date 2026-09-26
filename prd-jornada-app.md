# PRD — App Jornada (Marmitas + Jornada Física)
**Autora:** Dany | **Status:** MVP definido, pronto para build | **Última atualização:** setembro/2026

---

## 1. Problema

Hoje o controle de marmitas (preparo, estoque, validade) e o acompanhamento da jornada física
(peso, medidas, treino, hábitos) vivem em planilha Excel e documentos separados (PDFs de
relatório). Isso funciona, mas:
- Exige abrir o Excel pra registrar ou consultar qualquer coisa
- Não dá alerta automático de validade de marmita
- Não roda bem no celular, no meio da rotina do dia

## 2. Objetivo

Ter um app pessoal, acessível pelo celular, onde Dany registra e consulta:
- O que foi preparado e o que está no congelador (marmitas)
- Peso, medidas e adesão à rotina (treino + hábitos) da Jornada Física

O app deve estar pronto **antes** do início da nova rotina física, para que o registro comece
direto nele — sem depender da planilha em paralelo.

## 3. Escopo do MVP

### 3.1 Módulo Marmitas
- Registrar um preparo: data, dia da semana, semana do ciclo, receita (referenciando a
  biblioteca de receitas), quantidade, observações, status (congelado/consumido)
- Ver estoque atual do congelador, calculado a partir dos preparos com status "congelado"
- Alerta de validade por cor: verde (até 60 dias) / amarelo (61-90) / vermelho (90+)
- Lista de compras por grupo (proteínas, laticínios, carboidratos, vegetais, despensa),
  com marcação de "tenho em casa"
- **Biblioteca de receitas**: tudo que hoje está no PDF/guia (ingredientes, modo de preparo,
  dicas de congelamento, selos como "air fryer"/"congelável") passa a viver no app, não só
  em documento externo. Ao registrar um preparo, a receita é selecionada dessa biblioteca —
  não é mais texto livre
- **Cronograma planejado (template de rotação)**: guarda o *plano* das 4 semanas (o que
  deveria ser preparado em cada dia/semana do ciclo), separado do histórico do que já foi
  de fato preparado. Sem isso, o app só sabe o passado, não orienta o que fazer a seguir

### 3.1.1 Plano alimentar e dicas gerais (referência estática)
- Mapa de horários do plano (ex: 09:30 café da manhã, 12:00 almoço, 16:00 lanche, etc.),
  cadastrado como referência simples — não precisa de tabela própria, pode ser conteúdo
  fixo na tela ("Sobre o plano")
- Dicas gerais de boas práticas e regras de segurança alimentar (USDA), hoje na aba
  "Informações Importantes" da planilha — viram uma tela de referência dentro do app,
  fora do fluxo de registro diário

### 3.2 Módulo Jornada Física
- Registrar peso (data, peso em kg)
- **Linha de tendência**: gráfico de peso com média móvel de 7 e 28 dias sobreposta aos
  registros brutos — neutraliza oscilações normais de 500g-1kg (sódio, ciclo hormonal) que
  distorcem a leitura do progresso real. Única exceção à regra de "cards, não gráfico de
  linha" (seção 7), justamente por resolver o risco de sabotagem emocional pela balança
- Registrar medidas corporais (data, região, valor em cm)
- **Sanity check de medidas**: ao salvar uma medida com variação maior que 3 cm em relação
  ao mês anterior, exibir alerta sutil ("Variação atípica. Confira a tensão da fita e a
  altura anatômica antes de confirmar") — não bloqueia o registro, só avisa
- Registrar adesão ao treino (data, tipo, obrigatório sim/não, realizado sim/não)
- Registrar adesão a hábitos diários (data, bebeu água meta sim/não, priorizou proteína
  sim/não, quantidade de água em ml — comparada à meta diária em litros definida em `metas`)
- Meta com valor numérico por indicador: peso, cintura e abdômen inferior (cada um com
  valor de referência → valor meta), com prazo estimado
- **Indicadores clínicos calculados** (não digitados, derivados do que já foi registrado
  em `perfil_usuario` e `medidas_corporais`):
  - **RCEst** (relação cintura-estatura) = cintura ÷ estatura
    - ≤ 0,50: proteção cardiovascular máxima (padrão-ouro) · 0,51-0,59: risco metabólico
      aumentado · ≥ 0,60: alto risco cardiovascular
  - **RCQ** (relação cintura-quadril) = cintura ÷ quadril
    - ≤ 0,80: baixo risco (distribuição ginoide saudável) · 0,81-0,85: risco moderado ·
      > 0,85: risco aumentado (corte OMS)
  - **RFM** (massa gorda relativa) = 76 − (20 × estatura ÷ cintura)
    - 21-24%: faixa atlética/alta definição · 25-31%: faixa saudável recomendada ·
      32-39%: faixa de gordura residual/recomposição · ≥ 40%: faixa de obesidade
  - **Relação Cintura-Coxa** = cintura ÷ coxa
    - ≤ 1,30: alta proteção metabólica/boa massa muscular de pernas · 1,31-1,50:
      intermediária · > 1,50: alerta metabólico (predomínio de gordura abdominal)
  - TMB (taxa metabólica basal, estimativa por fórmula) = a partir de peso, altura, idade
  - Exibidos como cálculo em tela, com a classificação textual da faixa (não só o número)

### 3.2.1 Protocolo de coleta (referência estática)
Tela de referência com o protocolo padrão de medição, para garantir consistência entre
uma checagem e outra (mitiga o risco de "inconsistência de fita" citado no relatório):
- Frequência: uma vez a cada 30 dias
- Momento: pela manhã, em jejum completo, após esvaziar a bexiga
- Postura: em pé, abdômen relaxado, sem prender a respiração
- Posicionamento: cintura (ponto mais estreito, dois dedos acima do umbigo), quadril
  (maior circunferência dos glúteos), coxa (ponto médio da coxa direita)

### 3.2.2 Score de hábitos semanal (causa vs. efeito)
Placar semanal separando o que é **ação diária sob controle direto** (causa) do que é
**resultado tardio** (efeito — peso e medidas). Conceito: premiar a execução do hábito,
não o número da balança — desarma a frustração emocional com a pesagem.

**Checklist diário (3 itens):**
- Proteína do dia batida (sim/não)
- Hidratação atingida — 2,2 a 2,5 L (sim/não, a partir de `adesao_habitos.quantidade_agua_ml`)
- Treino do dia concluído (Move's ou Zumba, nos dias fixos — a partir de `adesao_treino`)

**Mecânica:**
- Cada item diário preenche uma fração da barra de progresso semanal
- **≥ 85% da semana = status verde "Semana Vencida"** — confirma que a recomposição está
  ocorrendo mesmo com a balança oscilando por retenção de água
- Calculado a partir de `adesao_habitos` e `adesao_treino` já registrados — não exige
  tabela nova, é uma agregação semanal

**Regra explícita anti-punição:** o score é sempre uma **média/acumulado da semana**, nunca
um streak diário que zera com uma quebra. Um dia atípico não deve resetar o progresso —
isso vai contra o "não se cobrar pelos dias que não puder treinar" do guia original.

### 3.2.3 Exportação de dados (soberania dos dados)
Botão de exportação em 1 clique de todas as tabelas em CSV ou JSON. Dado de saúde pessoal
nunca fica refém do aplicativo — permite backup, análise em planilha própria, ou migração
futura sem atrito.

### 3.3 Fora do MVP (ver documento "Backlog Fase 2")
- Indicadores visuais de percepção subjetiva
- Aba "Celebrar" (timeline de marcos/conquistas)
- Registro separado de bioimpedância (no MVP, é campo opcional dentro do registro de peso)
- Metas qualitativas (força, definição — sem número fixo)
- Dashboards e gráficos avançados (além da linha de tendência de peso, que é MVP — seção 3.2)
- Fotos corporais (fora de escopo até nova decisão — dado sensível, requer Storage privado)
- Exportador "1-toque" formatado para WhatsApp (resumo mensal para o treinador)

## 3.4 Decisão estratégica de acompanhamento

O IMC isolado deixa de ser critério de sucesso. A partir da Fase 2, a bússola oficial de
evolução no app é o quarteto **RCEst + RCQ + RFM + Relação Cintura-Coxa**, calculado a partir
de cintura, quadril, coxa e estatura já registrados — não o peso ou o IMC sozinhos. O
dashboard principal do módulo Jornada Física deve refletir essa prioridade visualmente:
- O quarteto (RCEst, RCQ, RFM, Relação Cintura-Coxa) ocupa o card principal, no topo,
  cada um com selo visual de status (ex: "Proteção Máxima", "Faixa Saudável")
- O IMC aparece em camada secundária/informativa — nunca no topo, para não deixar um
  cálculo isolado ditar o humor de quem abre o app

### 3.4.1 Riscos técnicos a monitorar na implementação
- **Quebra de input**: tratar separador de vírgula/ponto e validação de entrada nula nas
  medidas, para não gerar erro de divisão (cintura/quadril/coxa não podem ser zero ou vazias)
- **Inconsistência de arredondamento**: padronizar na camada lógica — 2 casas decimais para
  RCEst e RCQ; 1 casa decimal para RFM (%)
- **Acoplamento rígido (hardcode)**: a estatura (152 cm) deve ser lida de `perfil_usuario`,
  nunca cravada dentro das funções de cálculo

### 3.4.2 Massa de dados para teste unitário
Validar as funções de cálculo com os dados reais de setembro/2026 antes de considerar a
etapa concluída:
- Entrada: cintura 77 cm, quadril 96 cm, coxa 60 cm, estatura 152 cm
- Saída esperada: RCEst = 0,50 · RCQ = 0,80 · RFM = 36,5% · Relação Cintura-Coxa = 1,28

## 4. Fora de escopo (permanente, não é "depois")

- Multi-usuário / multi-tenant — é ferramenta pessoal
- Qualquer forma de monetização ou abertura pra terceiros
- Integração com balança conectada ou wearables (avaliar só se necessidade real aparecer)

## 5. Modelo de dados do MVP

```sql
-- Módulo Marmitas
receitas (
  id, user_id, nome, categoria, ingredientes, modo_preparo,
  dica_congelamento, selos  -- ex: "air fryer", "congelável", "porcionável"
)

preparos (
  id, user_id, data_preparo, dia_semana, semana_ciclo,
  receita_id (FK -> receitas.id), quantidade_porcoes, observacoes,
  status, data_consumo
)

cronograma_planejado (
  id, user_id, semana_ciclo, dia_semana, receita_id (FK -> receitas.id)
  -- template fixo de rotação, editável; "preparos" registra o que de fato aconteceu
)

itens_compra (
  id, user_id, grupo, item, tenho_em_casa, observacao
)

-- Módulo Jornada Física
perfil_usuario (
  id, user_id, altura_cm, data_nascimento
  -- necessário para calcular RCEst e TMB; preenchido uma vez, editável
)

registros_peso (
  id, user_id, data, peso_kg,
  percentual_gordura, massa_muscular, percentual_agua  -- campos opcionais de bioimpedância
)

medidas_corporais (
  id, user_id, data, regiao, valor_cm
)

adesao_treino (
  id, user_id, data, tipo, obrigatorio, realizado
)

adesao_habitos (
  id, user_id, data, bebeu_agua_meta, priorizou_proteina, quantidade_agua_ml
)

metas (
  id, user_id, data_inicio, fase, indicador (ex: "peso", "cintura", "abdomen_inferior"),
  valor_referencia, valor_meta, unidade (kg/cm), prazo_estimado_semanas,
  meta_hidratacao_litros_dia
  -- uma linha por indicador com meta numérica (peso, cintura, abdômen).
  -- Metas sem número (força, braços, glúteos, definição) ficam no Backlog Fase 2.
)
```

Toda tabela leva `user_id` + RLS (`auth.uid() = user_id`) desde a primeira migration —
não negociável, mesmo sendo uso pessoal.

## 6. Stack e arquitetura

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui — mesmo padrão do ReForma
- **Backend/DB:** Supabase (Postgres + Auth + RLS)
- **Deploy:** Vercel
- **Autenticação:** Supabase Auth, login único (Dany)

## 7. Design / referência visual

- Paleta: verde-oliva escuro (headers), rosa pastel e verde claro (cards), bege/off-white (base)
- Tipografia: fonte script pra títulos/frases motivacionais + sans-serif limpa pro conteúdo
- Padrão de card: ícone + título + lista com ✓/✕, cor com significado (verde=positivo,
  rosa=meta/foco)
- Tom de interface: primeira pessoa, acolhedor, sem jargão técnico nas telas principais
- Dashboard principal usa cards de "estado atual → meta", não gráfico de linha como visualização
  primária
- **Hidratação**: inspirar no padrão de apps dedicados a isso (ex: WaterMinder, Plant Nanny,
  Aqualert) — geralmente um indicador circular/barra de progresso do dia (ex: "1,4L de 2,3L"),
  com botões de incremento rápido (+200ml, +300ml, copo, garrafa) em vez de digitar valor
  exato. Mais rápido de registrar várias vezes ao dia do que abrir formulário completo

## 8. Definição de "Pronto" (MVP)

O MVP está pronto quando:
- [ ] Dany consegue logar no app pelo celular
- [ ] Consegue registrar um preparo de marmita e ver o estoque atualizar sozinho
- [ ] Consegue registrar peso, medida, treino e hábito do dia em menos de 1 minuto por registro
- [ ] Alerta de validade (verde/amarelo/vermelho) aparece corretamente no estoque
- [ ] App está deployado e acessível via URL, não só rodando local
- [ ] RLS testado — confirma que sem login não é possível acessar nenhum dado
- [ ] Biblioteca de receitas populada com as 16 receitas do guia original (ingredientes,
  modo de preparo, dicas), permitindo abandonar o PDF como referência
- [ ] Cronograma planejado das 4 semanas cadastrado — app indica o que preparar na semana,
  não só o que já foi preparado
- [ ] Registro de hidratação por quantidade (ml), com indicador de progresso do dia até a meta
- [ ] Indicadores clínicos (RCEst, RCQ, RFM, Relação Cintura-Coxa, TMB) calculados
  corretamente a partir de peso, altura e medidas já registrados, com classificação de
  faixa exibida junto ao número
- [ ] Metas numéricas de peso, cintura e abdômen inferior configuradas e comparáveis com
  o valor atual registrado
- [ ] Protocolo de coleta (frequência, momento, postura, posicionamento da fita) disponível
  como referência dentro do app
- [ ] Funções de cálculo (RCEst, RCQ, RFM, Cintura-Coxa) testadas com a massa de dados de
  setembro/2026 (seção 3.4.2), batendo exatamente com os valores esperados
- [ ] Validação de input tratando vírgula/ponto e valores nulos/zero nas medidas, sem gerar
  erro de divisão
- [ ] Estatura lida de `perfil_usuario` nas funções de cálculo, nunca hardcoded
- [ ] Dashboard exibe o quarteto funcional em destaque no topo, com o IMC em posição
  secundária/informativa
- [ ] Gráfico de peso exibe média móvel de 7 e 28 dias sobre os registros brutos
- [ ] Alerta de variação atípica (>3cm) funcionando ao registrar medida
- [ ] Score de hábitos semanal (proteína, hidratação, treino) calculado como acumulado da
  semana — nunca como streak diário que zera — com status verde a partir de 85%
- [ ] Exportação de dados em CSV/JSON funcionando para todas as tabelas

## 9. Documentos relacionados

- `backlog-fase-2.md` — indicadores visuais, aba Celebrar, metas qualitativas, dashboards
- `ways-of-working-jornada.md` — como as sessões de build com Claude Code vão rodar

## 10. Arquivos de referência para anexar na sessão do Claude Code

Este PRD não substitui os arquivos originais — ele resume decisões, mas alguns anexos
precisam ir junto na primeira sessão, senão a IA não tem acesso a eles:

- [ ] **Imagens do guia visual** (`1000418238.png` e `1000420675.jpg`) — anexar sempre que
  for construir ou ajustar telas. A seção 7 deste PRD descreve o estilo em palavras, mas
  não substitui ver o layout real (cards, cores, tipografia, ícones)
- [ ] **Referência de código do ReForma** — se quiser que o padrão de código (estrutura de
  pastas, componentes, convenções TypeScript/Tailwind) seja consistente com o ReForma, apontar
  explicitamente o repositório/pasta do ReForma na sessão, ou copiar um componente de exemplo
  junto. O Claude Code não acessa outro projeto seu sozinho, mesmo sabendo que ele existe
- [ ] **Relatório completo da Fase 2** (o PDF com a tabela de bioimpedância e medidas) —
  só necessário se for popular dados reais de teste; para construir o schema e as telas,
  este PRD já é suficiente
- [ ] **Guia de receitas original** (`receitas_da_jornada_da_dany_final.PDF`) — necessário
  para popular a biblioteca de receitas (tabela `receitas`) com as 16 receitas, ingredientes,
  modo de preparo e dicas. Sem esse anexo, a biblioteca nasce vazia e precisa ser digitada
  na mão

Regra prática: se a sessão do Claude Code for só sobre lógica/schema/backend, os documentos
já bastam. Se for sobre telas e visual, sempre anexar as imagens do guia.
