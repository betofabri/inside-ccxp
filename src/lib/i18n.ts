import { cookies } from "next/headers";

// i18n simples (sem lib): cookie `lang` define o idioma; PT-BR é o padrão.
// Traduz a porta de entrada do convidado (header, hub, /acesso, FAQ). Telas
// internas (admin, wizard do host) seguem em PT-BR.
export type Locale = "pt" | "en" | "es";
export const LOCALES: Locale[] = ["pt", "en", "es"];
export const LOCALE_PADRAO: Locale = "pt";

export const LOCALE_LABEL: Record<Locale, string> = { pt: "PT", en: "EN", es: "ES" };

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("lang")?.value as Locale | undefined;
  return c && LOCALES.includes(c) ? c : LOCALE_PADRAO;
}

type Dicionario = {
  evento: { datas: string; local: string; protoNav: string };
  header: { tagline: string; assets: string; fotos: string; faq: string; breve: string };
  rodape: { assinatura: string; proto: string };
  hub: {
    heroPre: string;
    heroEm: string;
    escolha: string;
    souHost: string;
    souConvidado: string;
    colabTitulo: string;
    colabDesc: string;
    convTitulo: string;
    convDesc: string;
    jaCadastrou: string;
    entreComCodigo: string;
    comFlag: string;
    semFlag: string;
    convitesN: (n: number) => string;
  };
  acesso: {
    titulo: string;
    tituloEm: string;
    sub: string;
    labelEmail: string;
    receber: string;
    naoEncontrado: string;
    enviadoPra: (email: string) => string;
    labelCodigo: string;
    entrar: string;
    reenviar: string;
    limite: string;
    falhou: string;
    codigoErrado: string;
    demo: string;
  };
  faq: {
    titulo: string;
    sub: string;
    itens: { q: string; a: string }[];
    aindaDuvida: string;
    contato: string;
  };
  convite: {
    naoEncTitulo: string;
    naoEncTexto: string;
    oQueFazer: string;
    naoEncFazer: string;
    expTitulo: string;
    canTitulo: string;
    expTexto: (nome: string, data: string, qtd: number) => string;
    canTexto: string;
    voltaLabel: string;
    voltaExp: (host: string) => string;
    voltaCan: (host: string) => string;
    jaTitulo: (nome: string) => string;
    jaTexto: string;
    jaBtn: string;
    deQuem: (host: string) => string;
    titulo: (nome: string, qtd: number) => string;
    otpTitulo: string;
    otpSub: (masc: string) => string;
    otpLimite: string;
    otpFalha: string;
    otpDemo: string;
    otpCodigoErrado: string;
    otpReceber: string;
    otpLabelCodigo: string;
    otpConfirmar: string;
    otpReenviar: string;
    formTitulo: string;
    erroCampos: string;
    erroEmailUso: string;
    labelNasc: string;
    labelCargo: string;
    phCargo: string;
    labelEmail: string;
    labelCelular: string;
    opcional: string;
    lgpdLabel: string;
    lgpdSmall: string;
    lgpdLink: string;
    concluir: string;
    prazo: (data: string) => string;
  };
  carteira: {
    cadastroOkB: string;
    cadastroOk: string;
    interessesOkB: string;
    interessesOk: string;
    pesquisaB: string;
    pesquisaPre: string;
    pesquisaLink: string;
    pesquisaPos: string;
    titulo: (nome: string) => string;
    lgpd: (data: string) => string;
    resgateDecl: string;
    anfitriaoUm: string;
    anfitriaoVarios: string;
    ingressos: string;
    ingressosNota: (n: number) => string;
    resgatar: string;
    copiarB: string;
    copiarTexto: string;
    mtB: string;
    mtTexto: string;
    mtLink: string;
    mtPos: string;
    dicaB: string;
    dicaPre: string;
    dicaPos: string;
    semCodigosB: string;
    semCodigos: string;
    agenda: string;
    agendaNota: string;
  };
  ticket: { de: (host: string) => string; copiar: string; copiado: string; codigoCopiado: string; disponivel: string };
  pesquisa: {
    ultima: (nome: string) => string;
    tituloPre: string;
    tituloEm: string;
    sub: string;
    erroVazio: string;
    escolhaUm: string;
    continuar: (n: number) => string;
    opcoes: { value: string; label: string }[];
  };
};

const PT: Dicionario = {
  evento: {
    datas: "03 a 06 de dezembro de 2026",
    local: "São Paulo Expo",
    protoNav: "Protótipo navegável · escolha um papel pra entrar",
  },
  header: {
    tagline: "O Backstage do Backstage.",
    assets: "Assets",
    fotos: "Fotos",
    faq: "FAQ",
    breve: "em breve",
  },
  rodape: {
    assinatura: "A plataforma de convites e relacionamento corporativo da CCXP",
    proto: "Protótipo · envio mockado · dados de exemplo",
  },
  hub: {
    heroPre: "A plataforma de RSVP e relacionamento para convidados especiais",
    heroEm: "pré, durante e pós CCXP",
    escolha: "Protótipo navegável · escolha um papel pra entrar",
    souHost: "Sou host",
    souConvidado: "Sou convidado",
    colabTitulo: "Colaborador O&CO",
    colabDesc:
      "Convida direto da tela inicial e acompanha os próprios convites. A flag corporativa libera o lote compartilhado.",
    convTitulo: "Convidado",
    convDesc:
      "Carteira de códigos consolidada, link da Mundo Ticket e agenda do evento (perfil corporativo).",
    jaCadastrou: "Já se cadastrou?",
    entreComCodigo: "Entre com seu código",
    comFlag: "com flag corp",
    semFlag: "sem flag",
    convitesN: (n) => `${n} convites`,
  },
  acesso: {
    titulo: "Acessar minha ",
    tituloEm: "carteira",
    sub: "Digite o email do seu cadastro e enviaremos um código de 6 dígitos.",
    labelEmail: "Email do cadastro",
    receber: "Receber código",
    naoEncontrado:
      "Não achamos cadastro com esse email. Se você ainda não se cadastrou, use o link do convite que recebeu. Em caso de dúvida, fale com seu anfitrião.",
    enviadoPra: (email) => `Código enviado pra ${email}.`,
    labelCodigo: "Código de 6 dígitos",
    entrar: "Entrar",
    reenviar: "Reenviar código",
    limite: "Muitos códigos pedidos em sequência; espere uns 10 minutos.",
    falhou: "O envio falhou; tente de novo.",
    codigoErrado: "Código incorreto ou vencido; peça outro.",
    demo: "Modo demo (envio de email ainda não configurado): seu código é",
  },
  faq: {
    titulo: "Perguntas frequentes",
    sub: "Tudo que você precisa saber sobre seu convite VIP pra CCXP26.",
    itens: [
      {
        q: "Recebi um convite. O que faço agora?",
        a: "Abra o link que chegou no seu email, confirme sua identidade com o código de 6 dígitos e complete o cadastro. Pronto: seus ingressos ficam na sua carteira digital.",
      },
      {
        q: "Por que preciso de um código de 6 dígitos?",
        a: "É a sua confirmação de identidade (OTP). Enviamos por email a cada acesso pra garantir que só você usa seu convite — mais seguro que senha.",
      },
      {
        q: "Esqueci/perdi meu código. Como recupero?",
        a: "Você não precisa decorar nada. Vá em “Entre com seu código”, digite o email do seu cadastro e enviaremos um código novo na hora. Seus ingressos continuam na carteira.",
      },
      {
        q: "Não recebi o email. E agora?",
        a: "Confira a caixa de spam e o lixo eletrônico. Pode pedir o reenvio na própria tela. Se o email estiver errado, fale com quem te convidou — ele corrige e reenvia em segundos.",
      },
      {
        q: "Como resgato meus ingressos?",
        a: "Na sua carteira, toque em cada código pra copiar e resgate no site da Mundo Ticket. Precisa ter cadastro na Mundo Ticket — se não tiver, é só criar na hora.",
      },
      {
        q: "Meu convite expirou. Tem volta?",
        a: "Tem. O convite vale por alguns dias; se vencer, os ingressos voltam pro pool. Fale com quem te convidou e peça pra reenviar — você recebe um link novo com prazo renovado.",
      },
      {
        q: "Posso ser convidado por mais de uma pessoa?",
        a: "Pode. Se mais de um anfitrião te convidar, os ingressos se juntam na mesma carteira e você vê todos os anfitriões lá.",
      },
      {
        q: "O que é a mini pesquisa de interesses?",
        a: "Uns toques rápidos pra contar o que te atrai na CCXP. Usamos pra deixar sua experiência e nossos convites mais com a sua cara — leva 10 segundos.",
      },
    ],
    aindaDuvida: "Ainda com dúvida?",
    contato: "Fale com o anfitrião que te convidou — ele é seu contato direto.",
  },
  convite: {
    naoEncTitulo: "Convite não encontrado",
    naoEncTexto: "Esse link não é válido — pode ter sido digitado errado ou substituído por um mais novo.",
    oQueFazer: "O que fazer:",
    naoEncFazer: "confira a mensagem que você recebeu (o link certo é o mais recente) ou peça um novo link a quem convidou você.",
    expTitulo: "Esse convite venceu",
    canTitulo: "Convite cancelado",
    expTexto: (nome, data, qtd) =>
      `${nome}, o prazo de cadastro terminou em ${data} e os ${qtd} ingresso(s) reservados voltaram pro pool da CCXP26.`,
    canTexto: "Este convite pra CCXP26 foi cancelado por quem convidou você.",
    voltaLabel: "Mas calma — isso tem volta:",
    voltaExp: (host) =>
      `fale com ${host} e peça pra reenviar o convite. Leva um clique do lado de lá e você recebe um link novo com prazo renovado.`,
    voltaCan: (host) =>
      `fale com ${host} e peça pra enviar um novo convite. Leva um clique do lado de lá e você recebe um link novo.`,
    jaTitulo: (nome) => `Você já está na lista, ${nome}`,
    jaTexto: "Seu cadastro foi concluído e os códigos estão na sua carteira.",
    jaBtn: "Abrir minha carteira",
    deQuem: (host) => `Convite de ${host} · Omelete Company`,
    titulo: (nome, qtd) => `${nome}, você tem ${qtd} ingresso(s) pra `,
    otpTitulo: "Confirme que é você",
    otpSub: (masc) => `Por segurança, enviamos um código de 6 dígitos pra ${masc}.`,
    otpLimite: "Muitos códigos pedidos em sequência. Espere uns 10 minutos e tente de novo.",
    otpFalha: "O envio falhou; tente reenviar o código.",
    otpDemo: "Modo demo (envio de email ainda não configurado): seu código é",
    otpCodigoErrado: "Código incorreto ou vencido; tente de novo.",
    otpReceber: "Receber código por email",
    otpLabelCodigo: "Código de 6 dígitos",
    otpConfirmar: "Confirmar código",
    otpReenviar: "Reenviar código",
    formTitulo: "Complete seu cadastro pra receber os códigos",
    erroCampos: "Preencha todos os campos obrigatórios.",
    erroEmailUso: "Esse email já está em uso em outra conta; confira o endereço.",
    labelNasc: "Data de nascimento",
    labelCargo: "Cargo",
    phCargo: "Seu cargo na empresa",
    labelEmail: "Email",
    labelCelular: "Celular",
    opcional: "(opcional)",
    lgpdLabel: "Li e aceito a política de privacidade",
    lgpdSmall: "Seus dados são usados só pra entrega dos ingressos e comunicação do evento (LGPD).",
    lgpdLink: "Política de privacidade",
    concluir: "Concluir cadastro e ver meus códigos",
    prazo: (data) => `Cadastro até ${data}; depois disso o convite expira.`,
  },
  carteira: {
    cadastroOkB: "Cadastro concluído ✓",
    cadastroOk: "Bem-vindo(a) ao CCXP INSIDER — seus códigos já estão na carteira abaixo.",
    interessesOkB: "Interesses salvos ✓",
    interessesOk: "Valeu! Agora a experiência fica com a sua cara.",
    pesquisaB: "10 segundos:",
    pesquisaPre: "conta pra gente",
    pesquisaLink: "o que te atrai na CCXP",
    pesquisaPos: "— deixa os convites e a programação com a sua cara.",
    titulo: (nome) => `Sua carteira, ${nome}`,
    lgpd: (data) => `LGPD ✓ ${data}`,
    resgateDecl: "Resgate declarado",
    anfitriaoUm: "Seu anfitrião na Omelete:",
    anfitriaoVarios: "Seus anfitriões na Omelete:",
    ingressos: "Seus ingressos",
    ingressosNota: (n) => `${n} código(s), consolidados de todos os convites`,
    resgatar: "Resgatar na Mundo Ticket ↗",
    copiarB: "Toque num código pra copiar",
    copiarTexto:
      "e resgate manualmente no site da Mundo Ticket. Os códigos que você já copiou ficam marcados aqui na carteira.",
    mtB: "Precisa de cadastro na Mundo Ticket",
    mtTexto: "pra resgatar — se ainda não tem, é só criar na própria página de login. Dúvidas? Veja o",
    mtLink: "passo a passo do resgate de cortesia",
    mtPos: "na central de ajuda da CCXP.",
    dicaB: "Dica:",
    dicaPre: "na aba",
    dicaPos: "tem mapa do evento, horários, por onde entrar, como chegar e o que levar.",
    semCodigosB: "Nenhum código ativo na sua carteira.",
    semCodigos: "Convites expirados ou cancelados devolvem os códigos ao pool.",
    agenda: "Agenda do evento",
    agendaNota: "geral única · perfil corporativo",
  },
  ticket: {
    de: (host) => `Convite de ${host}`,
    copiar: "Toque pra copiar o código",
    copiado: "Copiado ✓",
    codigoCopiado: "Código copiado",
    disponivel: "Disponível",
  },
  pesquisa: {
    ultima: (nome) => `Última coisa, ${nome} · leva 10 segundos`,
    tituloPre: "O que te atrai na ",
    tituloEm: "CCXP",
    sub: "Toque em tudo que combina com você. Usamos isso pra deixar sua experiência (e nossos convites) mais com a sua cara.",
    erroVazio: "Escolha pelo menos um interesse.",
    escolhaUm: "Escolha pelo menos um",
    continuar: (n) => `Continuar com ${n} interesse(s)`,
    opcoes: [
      { value: "Quadrinhos", label: "Quadrinhos" },
      { value: "Games", label: "Games" },
      { value: "Terror", label: "Terror" },
      { value: "Filmes", label: "Filmes" },
      { value: "Anime", label: "Anime" },
      { value: "Momento com a família", label: "Momento com a família" },
      { value: "Negócios", label: "Negócios" },
      { value: "Networking", label: "Networking" },
      { value: "Oportunidades de patrocínio", label: "Oportunidades de patrocínio" },
    ],
  },
};

const EN: Dicionario = {
  evento: {
    datas: "December 3–6, 2026",
    local: "São Paulo Expo",
    protoNav: "Navigable prototype · pick a role to enter",
  },
  header: {
    tagline: "The Backstage of the Backstage.",
    assets: "Assets",
    fotos: "Photos",
    faq: "FAQ",
    breve: "soon",
  },
  rodape: {
    assinatura: "CCXP's platform for corporate invitations and relationships",
    proto: "Prototype · mocked sending · sample data",
  },
  hub: {
    heroPre: "The RSVP and relationship platform for special guests",
    heroEm: "before, during and after CCXP",
    escolha: "Navigable prototype · pick a role to enter",
    souHost: "I'm a host",
    souConvidado: "I'm a guest",
    colabTitulo: "O&CO Staff",
    colabDesc:
      "Invites right from the home screen and tracks their own invitations. The corporate flag unlocks the shared batch.",
    convTitulo: "Guest",
    convDesc:
      "Consolidated code wallet, Mundo Ticket link and event schedule (corporate profile).",
    jaCadastrou: "Already registered?",
    entreComCodigo: "Sign in with your code",
    comFlag: "with corp flag",
    semFlag: "no flag",
    convitesN: (n) => `${n} invitations`,
  },
  acesso: {
    titulo: "Access my ",
    tituloEm: "wallet",
    sub: "Enter the email from your registration and we'll send a 6-digit code.",
    labelEmail: "Registration email",
    receber: "Get code",
    naoEncontrado:
      "We couldn't find a registration with that email. If you haven't registered yet, use the invite link you received. If in doubt, talk to your host.",
    enviadoPra: (email) => `Code sent to ${email}.`,
    labelCodigo: "6-digit code",
    entrar: "Enter",
    reenviar: "Resend code",
    limite: "Too many codes requested in a row; wait about 10 minutes.",
    falhou: "Sending failed; try again.",
    codigoErrado: "Wrong or expired code; request a new one.",
    demo: "Demo mode (email sending not set up yet): your code is",
  },
  faq: {
    titulo: "Frequently asked questions",
    sub: "Everything you need to know about your VIP invitation to CCXP26.",
    itens: [
      {
        q: "I got an invitation. What do I do now?",
        a: "Open the link sent to your email, confirm your identity with the 6-digit code and finish registering. Done: your tickets live in your digital wallet.",
      },
      {
        q: "Why do I need a 6-digit code?",
        a: "It's your identity confirmation (OTP). We send it by email on each access so only you can use your invitation — safer than a password.",
      },
      {
        q: "I forgot/lost my code. How do I recover it?",
        a: "Nothing to memorize. Go to “Sign in with your code”, enter your registration email and we'll send a fresh code right away. Your tickets stay in the wallet.",
      },
      {
        q: "I didn't get the email. Now what?",
        a: "Check your spam and junk folders. You can request a resend on the screen itself. If the email is wrong, talk to whoever invited you — they fix and resend it in seconds.",
      },
      {
        q: "How do I redeem my tickets?",
        a: "In your wallet, tap each code to copy it and redeem on the Mundo Ticket website. You'll need a Mundo Ticket account — if you don't have one, just create it on the spot.",
      },
      {
        q: "My invitation expired. Can I still use it?",
        a: "Yes. The invitation is valid for a few days; if it expires, the tickets return to the pool. Talk to whoever invited you and ask for a resend — you'll get a new link with a renewed deadline.",
      },
      {
        q: "Can more than one person invite me?",
        a: "Yes. If more than one host invites you, the tickets combine into the same wallet and you'll see all your hosts there.",
      },
      {
        q: "What is the mini interest survey?",
        a: "A few quick taps to tell us what draws you to CCXP. We use it to make your experience and our invitations more your style — it takes 10 seconds.",
      },
    ],
    aindaDuvida: "Still have a question?",
    contato: "Talk to the host who invited you — they're your direct contact.",
  },
  convite: {
    naoEncTitulo: "Invitation not found",
    naoEncTexto: "This link isn't valid — it may have been mistyped or replaced by a newer one.",
    oQueFazer: "What to do:",
    naoEncFazer: "check the message you received (the right link is the most recent one) or ask whoever invited you for a new link.",
    expTitulo: "This invitation expired",
    canTitulo: "Invitation cancelled",
    expTexto: (nome, data, qtd) =>
      `${nome}, the registration deadline ended on ${data} and the ${qtd} reserved ticket(s) returned to the CCXP26 pool.`,
    canTexto: "This CCXP26 invitation was cancelled by whoever invited you.",
    voltaLabel: "But don't worry — there's a way back:",
    voltaExp: (host) =>
      `talk to ${host} and ask for a resend. It's one click on their side and you'll get a new link with a renewed deadline.`,
    voltaCan: (host) =>
      `talk to ${host} and ask for a new invitation. It's one click on their side and you'll get a fresh link.`,
    jaTitulo: (nome) => `You're already on the list, ${nome}`,
    jaTexto: "Your registration is complete and the codes are in your wallet.",
    jaBtn: "Open my wallet",
    deQuem: (host) => `Invitation from ${host} · Omelete Company`,
    titulo: (nome, qtd) => `${nome}, you have ${qtd} ticket(s) for `,
    otpTitulo: "Confirm it's you",
    otpSub: (masc) => `For security, we sent a 6-digit code to ${masc}.`,
    otpLimite: "Too many codes requested in a row. Wait about 10 minutes and try again.",
    otpFalha: "Sending failed; try resending the code.",
    otpDemo: "Demo mode (email sending not set up yet): your code is",
    otpCodigoErrado: "Wrong or expired code; try again.",
    otpReceber: "Get code by email",
    otpLabelCodigo: "6-digit code",
    otpConfirmar: "Confirm code",
    otpReenviar: "Resend code",
    formTitulo: "Finish your registration to get the codes",
    erroCampos: "Fill in all required fields.",
    erroEmailUso: "This email is already used on another account; check the address.",
    labelNasc: "Date of birth",
    labelCargo: "Job title",
    phCargo: "Your role at the company",
    labelEmail: "Email",
    labelCelular: "Mobile",
    opcional: "(optional)",
    lgpdLabel: "I've read and accept the privacy policy",
    lgpdSmall: "Your data is used only to deliver the tickets and for event communication (LGPD).",
    lgpdLink: "Privacy policy",
    concluir: "Finish registration and see my codes",
    prazo: (data) => `Register by ${data}; after that the invitation expires.`,
  },
  carteira: {
    cadastroOkB: "Registration complete ✓",
    cadastroOk: "Welcome to CCXP INSIDER — your codes are in the wallet below.",
    interessesOkB: "Interests saved ✓",
    interessesOk: "Thanks! Now the experience is more your style.",
    pesquisaB: "10 seconds:",
    pesquisaPre: "tell us",
    pesquisaLink: "what draws you to CCXP",
    pesquisaPos: "— it makes invitations and programming more your style.",
    titulo: (nome) => `Your wallet, ${nome}`,
    lgpd: (data) => `LGPD ✓ ${data}`,
    resgateDecl: "Redemption declared",
    anfitriaoUm: "Your host at Omelete:",
    anfitriaoVarios: "Your hosts at Omelete:",
    ingressos: "Your tickets",
    ingressosNota: (n) => `${n} code(s), consolidated from all invitations`,
    resgatar: "Redeem on Mundo Ticket ↗",
    copiarB: "Tap a code to copy it",
    copiarTexto:
      "and redeem it manually on the Mundo Ticket website. Codes you've already copied are marked here in the wallet.",
    mtB: "You need a Mundo Ticket account",
    mtTexto: "to redeem — if you don't have one, just create it on the login page. Questions? See the",
    mtLink: "step-by-step courtesy redemption guide",
    mtPos: "in the CCXP help center.",
    dicaB: "Tip:",
    dicaPre: "in the",
    dicaPos: "tab you'll find the event map, schedule, where to enter, how to get there and what to bring.",
    semCodigosB: "No active codes in your wallet.",
    semCodigos: "Expired or cancelled invitations return the codes to the pool.",
    agenda: "Event schedule",
    agendaNota: "single general agenda · corporate profile",
  },
  ticket: {
    de: (host) => `Invitation from ${host}`,
    copiar: "Tap to copy the code",
    copiado: "Copied ✓",
    codigoCopiado: "Code copied",
    disponivel: "Available",
  },
  pesquisa: {
    ultima: (nome) => `One last thing, ${nome} · takes 10 seconds`,
    tituloPre: "What draws you to ",
    tituloEm: "CCXP",
    sub: "Tap everything that fits you. We use it to make your experience (and our invitations) more your style.",
    erroVazio: "Pick at least one interest.",
    escolhaUm: "Pick at least one",
    continuar: (n) => `Continue with ${n} interest(s)`,
    opcoes: [
      { value: "Quadrinhos", label: "Comics" },
      { value: "Games", label: "Games" },
      { value: "Terror", label: "Horror" },
      { value: "Filmes", label: "Movies" },
      { value: "Anime", label: "Anime" },
      { value: "Momento com a família", label: "Family time" },
      { value: "Negócios", label: "Business" },
      { value: "Networking", label: "Networking" },
      { value: "Oportunidades de patrocínio", label: "Sponsorship opportunities" },
    ],
  },
};

const ES: Dicionario = {
  evento: {
    datas: "3 a 6 de diciembre de 2026",
    local: "São Paulo Expo",
    protoNav: "Prototipo navegable · elige un rol para entrar",
  },
  header: {
    tagline: "El Backstage del Backstage.",
    assets: "Assets",
    fotos: "Fotos",
    faq: "FAQ",
    breve: "pronto",
  },
  rodape: {
    assinatura: "La plataforma de invitaciones y relaciones corporativas de la CCXP",
    proto: "Prototipo · envío simulado · datos de ejemplo",
  },
  hub: {
    heroPre: "La plataforma de RSVP y relaciones para invitados especiales",
    heroEm: "antes, durante y después de la CCXP",
    escolha: "Prototipo navegable · elige un rol para entrar",
    souHost: "Soy anfitrión",
    souConvidado: "Soy invitado",
    colabTitulo: "Equipo O&CO",
    colabDesc:
      "Invita desde la pantalla inicial y sigue sus propias invitaciones. La marca corporativa libera el lote compartido.",
    convTitulo: "Invitado",
    convDesc:
      "Cartera de códigos consolidada, enlace de Mundo Ticket y agenda del evento (perfil corporativo).",
    jaCadastrou: "¿Ya te registraste?",
    entreComCodigo: "Entra con tu código",
    comFlag: "con marca corp",
    semFlag: "sin marca",
    convitesN: (n) => `${n} invitaciones`,
  },
  acesso: {
    titulo: "Acceder a mi ",
    tituloEm: "cartera",
    sub: "Escribe el email de tu registro y te enviaremos un código de 6 dígitos.",
    labelEmail: "Email del registro",
    receber: "Recibir código",
    naoEncontrado:
      "No encontramos un registro con ese email. Si aún no te registraste, usa el enlace de invitación que recibiste. Ante la duda, habla con tu anfitrión.",
    enviadoPra: (email) => `Código enviado a ${email}.`,
    labelCodigo: "Código de 6 dígitos",
    entrar: "Entrar",
    reenviar: "Reenviar código",
    limite: "Demasiados códigos seguidos; espera unos 10 minutos.",
    falhou: "El envío falló; inténtalo de nuevo.",
    codigoErrado: "Código incorrecto o vencido; pide otro.",
    demo: "Modo demo (envío de email aún no configurado): tu código es",
  },
  faq: {
    titulo: "Preguntas frecuentes",
    sub: "Todo lo que necesitas saber sobre tu invitación VIP a la CCXP26.",
    itens: [
      {
        q: "Recibí una invitación. ¿Qué hago ahora?",
        a: "Abre el enlace que llegó a tu email, confirma tu identidad con el código de 6 dígitos y completa el registro. Listo: tus entradas quedan en tu cartera digital.",
      },
      {
        q: "¿Por qué necesito un código de 6 dígitos?",
        a: "Es tu confirmación de identidad (OTP). Lo enviamos por email en cada acceso para que solo tú uses tu invitación — más seguro que una contraseña.",
      },
      {
        q: "Olvidé/perdí mi código. ¿Cómo lo recupero?",
        a: "No tienes que memorizar nada. Entra en “Entra con tu código”, escribe el email de tu registro y te enviaremos un código nuevo al instante. Tus entradas siguen en la cartera.",
      },
      {
        q: "No recibí el email. ¿Y ahora?",
        a: "Revisa la carpeta de spam y correo no deseado. Puedes pedir el reenvío en la propia pantalla. Si el email está mal, habla con quien te invitó — lo corrige y reenvía en segundos.",
      },
      {
        q: "¿Cómo canjeo mis entradas?",
        a: "En tu cartera, toca cada código para copiarlo y canjéalo en el sitio de Mundo Ticket. Necesitas una cuenta en Mundo Ticket — si no la tienes, créala en el momento.",
      },
      {
        q: "Mi invitación expiró. ¿Tiene solución?",
        a: "Sí. La invitación vale por unos días; si expira, las entradas vuelven al pool. Habla con quien te invitó y pide el reenvío — recibirás un enlace nuevo con plazo renovado.",
      },
      {
        q: "¿Puede invitarme más de una persona?",
        a: "Sí. Si más de un anfitrión te invita, las entradas se juntan en la misma cartera y verás a todos tus anfitriones ahí.",
      },
      {
        q: "¿Qué es la mini encuesta de intereses?",
        a: "Unos toques rápidos para contarnos qué te atrae de la CCXP. La usamos para que tu experiencia y nuestras invitaciones tengan más tu estilo — toma 10 segundos.",
      },
    ],
    aindaDuvida: "¿Sigues con dudas?",
    contato: "Habla con el anfitrión que te invitó — es tu contacto directo.",
  },
  convite: {
    naoEncTitulo: "Invitación no encontrada",
    naoEncTexto: "Este enlace no es válido — puede haberse escrito mal o haber sido reemplazado por uno más nuevo.",
    oQueFazer: "Qué hacer:",
    naoEncFazer: "revisa el mensaje que recibiste (el enlace correcto es el más reciente) o pide uno nuevo a quien te invitó.",
    expTitulo: "Esta invitación expiró",
    canTitulo: "Invitación cancelada",
    expTexto: (nome, data, qtd) =>
      `${nome}, el plazo de registro terminó el ${data} y las ${qtd} entrada(s) reservadas volvieron al pool de la CCXP26.`,
    canTexto: "Esta invitación a la CCXP26 fue cancelada por quien te invitó.",
    voltaLabel: "Pero tranquilo — tiene solución:",
    voltaExp: (host) =>
      `habla con ${host} y pide el reenvío. Es un clic de su lado y recibirás un enlace nuevo con plazo renovado.`,
    voltaCan: (host) =>
      `habla con ${host} y pide una nueva invitación. Es un clic de su lado y recibirás un enlace nuevo.`,
    jaTitulo: (nome) => `Ya estás en la lista, ${nome}`,
    jaTexto: "Tu registro está completo y los códigos están en tu cartera.",
    jaBtn: "Abrir mi cartera",
    deQuem: (host) => `Invitación de ${host} · Omelete Company`,
    titulo: (nome, qtd) => `${nome}, tienes ${qtd} entrada(s) para `,
    otpTitulo: "Confirma que eres tú",
    otpSub: (masc) => `Por seguridad, enviamos un código de 6 dígitos a ${masc}.`,
    otpLimite: "Demasiados códigos seguidos. Espera unos 10 minutos e inténtalo de nuevo.",
    otpFalha: "El envío falló; intenta reenviar el código.",
    otpDemo: "Modo demo (envío de email aún no configurado): tu código es",
    otpCodigoErrado: "Código incorrecto o vencido; inténtalo de nuevo.",
    otpReceber: "Recibir código por email",
    otpLabelCodigo: "Código de 6 dígitos",
    otpConfirmar: "Confirmar código",
    otpReenviar: "Reenviar código",
    formTitulo: "Completa tu registro para recibir los códigos",
    erroCampos: "Completa todos los campos obligatorios.",
    erroEmailUso: "Este email ya está en uso en otra cuenta; revisa la dirección.",
    labelNasc: "Fecha de nacimiento",
    labelCargo: "Cargo",
    phCargo: "Tu cargo en la empresa",
    labelEmail: "Email",
    labelCelular: "Celular",
    opcional: "(opcional)",
    lgpdLabel: "He leído y acepto la política de privacidad",
    lgpdSmall: "Tus datos se usan solo para la entrega de las entradas y la comunicación del evento (LGPD).",
    lgpdLink: "Política de privacidad",
    concluir: "Completar registro y ver mis códigos",
    prazo: (data) => `Regístrate hasta el ${data}; después la invitación expira.`,
  },
  carteira: {
    cadastroOkB: "Registro completo ✓",
    cadastroOk: "Bienvenido(a) a CCXP INSIDER — tus códigos ya están en la cartera de abajo.",
    interessesOkB: "Intereses guardados ✓",
    interessesOk: "¡Gracias! Ahora la experiencia tiene más tu estilo.",
    pesquisaB: "10 segundos:",
    pesquisaPre: "cuéntanos",
    pesquisaLink: "qué te atrae de la CCXP",
    pesquisaPos: "— hace que las invitaciones y la programación tengan más tu estilo.",
    titulo: (nome) => `Tu cartera, ${nome}`,
    lgpd: (data) => `LGPD ✓ ${data}`,
    resgateDecl: "Canje declarado",
    anfitriaoUm: "Tu anfitrión en Omelete:",
    anfitriaoVarios: "Tus anfitriones en Omelete:",
    ingressos: "Tus entradas",
    ingressosNota: (n) => `${n} código(s), consolidados de todas las invitaciones`,
    resgatar: "Canjear en Mundo Ticket ↗",
    copiarB: "Toca un código para copiarlo",
    copiarTexto:
      "y canjéalo manualmente en el sitio de Mundo Ticket. Los códigos que ya copiaste quedan marcados aquí en la cartera.",
    mtB: "Necesitas una cuenta en Mundo Ticket",
    mtTexto: "para canjear — si no la tienes, créala en la página de login. ¿Dudas? Mira el",
    mtLink: "paso a paso del canje de cortesía",
    mtPos: "en el centro de ayuda de la CCXP.",
    dicaB: "Tip:",
    dicaPre: "en la pestaña",
    dicaPos: "encuentras el mapa del evento, horarios, por dónde entrar, cómo llegar y qué llevar.",
    semCodigosB: "No hay códigos activos en tu cartera.",
    semCodigos: "Las invitaciones expiradas o canceladas devuelven los códigos al pool.",
    agenda: "Agenda del evento",
    agendaNota: "agenda general única · perfil corporativo",
  },
  ticket: {
    de: (host) => `Invitación de ${host}`,
    copiar: "Toca para copiar el código",
    copiado: "Copiado ✓",
    codigoCopiado: "Código copiado",
    disponivel: "Disponible",
  },
  pesquisa: {
    ultima: (nome) => `Una última cosa, ${nome} · toma 10 segundos`,
    tituloPre: "¿Qué te atrae de la ",
    tituloEm: "CCXP",
    sub: "Toca todo lo que combina contigo. Lo usamos para que tu experiencia (y nuestras invitaciones) tengan más tu estilo.",
    erroVazio: "Elige al menos un interés.",
    escolhaUm: "Elige al menos uno",
    continuar: (n) => `Continuar con ${n} interés(es)`,
    opcoes: [
      { value: "Quadrinhos", label: "Cómics" },
      { value: "Games", label: "Videojuegos" },
      { value: "Terror", label: "Terror" },
      { value: "Filmes", label: "Películas" },
      { value: "Anime", label: "Anime" },
      { value: "Momento com a família", label: "Tiempo en familia" },
      { value: "Negócios", label: "Negocios" },
      { value: "Networking", label: "Networking" },
      { value: "Oportunidades de patrocínio", label: "Oportunidades de patrocinio" },
    ],
  },
};

// Tipos de ingresso traduzidos pras telas do convidado (admin usa TIPO_LABEL PT)
export const TIPO_LABEL_I18N: Record<Locale, Record<string, string>> = {
  pt: {
    spoiler_night: "Spoiler Night",
    quinta: "Quinta",
    sexta: "Sexta",
    sabado: "Sábado",
    domingo: "Domingo",
    todos_os_dias: "Todos os Dias VIP",
  },
  en: {
    spoiler_night: "Spoiler Night",
    quinta: "Thursday",
    sexta: "Friday",
    sabado: "Saturday",
    domingo: "Sunday",
    todos_os_dias: "All Days VIP",
  },
  es: {
    spoiler_night: "Spoiler Night",
    quinta: "Jueves",
    sexta: "Viernes",
    sabado: "Sábado",
    domingo: "Domingo",
    todos_os_dias: "Todos los Días VIP",
  },
};

export const DICIONARIOS: Record<Locale, Dicionario> = { pt: PT, en: EN, es: ES };

export async function getT(): Promise<{ L: Locale; t: Dicionario }> {
  const L = await getLocale();
  return { L, t: DICIONARIOS[L] };
}
