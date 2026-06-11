# Roadmap — RSVP CCXP26

Estado em 11/jun/2026. Fases do plano original em `~/Downloads/plano_rsvp_ccxp_final.md` (§12).

## Feito

- **F0 — Scaffold**: Next 16 + Prisma 7/SQLite, modelo §11 (+ empresa/cargo/nascimento no Convidado, vip na ConviteParcela), switcher de papéis, seed rico, identidade CCXP (escuro premium, champagne, cor por tipo de ingresso).
- **F2 — Convite + gestão** (núcleo): wizard em 3 passos com fluxos pessoal × corporativo separados, reserva atômica em transação, validações server-side (empresa + email corporativo obrigatórios, domínio genérico bloqueado via tabela do admin, dedupe corporativo com aviso que nunca bloqueia), link mágico, expiração lazy automática, ações do host (copiar link, reenviar com nova reserva, cancelar devolvendo ao pool).
- **F3 — Convidado** (núcleo): cadastro via link mágico com host em destaque (pessoal: nascimento; corporativo: nascimento + cargo + email E celular obrigatórios), consentimento LGPD, entrega de códigos, carteira consolidada com cores por tipo, agenda pro corporativo.
- **Material de apoio**: cards verticais prontos pra encaminhar no WhatsApp (mapa, horários, entrada, como chegar, o que levar, lounge VIP), link fixo no topo.

## Decisões registradas (11/jun/2026)

- **Autenticação do convidado: OTP, não magic link.** Token único por pessoa via **OTP de 6 dígitos**; canal padrão email (infra Resend), SMS como opção futura; código com TTL ~10 min em Cloudflare KV/Durable Object. **Magic link descartado** — o link mágico atual do protótipo é provisório até essa troca.
- **Formato das planilhas de cortesias**: funcionário individual sobe a própria planilha com colunas `NOME | EVENTO | CATEGORIA | INGRESSO | TIPO | CÓDIGO | RESGATADO`; corporativo é planilha única centralizada (admin). Liga com a importação em lote via Excel da F1 e com a flag de corporativo.
- **Sem flag corporativa = sem sinalização**: quem não tem a flag não vê aba, badge nem menção ao corporativo (implementado).

## Próximas fases

- **F1 — Ingestão**: parser Excel (SheetJS) com hardening de privilégio — planilha individual do host (formato acima) + planilha corporativa central do admin, validações + relatório de rejeição.
- **F2 restante**: import de resgate do host (CSV Mundo Ticket restrito aos códigos dele), notificação in-app quando convidado se cadastra.
- **F3 restante**: botão "já resgatei" funcional, transacionais mockados visíveis (lembrete D+3, aviso D+6).
- **F4 — Régua + agenda** (painel pronto, motor pendente): o admin já tem o painel "Régua de comunicação" com a régua RSVP padrão (4 transacionais + 4 de relacionamento, modelo `ReguaPasso` no banco, toggle ativo/pausado com audit log). Falta: motor de disparo com condições e opt-out, edição de timing/template/canal pelo painel, agenda editável.
- **F5 — Admin**: imports centrais (resgate corporativo + presença), exports CSV, configs editáveis, audit log completo, filtro VIP + busca na tabela de convidados.
- **F6 — Produção**: Google SSO, Postgres com lock, email real (Resend/SendGrid), WhatsApp Business API, domínio, LGPD operacional.

## Melhorias futuras (pedidos do Beto)

- **📸 Fotos do dia** — galeria pessoal do convidado VIP: fotos tiradas no lounge VIP Omelete, filtradas só pra pessoa (reconhecimento facial ou marcação manual no upload). Botão já está no topo, desabilitado com selo "em breve" pra gerar hype. Decisões pendentes: fornecedor de captura, pipeline de upload, matching, LGPD de biometria.
- **📋 Pesquisa de satisfação** — disparo pós-evento (D+1) na régua de relacionamento, com NPS + perguntas abertas; resultados agregados no dashboard admin. Aproveitar opt-out da régua.
- **🎨 Polish final de UI** — ajustes de contraste e estados de botão (hover/focus/active/disabled) em toda a aplicação; revisão de acessibilidade AA; **botão de navegação do hub mais marcado**; **microinterações** (fades e transições entre telas e estados).
- **🔐 OTP de 6 dígitos** — substitui o magic link (ver Decisões registradas): Resend pra email, KV/DO pro TTL do código, SMS futuro.
