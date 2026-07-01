// Renderização única das variáveis de mensagem da régua ({{nome}}, {{host}},
// {{qtd}}, {{tipos}}, {{link}}) — usada pelo motor, pelos testes do Follow up
// e pelo preview do wa.me. Nova variável entra aqui e vale em todo lugar.
export type DadosTemplate = {
  nome: string;
  host?: string;
  qtd?: string | number;
  tipos?: string;
  link: string;
};

export function renderizarTemplate(texto: string, d: DadosTemplate) {
  return texto
    .replaceAll("{{nome}}", d.nome)
    .replaceAll("{{host}}", d.host ?? "CCXP INSIDER")
    .replaceAll("{{qtd}}", String(d.qtd ?? ""))
    .replaceAll("{{tipos}}", d.tipos ?? "")
    .replaceAll("{{link}}", d.link);
}
