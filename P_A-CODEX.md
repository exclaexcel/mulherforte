# Auditoria e Plano de Acao - App Jornada

Data da auditoria: 2026-10-09  
Escopo: usabilidade, CRUD, rotina diaria, qualidade tecnica e riscos de evolucao.  
Projeto: `acompanhamento_dany` / App Jornada.

## 1. Objetivo

Melhorar o App Jornada para uso pratico no dia a dia, reduzindo friccao nos registros,
facilitando correcao de erros e deixando o fluxo de marmitas, jornada fisica e compras
mais confiavel.

## 2. Fora de Escopo Neste Plano

- Monetizacao ou abertura para terceiros.
- Multiusuario/multitenant.
- Importacao de planilha, PDF ou OCR.
- Redesign completo da identidade visual.
- Deploy, commit ou push sem autorizacao explicita.
- Alteracoes em banco sem migration versionada, pre-checks e autorizacao.

## 3. Provas da Auditoria

Comandos executados:

```bash
git status --short --branch
npm run lint
npm test
npm run build
```

Resultados:

- `git status --short --branch`: branch `main...origin/main`; arquivos nao rastreados: `.claude/`, `auditoriabl0.txt`, `revisao.txt`.
- `npm run lint`: aprovado, sem warnings ou erros.
- `npm run build`: aprovado em Next.js 14.2.35.
- `npm test`: nao iniciou por erro de ambiente/permissao ao carregar `vitest.config.mts`.

Erro observado nos testes:

```text
Cannot read directory "../../../..": Access is denied.
Could not resolve "C:\Users\daany\.vscode\Projeto\Repos\acompanhamento_dany\vitest.config.mts"
```

Observacao importante: nao houve validacao visual real em navegador, Galaxy A34 ou leitor
de tela nesta auditoria. Portanto, pontos de layout visual fino, toque mobile e contraste
composto ainda precisam de validacao manual.

## 4. Resumo Executivo

O projeto esta tecnicamente bem estruturado para um MVP pessoal: tem Next.js, Supabase,
RLS, server actions, mensagens amigaveis, exportacao de dados e boa separacao de regras
em `lib/`.

Os principais pontos de melhoria nao sao de "app quebrado"; sao de praticidade:

- O app ainda funciona mais como conjunto de telas de registro do que como painel diario.
- Alguns CRUDs importantes estao incompletos para o uso real.
- Campos numericos ainda nao estao totalmente naturais para PT-BR.
- Historico e biblioteca tendem a ficar cansativos quando os dados crescerem.
- Testes automatizados precisam voltar a rodar no ambiente local.

## 5. O Que Esta Bom

### 5.1 Seguranca e dados

- As consultas usam `user_id` explicitamente alem da RLS.
- As migrations ativam RLS e policies por usuario.
- Ha migration de privilegios minimos removendo acessos diretos de `anon`.
- Exportacao remove dados tecnicos sensiveis como sessao, e-mail e tokens.

Motivo: isso reduz risco de vazamento ou leitura indevida de dados pessoais.

### 5.2 CRUD parcial bem encaminhado

- Peso, medidas, treino, habitos e metas usam `upsert` quando faz sentido.
- Exclusoes filtram por `user_id`.
- Acoes verificam zero linhas alteradas/excluidas em varios pontos.
- Receita nao pode ser excluida se ja tiver preparo vinculado.

Motivo: evita duplicidade e reduz risco de uma tela antiga gravar dado errado.

### 5.3 Feedback de uso

- Formularios mostram erro previsivel na tela.
- Botao desabilita durante envio.
- Ha mensagens de sucesso e erro com `role="status"`/`role="alert"` em varios fluxos.

Motivo: isso ajuda muito no mobile, onde a pessoa precisa saber se a acao foi salva.

### 5.4 Regras importantes preservadas

- Validade de congelamento pode ficar vazia.
- Sem prazo padrao inventado.
- Indicadores corporais usam linguagem informativa, nao diagnostica.
- Exportacao tem formatos pensados para Excel/backup.

Motivo: o app respeita as decisoes de produto ja consolidadas.

## 6. Problemas e Melhorias Identificados

## 6.1 Usabilidade diaria

### Problema 1 - Falta uma tela "Hoje"

Hoje a Home separa os fluxos em abas e cards. Isso esta organizado, mas ainda exige navegar
por varias telas para responder uma pergunta simples: "o que falta fazer hoje?".

Sugestao:

- Criar uma tela ou bloco principal "Hoje".
- Mostrar status de agua, proteina, treino, peso quando aplicavel e marmitas com vencimento proximo.
- Exibir atalhos diretos para as acoes do dia.

Motivo:

- Reduz cliques.
- Aumenta adesao na rotina.
- Transforma o app em acompanhamento diario, nao so cadastro.

Prioridade: Alta.

### Problema 2 - Acoes frequentes exigem muita navegacao

Exemplos:

- Adicionar agua.
- Marcar proteina.
- Registrar treino.
- Registrar preparo.
- Ver o que comer primeiro.

Sugestao:

- Criar botoes rapidos:
  - `+250 ml`
  - `+500 ml`
  - `Marcar proteina`
  - `Registrar treino`
  - `Registrar preparo`
  - `Ver estoque prioritario`

Motivo:

- Em rotina corrida, menos friccao significa mais registro.
- A acao mais usada nao deve ficar escondida em varias telas.

Prioridade: Alta.

### Problema 3 - Receitas podem virar lista cansativa

A biblioteca usa grupos e `details`, mas nao tem busca.

Sugestao:

- Adicionar busca por:
  - nome
  - categoria
  - marcador/selo
  - texto dos ingredientes
- Adicionar filtros por categoria.
- Adicionar acao rapida "preparar esta receita".

Motivo:

- Quando a biblioteca crescer, rolar lista manual vira atrito.
- Busca reduz tempo na hora de cozinhar/planejar.

Prioridade: Media.

### Problema 4 - Estoque lista dados, mas poderia orientar decisao

Hoje o estoque mostra situacao de validade e acoes, mas a decisao principal e:
"o que eu como primeiro?".

Sugestao:

- Agrupar estoque em secoes:
  - Comer primeiro
  - Vence hoje
  - Proximos 7 dias
  - Dentro da validade
  - Validade nao informada
- Mostrar total de porcoes por receita.
- Adicionar filtro por status de validade.

Motivo:

- Estoque bom nao e so lista; e apoio de decisao.
- Ajuda a evitar desperdicio.

Prioridade: Alta/Media.

### Problema 5 - Confirmacao nativa e funcional, mas pouco amigavel

Algumas acoes usam `window.confirm`.

Sugestao:

- Substituir por modal/painel proprio para acoes destrutivas ou sensiveis.
- Texto claro:
  - o que vai acontecer
  - se pode desfazer
  - qual dado sera afetado

Motivo:

- Melhora no mobile.
- Reduz exclusao por engano.
- Mantem consistencia visual do app.

Prioridade: Baixa/Media.

## 6.2 CRUD

### Problema 6 - CRUD de preparos esta incompleto

Hoje e possivel:

- criar preparo;
- marcar como consumido;
- descartar preparo vencido.

Mas faltam:

- editar preparo;
- excluir preparo lancado por engano;
- corrigir status;
- restaurar descarte/consumo acidental;
- consultar historico completo dos preparos.

Sugestao:

- Criar tela "Historico de preparos".
- Em cada preparo, permitir:
  - editar receita;
  - editar data;
  - editar quantidade;
  - editar semana do ciclo;
  - editar observacao;
  - excluir ou arquivar;
  - restaurar para congelado quando aplicavel.

Motivo:

- Preparo e o centro do estoque.
- Se o preparo estiver errado, o estoque inteiro fica errado.
- Erro de lancamento e comum no uso real.

Prioridade: Alta.

### Problema 7 - Lista de compras nao tem CRUD completo

Hoje e possivel:

- criar item;
- marcar/desmarcar "tenho em casa";
- corrigir nome.

Mas faltam:

- excluir item;
- mudar grupo;
- editar observacao;
- limpar itens marcados;
- talvez arquivar itens recorrentes.

Sugestao:

- Criar formulario de edicao completa do item.
- Adicionar acao de excluir com confirmacao.
- Adicionar acao "limpar comprados" ou "ocultar itens que ja tenho".

Motivo:

- Lista de compras e viva.
- Sem limpeza, acumula sujeira e perde utilidade.
- Mudar grupo evita recriar item por erro simples.

Prioridade: Alta.

### Problema 8 - Metas existem, mas precisam de leitura mais orientada

As metas podem ser salvas/excluidas, mas a experiencia ainda e mais formulario do que acompanhamento.

Sugestao:

- Mostrar metas em formato de resumo:
  - atual;
  - meta;
  - diferenca;
  - prazo;
  - ultima atualizacao.
- Separar edicao em modo recolhido.

Motivo:

- No dia a dia, a pessoa quer ver progresso antes de editar.
- Menos formulario visivel reduz carga mental.

Prioridade: Media.

### Problema 9 - Historico fisico nao tem filtros suficientes

Historico carrega dados de peso, medidas, treino e habitos, mas sem paginacao/filtro por periodo.

Sugestao:

- Filtros rapidos:
  - 7 dias
  - 30 dias
  - 90 dias
  - tudo
- Busca ou filtro por tipo de registro.
- Botao "corrigir" mais destacado nos itens.

Motivo:

- Historico cresce rapido.
- Sem filtro, fica mais lento e mais dificil de revisar.

Prioridade: Media.

## 6.3 Dados, validacao e PT-BR

### Problema 10 - Campos decimais nao sao naturais em PT-BR

Muitos campos usam `type="number"` e a leitura usa `Number(raw)`.

Risco:

- `72,5` pode falhar.
- Usuaria brasileira tende a digitar virgula.
- Excel PT-BR usa virgula decimal.

Sugestao:

- Criar parser unico para numeros PT-BR:
  - aceita `72,5`;
  - aceita `72.5`;
  - rejeita texto invalido;
  - preserva vazio como `null` quando opcional.
- Trocar inputs decimais para `inputMode="decimal"` quando fizer sentido.

Motivo:

- Reduz erro bobo.
- Deixa o app mais brasileiro e mais proximo do uso em Excel.

Prioridade: Alta.

### Problema 11 - Validacao de datas nao esta totalmente centralizada

Ha checagem de data futura, mas formato invalido pode cair no banco e voltar como erro generico.

Sugestao:

- Criar funcao unica:
  - `dataISOValida`
  - `lerDataObrigatoria`
  - `lerDataOpcional`
- Usar em peso, medidas, treino, habitos, perfil e marmitas.

Motivo:

- Mensagem melhor para a usuaria.
- Menos dependencia de erro tecnico do banco.
- Evita inconsistencias entre telas.

Prioridade: Alta.

### Problema 12 - Limites numericos poderiam ser mais inteligentes

Campos usam `min`, mas muitas vezes sem maximo plausivel.

Sugestao:

- Criar validacoes por dominio:
  - peso maior que zero e dentro de faixa plausivel;
  - altura em cm dentro de faixa plausivel;
  - medidas corporais dentro de faixa plausivel;
  - agua em ml com limite de seguranca;
  - calorias/duracao com limite plausivel.

Motivo:

- Evita erro de digitacao como `725` no lugar de `72,5`.
- Ajuda a manter historico limpo.

Prioridade: Media.

### Problema 13 - Upsert pode sobrescrever sem ficar obvio

Peso, treino, medidas, habitos e metas usam `upsert`, que e bom para corrigir.

Sugestao:

- Quando ja existir registro do dia, exibir texto:
  - "Voce esta corrigindo o registro de hoje."
  - "Salvar vai substituir os dados atuais deste dia."

Motivo:

- Evita surpresa.
- Mantem o beneficio do `upsert`, mas deixa a acao clara.

Prioridade: Media.

## 6.4 Relatorios e decisao

### Problema 14 - Descartes ja existem, mas poderiam virar decisao pratica

A tela de descartes ja calcula motivo e taxa por receita.

Sugestao:

- Adicionar leitura mensal:
  - receitas mais descartadas;
  - principal motivo;
  - total de porcoes descartadas;
  - sugestao operacional: reduzir porcao, mudar prazo, trocar receita.

Motivo:

- Ajuda a ajustar planejamento.
- Reduz desperdicio.

Prioridade: Media.

### Problema 15 - Exportacao poderia dar mais confianca antes do download

A exportacao e tecnicamente bem planejada, mas poderia mostrar resumo antes.

Sugestao:

- Antes do download, exibir:
  - X receitas;
  - Y preparos;
  - Z registros fisicos;
  - formato CSV/JSON;
  - data da geracao.

Motivo:

- Aumenta confianca.
- Ajuda a saber se o backup esta completo.

Prioridade: Baixa/Media.

## 6.5 Qualidade tecnica

### Problema 16 - Testes nao rodaram no ambiente atual

O `npm test` falhou antes de executar os testes.

Sugestao:

- Investigar permissao/caminho do Vitest.
- Confirmar se `vite-tsconfig-paths` esta tentando subir diretorios bloqueados.
- Rodar teste novamente apos ajuste.

Motivo:

- Sem teste rodando, evoluir CRUD fica arriscado.
- Lint/build nao substituem teste de regra.

Prioridade: Alta antes de mexer em muito CRUD.

### Problema 17 - Falta teste E2E dos fluxos criticos

Sugestao:

- Criar smoke tests dos fluxos:
  - login;
  - criar receita;
  - registrar preparo;
  - ver estoque;
  - marcar consumido;
  - registrar peso;
  - corrigir historico;
  - exportar dados.

Motivo:

- Teste unitario valida regra isolada.
- E2E valida se a usuaria consegue completar o fluxo.

Prioridade: Media.

### Problema 18 - Validacao visual mobile esta pendente

O README ja registra pendencia de navegador, Galaxy A34, leitor de tela e smoke pos-deploy.

Sugestao:

- Validar no mobile real ou Playwright com viewport mobile.
- Checar:
  - toque em botoes;
  - foco;
  - scroll;
  - texto quebrando;
  - contraste em superficie composta;
  - formularios longos.

Motivo:

- O app e para uso no celular.
- Build aprovado nao prova experiencia visual.

Prioridade: Alta antes de considerar MVP 100% validado.

## 7. Plano de Acao Detalhado

## Fase 1 - Base pratica e reducao de erro

Prioridade: Alta.  
Objetivo: reduzir dado errado e deixar campos mais naturais para uso brasileiro.

### 1.1 Aceitar virgula decimal

Tarefas:

- Criar parser numerico PT-BR em `lib/numero-formulario.ts`.
- Aceitar virgula e ponto decimal.
- Manter vazio como `null` nos opcionais.
- Rejeitar texto invalido com mensagem amigavel.
- Cobrir com testes.

Campos afetados:

- peso;
- gordura;
- massa muscular;
- agua percentual;
- medidas corporais;
- altura;
- metas;
- hidratacao em litros.

Pronto quando:

- `72,5` funciona.
- `72.5` funciona.
- `abc` falha com mensagem amigavel.
- vazio opcional continua vazio.

Risco:

- Parser mal feito pode aceitar formato ambiguo.

Como testar:

```bash
npm test -- numero-formulario
npm test -- fisico
npm run lint
npm run build
```

### 1.2 Centralizar validacao de datas

Tarefas:

- Criar helper de data valida.
- Usar em actions de perfil, fisico e marmitas.
- Padronizar mensagens.
- Testar data vazia, invalida e futura.

Pronto quando:

- `2026-02-30` falha antes do banco.
- data futura falha com mensagem atual.
- data valida segue funcionando.

Risco:

- Algum fluxo que hoje aceita vazio opcional pode passar a bloquear indevidamente.

Como testar:

```bash
npm test -- date
npm test -- fisico
npm test -- perfil
npm run build
```

### 1.3 Estados vazios acionaveis

Tarefas:

- Revisar telas principais sem dados.
- Adicionar CTA direto:
  - cadastrar receita;
  - registrar primeiro preparo;
  - criar item de compra;
  - configurar meta;
  - registrar primeiro peso.

Pronto quando:

- Nenhuma tela importante fica apenas com "nada cadastrado".

Risco:

- Exagerar em texto explicativo e deixar a interface pesada.

Como testar:

- Entrar com usuario sem dados.
- Conferir cada tela principal.

## Fase 2 - Completar CRUD essencial

Prioridade: Alta.  
Objetivo: permitir corrigir erros comuns sem quebrar estoque/historico.

### 2.1 Historico de preparos

Tarefas:

- Criar tela de historico/listagem de preparos.
- Listar todos os status:
  - congelado;
  - consumido;
  - descartado.
- Mostrar receita, data, quantidade, status e observacao.
- Adicionar filtros por status e periodo.

Pronto quando:

- Dany consegue ver o que foi preparado, consumido e descartado.

Risco:

- Query sem limite pode crescer demais.

Como testar:

- Criar preparos de status diferentes.
- Validar ordenacao e filtros.

### 2.2 Editar preparo

Tarefas:

- Criar action `atualizarPreparo`.
- Criar tela/formulario de edicao.
- Permitir corrigir:
  - receita;
  - data;
  - quantidade;
  - semana do ciclo;
  - observacao.
- Recalcular dia da semana ao alterar data.
- Validar receita pertence a usuaria.

Pronto quando:

- Um preparo errado pode ser corrigido sem criar outro.

Risco:

- Alterar receita muda validade exibida no estoque, seguindo a regra atual do MVP.

Como testar:

```bash
npm test -- marmitas
npm run build
```

### 2.3 Excluir ou arquivar preparo

Tarefas:

- Definir decisao: exclusao definitiva ou arquivamento.
- Para uso diario, recomendacao: arquivar/cancelar preparo lancado por engano.
- Criar confirmacao clara.
- Remover do estoque quando arquivado/cancelado.

Pronto quando:

- Um preparo criado por engano nao fica poluindo o estoque.

Risco:

- Se excluir definitivamente, perde rastreabilidade.

Como testar:

- Criar preparo.
- Excluir/arquivar.
- Confirmar que saiu do estoque.

### 2.4 CRUD completo da lista de compras

Tarefas:

- Permitir editar grupo.
- Permitir editar observacao.
- Permitir excluir item.
- Avaliar botao "limpar itens marcados".

Pronto quando:

- Item pode ser criado, marcado, editado, movido e excluido.

Risco:

- Limpar itens marcados pode apagar coisa demais se nao houver confirmacao boa.

Como testar:

```bash
npm test -- marmitas
npm run build
```

## Fase 3 - Tela Hoje e rotina diaria

Prioridade: Alta/Media.  
Objetivo: reduzir navegacao e transformar o app em painel de execucao diaria.

### 3.1 Criar bloco ou tela "Hoje"

Conteudo sugerido:

- Agua consumida hoje.
- Status da proteina.
- Treino esperado/registrado.
- Atalho para peso.
- Atalho para medidas, se for dia de medicao.
- Marmitas que vencem hoje ou em ate 7 dias.
- Ultimo preparo registrado.

Pronto quando:

- Ao abrir o app, Dany sabe o que falta fazer hoje.

Risco:

- Tela ficar carregada demais.

Como testar:

- Usuario sem dados.
- Usuario com dados parciais.
- Usuario com estoque vencendo.

### 3.2 Botoes rapidos

Tarefas:

- Adicionar `+250 ml`.
- Adicionar `+500 ml`.
- Adicionar marcar/desmarcar proteina.
- Adicionar atalho de treino.
- Adicionar atalho de preparo.

Pronto quando:

- As acoes mais frequentes estao a um toque.

Risco:

- Muitos botoes podem poluir a tela.

Como testar:

- Usar no mobile.
- Confirmar feedback apos cada clique.

## Fase 4 - Consulta e decisao

Prioridade: Media.  
Objetivo: facilitar encontrar informacao e tomar decisao.

### 4.1 Busca de receitas

Tarefas:

- Campo de busca client-side ou server-side.
- Filtrar por nome, categoria, selo e ingredientes.
- Manter grupos por categoria apos filtro.

Pronto quando:

- Buscar "frango", "lanche" ou "air fryer" retorna receitas esperadas.

### 4.2 Estoque orientado a acao

Tarefas:

- Agrupar por prioridade.
- Mostrar porcoes totais por receita.
- Destacar "comer primeiro".
- Manter acao de consumir/descarte.

Pronto quando:

- A tela responde rapidamente: "o que consumir primeiro?".

### 4.3 Filtros simples no historico

Tarefas:

- Filtro por periodo:
  - 7 dias;
  - 30 dias;
  - 90 dias;
  - tudo.
- Manter aba por tipo.
- Evitar carregar tudo sem necessidade.

Pronto quando:

- Historico fica rapido e revisavel.

## Fase 5 - Prova, qualidade e validacao visual

Prioridade: Media/Alta.  
Objetivo: garantir que as melhorias nao quebrem o MVP.

### 5.1 Resolver Vitest

Tarefas:

- Investigar erro de permissao.
- Ajustar config se necessario.
- Rodar todos os testes.

Pronto quando:

```bash
npm test
```

passar no ambiente local.

### 5.2 Criar smoke/E2E dos fluxos criticos

Fluxos:

- login;
- criar receita;
- registrar preparo;
- corrigir preparo;
- consumir preparo;
- criar item de compra;
- editar/excluir item de compra;
- registrar peso;
- corrigir historico;
- exportar dados.

Pronto quando:

- Fluxos principais passam de ponta a ponta.

### 5.3 Validacao mobile e visual

Checklist:

- Galaxy A34 ou viewport equivalente.
- Botoes com area de toque confortavel.
- Sem texto quebrado.
- Formularios longos usaveis.
- Mensagens visiveis apos salvar.
- Contraste em superficie composta.
- Navegacao clara.

Pronto quando:

- Dany consegue usar os fluxos principais no celular sem travar.

## 8. Ordem Recomendada de Execucao

1. Corrigir numeros PT-BR e validacao de datas.
2. Resolver `npm test` ou pelo menos isolar a causa.
3. Completar CRUD de preparos.
4. Completar CRUD de compras.
5. Criar tela/bloco "Hoje".
6. Adicionar botoes rapidos.
7. Melhorar estoque por prioridade.
8. Adicionar busca de receitas.
9. Adicionar filtros no historico.
10. Fazer validacao mobile e visual.

## 9. Priorizacao Por Impacto

### Alta prioridade

- Aceitar virgula decimal.
- Validar datas corretamente.
- Editar preparo.
- Excluir/arquivar preparo.
- Completar CRUD de compras.
- Criar tela "Hoje".
- Resolver testes.
- Validar mobile.

### Media prioridade

- Busca de receitas.
- Estoque agrupado por prioridade.
- Filtros no historico.
- Resumo de metas mais orientado.
- Modal proprio para confirmacoes.
- Dashboard mensal de descartes.

### Baixa prioridade

- Preview antes da exportacao.
- Duplicar receita/preparo.
- Soft delete mais amplo.
- E2E completo, depois do smoke inicial.

## 10. Riscos e Cuidados

- Nao alterar banco direto sem migration versionada.
- Nao mexer em deploy/producao sem autorizacao.
- Nao transformar melhorias praticas em redesign grande.
- Validar no celular antes de considerar usabilidade resolvida.
- Garantir que filtros e buscas nao escondam dados importantes.
- Evitar textos longos demais dentro da UI diaria.

## 11. Definicao de Pronto Geral

O plano pode ser considerado concluido quando:

- Dany abre o app e entende o que precisa fazer hoje.
- Registros diarios exigem poucos cliques.
- Preparo errado pode ser corrigido.
- Lista de compras pode ser mantida limpa.
- Campos numericos aceitam formato PT-BR.
- Historico e receitas continuam usaveis com mais dados.
- `lint`, `build` e testes principais passam.
- Fluxos principais foram validados em mobile.
