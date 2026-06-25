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
};

export const DICIONARIOS: Record<Locale, Dicionario> = { pt: PT, en: EN, es: ES };

export async function getT(): Promise<{ L: Locale; t: Dicionario }> {
  const L = await getLocale();
  return { L, t: DICIONARIOS[L] };
}
