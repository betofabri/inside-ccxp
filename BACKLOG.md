# CCXP Insider — Backlog de Melhorias

Log de ajustes e roadmap priorizado. Backlog **vivo** — atualizar status aqui a cada entrega.
Legenda: ✅ feito · 🟡 mock/parcial · ⬜ a fazer · ❓ pendência/decisão em aberto

> Status conciliados com o code em 12/jun/2026. Detalhe técnico das fases já entregues no `ROADMAP.md`.

## P0 — Fundacional (destrava o resto)

### 1. Gestão de usuários ⬜

Único núcleo ainda não no code (hoje o acesso é via switcher de personas do protótipo).

- CRUD de usuários
- Papéis: admin / host / produção / portaria (quem vê o quê)
- Convidar host por email, desativar acesso, reset de sessão
- Quota por host (quantas cortesias pode distribuir) + histórico (taxa de comparecimento dos convidados dele)

## P1 — Funil de relacionamento (alto valor, início do ciclo)

### 2. Save the Date (pré-convite) ⬜

- Nova fase ANTES do RSVP — passo 0 da comunicação
- Disparo antecipado: pessoa sabe que o evento está chegando e se planeja
- Enviado antes de saber os dias que ela vai (reservar data, gerar expectativa, reduzir recusa)
- Demonstração de interesse mora na mini pesquisa (item 3)

### 3. Mini pesquisa de interesse (pós-token, 1º acesso do convidado) ⬜

- Estilo "app de relacionamento": chips/cards selecionáveis, leve e rápido
- Pergunta: o que te atrai na CCXP e no universo geek? (múltipla escolha)
- Opções: Quadrinhos · Games · Terror · Filmes · Anime · Momento com a família · Negócios · Networking · Oportunidades de patrocínio
- Alimenta: segmentação de follow-up, scoring de VIP
- Loop futuro: cruzar interesse declarado × comportamento real (Footprint) — ex: disse terror e passou 4h no Thunder
- **Posição no fluxo (decisão 12/jun)**: a pesquisa acontece ANTES do resgate — mesmo com magic link/OTP, a pessoa responde a mini pesquisa e a relação fica gravada no perfil dela antes de receber os códigos

## P2 — Operação diária

### 4. Importação em lote via Excel ✅

- Subir códigos de cortesia em massa para hosts/funcionários — host importa a planilha pessoal na própria página (dropdown do perfil); admin importa a corporativa central. Prévia com rejeições linha a linha, revalidação server-side idempotente, RESGATADO=SIM entra como resgatado.

### 5. Lógica de corporativo ✅ (com 1 pendência)

- Sem flag de corporativo → oculta a sinalização E a aba ✅
- Fonte de dados:
  - Funcionário individual: cada um sobe sua própria planilha ✅
  - Corporativo: planilha única centralizada ✅
- Formato da planilha individual: `NOME | EVENTO | CATEGORIA | INGRESSO | TIPO | CÓDIGO | RESGATADO` ✅
  - `CÓDIGO` ex: `CRT-XXXX-NNNNN` · `RESGATADO`: SIM/NÃO
- ❓ Pendência: planilha única do corporativo usa o mesmo layout de colunas ou tem campo a mais (empresa/depto)? (hoje o import central assume o mesmo layout)

### 6. FOLLOW UP 🟡 (painel pronto · motor de disparo pendente = F4)

- Renomeado de "Régua de comunicação" ✅
- CRUD completo das etapas (criar/editar/excluir/pausar) ✅
- Pós-evento ✅:
  1. Agradecimento + fotos
  2. Pesquisa de satisfação
  3. Divulgação de números / after movie
- Envio de mensagens ad hoc (sob demanda) para todos os convidados VIPs ✅ (registro mock no log de comunicação)
- Testar por email (Resend real) ✅ · Testar no WhatsApp (Meta Cloud API real, wa.me como plano B) ✅
- ⬜ Motor real de disparo com condições e opt-out (F4)

### 7. Autocomplete de empresas no cadastro ✅

- Evitar typo; melhora a qualidade do dado de empresa (usado pela lógica corporativa)

### 8. Tela de sucesso pós-etapa 3 ✅

- Avisa que existem materiais na aba "Materiais de Apoio" (renomeada pra "Assets")

### 9. Colapsar abas no admin ✅

- Dashboard 100% colapsável; funil e Resgates Corporativos como gráficos

### 15. Corrigir contato de convite pendente ⬜ (novo, 12/jun)

- Host (e admin) pode editar o email/WhatsApp de um convite ainda pendente e redisparar o OTP
- Motivo: convidado com email errado (typo na hora do convite, dado fake de import) trava no gate de OTP num beco sem saída silencioso — hoje a única saída é cancelar e reconvidar
- Registrar a correção no audit log

## P2.5 — Integração Mundo Ticket (destrava a Footprint real)

### 10. Webhooks / API — Mundo Ticket ❓ (bloqueado)

- ❓ Pendência crítica: ainda não se sabe o processo com a Mundo Ticket.
  - Decisão: push (webhook tempo real → endpoint receptor + fila) ou pull (API/export em batch → mais simples)
  - Pergunta objetiva pra eles: "mandam webhook a cada bipagem, ou acesso é via API/export que eu consulto?"
- Nota técnica — padrão Adapter: plugar a Footprint num adapter com interface fixa = contrato abaixo. A tela consome só essa interface; trocar mock → real (push/pull) mexe apenas no adapter, sem refatorar a Footprint. (Contrato já tipado em `src/lib/footprint.ts`.)
- Contrato de bipagem:

```
{ credentialId, type: 'entry' | 'exit' | 'stage' | 'purchase', location, timestamp, payload }
```

- ⚠️ Não confundir: PULSE V.1 ingere export da Ticketmaster (CCXP MX ticketing). O CCXP Insider integra com Mundo Ticket (bipagens da Footprint).

## P3 — Footprint: do mock pro real

### 11. Footprint 🟡 (feita com mock — falta plugar dados reais)

Front já construído. Estrutura atual:

- Abre com insights gerais agregados (visão macro do público) — 6 cards:
  1. 90% dos convidados passaram +5h no evento
  2. 65% foram a 2 dias ou mais
  3. Pico de chegada 10h–11h (manhã → painéis)
  4. Palco Thunder mais visitado (78% dos VIPs)
  5. Ticket médio de compra R$ 480
  6. 42% ficaram até após 19h
- Busca por nome → abre ficha individual
- Ficha individual: dados básicos completos (nome, empresa, cargo, email, whatsapp, nascimento, redes, anfitriões) + trajeto via bipagens (chegada/saída, compras, palcos)
- Box de Insights AI (dentro da ficha): 3 sub-cards com leitura comportamental + badges
  - Ex: 4h no Thunder em painéis de terror → badge Terror Master
  - Gastou +R$1.000 → badge Shopper
  - Maior tempo no evento → badge CCXP Fan

Falta pra virar real:

- ⬜ Trocar fonte mock pelo stream real de bipagens (via P2.5 / adapter)
- ⬜ Ligar o Box de Insights AI na Claude API real (input = bipagens agregadas por `credentialId`)
- ⬜ Validar agregação por `credentialId` com dado real
- ⬜ Remover estado de demo quando os dados reais entrarem

## P4 — Responsivo / Acesso

### 12. Home / Landing genérica ⬜

- Acesso sem código ou sem perfil → página estilo landing (hoje abre o switcher de personas do protótipo)
- Texto descritivo curto + duas opções: "Sou host" / "Sou convidado"

### 13. Admin oculto ⬜ ⚠️ (subiu de prioridade)

- Acessível apenas por link direto (fora da navegação)
- ⚠️ Urgência nova: desde 12/jun o app está **público** em `betofabri.com/insider-ccxp` (fora do Cloudflare Access, pra testar com convidados reais e ter preview de link). O switcher de personas — incluindo Admin — está acessível a qualquer um com o link. Ok pra fase de teste com dados de exemplo; resolver antes de circular o link amplamente.

### 14. Mobile — topo colapsado 🟡

- ✅ Card de perfil global no topo com dropdown (detalhes, Assets/Fotos no mobile, importar, trocar papel)
- ⬜ Topo colapsa e vira ícone de perfil (bonequinho) → perfil/detalhes da conta
- ⬜ Conteúdo: logo + perfil logado (ou botão de login se deslogado)

## P5 — Polish (fase final)

- ✅ Hub: botão de navegação entre páginas mais marcado (borda, fundo, seta sempre visível)
- ✅ Microinterações: fade de entrada de página, seções colapsáveis, modal, hover-lifts (com `prefers-reduced-motion`)
- ⬜ Card profile: mouseover (vindo do fade / arrasta)
- ⬜ Card profile: mover avatar para a direita (hoje à esquerda)
- ✅ Imagens de compartilhamento (OG/share) corretas — og.png 1200×630 com logo Insider + metadata OG/Twitter completa
- ✅ Telas de estado terminal do convite (expirado/cancelado/não encontrado) desenhadas — glifo, próximo passo destacado, tom acolhedor
- ⬜ Gradiente triplo `#FFD000 → #FF7A2F → #ED3A86` em palavras de destaque de títulos e subtítulos
- 🟡 Bottom nav glass no mobile (conceito aprovado, "em digestão" — aguarda go)

## Hub — Backlog vivo

- ⬜ Exibir os next steps do backlog de melhorias + pontos de atenção na própria página hub
- Visibilidade: visível pra todos (por enquanto)
- ⚠️ Reavaliar antes do go-live: backlog interno exposto pode revelar o que ainda não está pronto a hosts/produção

## P6 — QA final (última etapa)

- ⬜ Revisão geral de código
- ⬜ Revisão de UX
- ⬜ Consistência visual (componentes, espaçamentos, cores, tipografia)
- ⬜ Consistência de linguagem (tom, termos PT-BR, labels de abas)

## Referências de contexto

- Autenticação: OTP de 6 dígitos, token por pessoa ✅ (já no code)
  - Canal: email como padrão (infra Resend pronta) ✅; SMS como opção futura se houver atrito no balcão
  - Código com TTL ~10 min em Cloudflare KV ✅ · magic link descartado ✅ (token do convite é só o endereço)
  - 🟡 Incluir: reenviar/recuperar código com rate-limit, estados usado/expirado/inválido (reenvio existe; rate-limit e estados detalhados pendentes)
- Email: Resend real com template padrão (logo embutido, CTA, rodapé do evento) ✅ · ⬜ verificar domínio próprio (DKIM/SPF) pra entregar a qualquer destinatário
- WhatsApp: Meta Cloud API integrada (teste do Follow up) ✅ · ⬜ token permanente via System User + templates aprovados pra disparo fora da janela de 24h
- Ciclo completo do convidado: `Save the Date → Convite/RSVP (escolhe dias) → Confirmação → Lembrete pré-evento → Evento/check-in → Follow-up pós-evento`
