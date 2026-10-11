# Testes E2E (Playwright)

Testam o app de ponta a ponta, como uma usuária real: login → ação → confirmação na
tela. Diferente dos testes em `lib/`/`app/**/*.test.ts` (funções isoladas), estes
abrem o navegador de verdade contra o `npm run dev`.

## Nunca use a conta real aqui

Os testes rodam contra uma **conta de teste dedicada** (`e2e-teste@mulherforte.app`),
criada no mesmo projeto Supabase (`mulherforte`) mas com dados isolados pelo RLS —
nenhuma linha sua é lida ou alterada. Os testes criam, editam e excluem dados de
verdade na conta de teste a cada execução.

## Configurar (uma vez por máquina)

Crie `.env.test.local` na raiz do projeto (já está no `.gitignore`, nunca vai pro
Git):

```
E2E_TEST_EMAIL=e2e-teste@mulherforte.app
E2E_TEST_PASSWORD=<peça a senha pra Dany ou gere uma nova conta de teste>
```

Sem esse arquivo, `auth.setup.ts` falha com uma mensagem explicando o que falta —
não tenta rodar com a conta errada.

## Rodar

```
npm run test:e2e        # roda tudo, headless
npm run test:e2e:ui     # interface do Playwright pra depurar passo a passo
```

O `webServer` do `playwright.config.ts` sobe o `npm run dev` sozinho se não houver
um já rodando em `localhost:3000`. Primeira execução é mais lenta (compilação das
rotas em modo dev).

## O que está coberto

- `receitas.spec.ts` — criar, editar, excluir receita
- `preparo.spec.ts` — registrar preparo, corrigir (editar), marcar como consumido
- `compras.spec.ts` — criar item, editar (trocar grupo), excluir item
- `fisico.spec.ts` — registrar peso, corrigir um dia passado a partir do histórico
- `exportar.spec.ts` — resumo de exportação aparece, download é gerado

Cada teste cria os próprios dados (nomes com timestamp, pra não colidir entre
execuções) — não dependem de estado deixado por um teste anterior, exceto a sessão
de login (feita uma vez em `auth.setup.ts` e reaproveitada).
