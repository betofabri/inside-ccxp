export const TIPOS = ["spoiler_night", "quinta", "sexta", "sabado", "domingo", "todos_os_dias"] as const;

export const TIPO_LABEL: Record<string, string> = {
  spoiler_night: "Spoiler Night",
  quinta: "Quinta",
  sexta: "Sexta",
  sabado: "Sábado",
  domingo: "Domingo",
  todos_os_dias: "Todos os Dias VIP",
};

export const TIPO_DATA: Record<string, string> = {
  spoiler_night: "quarta, 02/dez",
  quinta: "quinta, 03/dez",
  sexta: "sexta, 04/dez",
  sabado: "sábado, 05/dez",
  domingo: "domingo, 06/dez",
  todos_os_dias: "acesso aos 4 dias",
};

export const STATUS_CONVITE_LABEL: Record<string, string> = {
  pendente: "Pendente",
  cadastrado: "Cadastrado",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

export const STATUS_CODIGO_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  reservado: "Reservado",
  entregue: "Entregue",
  resgatado: "Resgatado",
};

export const NIVEL_LABEL: Record<string, string> = {
  vp_socio: "VP / Sócio",
  diretoria: "Diretoria",
  geral: "Geral",
};

export const fmtData = (d: Date) =>
  d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const PAPEL_OPERACIONAL_LABEL: Record<string, string> = {
  host: "Host",
  producao: "Produção",
  portaria: "Portaria",
};

// Mini pesquisa de afinidade (P1): o que te atrai na CCXP e no universo geek?
export const INTERESSES_OPCOES = [
  "Quadrinhos",
  "Games",
  "Terror",
  "Filmes",
  "Anime",
  "Momento com a família",
  "Negócios",
  "Networking",
  "Oportunidades de patrocínio",
];
