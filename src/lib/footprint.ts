// Footprint — contrato de dados assumido (feature atrás de FOOTPRINT_ENABLED).
//
// Cada bipagem da credencial no evento é um evento atômico; a ficha do
// convidado é a agregação desses eventos por credentialId:
// - Dados básicos: nome, empresa, categoria do ingresso
// - Trajeto: chegada/saída, compras, palcos visitados

export type BipagemTipo = "entry" | "exit" | "stage" | "purchase";

export type BipagemEvento = {
  credentialId: string;
  type: BipagemTipo;
  location: string;
  timestamp: string; // ISO 8601
  payload?: Record<string, unknown>; // ex: valor da compra, nome do painel
};

export type FichaConvidado = {
  credentialId: string;
  nome: string;
  empresa: string | null;
  categoriaIngresso: string; // tipo do código (spoiler_night, quinta, ..., todos_os_dias)
  eventos: BipagemEvento[];
};
