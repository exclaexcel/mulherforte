# App Jornada (Marmitas + Jornada Física)

Next.js 14 + Supabase Auth + RLS. Deploy de produção: https://mulher-forte.vercel.app

## Status atual (2026-10-13)

- **MVP fechado:** todos os itens de `validacao-manual.md` confirmados no Galaxy A34,
  com data e evidência em cada um — esse arquivo é a fonte da verdade do que já foi
  validado, não este README.
- Auditoria técnica aprovada; TypeScript, lint, build e 760 testes automatizados passando.
- Banco Supabase próprio (`mulherforte`), separado do projeto do ReForma desde 09/10/2026.
- Env vars de produção na Vercel corrigidas em 13/10/2026 — estavam apontando por engano
  pro banco antigo desde a separação; ver nota do incidente em `validacao-manual.md`.
- Pendências fora do MVP (reorganização da Home, upgrade de dependências, revisão visual
  final, etc.): ver seção "Ainda pendente" em `auditoria-ux-etapa7b.md` e `backlog-fase-2.md`.

## Setup local

1. Copie `.env.example` → `.env.local` com a URL e a anon key do projeto Supabase
   `mulherforte`.
2. `npm install` → `npm run dev`
3. Login com a conta já existente no projeto. Não existe tela de cadastro ainda — contas
   são criadas pelo painel do Supabase (Authentication → Users). Ver backlog 2.18.

## Testes e validação

- `npm test` (Vitest) — deve passar antes de qualquer commit que toque `lib/`.
- `npm run build` + `npm run lint` — prova mínima de qualquer mudança antes de pedir
  validação visual.
- `npm run test:e2e` (Playwright) — fluxos ponta a ponta contra uma conta de teste
  dedicada; ver `e2e/README.md` pra configurar.
- `npm test`/`build`/`lint` comprovam que o código funciona, não que a tela ficou boa —
  validação visual real (navegador, celular, leitor de tela) vive em `validacao-manual.md`.

## Documentos

- `prd-jornada-app.md` — requisitos e critério de "pronto" (seção 8)
- `etapas-mvp.md` — etapas de build, uma de cada vez
- `backlog-fase-2.md` — o que fica pra depois do MVP, e por quê
- `auditoria-ux-etapa7b.md` — auditoria de UX consolidada, com plano de ação por item
- `validacao-manual.md` — checklist único de validação manual (marcar aqui, não duplicar)
- `ways-of-working-jornada.md` — regras de colaboração, escopo e segurança
