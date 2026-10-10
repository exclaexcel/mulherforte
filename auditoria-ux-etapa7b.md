# Auditoria de UX — Etapa 7B (Projeto Mulher Forte)

**Data:** 10/10/2026
**Commit auditado:** `696eb5c` — "feat: excluir meta individualmente por indicador"
**Escopo:** roteiro salvo em `revisao.txt` (UX, pré-fechamento do MVP) — rodado por um agente de leitura, em worktree isolado, nenhum arquivo do projeto foi alterado.
**Como usar este documento:** é a fotografia da UX nessa data. Antes de assumir que um achado ainda vale, confira se o arquivo/linha citado ainda existe do jeito descrito — o código muda, este relatório não se atualiza sozinho.

---

## Resumo executivo

Nenhum bloqueador de fechamento do MVP. 3 achados pra corrigir antes do próximo deploy, 9 melhorias candidatas a Fase 2. Os padrões de formulário (erro/sucesso, duplo envio, confirmação de exclusão) são consistentes na quase totalidade do app.

**Já implementado e confirmado por código nesta rodada** (itens de rodadas anteriores desta mesma auditoria):
- Home com "Hoje"/"Minha evolução" — mas só dentro da aba "Jornada física", não como as 4 categorias completas da proposta original (ver achado 3.1).
- `/fisico/historico` — histórico unificado (Peso/Medidas/Treino/Hábitos), editar e excluir por data.
- Receitas: editar e excluir em `/marmitas/receitas/[id]/editar`, com bloqueio de exclusão de receita vinculada a preparo.
- Descarte de preparo com motivo (`/marmitas/estoque`) + análise (`/marmitas/descartes`).
- Excluir meta individualmente por indicador (`/fisico/metas`).

**Testes e lint:** confirmado — 57 arquivos, 720 testes, todos passando; lint sem warnings. **Build:** não comprovado nesta rodada (worktree sem `.env.local`, por desenho — ver `.gitignore`); já validado antes, manualmente, nesta mesma sessão.

**`npm audit`:** 19 vulnerabilidades (3 críticas, 11 altas, 5 moderadas), todas em devDependencies/toolchain (Next 14.2.35, Tailwind 3.4.19, Vitest 2.1.9) — já mapeado em auditoria técnica anterior, nada novo. Correção exige `--force` com breaking changes (Next 16, Tailwind 4, Vitest 5) — fora do escopo desta auditoria de UX.

---

## 1. Pré-check do Git

- Commit atual: `696eb5c`.
- Working tree: limpo.
- Arquivos pendentes: 0.
- Nenhuma alteração inesperada.

## 2. Linguagem interna na interface

Varredura em `app/**/*.tsx` e `components/**/*.tsx` por "Etapa N", "MVP", "backlog", "PRD", "migration", nomes de tabela.

**Nenhuma ocorrência visível na interface.** As únicas menções a "MVP"/"Etapa N"/"backlog" que existem no código são comentários técnicos em `lib/` (ex.: `lib/fisico/calendarioTreino.ts:5-9`, `lib/marmitas/descarte.ts:2`) — nunca texto exibido à usuária. Pelas regras do roteiro, isso não é defeito de UX.

**Classificação:** Sem problema relevante.

## 3. Auditoria da Home (`app/page.tsx`)

Estrutura atual:

- Cabeçalho: saudação + título + "Editar perfil" + "Sair".
- Card fixo: "Exportar meus dados" (`/perfil/exportar`).
- 3 abas (`HomeTabs`):
  1. **Dia a dia** — Registrar preparo, Estoque do congelador, Lista de compras.
  2. **Jornada física** — subseção "Hoje" (peso, medidas, treino, hábitos) + subseção "Minha evolução" (tendência, metas, indicadores, score).
  3. **Planejamento** — Biblioteca de receitas, Cronograma planejado, Sobre o plano.

Total: 15 cards (no máximo 8 visíveis de uma vez, na aba Jornada física).

### Achado 3.1 — Home diverge das 4 categorias originalmente propostas
O roteiro pedia "Hoje / Minha evolução / Marmitas / Minha conta e dados" como agrupamento único. Hoje, "Hoje"/"Minha evolução" só existem dentro de Jornada física; Marmitas está partido em duas abas (Dia a dia + Planejamento) sem agrupamento único; e não existe agrupamento "Minha conta e dados" — Perfil, Exportar e Sair ficam em 3 lugares diferentes.
**Classificação:** Melhoria de Fase 2 (decisão de produto, não erro funcional).

### Achado 3.2 — Dois caminhos para criar receita
`/marmitas/receitas/nova` (completo) e um atalho embutido em `/marmitas/preparo` (`criarReceita`, só nome + validade). Mesma validação, mesmo bloqueio de duplicidade — sem risco de dado inconsistente, mas é duplicidade de fluxo.
**Classificação:** Melhoria de Fase 2.

### Achado 3.3 — `/marmitas/descartes` fora da Home
Intencional — só alcançável a partir do Estoque, que é o comportamento correto para uma tela de análise secundária.
**Classificação:** Sem problema relevante.

## 4. Auditoria geral das rotas

Padrão comum confirmado em quase todas as rotas: redirect pra login se deslogada; `houveFalhaDeConsulta` + `AvisoErroLeitura` em erro de leitura; `role="status"` em sucesso; botão com rótulo mutável + `disabled` durante envio; confirmação nativa em exclusões; breadcrumb de volta.

| Rota | Ação principal | Observação / problema | Severidade |
|---|---|---|---|
| `/` | Navegar por abas | Ver achados 3.1-3.3 | Melhoria Fase 2 |
| `/login` | Entrar | Erro sem `role="alert"`; botão sem rótulo de carregamento — único ponto fora do padrão de a11y do app | **Corrigir antes do deploy** |
| `/perfil` | Salvar dados | — | Sem problema |
| `/perfil/exportar` | Baixar planilha/JSON | Avisos de privacidade claros | Sem problema |
| `/fisico/peso` | Registrar/corrigir | — | Sem problema |
| `/fisico/peso/tendencia` | Visualizar gráfico | Erro tratado fora do padrão `AvisoErroLeitura` (mensagem bespoke sem `role="alert"`); resumo textual acessível complementa o gráfico | Melhoria Fase 2 |
| `/fisico/medidas` | Registrar/corrigir | Alerta de variação atípica | Sem problema |
| `/fisico/treino` | Registrar/corrigir | — | Sem problema |
| `/fisico/habitos` | Registrar água/proteína | Trava compartilhada entre botões | Sem problema |
| `/fisico/metas` | Salvar/excluir meta | Exclusão por indicador confirmada | Sem problema |
| `/fisico/indicadores` | Visualizar | Disclaimers claros de "não é diagnóstico" | Sem problema |
| `/fisico/score` | Visualizar | — | Sem problema |
| `/fisico/historico` | Ver/editar/excluir por data | Histórico unificado, 4 abas | Sem problema |
| `/marmitas/preparo` | Registrar preparo | Contém o 2º caminho de criar receita (achado 3.2) | Melhoria Fase 2 |
| `/marmitas/estoque` | Marcar consumido/descartar | Link "Ver descartados" | Sem problema |
| `/marmitas/descartes` | Visualizar análise | Resumo por motivo + taxa por receita | Sem problema |
| `/marmitas/compras` | Marcar/adicionar item | Botão "Adicionar item" quebra convenção "Salvar" | Melhoria Fase 2 |
| `/marmitas/cronograma` | Editar dia | **Mostra `error.message` cru do Supabase na tela** se a consulta falhar | **Corrigir antes do deploy** |
| `/marmitas/plano` | Ler referências | Links externos com `target=_blank`/`rel` corretos | Sem problema |
| `/marmitas/receitas` | Nova/editar/excluir | — | Sem problema |
| `/marmitas/receitas/nova` | Criar | — | Sem problema |
| `/marmitas/receitas/[id]/editar` | Editar/excluir | 404 se id não existe; bloqueio de exclusão bem comunicado | Sem problema |
| 404 / boundaries de erro | Voltar ao início | Foco automático no título, sem detalhe técnico exposto | Sem problema |

### Achado 4.1 — `/marmitas/cronograma` expõe erro técnico do Supabase
`app/marmitas/cronograma/page.tsx:161-162`:
```tsx
{error ? (
  <p className="text-sm text-red-700">Erro ao carregar cronograma: {error.message}</p>
) : (
```
Única rota do app que não usa `houveFalhaDeConsulta` + `AvisoErroLeitura`. Quebra a regra implícita do resto do app (nunca mostrar erro técnico pra usuária).
**Classificação:** Corrigir antes do próximo deploy.

**Responsividade/acessibilidade por código é inferida, não comprovada.** Telas com gráfico, diálogo de confirmação nativo e `backdrop-blur` da barra de abas **requerem validação manual logada** no Galaxy A34.

## 5. Consistência de conteúdo

Pontos fortes: nenhuma linguagem técnica vazando; disclaimers de "não é diagnóstico médico" bem escritos e presentes onde importa; pluralização consistente; mensagens de sucesso "conquista" terminam em "!", administrativas em "."; erros sempre amigáveis.

### Achado 5.1 — Convenção de verbos quase consistente
Padrão: "Registrar" pra logs diários, "Salvar" como submit genérico, "+ Novo/Nova X" pra abrir criação. Exceção: Lista de compras usa "Adicionar item" em vez de "Salvar item".
**Proposta de convenção:**
1. Logs do dia → "Registrar X".
2. Itens de biblioteca → abrir com "+ Novo/Nova X", submit "Salvar X".
3. Sucesso: frase curta + "!" quando é conquista; "." quando é neutro.
4. Erros: sempre amigáveis, terminando em "Tente novamente." quando aplicável.
5. Padronizar "Adicionar item" → "Salvar item" (ou documentar a exceção).
**Classificação:** Melhoria de Fase 2.

### Achado 5.2 — Duas telas fora do padrão de erro de leitura
`/fisico/peso/tendencia` e `/marmitas/cronograma` (ver achados acima). A de cronograma é a prioritária (vaza erro técnico); a de tendência só não usa o componente padrão, mas já tem mensagem amigável.

## 6. Módulo de receitas — as 30 perguntas do roteiro

| # | Pergunta | Resposta |
|---|---|---|
| 1-3 | Botão "Nova receita" visível, sem rolagem | Sim, "+ Nova receita" no topo da Biblioteca |
| 4 | Rota específica de criação | Sim, `/marmitas/receitas/nova` — **e** um 2º caminho rápido em `/marmitas/preparo` |
| 5-6 | Campos / obrigatórios | nome, categoria, ingredientes, modo_preparo, dica_congelamento, selos, notas, validade_congelado_dias — só "nome" é obrigatório |
| 7-8 | Validação cliente/servidor | Cliente: `required` no nome, número no prazo. Servidor (`lib/marmitas/receita.ts`): nome obrigatório, validade inteira positiva ou vazia, texto até 10.000 caracteres, categoria restrita à lista |
| 9-10 | Texto longo / quebras preservadas | Sim, `<textarea>` livre; quebras preservadas e exibidas com `whitespace-pre-line` |
| 11-14 | Labels, loading, sucesso, erro | Todos presentes e consistentes |
| 15-16 | Rota pós-salvar / aparece na lista | Sim, via `revalidatePath`; destino varia pelo caminho usado (completo → lista; rápido → fica no Preparo) |
| 17-18 | Duplo envio / duplicidade de nome | Protegidos |
| 19-20 | Edição / exclusão | Ambas existem, com confirmação |
| 21-22 | Busca / filtro | **Não existem** — só agrupamento automático por categoria |
| 23-26 | Estado vazio, retorno, descoberta | Todos presentes e claros |
| 27-30 | Relação com preparos / bloqueio de exclusão | Bem comunicada; bloqueio por FK confirmado no comentário do código (não reconfirmado direto no banco nesta rodada — **requer validação manual** se quiser certeza total) |

**Critério do MVP atendido:** fácil de encontrar, funciona ponta a ponta, aceita os campos necessários, preserva texto longo, informa erro e sucesso, retorna a lugar previsível. **Classificação: Sem problema relevante para o MVP**, com a duplicidade de caminho (achado 3.2) e busca/filtro ausentes como melhorias de Fase 2.

## 7. Proposta "Colar receita" (planejamento, não implementado)

| Opção | Valor | Esforço | Privacidade | Recomendação |
|---|---|---|---|---|
| 1. Criação manual atual | Controle total | Já feito | Alta | Padrão atual do MVP |
| 2. Colar texto sem interpretação | Baixo | Muito baixo | Alta | Fase 2, ganho marginal |
| 3. Colar texto com identificação assistida (heurística local, sem IA externa) | Alto — reduz fricção | Médio | Alta | **Melhor custo/benefício pra Fase 2** |
| 4. Importar PDF textual | Alto se já tem receitas em PDF | Médio-alto (lib de extração) | Alta se processar no cliente | Fase 2 |
| 5. OCR de PDF escaneado/imagem | Alto pra fotos de caderno | Alto (lib pesada ou serviço pago) | Média/baixa | **Não recomendado agora** |

Regras do roteiro (nenhuma gravação automática, campos editáveis, cancelamento sem salvar, duplicidade verificada) são compatíveis com a arquitetura atual — reaproveitaria `CamposReceita` e `criarReceitaCompleta` já existentes, sem mudança de schema.

## 8. Importação de PDF e imagem (planejamento)

Fluxo: seleção → validação → extração → identificação (heurística da seção 7) → prévia → revisão → confirmação → salvamento.

Propostas de parâmetro: até 10MB, até 20 páginas, processamento no cliente quando possível (ex: `pdfjs-dist` com `next/dynamic` pra não pesar o bundle principal), nunca armazenar o arquivo original, validar assinatura do arquivo (não só extensão).

**Classificação:** PDF textual simples — candidato a Fase 2. OCR — não recomendado até haver demanda comprovada.

## 9. Integração com pulseira (Mi Band 5 / Zepp) — planejamento

Nome exato do app instalado (Zepp vs. Zepp Life) **requer confirmação manual no Galaxy A34**.

Caminhos realistas de curto prazo pro app web atual (sem camada nativa Android): exportação de arquivo pelo app da pulseira + importação manual de CSV/JSON. Health Connect/Google Fit API exigem um wrapper Android que hoje não existe no projeto — ficaria pra uma Fase 2B separada, de esforço bem maior.

**Schema atual de `adesao_treino` é insuficiente** pra importação de wearable: falta `origem`, `identificador_externo`, `sincronizado_em`; e a constraint `UNIQUE(user_id, data)` impede múltiplos treinos no mesmo dia (comum em dados de pulseira).

**Classificação:** Nenhuma integração é bloqueadora do MVP.

## 10. Navegação futura das importações

- "Colar receita" → botão secundário discreto ao lado de "+ Nova receita", nunca na Home.
- "Importar PDF" → 3ª opção dentro do fluxo de criação de receita.
- "Importar treino" → ação secundária em `/fisico/treino` ou `/fisico/historico`.
- "Conectar dispositivo" → é configuração, pertence ao Perfil, não à Home.

## 11. Mobile e acessibilidade

Comprovado por código: larguras/margens consistentes (`max-w-lg mx-auto px-6`); nenhuma tabela nem imagem no app (sem risco de `alt` ausente); botões/inputs em 44px (`h-11`); foco visível padronizado; `role="status"`/`role="alert"` consistentes (exceto login e cronograma); ícones decorativos com `aria-hidden` + texto equivalente; headings sem saltos de hierarquia; gráfico de peso tem alternativa textual completa (`ResumoTendenciaPeso`) sempre visível acima do gráfico.

### Achado 11.1 — Sem `prefers-reduced-motion`
`app/globals.css` não tem essa media query. Risco real baixo hoje (só transições de cor em hover, nenhuma animação de entrada/autoplay).
**Classificação:** Melhoria de Fase 2.

### Achado 11.2 — Links secundários pequenos
Vários "Editar"/"Ver histórico"/"Ver tendência" usam `text-xs underline` sem padding explícito — podem ficar abaixo do alvo mínimo de toque (24×24px, WCAG 2.2) em telas de densidade alta. Links de "Excluir" são parcialmente protegidos pelo `window.confirm()`. **Requer validação manual logada no Galaxy A34.**
**Classificação:** Melhoria de Fase 2.

---

## Lista consolidada por prioridade

**Bloqueador do MVP:** nenhum.

**Corrigir antes do próximo deploy:**
1. `app/login/page.tsx` — erro sem `role="alert"`, botão sem rótulo de carregamento.
2. `app/marmitas/cronograma/page.tsx` — vaza `error.message` do Supabase direto na tela.
3. Confirmar `npm run build` com `.env.local` real antes do próximo deploy (já validado nesta sessão separadamente).

**Melhoria de Fase 2:**
4. Dois caminhos de criar receita (`/marmitas/receitas/nova` vs. atalho em `/marmitas/preparo`).
5. Home não implementa as 4 categorias completas da proposta original.
6. `/fisico/peso/tendencia` fora do padrão `AvisoErroLeitura`.
7. "Adicionar item" (Compras) quebra a convenção "Salvar".
8. Busca/filtro ausente na Biblioteca de receitas.
9. Sem `prefers-reduced-motion` em `globals.css`.
10. Links secundários com alvo de toque pequeno.
11. Schema de `adesao_treino` insuficiente pra importação futura de wearable.
12. Dependências desatualizadas (`npm audit`, já mapeado, nada novo).

**Sem problema relevante:** as 17 rotas restantes, a arquitetura de formulários, o módulo de receitas no critério mínimo do MVP, os disclaimers médicos, a cobertura de testes/lint.

---

# Plano de ação

Ordem sugerida: primeiro os 3 itens de "corrigir antes do deploy" (pequenos, rápidos, sem risco), depois as melhorias de Fase 2 priorizadas por impacto × esforço.

## Corrigir antes do deploy

### 1. Login — acessibilidade do erro e loading
**Objetivo:** alinhar `/login` ao mesmo padrão de acessibilidade usado no resto do app.
**Arquivo:** `app/login/page.tsx`.
**O que muda:** envolver a mensagem de erro em `role="alert"` com foco automático (mesmo padrão de `MensagemFormulario`/`AvisoErroLeitura`); trocar o texto do botão pra "Entrando…" durante o envio, igual aos outros formulários do app.
**Risco:** nenhum — mudança isolada de UI, sem tocar em auth.
**Esforço:** pequeno (< 30 min).

### 2. Cronograma — parar de vazar erro técnico
**Objetivo:** tratar falha de leitura em `/marmitas/cronograma` com o mesmo padrão do resto do app.
**Arquivo:** `app/marmitas/cronograma/page.tsx:161-162`.
**O que muda:** trocar `{error.message}` cru pelo padrão `houveFalhaDeConsulta` + `<AvisoErroLeitura>` já usado em todas as outras rotas.
**Risco:** nenhum — só troca a forma de exibir erro, não a lógica de consulta.
**Esforço:** pequeno (< 30 min).

### 3. Confirmar build antes do próximo deploy
**Objetivo:** garantir que `npm run build` passa com as variáveis reais antes de publicar.
**Como:** já validado nesta sessão (`npm run build` ok, commit `696eb5c`); reconfirmar sempre que houver mudança de schema/dependência antes do próximo deploy real.
**Esforço:** nenhum código novo, só disciplina de processo.

## Fase 2 — plano leve por item (esforço estimado, sem compromisso de data)

| # | Item | Abordagem proposta | Esforço |
|---|---|---|---|
| 4 | Dois caminhos de criar receita | Decisão de produto primeiro: manter os dois (um rápido, um completo) com link cruzado mais visível, ou remover o atalho dentro de Preparo e linkar pra `/marmitas/receitas/nova` | Pequeno, depende da decisão |
| 5 | Home com 4 categorias completas | Reorganização visual de agrupamento (sem rota nova): juntar "Dia a dia" + parte de "Jornada física" em "Hoje"; "Planejamento" + parte de "Jornada física" em "Minha evolução"/"Marmitas"; novo agrupamento "Minha conta e dados" pra Perfil/Exportar/Sair | Médio — mexe na Home inteira, pedir aprovação visual antes |
| 6 | Tendência do peso fora do padrão de erro | Trocar mensagem bespoke por `AvisoErroLeitura` | Pequeno |
| 7 | "Adicionar item" → "Salvar item" | Troca de texto do botão em `app/marmitas/compras/page.tsx` | Trivial |
| 8 | Busca/filtro em receitas | Campo de busca por nome (client-side, já são poucas receitas) + filtro por selo/categoria | Médio |
| 9 | `prefers-reduced-motion` | Media query em `globals.css` reduzindo/removendo `transition-colors` | Trivial |
| 10 | Links secundários pequenos | Adicionar padding (`p-1` ou similar) nos links `text-xs underline` de navegação/edição | Pequeno, mexe em várias telas |
| 11 | Schema `adesao_treino` pra wearable | Nova migration: campos `origem`, `identificador_externo`, `sincronizado_em`; revisar a constraint `UNIQUE(user_id, data)` — só quando a integração de wearable for decidida, não antes | Grande, não fazer isolado — só junto com a feature de importação |
| 12 | Dependências desatualizadas | Upgrade de Next/Tailwind/Vitest em lote separado, com testes completos depois — envolve breaking changes | Grande, merece sessão própria |

**Não recomendado agora:** OCR de receita (item 5 da seção 7), importação FIT/Google Fit API (seção 9) — custo/complexidade alto sem demanda comprovada.

---

# Anexo — Achados de auditorias externas (GPT e Codex)

**Adicionado em:** 10/10/2026, depois do relatório principal acima.
**Fontes:** dois relatórios que a Dany já tinha rodado em outras ferramentas de IA (GPT e OpenAI Codex), salvos como `sugestoesGPT.md` e `P_A-CODEX.md` na raiz do repo, datado de 09/10/2026. São dados externos — cada achado foi conferido no código atual antes de entrar aqui; nada foi descartado, só marcado o status de verificação.

**Legenda de status:**
- ✅ **Confirmado no código** — verifiquei e o achado procede, como descrito.
- ⚠️ **Plausível, requer validação manual** — o código sugere o problema, mas o comportamento real depende do navegador/dispositivo.
- 🔁 **Já coberto** — mesma ideia já registrada em outra seção deste documento ou no backlog.
- ❌ **Provável falso alarme** — contradito por evidência direta nesta sessão.

## A. Achados novos (não estavam no relatório principal)

### A.1 — Preparos sem editar nem excluir ✅ Confirmado
**Fonte:** sugestoesGPT.md achado 1 (Alto) + P_A-CODEX.md problema 6 (Alta).
Hoje só existe criar (`criarPreparo`), marcar consumido (`marcarConsumido`) e descartar (`descartarPreparo`) em `app/marmitas/actions.ts`. Não existe `editarPreparo`/`atualizarPreparo` nem `excluirPreparo` — confirmado por busca direta no arquivo. Se um preparo for lançado com receita, data ou quantidade errada, hoje não tem como corrigir: só criar de novo ou descartar o errado (o que suja a taxa de descarte por receita que acabamos de construir).
**Classificação:** Alta prioridade — é o achado mais acionável desta rodada.

### A.2 — Itens de compra sem excluir nem trocar de grupo ✅ Confirmado
**Fonte:** sugestoesGPT.md achado 2 (Alto) + P_A-CODEX.md problema 7 (Alta).
`atualizarItemCompra` (`app/marmitas/actions.ts:418-483`) só permite renomear o item. Não existe ação de excluir nem de mudar o campo `grupo`. Pra "limpar" a lista hoje, a única saída é marcar "tenho em casa" — o item nunca some de verdade.
**Classificação:** Alta prioridade.

### A.3 — Campos decimais podem não aceitar vírgula PT-BR ⚠️ Requer validação manual
**Fonte:** sugestoesGPT.md achado 3 (Alto) + P_A-CODEX.md problema 10 (Alta).
`lib/numero-formulario.ts` usa `Number(raw)` direto sobre o valor do `<input type="number">`. Tecnicamente, o DOM normaliza esse campo pra usar ponto internamente (então em teoria funciona mesmo se a usuária "vê" vírgula) — mas o teclado numérico do Android em `type="number"` às vezes só mostra o ponto, nunca a vírgula, o que é uma fricção real mesmo sem ser um "bug" de parsing. **Requer validação manual no Galaxy A34**: abrir `/fisico/peso` e tentar digitar `72,5` no campo de peso.
**Classificação:** Alta prioridade, mas ação é "testar primeiro", não "codar direto".

### A.4 — Validação de data não centralizada 🔁 Já era um padrão observado, agora com achado concreto
**Fonte:** sugestoesGPT.md achado 6 (Moderado) + P_A-CODEX.md problema 11 (Alta).
`ehDataFutura` existe, mas cada action faz sua própria checagem de vazio/futuro; formato inválido (ex: dia 30 de fevereiro) pode cair direto no banco e voltar como erro genérico do Postgres, em vez de mensagem amigável. Proposta dos dois relatórios: centralizar em `dataISOValida`/`lerDataObrigatoria`/`lerDataOpcional`, no mesmo espírito de `lib/numero-formulario.ts`.
**Classificação:** Moderada/Alta — não verifiquei ponto a ponto quais actions já tratam isso e quais não; antes de implementar, mapear.

### A.5 — Histórico sem filtro/paginação por período 🔁 Parcialmente novo
**Fonte:** sugestoesGPT.md achado 4 (Moderado) + P_A-CODEX.md problema 9 (Média).
`/fisico/historico` carrega as 4 tabelas inteiras sem `limit`. Diferente do achado 8 do relatório principal (que é sobre busca/filtro em **receitas**) — este é sobre o **histórico de registros físicos** crescer sem filtro de período (7/30/90 dias/tudo).
**Classificação:** Média — relevante conforme o histórico crescer; hoje (poucos meses de uso) o impacto é baixo.

### A.6 — Tela/bloco "Hoje" dedicado 🔁 Se sobrepõe parcialmente ao achado 3.1
**Fonte:** P_A-CODEX.md problema 1 (Alta), problema 2 (Alta — botões rápidos).
Mais ambicioso que o achado 3.1 (que só reorganiza as abas existentes): propõe um painel único mostrando água, proteína, treino, peso do dia e marmitas vencendo, com botões de ação direta (`+250ml`, `+500ml`, marcar proteína, atalho de treino/preparo) — sem precisar entrar em cada tela.
**Classificação:** Alta, mas é a mudança de maior esforço de todo este anexo (mexe em agregação de várias tabelas numa tela só). Decisão de produto antes de estimar.

### A.7 — Estoque orientado a decisão, não só lista ✅ Ideia nova sobre tela existente
**Fonte:** P_A-CODEX.md problema 4 (Alta/Média).
Propõe agrupar o estoque em seções ("Comer primeiro", "Vence hoje", "Próximos 7 dias", "Dentro da validade", "Validade não informada") em vez da lista única ordenada que existe hoje, e mostrar total de porções por receita.
**Classificação:** Média/Alta — o estoque já ordena por urgência (`ordenarEstoque`), então é mais uma questão de agrupamento visual do que de lógica nova.

### A.8 — `window.confirm` pouco amigável no mobile
**Fonte:** P_A-CODEX.md problema 5 (Baixa/Média).
Propõe substituir o diálogo nativo do navegador por um modal/painel próprio nas ações destrutivas, com texto explicando o que vai acontecer e se pode desfazer. Hoje o app usa `window.confirm` de propósito (simples, acessível por padrão, sem CSS pra manter) — trocar é decisão de design, não correção de bug.
**Classificação:** Baixa/Média — ganho estético, custo de manutenção de um componente novo.

### A.9 — Metas como resumo, não só formulário
**Fonte:** P_A-CODEX.md problema 8 (Média).
Propõe mostrar "atual / meta / diferença / prazo / última atualização" de forma mais enxuta, com o formulário de edição recolhido por padrão, em vez do formulário sempre aberto como é hoje.
**Classificação:** Média — `/fisico/metas` já mostra "Atual" e a comparação (`compararComMeta`); a mudança seria esconder o formulário até a usuária optar por editar.

### A.10 — Limites numéricos sem faixa plausível
**Fonte:** P_A-CODEX.md problema 12 (Média).
Hoje os campos numéricos têm `min` mas não `max` plausível (ex: nada impede digitar peso "725" por engano de vírgula). Proposta: faixas por domínio (peso, altura, medidas, água, calorias/duração).
**Classificação:** Média — companheiro natural do achado A.3 (vírgula): se o parser aceitar vírgula corretamente, esse risco de erro de digitação diminui sozinho.

### A.11 — Upsert sobrescreve sem aviso claro
**Fonte:** P_A-CODEX.md problema 13 (Média).
Peso, treino, medidas, hábitos e metas usam `upsert` por dia — bom pra corrigir, mas quando já existe registro do dia, a tela não avisa "você está corrigindo o que já foi salvo, isso vai substituir".
**Classificação:** Média — mudança pequena de texto condicional em cada formulário.

### A.12 — Descartes como decisão mensal 🔁 Extensão do que já construímos hoje
**Fonte:** P_A-CODEX.md problema 14 (Média).
A tela `/marmitas/descartes` que fizemos hoje já calcula motivo e taxa por receita (acumulado geral). Esta proposta vai além: leitura **mensal** (receitas mais descartadas no mês, motivo predominante, total de porções perdidas, sugestão operacional tipo "reduza a porção" ou "troque a receita").
**Classificação:** Média — extensão natural, não substitui o que já existe, soma.

### A.13 — Preview antes de exportar
**Fonte:** P_A-CODEX.md problema 15 (Baixa/Média).
Antes do download em `/perfil/exportar`, mostrar quantas receitas/preparos/registros físicos serão incluídos, formato e data de geração — aumenta a confiança de que o backup está completo.
**Classificação:** Baixa/Média.

### A.14 — Testes automatizados não rodaram no ambiente deles ❌ Provável falso alarme
**Fonte:** sugestoesGPT.md e P_A-CODEX.md, ambos reportam `npm test` falhando com `Cannot read directory "../../../..": Access is denied` ao carregar `vitest.config.mts`.
**Contraditado nesta sessão:** rodei `npm test` com sucesso várias vezes hoje (720 testes passando, 57 arquivos). O erro relatado é específico de permissão de sistema de arquivos — muito provavelmente do sandbox/ambiente que o GPT e o Codex usaram pra rodar os comandos, não do projeto em si. Não vejo motivo pra investigar isso como bug real, mas registro aqui porque você pediu pra não descartar nada.

### A.15 — Falta teste E2E dos fluxos críticos
**Fonte:** P_A-CODEX.md problema 17 (Média).
Lista fluxos sugeridos pra smoke/E2E: login, criar receita, registrar preparo, corrigir preparo, consumir preparo, criar/editar/excluir item de compra, registrar peso, corrigir histórico, exportar dados. Hoje o projeto só tem testes unitários (`vitest`), sem E2E.
**Classificação:** Média — ganho real de confiança, mas é investimento de infraestrutura de teste (ex: Playwright), não um fix pontual.

### A.16 — Validação visual mobile real 🔁 Já era pendência conhecida
**Fonte:** P_A-CODEX.md problema 18 (Alta) — mesma pendência que já está registrada na memória de continuidade deste projeto (zoom 200%, leitor de tela, Galaxy A34). Nada novo, só reforça a prioridade.

## B. Achados que já estavam cobertos (confirmando, não repetindo)

- Busca/filtro de receitas → já é o achado 8 do relatório principal.
- Home sem organização clara → já é o achado 3.1.
- Dependências desatualizadas → já é o achado 12 da lista consolidada.

## C. Plano de ação recomendado pelo Codex (preservado na íntegra, como referência)

O `P_A-CODEX.md` já vinha com uma sequência de implementação própria, em 5 fases. Reproduzo aqui resumida, pra não se perder — é uma segunda opinião de ordenação, pode divergir da minha:

1. **Fase 1 — Base prática:** aceitar vírgula decimal (A.3) + centralizar validação de data (A.4) + estados vazios acionáveis.
2. **Fase 2 — CRUD essencial:** histórico de preparos + editar preparo (A.1) + excluir/arquivar preparo (A.1) + CRUD completo de compras (A.2).
3. **Fase 3 — Tela Hoje:** bloco "Hoje" (A.6) + botões rápidos (A.6).
4. **Fase 4 — Consulta e decisão:** busca de receitas (já coberto) + estoque orientado a decisão (A.7) + filtros no histórico (A.5).
5. **Fase 5 — Prova e qualidade:** confirmar testes rodando (já não é problema aqui — A.14) + E2E (A.15) + validação visual mobile (A.16).

---

# Plano de ação — atualização com os achados do Anexo

Acrescentando à seção "Plano de ação" original, só os itens **confirmados no código** (A.1 e A.2) ganham plano detalhado agora. Os demais do Anexo (A.3 em diante) ficam registrados, priorizados, mas sem plano técnico até você decidir o que entra na fila.

### A.1 — Editar e excluir preparo
**Objetivo:** permitir corrigir um preparo lançado com receita/data/quantidade errada, e excluir um preparo criado por engano — sem precisar passar por "consumido" ou "descartado".
**Arquivos:** `app/marmitas/actions.ts` (novas actions `editarPreparo`/`excluirPreparoRegistro`), `app/marmitas/estoque/page.tsx` ou uma tela própria de histórico de preparos (decisão: editar dentro do estoque, ou criar `/marmitas/preparo/[id]/editar` espelhando o padrão já usado em receitas).
**Decisão de produto necessária antes de codar:** excluir preparo é diferente de "descartar" (que já existe, com motivo e é sobre comida real jogada fora) — esse "excluir" seria só remover um **lançamento errado**, sem afetar a taxa de descarte. Vale um texto de confirmação que deixe essa diferença clara pra você não confundir os dois no futuro.
**Esforço:** médio — segue o mesmo padrão já usado em receitas (editar) e metas (excluir item a item).

### A.2 — Excluir item de compra e trocar de grupo
**Objetivo:** permitir remover um item da lista de compras de vez, e corrigir o grupo se foi cadastrado errado.
**Arquivos:** `app/marmitas/actions.ts` (nova action `excluirItemCompra`; estender `atualizarItemCompra` pra aceitar `grupo` também), `app/marmitas/compras/page.tsx`.
**Esforço:** pequeno/médio — mesmo padrão de `excluirMeta` (ação com confirmação, item a item).

**Itens A.3 a A.16:** registrados no Anexo acima, com status de verificação e fonte. Aguardando sua priorização antes de eu desenhar plano técnico pra cada um — alguns (A.6, tela "Hoje") são mudanças grandes que merecem conversa de produto antes de qualquer código.
