export const TIPOS = ["quinta", "sexta", "sabado", "domingo", "todos_os_dias"] as const;

export const TIPO_LABEL: Record<string, string> = {
  quinta: "QUI 03",
  sexta: "SEX 04",
  sabado: "SÁB 05",
  domingo: "DOM 06",
  todos_os_dias: "FULL PASS",
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
