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
- **Linha de tendência (implementada na Etapa 6B, 2026-10-01)**: gráfico de peso com média
  móvel de 7 e 28 dias sobreposta aos registros brutos — neutraliza oscilações normais de
  500g-1kg (sódio, ciclo hormonal) que distorcem a leitura do progresso real. Única exceção
  à regra de "cards, não gráfico de linha" (seção 7), justamente por resolver o risco de
  sabotagem emocional pela balança.
  - Janelas de **dias corridos** (não últimos N registros): `[data-6, data]` pra 7 dias,
    `[data-27, data]` pra 28 dias, ambas inclusivas nos dois limites
  - Peso bruto exibido como **pontos** (nunca linha ligando pesagens); MM7/MM28 exibidas
    como linha, calculadas só com as pesagens que existem na janela — nenhum dia sem
    pesagem ganha valor inventado, carregado do anterior ou interpolado
  - Média parcial é permitida e normal (não exige 7 nem 28 pesagens pra existir); a tela
    mostra quantas pesagens entraram em cada média e se a janela já é "completa" (tempo
    decorrido desde a 1ª pesagem ≥ 6/27 dias) ou ainda "parcial"
  - Cálculo roda sobre o histórico completo primeiro; o recorte pros últimos 90 dias
    exibidos acontece só depois, na camada de apresentação — as médias dos pontos visíveis
    podem usar pesagens anteriores à janela de 90 dias
  - Arredondamento (1 casa decimal, formato PT-BR) só na exibição — o cálculo interno
    mantém precisão bruta
  - Biblioteca: Recharts, isolado num único componente client
    (`components/fisico/grafico-tendencia-peso.tsx`) — a página e o cálculo continuam sem
    nenhuma dependência de UI de gráfico
  - Puramente informativo: sem meta, sem projeção de emagrecimento, sem recomendação
    alimentar — só "o peso de um dia é um ponto, a tendência mostra o caminho"
- Registrar medidas corporais (data, região, valor em cm)
- **Sanity check de medidas**: ao salvar uma medida com variação maior que 3 cm em relação
  ao mês anterior, exibir alerta sutil ("Variação atípica. Confira a tensão da fita e a
  altura anatômica antes de confirmar") — não bloqueia o registro, só avisa
- Registrar adesão ao treino (data, tipo, obrigatório sim/não, realizado sim/não)
- Registrar adesão a hábitos diários (data, bebeu água meta sim/não, priorizou proteína
  sim/não, quantidade de água em ml — comparada à meta diária em litros definida em `metas`)
- Meta com valor numérico por indicador: peso, cintura e abdômen inferior (cada um com
  valor de referência → valor meta), com prazo estimado
- **Indicadores corporais estimados** (não digitados, derivados do que já foi registrado
  em `perfil_usuario` e `medidas_corporais`). Resultados são estimativas informativas, não
  diagnósticos médicos — mensagem fixa exibida junto ao painel. Para cada indicador:
  calcular e guardar o valor bruto (precisão completa), classificar a partir do valor
  bruto (nunca do valor já arredondado), e só arredondar na hora de exibir:
  - **Circunferência da cintura**: valor registrado, exibido direto em cm, sem inferência
    de risco isolada.
  - **RCEst** (relação cintura-estatura) = cintura ÷ altura
    - < 0,50: "Abaixo do ponto de atenção para adiposidade central" · ≥ 0,50 e < 0,60:
      "Adiposidade central aumentada" · ≥ 0,60: "Adiposidade central elevada"
  - **RCQ** (relação cintura-quadril) = cintura ÷ quadril
    - < 0,80: "Faixa inferior de distribuição abdominal" · ≥ 0,80 e < 0,85: "Faixa
      intermediária" · ≥ 0,85: "Ponto de atenção para obesidade abdominal"
  - **RFM feminina** (relative fat mass) = 76 − (20 × altura ÷ cintura) — exibida só como
    "Gordura corporal estimada pela RFM: X%", sem categoria clínica (nada de
    "atlética"/"saudável"/"recomposição"/"obesidade" no MVP), com a mensagem "Estimativa
    antropométrica. Não equivale a exame de composição corporal."
  - **Metabolismo de repouso estimado** (sigla TMB mantida só por compatibilidade interna)
    = fórmula feminina de Mifflin-St Jeor: 10×peso + 6,25×altura − 5×idade − 161 (peso em
    kg, altura em cm, idade em anos, calculada considerando se o aniversário já ocorreu no
    ano de referência). Exibido como inteiro em kcal/dia, com a mensagem "Estimativa da
    energia utilizada pelo organismo em repouso. Não corresponde ao gasto diário total nem
    define, sozinha, uma meta de alimentação." Não calcula déficit, manutenção, superávit
    ou recomendação alimentar.
  - **Relação Cintura-Coxa** = cintura ÷ coxa — indicador exploratório, fora do painel
    principal, sem classificação clínica. Dados históricos nunca são excluídos; se exibido
    em algum detalhe, usar a mensagem "Indicador exploratório, sem faixa clínica validada
    para uso individual."
  - Cores/badges representam só a faixa do indicador — nunca "sem risco", "risco zero" ou
    garantia de saúde, mesmo em verde.

### 3.2.1 Protocolo de coleta (referência estática)
Tela de referência com o protocolo padrão de medição, para garantir consistência entre
uma checagem e outra (mitiga o risco de "inconsistência de fita" citado no relatório):
- Frequência: uma vez a cada 30 dias
- Momento: pela manhã, em jejum completo, após esvaziar a bexiga
- Postura: em pé, abdômen relaxado, sem prender a respiração
- Posicionamento: cintura (ponto mais estreito, dois dedos acima do umbigo), quadril
  (maior circunferência dos glúteos), coxa (ponto médio da coxa direita)

### 3.2.2 Score de hábitos semanal (causa vs. efeito) — implementado na Etapa 6A
Placar semanal separando o que é **ação diária sob controle direto** (causa) do que é
**resultado tardio** (efeito — peso e medidas). Conceito: premiar a execução do hábito,
não o número da balança — desarma a frustração emocional com a pesagem.

**Checklist diário (3 categorias):**
- Proteína priorizada (sim/não, `adesao_habitos.priorizou_proteina`)
- Meta de hidratação atingida (sim/não, `adesao_habitos.bebeu_agua_meta`) — só entra no
  cálculo se houver meta válida pra essa semana (ver regra de meta abaixo)
- Treino obrigatório realizado — obrigatoriedade vem de um **calendário fixo centralizado
  no código** (`lib/fisico/calendarioTreino.ts`), não da coluna `obrigatorio` da linha:
  - Segunda e quarta: Move's obrigatório · Terça e quinta: Zumba obrigatória · Sexta,
    sábado e domingo: sem treino obrigatório (qualquer atividade nesses dias é "adicional",
    não entra no score)
  - Qualquer treino `realizado=true` num dia obrigatório cumpre a oportunidade, mesmo que
    o tipo registrado não bata com o planejado (ex: fez Zumba numa segunda de Move's)

**Mecânica:**
- `pontos_obtidos / oportunidades × 100`, calculado a partir de `adesao_habitos` e
  `adesao_treino` já registrados — agregação semanal, sem tabela nova
- **Dia passado**: sempre conta (0 ou 1 ponto, 1 oportunidade); ausência de registro conta
  como não realizado, nunca é ignorada
- **Dia de hoje**: só entra no numerador E no denominador se já realizado; pendente fica
  fora dos dois até virar o dia — evita punir um dia que ainda não terminou
- **Dia futuro**: nunca entra
- **≥ 85% do valor BRUTO (nunca arredondado) = "Semana Vencida"** — comparação por
  multiplicação cruzada (`pontos×100 ≥ oportunidades×85`), já que a semana completa (até
  18 oportunidades) raramente bate exatamente em 85%
- Sem nenhuma oportunidade ainda na semana → estado "indisponível", nunca "0%"
- Semana vai de segunda a domingo; sem navegação pra semanas passadas e sem snapshot
  persistido no MVP (recalculado a cada carregamento da tela, igual aos indicadores)

**Regra da meta de hidratação:** como `metas` não guarda histórico de quando um valor
passou a valer (sem trigger de `updated_at`, uma edição de valor não desloca `created_at`),
a meta só participa do score a partir da **segunda-feira seguinte** à sua criação — nunca
na própria semana em que foi criada ou editada. Sem meta configurada, hidratação fica
inteiramente fora do score (nunca interpretada como meta não atingida).

**Regra explícita anti-punição:** o score é sempre uma **soma/acumulado da semana**, nunca
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

O IMC isolado deixa de ser critério de sucesso. O **Painel de evolução corporal** reúne
**circunferência da cintura + RCEst + RCQ + RFM feminina**, calculados a partir de cintura,
quadril e altura já registrados — não o peso ou o IMC sozinhos. A Relação Cintura-Coxa é
indicador exploratório, à parte do painel principal, sem classificação clínica. O dashboard
principal do módulo Jornada Física deve refletir essa prioridade visualmente:
- O painel (cintura, RCEst, RCQ, RFM) ocupa o card principal, no topo. RCEst e RCQ têm selo
  visual de status com linguagem neutra e não diagnóstica (nunca "proteção máxima",
  "padrão-ouro" ou qualquer leitura de "sem risco"/"saúde garantida" em verde); cintura e
  RFM são exibidos sem classificação, só o valor e uma mensagem de contexto.
- O IMC aparece em camada secundária/informativa — nunca no topo.
- Mensagem fixa próxima ao painel: "O aplicativo calcula indicadores de acompanhamento
  corporal a partir das medidas registradas. Os resultados são estimativas informativas,
  não diagnósticos médicos."

### 3.4.1 Riscos técnicos a monitorar na implementação
- **Quebra de input**: tratar separador de vírgula/ponto e validação de entrada nula nas
  medidas, para não gerar erro de divisão (cintura/quadril/coxa não podem ser zero ou vazias)
- **Inconsistência de arredondamento**: padronizar na camada lógica — 2 casas decimais para
  RCEst e RCQ; 1 casa decimal para RFM (%). O arredondamento só acontece na exibição; a
  classificação de RCEst/RCQ sempre usa o valor bruto, nunca o já arredondado (ex: um RCEst
  bruto de 0,4996 exibe 0,50 mas classifica na faixa abaixo de 0,50, porque a fronteira usa
  o valor exato, não o número redondo)
- **Acoplamento rígido (hardcode)**: a altura (152 cm) deve ser lida de `perfil_usuario`,
  nunca cravada dentro das funções de cálculo

### 3.4.2 Massa de dados para teste unitário
Validar as funções de cálculo com os dados reais de setembro/2026 antes de considerar a
etapa concluída:
- Entrada: cintura 77 cm, quadril 96 cm, coxa 60 cm, altura 152 cm
- Saída esperada: RCEst = 0,51 (77÷152=0,506578... arredondado — não truncado) · RCQ = 0,80
  (bruto 0,802083... classifica como "Faixa intermediária" mesmo exibindo 0,80) · RFM =
  36,5% (sem classificação) · Relação Cintura-Coxa = 1,28 (exploratório, sem classificação)

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
- [ ] Indicadores corporais estimados (cintura, RCEst, RCQ, RFM, metabolismo de repouso)
  calculados corretamente a partir de peso, altura e medidas já registrados, com
  classificação de faixa exibida só para RCEst e RCQ (RFM e Relação Cintura-Coxa sem
  classificação clínica, conforme §3.4)
- [ ] Metas numéricas de peso, cintura e abdômen inferior configuradas e comparáveis com
  o valor atual registrado
- [ ] Protocolo de coleta (frequência, momento, postura, posicionamento da fita) disponível
  como referência dentro do app
- [ ] Funções de cálculo (RCEst, RCQ, RFM, Cintura-Coxa) testadas com a massa de dados de
  setembro/2026 (seção 3.4.2), batendo exatamente com os valores esperados (RCEst=0,51)
- [ ] Validação de input tratando vírgula/ponto e valores nulos/zero nas medidas, sem gerar
  erro de divisão
- [ ] Altura lida de `perfil_usuario` nas funções de cálculo, nunca hardcoded
- [ ] Dashboard exibe o Painel de evolução corporal (cintura, RCEst, RCQ, RFM) em destaque
  no topo, Relação Cintura-Coxa como indicador exploratório à parte, e o IMC em posição
  secundária/informativa
- [x] Gráfico de peso exibe média móvel de 7 e 28 dias sobre os registros brutos, com
  janelas de dias corridos, sem interpolação, recorte de exibição de 90 dias calculado só
  depois das médias (Etapa 6B, 2026-10-01)
- [ ] Alerta de variação atípica (>3cm) funcionando ao registrar medida
- [x] Score de hábitos semanal (proteína, hidratação, treino) calculado como acumulado da
  semana — nunca como streak diário que zera — com "Semana Vencida" a partir de 85% do
  valor bruto, treino obrigatório pelo calendário fixo (Etapa 6A, 2026-10-01)
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
