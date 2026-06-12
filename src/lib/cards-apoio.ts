// Cards de apoio (Assets): fonte única pros componentes e pro gerador de PNGs
// (scripts/gerar-cards.mjs). Ao editar, rode `node scripts/gerar-cards.mjs`.

export type Card = {
  id: string;
  icone: string;
  titulo: string;
  linhas: string[];
  rodape?: string;
};

export const CARDS: Card[] = [
  {
    id: "mapa",
    icone: "🗺️",
    titulo: "Mapa do evento",
    linhas: [
      "São Paulo Expo · Rod. dos Imigrantes, km 1,5",
      "Credenciamento VIP: entrada Sul",
      "Lounge Omelete: pavilhão 3, mezanino",
      "Palco Thunder: pavilhão 2",
      "Artists' Valley: pavilhão 1",
    ],
    rodape: "Baixe o mapa completo no app da CCXP",
  },
  {
    id: "horarios",
    icone: "🕐",
    titulo: "Horários",
    linhas: [
      "Spoiler Night (qua 02/dez): 18h às 23h",
      "Qui e sex (03 e 04/dez): 12h às 21h",
      "Sáb e dom (05 e 06/dez): 11h às 21h",
      "Credenciamento VIP abre 1h antes",
    ],
    rodape: "Chegue cedo nos dias de painel principal",
  },
  {
    id: "entrada",
    icone: "🎟️",
    titulo: "Por onde entrar",
    linhas: [
      "Acesso VIP: entrada Sul (estacionamento E2)",
      "Apresente o QR do ingresso + documento com foto",
      "A pulseira VIP é colocada no credenciamento",
      "Reentrada liberada no mesmo dia",
    ],
    rodape: "Não compartilhe o QR do seu ingresso",
  },
  {
    id: "chegar",
    icone: "🚗",
    titulo: "Como chegar",
    linhas: [
      "Metrô: Linha 1-Azul, estação Jabaquara + shuttle gratuito",
      "Carro: estacionamento oficial no local (E1/E2)",
      "App de corrida: desembarque na entrada Sul",
      "Shuttle VIP: consulte seu host",
    ],
    rodape: "Evite chegar entre 11h e 13h no sábado",
  },
  {
    id: "levar",
    icone: "🎒",
    titulo: "O que levar",
    linhas: [
      "Documento com foto (obrigatório)",
      "Ingresso no celular (salve offline)",
      "Carregador portátil",
      "Garrafa de água (até 500ml lacrada)",
      "Casaco leve: os pavilhões são gelados",
    ],
    rodape: "Mochilas passam por revista na entrada",
  },
  {
    id: "lounge",
    icone: "⭐",
    titulo: "Lounge VIP Omelete",
    linhas: [
      "Acesso exclusivo com a pulseira VIP",
      "Open bar e snacks o dia todo",
      "Meet & greets surpresa",
      "Concierge pra agenda de painéis",
    ],
    rodape: "Seu host é seu contato pra qualquer coisa",
  },
];

export const textoWhatsApp = (c: Card) =>
  `${c.icone} *CCXP26 · ${c.titulo}*\n\n${c.linhas.map((l) => `• ${l}`).join("\n")}\n\n${c.rodape ?? ""}\n\n_03 a 06/dez · São Paulo Expo_`;
