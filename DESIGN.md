# Design

Sistema visual do protótipo RSVP CCXP26. Tokens em `src/app/globals.css`; tudo é CSS custom, sem framework de UI.

## Theme

Escuro premium ("backstage de evento"): veludo grafite com leve calor, champagne como único acento, wordmark CCXP preto/branco invertido pra branco. Superfícies internas são ferramenta discreta; a carteira do convidado é a única superfície com cerimônia.

## Color palette

Tudo em OKLCH, hue ~75–85 (neutros tintados na direção do champagne):

- `--bg` oklch(15.5% 0.006 75): fundo do app
- `--surface` oklch(18.5% 0.007 75): cards, tabelas em hover
- `--surface-2` oklch(22% 0.009 75): camada elevada (inputs de stepper, pills sólidas)
- `--line` / `--line-soft`: bordas hairline (28% / 23.5%)
- `--ink` oklch(95% 0.012 85): texto principal
- `--muted` oklch(73% 0.022 80): texto secundário (mantém ≥4.5:1 no bg)
- `--faint` oklch(58% 0.018 78): notas e placeholders de baixa ênfase
- `--champagne` oklch(84% 0.088 85): acento único — ações primárias, seleção, destaque VIP
- Estados semânticos (`--st-*`): pendente âmbar, cadastrado azul, entregue lavanda, resgatado verde, expirado cinza, cancelado vermelho. Sempre via pill `.badge` (texto colorido + fundo `color-mix` 13%), nunca cor decorativa.

## Typography

- **Display**: Marcellus (serif lapidar), só em títulos textuais (h1 de página, h2 de seção, header de card de persona). **Nunca em números, labels, botões ou dados** — os algarismos do Marcellus parecem romanos.
- **Corpo/UI**: Archivo, 15px base. Números grandes (stats, saldos) em Archivo weight 650.
- **Mono**: IBM Plex Mono, restrito a códigos de ingresso e emails em tabelas.
- Sem uppercase com tracking em texto corrido; uppercase só onde for dado curto (tipo "SÁB 05").

## Components

- **`.badge`**: pill radius 999, fundo translúcido da própria cor. Variante `.vip` é champagne sólido. Variante `.solido` neutra.
- **`.cta`**: botão champagne sólido, texto escuro, radius 7px; `.fantasma` é a variante outline. Disabled a 45%.
- **`.composer`**: card de duas colunas (quem × ingressos por dia) com rodapé de ação; é o herói da página do host. Saldos aparecem como contexto dos steppers, não como dashboard.
- **`.ticket`**: card da carteira do convidado — tipo em champagne, código em mono num poço recuado, origem do convite, pill de estado.
- **`.stat` / `.saldo`**: blocos numéricos com label embaixo, número em sans 650.
- **`.tabela`**: densa, headers em sans 12px, hairlines, hover na linha.
- Inputs: fundo `--bg`, borda `--line`, foco champagne (sem ring duplo).

## Layout & motion

- Container 1120px, padding lateral 32px (18px mobile).
- Seções com h2 serif + hairline e nota à direita; sem eyebrows uppercase.
- Motion 180ms `cubic-bezier(0.22,1,0.36,1)`, só pra estado (hover, foco); sem coreografia de load. `prefers-reduced-motion` zera tudo.

## Voice

pt-BR, direto e hospitaleiro. Sem travessão (usar vírgula, dois-pontos ou ·). Labels de botão são verbo + objeto ("Enviar convite", "Resgatar na Mundo Ticket").
