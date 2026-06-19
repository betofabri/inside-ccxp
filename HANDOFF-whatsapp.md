# Handoff — Token do WhatsApp (CCXP Insider)

Objetivo: gerar o **access token** do WhatsApp Cloud API pra ligar o "Testar no WhatsApp"
e os disparos do CCXP Insider. **É a única peça que falta** — o código já está pronto e
espera só dois segredos no worker.

> ⚠️ Fazer com uma conta que **não esteja em bloqueio temporário** da Meta. Em 13/jun a conta
> do Roberto entrou em modo de proteção (excesso de ações) e passou a dizer "não está apto"
> pra criar System User. Esperar ~24h OU pedir pra um admin do BM da Omelete (quem criou o
> app do Mundo Ticket já sabe esse fluxo).

## IDs que já temos

| Item | Valor |
|---|---|
| Portfólio (verificado) | **Omelete Company Live Experience** / CCXP EVENTOS LTDA |
| Business ID | `980440388640846` |
| WhatsApp Business Account (WABA) | **Omelete Company Live Experience** |
| WABA ID | `2751816215196969` |
| Número | +1 555-912-3945 (In Review) |
| **Phone Number ID** | **`1100392643164850`**  ← já é o `WHATSAPP_PHONE_ID` |
| Apps já criados | `CCXPInsider` (App ID 1010037488787547) e `ccxpinsiderv2` (2881386478862880) — usar UM só |
| Worker (Cloudflare) | `inside-ccxp` |

## Passo a passo pra gerar o token (System User — token permanente)

1. **business.facebook.com** → Business Settings do portfólio **Omelete Company Live Experience**
2. **Users → System users → "+ Add"**
   - Nome: `CCXPInsider` (sem espaço/acentos — a Meta recusa nomes "inválidos")
   - Role: **Admin**
3. Selecionar o system user criado → **Add assets**:
   - **Apps** → escolher um dos apps (ex. `CCXPInsider` / 1010037488787547) → **Full control**
   - **WhatsApp accounts** → **Omelete Company Live Experience** → **Full control**
4. **Generate token**:
   - App: o mesmo app do passo 3
   - Permissões: marcar **`whatsapp_business_messaging`** e **`whatsapp_business_management`**
   - Gerar → **copiar o token na hora** (só aparece uma vez)

> Alternativa (token temporário, 24h, só pra teste): exige o app ser tipo **Business** com o
> produto **WhatsApp** adicionado → API Setup mostra o token. Os apps atuais são "type: None",
> então o produto WhatsApp não aparece — por isso o caminho do System User acima é o recomendado.

## Quando tiver o token — 2 comandos (1 minuto)

Na pasta do projeto (`~/Claude/RSVP`):

```bash
npx wrangler secret put WHATSAPP_TOKEN --name inside-ccxp
# cola o token gerado

npx wrangler secret put WHATSAPP_PHONE_ID --name inside-ccxp
# cola: 1100392643164850
```

Depois: entrar como admin em `/backstage` → **Follow up → "Testar no WhatsApp"** num passo →
deve chegar no número de teste cadastrado em **Settings → WhatsApp pra testes**
(hoje: +55 11 97620-8834).

## Importante pra produção (depois do teste)

Pra **disparar proativamente** (OTP, convite, Save the Date) pros convidados — e não só
responder dentro de 24h — a WABA ainda precisa de:
- **Método de pagamento** na conta (WhatsApp cobra por conversa iniciada)
- **Templates aprovados** pela Meta (mensagem fora da janela de 24h tem que ser template)

Enquanto isso, **o email (Resend, `insider@betofabri.com`) já entrega tudo isso de graça** —
WhatsApp é o canal-bônus.
