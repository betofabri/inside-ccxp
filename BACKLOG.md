# CCXP Insider — Backlog de Melhorias

Log de ajustes e roadmap priorizado. Backlog **vivo** — atualizar status aqui a cada entrega.
Legenda: ✅ feito · 🟡 mock/parcial · ⬜ a fazer · ❓ pendência/decisão em aberto

> Status conciliados com o code em 12/jun/2026. Detalhe técnico das fases já entregues no `ROADMAP.md`.

## P0 — Fundacional (destrava o resto)

### 1. Gestão de usuários 🟡 (núcleo feito 12/jun — auth real fica pra produção)

- CRUD de usuários ✅ — aba **Usuários** no admin (`/admin/usuarios`): criar, editar, lista com cards
- Papéis: admin / host / produção / portaria ✅ — campo `papel` no schema + seletor; o gating fino de "quem vê o quê" por papel entra com a auth real (F6)
- Convidar host por email ✅ (boas-vindas via Resend, mock sem chave) · desativar/reativar acesso ✅ (some do hub, não assume persona, não se auto-desativa) · reset de sessão ⬜ (depende de sessão real — hoje é cookie de persona do protótipo)
- Quota por host ✅ (códigos disponíveis) + histórico ✅ (convites, resgatados, % de comparecimento por host)

## P1 — Funil de relacionamento (alto valor, início do ciclo)

### 2. Save the Date (pré-convite) 🟡 (núcleo feito 12/jun — disparo real = F4)

- Nova fase ANTES do RSVP — passo 0 da comunicação ✅ (grupo "Save the Date" no Follow up, etapa padrão D-180 editável com Testar por email/WhatsApp)
- **Decisão (12/jun): destinatários vêm de import de planilha ou pré-cadastro manual do admin** ✅ — seção "Audiência do Save the Date" no Follow up: form nome+email e import colando linhas do Excel (`;`, vírgula ou tab; inválidas/repetidas puladas com aviso). Pré-cadastrado = Convidado sem convite; quando o host convidar, o "Já convidado" encontra a pessoa
- Disparo pra audiência ✅ mockado e registrado no log de comunicação por destinatário · ⬜ envio real entra com o motor da F4
- Demonstração de interesse mora na mini pesquisa (item 3)

### 3. Mini pesquisa de interesse (pós-token, 1º acesso do convidado) ✅ (12/jun)

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

### 15. Corrigir contato de convite pendente ✅ (12/jun)

- "Corrigir contato" nas ações do convite pendente (host e admin): atualiza email/WhatsApp, invalida o código OTP em trânsito (chegaria no endereço errado) e registra no audit log; email já usado por outro convidado é barrado

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

Perfumaria (12/jun):

- ⬜ Cards pessoais com cara de game: badges como conquistas visuais, com uma **imagem/arte própria pra cada badge** (Terror Master, Shopper, CCXP Fan...) em vez de chips de texto — estética de achievement desbloqueado
- 🟡 **Gráfico radar do perfil** ao lado do card de perfil do convidado na ficha individual — FEITO com mock determinístico (12/jun, `radar-perfil.tsx`, glowing-stroke recharts no design system); falta plugar dado real via P2.5 — 7 eixos:
  1. Tempo (horas no evento)
  2. Quantidade de dias
  3. Quantidade de painéis
  4. Compras
  5. Alimentação
  6. VIP area
  7. M&G (meet & greet)
  - Modelo de referência: radar chart shadcn/recharts com **glowing stroke** (traço com filtro `feGaussianBlur` de glow, grid pontilhado, fill none) — adaptar pro nosso design system como nos outros gráficos: **sem Tailwind/shadcn**, recharts puro (já instalado) + tokens CSS (traço champagne ou gradiente Insider, grid `--line-soft`, tooltip no padrão dos cards), valores normalizados 0–100 por eixo pra escala comparável
  - Mesmo dado que alimenta os insights AI (bipagens agregadas por `credentialId`) — dá pra nascer com mock agora e plugar no real junto com o resto da Footprint

## P4 — Responsivo / Acesso

### 12. Home / Landing genérica ⬜

- Acesso sem código ou sem perfil → página estilo landing (hoje abre o switcher de personas do protótipo)
- Texto descritivo curto + duas opções: "Sou host" / "Sou convidado"

### 13. Admin oculto ✅ (12/jun)

- Coluna Admin saiu do hub; entrada do admin só por **`/backstage`** (link direto, fora da navegação, sem menção no hub)
- Nota: segurança real (não só obscuridade) chega com a auth do item 1 / F6

### 14. Mobile — topo colapsado 🟡

- ✅ Card de perfil global no topo com dropdown (detalhes, Assets/Fotos no mobile, importar, trocar papel)
- ⬜ Topo colapsa e vira ícone de perfil (bonequinho) → perfil/detalhes da conta
- ⬜ Conteúdo: logo + perfil logado (ou botão de login se deslogado)

## P5 — Polish (fase final)

- ✅ **Semiótica de sucesso = verde** (12/jun): selo ✓ do wizard verde com glow, painel de sucesso com borda verde, avisos .ok com tint verde de fundo, aviso verde "Cadastro concluído ✓" na chegada à carteira (token `--sucesso`)
- ✅ Perfumaria do sucesso: **confetes em JavaScript** (`src/components/confetes.tsx`, paleta Insider + verde) no convite enviado e no cadastro concluído — com `prefers-reduced-motion` desligando

- ✅ Hub: botão de navegação entre páginas mais marcado (borda, fundo, seta sempre visível)
- ✅ Microinterações: fade de entrada de página, seções colapsáveis, modal, hover-lifts (com `prefers-reduced-motion`)
- ⬜ Card profile: mouseover (vindo do fade / arrasta)
- ✅ Card profile: avatar movido pra direita (12/jun)
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
