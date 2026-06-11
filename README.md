# Inside CCXP — RSVP / CRM de convidados VIP

Protótipo navegável do sistema de convites VIP da CCXP26 (03 a 06/dez/2026, São Paulo Expo).

**Produção**: https://betofabri.com/lab/inside-ccxp (Cloudflare Access · Google @omeletecompany)

## Stack

- Next.js 16 (App Router, TS) + CSS custom — identidade CCXP escuro premium
- Prisma 7 + **Cloudflare D1** (`@prisma/adapter-d1`) em produção e no dev (miniflare)
- Deploy: `@opennextjs/cloudflare` → Worker `inside-ccxp`, rota `betofabri.com/lab/inside-ccxp*`
- CI/CD: Workers Builds conectado a este repo (push na `main` = deploy)

## Rodar local

```bash
npm install
npm run db:d1:local   # aplica schema + seed no D1 local (primeira vez)
npm run dev           # http://localhost:3000/lab/inside-ccxp
```

## Scripts úteis

| script | faz |
|---|---|
| `npm run deploy` | build OpenNext + deploy manual no Worker |
| `npm run db:sql` | regenera `prisma/schema.sql` a partir do schema Prisma |
| `npm run db:seed` | popula o `prisma/dev.db` local (fonte pro dump do seed.sql) |
| `npm run db:d1:local` / `db:d1:remote` | aplica schema+seed no D1 local / produção |

## Documentos

- `ROADMAP.md` — status das fases (F0–F6) e melhorias futuras
- `PRODUCT.md` / `DESIGN.md` — princípios de produto e sistema visual
- Plano completo: `plano_rsvp_ccxp_final.md` (fora do repo)

## Papéis do protótipo

Login mockado por switcher na landing: **Admin** (Beto), **Hosts** (Camila com flag corporativa, Diego sem) e **Convidados** em todos os estados do funil. O ciclo convite → link mágico → cadastro → carteira funciona ponta a ponta com reserva atômica de códigos no D1.
