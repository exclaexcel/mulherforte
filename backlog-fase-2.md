# Backlog Fase 2 — App Jornada (Marmitas + Jornada Física)
**Status:** Não faz parte do MVP. Só entra em desenvolvimento depois do MVP estar "Pronto"
(ver critério na seção 8 do PRD).

---

## 1. Por que isso está separado do MVP

Durante o desenho do app, surgiram funcionalidades de valor real, mas que não são
pré-requisito para começar a usar o app no lugar da planilha. Separar evita o risco de
over-engineering: o MVP precisa rodar primeiro, sem esperar o produto completo ficar pronto.

## 2. Itens do backlog

### 2.1 Indicadores visuais de percepção subjetiva
Registro qualitativo (sim/não + observação) de itens como contorno dos ombros, firmeza dos
braços, projeção abdominal, definição da cintura, contraste cintura-quadril, projeção do
glúteo, postura, facilidade com cargas elevadas.

```sql
indicadores_visuais (
  id, user_id, data, indicador, percebido, observacao
)
```

### 2.2 Aba "Celebrar" (timeline de marcos/conquistas)
Linha do tempo de marcos — cards por conquista, mais recente primeiro, cor por categoria.
Pode ser preenchida manualmente ou sugerida automaticamente (ex: peso cruza faixa de IMC,
total de cm perdidos cruza uma centena redonda, X semanas seguidas de adesão ao treino).

```sql
marcos (
  id, user_id, data, titulo, descricao, categoria, valor_referencia
)
```

Referência de estilo: cards com ícone + frase curta + data, cores por categoria
(verde = peso/medida, rosa = hábito, etc.), mantendo a paleta definida no PRD.

### 2.3 Registro de bioimpedância como entidade própria
No MVP, os campos de bioimpedância (% gordura, massa muscular, % água) vivem como colunas
opcionais dentro de `registros_peso`. Se o volume de dados justificar, separar em tabela
própria com sua própria nota de confiabilidade (variação de 3-5 p.p., conforme já registrado
no relatório da Fase 2).

### 2.4 Metas qualitativas (sem número fixo)
Suporte a metas do tipo "evolução desejada" (força, definição, aparência atlética) sem um
valor numérico de destino. No MVP, a tabela `metas` já suporta múltiplos indicadores
**numéricos** (peso, cintura, abdômen inferior) — falta apenas o tipo qualitativo, que usa
seta de evolução (↑) em vez de valor de destino.

```sql
-- ajuste futuro na tabela metas
ALTER TABLE metas ADD COLUMN tipo_meta TEXT; -- 'numerica' | 'qualitativa_evolucao'
-- para tipo_meta = 'qualitativa_evolucao', valor_meta e unidade ficam nulos
```

### 2.5 Dashboards e gráficos avançados
- Gráfico de linha de peso **já implementado na Etapa 6B** (`/fisico/peso/tendencia`) — o
  que fica de fora ainda é:
  - **Seletor de período** (30 dias, 90 dias, 1 ano, todo o histórico). No MVP (Etapa 6B)
    o período é fixo em 90 dias, calculado sobre o histórico completo e só recortado na
    exibição — trocar o período no futuro é reaproveitar a mesma função pura
    (`lib/fisico/tendenciaPeso.ts`) com um corte diferente, sem mudar o cálculo
  - Gráfico de linha de medidas corporais ao longo do tempo (ainda não existe nenhuma
    versão, nem fixa nem com seletor)
- Cruzamento entre módulo Marmitas e módulo Jornada Física — ex: dias com proteína priorizada
  vs. dias com marmita de proteína preparada/consumida (view `vw_adesao_proteina`)

### 2.6 Fotos corporais
Fora de escopo até nova decisão explícita da Dany. Se reativado no futuro, requer:
- Bucket privado no Supabase Storage (nunca público)
- URL assinada com expiração curta
- Revisão de RLS específica para esse bucket antes de qualquer upload

### 2.7 Exportador "1-toque para o Sauer" (integração WhatsApp)
Botão no fechamento mensal que copia para a área de transferência um texto estruturado
para envio direto ao treinador, ex:

```
Dany Pinheiro | Fechamento Mensal Fase 2
Adesão aos treinos: 100% | RCEst: 0,51 | RFM: 36,5%
Cintura: 77 cm (-11 cm acumulados) | Coxa: 60 cm
Pronta para os ajustes do próximo ciclo.
```

Depende dos indicadores calculados (já MVP) e do score de hábitos (já MVP) como fonte —
é só a camada de formatação/exportação que fica para depois.

### 2.8 Padronização numérica PT-BR

Revisar a formatação numérica do aplicativo para utilizar vírgula decimal na interface,
preservando ponto decimal apenas no armazenamento e nos cálculos.

Escopo futuro:
- peso;
- medidas;
- metas;
- indicadores corporais;
- percentuais;
- valores energéticos.

Hoje a interface exibe os números como o JavaScript formata por padrão (ponto decimal,
ex: "58.1kg", "0.51") em todas as telas do módulo Jornada Física — convenção consistente
em todo o app, mas não é PT-BR. Mudar isso exige uma função central de formatação de
exibição (separada do cálculo, que deve continuar em ponto decimal) e tocar em todas as
telas listadas acima de uma vez, pra não deixar o app com mistura de vírgula e ponto.

### 2.9 Histórico de semanas do score de hábitos

No MVP (Etapa 6A), a tela `/fisico/score` mostra só a semana atual (segunda a domingo),
sem navegação pra semanas passadas e sem nenhum snapshot persistido — é recalculada do
zero a cada carregamento, igual ao painel de indicadores.

Se um dia fizer sentido ver a evolução do score ao longo de várias semanas, as opções são:
- Navegar entre semanas passadas recalculando sob demanda (sem tabela nova, só passar uma
  data de referência diferente pras mesmas funções de `lib/fisico/score.ts`).
- Persistir um snapshot semanal (tabela nova, com migration) se recalcular ficar caro ou se
  quiser congelar o resultado mesmo que os dados brutos mudem depois.

Decisão consciente de não fazer isso agora, pra manter a Etapa 6A pequena e sem migration.

### 2.10 Teste manual de isolamento com duas contas

Executar teste manual de isolamento com duas contas antes de tornar o aplicativo multiusuário,
compartilhar acesso com terceiros ou disponibilizá-lo como produto.

Hoje o app é pessoal, com uma única usuária. O isolamento é garantido por RLS e por filtro
explícito `user_id` nas consultas, e tem testes automatizados com usuários fictícios e cliente
mockado. O teste manual com duas contas real fica para quando o cenário mudar.

### 2.11 Importação do backup JSON

Permitir restaurar um backup gerado pela exportação (`versao_exportacao` 1.0).

No MVP só existe exportação. Para a importação, as chaves naturais já estão no arquivo
(`data`; `data`+`regiao`; `indicador`; `(semana_ciclo, dia_semana)`), e `receitas.id` mais
`preparos.receita_id` mantêm as relações. Precisa de regra de conflito (sobrescrever ou
mesclar) e de confirmação explícita antes de qualquer escrita.

### 2.12 Validade congelado congelada no preparo

Hoje o preparo guarda só a referência à receita, e o estoque calcula a validade com a
validade atual da receita. Se a validade de uma receita mudar, o estoque dos preparos antigos
muda junto. Avaliar em Fase 2 um snapshot histórico: preservar no preparo a validade aplicada no momento do
congelamento (ex.: `validade_congelado_dias_aplicada`).
Exige migration e decisão sobre preparos antigos sem o valor guardado. Não implementado no MVP.

## 3. Como usar este documento

Nenhum item aqui deve ser construído "de brinde" durante o desenvolvimento do MVP, mesmo que
pareça rápido de adicionar. Ao concluir o MVP (checklist do PRD, seção 8), revisitar este
backlog e priorizar item a item, um de cada vez.

### 2.13 Descarte de preparo vencido ou sem uso

Hoje o estoque só permite "Marcar como consumido", inclusive para preparos vencidos ou que
vencem hoje. Isso mistura consumo com descarte no histórico. A tabela `preparos` aceita apenas
os status `congelado` e `consumido` (constraint no banco).

Possível solução: novo status `descartado` (migration para alterar a constraint), ação própria
na tela de estoque e texto neutro de confirmação. Decisão de produto pendente: como a usuária
quer registrar o descarte. Não implementado no MVP.

### 2.14 Consultar referência de congelamento por tipo de preparação

Recurso futuro: consultar uma referência de congelamento por tipo de preparação.

Quando existir, poderá:
- usar uma base interna previamente revisada;
- mostrar a fonte utilizada;
- informar as condições consideradas;
- apresentar o prazo como referência geral;
- exigir confirmação antes de preencher o campo;
- permitir rejeitar a sugestão;
- permitir manter o prazo não informado.

Fora do escopo agora (não implementar):
- busca automática na internet;
- interpretação automática das páginas da Anvisa ou do USDA/FSIS;
- sugestão automática de prazo;
- armazenamento da origem do prazo;
- base interna de referências;
- preenchimento automático.

### 2.15 Sugestão assistida de prazo de congelamento (decisão futura)

Funcionalidade futura que ajuda a usuária a identificar uma referência de congelamento ao
cadastrar ou importar uma receita.

A sugestão poderá considerar: tipo de preparação; ingredientes principais; alimento cru ou
cozido; presença de molhos ou laticínios; forma de preparo; embalagem; temperatura do freezer;
orientação específica da receita ou dos ingredientes; fontes oficiais previamente revisadas.

Fluxo esperado:
analisar receita → identificar categoria → localizar referência aplicável → mostrar fonte e
condições → apresentar prazo ou intervalo → solicitar revisão → exigir confirmação → preencher
somente após aprovação.

Regras:
- não preencher automaticamente;
- não apresentar a sugestão como validade exata;
- nunca usar prazo sem fonte;
- permitir rejeitar a referência;
- permitir manter o prazo sem informar;
- diferenciar prazo informado de prazo sugerido;
- não aconselhar consumo ou descarte;
- não pesquisar fontes aleatórias na internet;
- manter histórico da fonte e da data de revisão, caso a funcionalidade seja implementada.

Relação: complementa o item 2.14 (consulta de referência por tipo de preparação).

### 2.16 Importação de receitas por texto colado, PDF ou OCR

O MVP entrega só o cadastro manual (completo e rápido). Colar texto, importar PDF e OCR não
entram no MVP. Quando forem avaliados, a importação deve ser assistida: o app sugere, a
Dany confere e salva. Nenhuma receita é gravada sem revisão.

### 2.17 Integração com Mi Band 5 e Zepp

Leitura de dados de atividade e sono (Mi Band 5, app Zepp) para a Jornada Física. Fica na
Fase 2. Antes de implementar: avaliar necessidade real, permissões, origem dos dados e
como os valores entram no registro manual (sem sobrescrever o que a Dany digitou).

### 2.18 Tela de cadastro (signup)

Hoje o app só tem login (`app/login/page.tsx`) — toda conta é criada manualmente pelo painel
do Supabase (Authentication → Users). Isso é suficiente enquanto o app é só da Dany, mas a
intenção é expandir para outras usuárias depois que o projeto Supabase ficou dedicado ao
Mulher Forte (projeto `mulherforte`, separado do `appreforma` em 09/10/2026 — ver
[[project_supabase_compartilhado_reforma]]).

A tabela `preparos` e as demais já são multiusuário "de fábrica": toda RLS já isola por
`auth.uid() = user_id`. Falta só a porta de entrada. Antes de implementar, decidir:
- Cadastro aberto (qualquer e-mail) ou por convite/aprovação?
- Confirmação de e-mail obrigatória?
- Alguma tela de onboarding (perfil, altura, etc.) logo após o cadastro?

Relação: útil implementar junto com 2.19 (recuperar senha), já que os dois usam o mesmo
fluxo de e-mail transacional do Supabase Auth.

### 2.19 Recuperar senha

Tentado em 08/10/2026 e revertido (código não chegou a ser commitado) porque, na época, o
projeto Supabase era compartilhado com o ReForma — inclusive o template de e-mail de
"Reset Password", com link fixo no domínio do ReForma. Ver
[[project_supabase_compartilhado_reforma]] para o diagnóstico completo.

Esse bloqueio não existe mais: desde a separação do banco em 09/10/2026 (projeto
`mulherforte`), o template de e-mail é só do Mulher Forte, livre pra configurar do jeito
certo. Ao retomar: usar o formato de fluxo real do template (`?token_hash=...&type=recovery`,
verificação por OTP), não o formato `?code=` (PKCE) tentado antes. O `middleware.ts` precisa
isentar a rota de redefinição da exigência de sessão ativa (a sessão só existe depois que a
página chama `verifyOtp` com o `token_hash` da URL).

### 2.20 Calendário de treino obrigatório configurável por usuária

Hoje o que é "obrigatório" em cada dia da semana (moves na segunda/quarta, zumba na
terça/quinta) é uma constante fixa no código (`TREINO_OBRIGATORIO_POR_DIA` em
`lib/fisico/calendarioTreino.ts`), única fonte de verdade usada pelo cálculo do score
(`lib/fisico/score.ts`). O campo `obrigatorio` salvo em cada linha de `adesao_treino` é só
informativo/histórico — nunca decide o score. Mudar a rotina hoje exige editar a constante e
fazer novo deploy; decisão de MVP deliberada (Etapa 6A), documentada no próprio código.

Motivo de reabrir (09/10/2026): com a intenção de expandir o app pra outras usuárias (ver
[[project_supabase_compartilhado_reforma]]), a rotina fixa da Dany deixa de fazer sentido como
regra única — cada usuária provavelmente treina em dias diferentes.

Antes de implementar, decidir (não é só um toggle, mexe no cálculo do score):
- Onde a configuração fica: por usuária (tabela nova, tipo `preferencias_treino`) é o caminho
  óbvio dado o RLS já existente por `user_id`.
- Mudança na regra vale só daqui pra frente, ou reinterpreta o histórico já registrado? (Ex.:
  se a usuária muda de "moves na segunda" pra "moves na terça", os registros antigos de
  segunda continuam contando como obrigatório cumprido, ou o score recalcula pro passado?)
- A regra é só por dia da semana (como hoje) ou pode variar por semana do ciclo (1-4)?
- Tela de configuração em si: onde fica no fluxo (perfil? config própria?), e o que a usuária
  pode escolher (dias + tipo de treino por dia, dentro dos tipos existentes `moves`/`zumba`/
  `outro`).
