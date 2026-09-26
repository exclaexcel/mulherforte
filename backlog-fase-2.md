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
- Gráfico de linha de peso/medidas ao longo do tempo (visualização secundária, opcional —
  o padrão principal do app continua sendo cards de estado atual → meta, ver PRD seção 7)
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
Adesão aos treinos: 100% | RCEst: 0,50 | RFM: 36,5%
Cintura: 77 cm (-11 cm acumulados) | Coxa: 60 cm
Pronta para os ajustes do próximo ciclo.
```

Depende dos indicadores calculados (já MVP) e do score de hábitos (já MVP) como fonte —
é só a camada de formatação/exportação que fica para depois.

## 3. Como usar este documento

Nenhum item aqui deve ser construído "de brinde" durante o desenvolvimento do MVP, mesmo que
pareça rápido de adicionar. Ao concluir o MVP (checklist do PRD, seção 8), revisitar este
backlog e priorizar item a item, um de cada vez.
