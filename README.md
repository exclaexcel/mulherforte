# App Jornada — Etapa 1

Fundação: Next.js 14 + Supabase Auth + `perfil_usuario` (RLS) + deploy.

## Setup local

1. Copie `.env.example` → `.env.local` e preencha URL + anon key do Supabase (mesmo projeto do MCP / ReForma, se for o caso).
2. No Supabase SQL Editor, rode o arquivo:
   `supabase/migrations/20260915000000_perfil_usuario.sql`
3. `npm install` → `npm run dev`
4. Crie o usuário (Auth → Users) ou use a conta já existente no projeto.

## Pronto quando (Etapa 1)

- [ ] Login funciona
- [ ] RLS testado — sem login, nenhum dado acessível
- [ ] Deploy acessível via URL (**projeto Vercel novo** — nunca reutilizar `app_reforma`)

## Deploy (regra)

- **Não** linkar nem fazer deploy no projeto Vercel `app_reforma`.
- Só criar/usar um projeto separado (ex.: `app-jornada`), e só quando Dany autorizar.
- O `.env.local` copiado do ReForma aponta para o **mesmo** Supabase por enquanto — migration de `perfil_usuario` também exige OK explícito antes de rodar no SQL Editor desse projeto.

## Nota MCP

`execute_sql` / `list_tables` do MCP estão falhando com auth do `supabase_read_only_user`. A migration precisa ser aplicada no SQL Editor até o MCP ser reconectado.
