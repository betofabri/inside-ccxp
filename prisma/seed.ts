// Seed F0 — 3 funcionários (1 admin, 1 com flag, 1 sem), lote corporativo,
// convidados em estados variados: pendente, cadastrado, expirado, cancelado,
// resgate declarado, resgatado, VIP e não-VIP. Carteira consolidada (Luís).
import { PrismaClient } from "./generated/client-node/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const db = new PrismaClient({ adapter });

const TIPOS = ["spoiler_night", "quinta", "sexta", "sabado", "domingo", "todos_os_dias"] as const;

const dias = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

async function main() {
  // limpa tudo (ordem respeita FKs)
  await db.comunicacaoLog.deleteMany();
  await db.conviteParcela.deleteMany();
  await db.codigo.deleteMany();
  await db.convite.deleteMany();
  await db.convidado.deleteMany();
  await db.funcionario.deleteMany();
  await db.agendaItem.deleteMany();
  await db.dominioBloqueado.deleteMany();
  await db.auditLog.deleteMany();
  await db.config.deleteMany();

  // ── Funcionários ───────────────────────────────────────────────
  const beto = await db.funcionario.create({
    data: {
      nome: "Beto Fabri",
      email: "beto.fabri@omelete.com",
      nivel: "vp_socio",
      podeCorporativo: true,
      isAdmin: true,
    },
  });
  const camila = await db.funcionario.create({
    data: {
      nome: "Camila Ramos",
      email: "camila.ramos@omelete.com",
      nivel: "diretoria",
      podeCorporativo: true,
    },
  });
  const diego = await db.funcionario.create({
    data: {
      nome: "Diego Lima",
      email: "diego.lima@omelete.com",
      nivel: "geral",
      podeCorporativo: false,
    },
  });

  // ── Códigos pessoais ───────────────────────────────────────────
  // OMLT-<dono><tipo><seq> — unicidade global garantida pelo padrão
  // Quantidades variadas por tipo (inclui zerado, pra mostrar o estado)
  const pessoalPorTipo: Record<number, Record<string, number>> = {
    // Beto começa zerado (só os 2 sábados já consumidos pelo convite do Luís) — demo do import da planilha
    [beto.id]:   { spoiler_night: 0, quinta: 0, sexta: 0, sabado: 2, domingo: 0, todos_os_dias: 0 },
    [camila.id]: { spoiler_night: 4,  quinta: 2, sexta: 3, sabado: 3, domingo: 3, todos_os_dias: 2 },
    [diego.id]:  { spoiler_night: 2,  quinta: 0, sexta: 2, sabado: 2, domingo: 2, todos_os_dias: 1 },
  };
  const prefixo: Record<number, string> = { [beto.id]: "BF", [camila.id]: "CR", [diego.id]: "DL" };
  for (const dono of [beto, camila, diego]) {
    for (const tipo of TIPOS) {
      for (let i = 1; i <= pessoalPorTipo[dono.id][tipo]; i++) {
        await db.codigo.create({
          data: {
            valor: `OMLT-${prefixo[dono.id]}-${tipo.slice(0, 3).toUpperCase()}${i}`,
            tipo,
            pool: "pessoal",
            donoId: dono.id,
          },
        });
      }
    }
  }

  // ── Lote corporativo ───────────────────────────────────────────
  for (const tipo of TIPOS) {
    for (let i = 1; i <= 12; i++) {
      await db.codigo.create({
        data: {
          valor: `CCXP-CORP-${tipo.slice(0, 3).toUpperCase()}${String(i).padStart(3, "0")}`,
          tipo,
          pool: "corporativo",
        },
      });
    }
  }

  const corpDisponiveis = async (tipo: string, n: number) =>
    db.codigo.findMany({ where: { pool: "corporativo", tipo, status: "disponivel" }, take: n });
  const pessoalDisponiveis = async (donoId: number, tipo: string, n: number) =>
    db.codigo.findMany({ where: { pool: "pessoal", donoId, tipo, status: "disponivel" }, take: n });

  // helper: cria convite + parcelas + vincula códigos
  async function convite(opts: {
    host: { id: number };
    convidadoId: number;
    canais: string;
    status: string;
    expiraEm: Date;
    vip?: boolean;
    criadoEm?: Date;
    token: string;
    parcelas: { pool: "pessoal" | "corporativo"; tipo: string; qtd: number; vip?: boolean }[];
    statusCodigos?: string; // reservado | entregue | resgatado
  }) {
    const c = await db.convite.create({
      data: {
        hostId: opts.host.id,
        convidadoId: opts.convidadoId,
        canais: opts.canais,
        status: opts.status,
        expiraEm: opts.expiraEm,
        vipOmelete: opts.vip ?? false,
        criadoEm: opts.criadoEm ?? new Date(),
        magicToken: opts.token,
      },
    });
    for (const p of opts.parcelas) {
      await db.conviteParcela.create({ data: { conviteId: c.id, pool: p.pool, tipo: p.tipo, qtd: p.qtd, vip: p.vip ?? false } });
      // convites expirados/cancelados devolveram os códigos — não vincula
      if (opts.status === "expirado" || opts.status === "cancelado") continue;
      const codigos =
        p.pool === "corporativo"
          ? await corpDisponiveis(p.tipo, p.qtd)
          : await pessoalDisponiveis(opts.host.id, p.tipo, p.qtd);
      for (const cod of codigos) {
        await db.codigo.update({
          where: { id: cod.id },
          data: {
            status: opts.statusCodigos ?? "reservado",
            conviteId: c.id,
            resgateConfirmadoEm: opts.statusCodigos === "resgatado" ? dias(-2) : null,
          },
        });
      }
    }
    return c;
  }

  // ── Convidados em estados variados ─────────────────────────────

  // 1. PENDENTE — convidada ontem, ainda não cadastrou
  const ana = await db.convidado.create({
    data: { nome: "Ana Beltrão", email: "ana.beltrao@warnerbros.com", empresa: "Warner Bros." },
  });
  await convite({
    host: beto, convidadoId: ana.id, canais: "email", status: "pendente",
    expiraEm: dias(6), vip: true, criadoEm: dias(-1), token: "tok-ana",
    parcelas: [{ pool: "corporativo", tipo: "todos_os_dias", qtd: 2, vip: true }],
  });

  // 1b. PENDENTE pessoal — só WhatsApp, cadastro simplificado
  const henrique = await db.convidado.create({
    data: { nome: "Henrique Sato", telefone: "+5511955554444" },
  });
  await convite({
    host: diego, convidadoId: henrique.id, canais: "whatsapp", status: "pendente",
    expiraEm: dias(5), criadoEm: dias(-2), token: "tok-henrique",
    parcelas: [{ pool: "pessoal", tipo: "domingo", qtd: 1 }],
  });

  // 2. CADASTRADO + ENTREGUE — viu os códigos, ainda não resgatou
  const bruno = await db.convidado.create({
    data: { nome: "Bruno Okamoto", email: "bruno.okamoto@netflix.com", empresa: "Netflix", cargo: "Diretor de Conteúdo", nascimento: new Date("1988-03-14"), instagram: "@brunookamoto", linkedin: "linkedin.com/in/brunookamoto", consentimentoEm: dias(-3) },
  });
  await convite({
    host: camila, convidadoId: bruno.id, canais: "email,whatsapp", status: "cadastrado",
    expiraEm: dias(3), criadoEm: dias(-4), token: "tok-bruno",
    parcelas: [{ pool: "corporativo", tipo: "sabado", qtd: 2 }],
    statusCodigos: "entregue",
  });

  // 3. EXPIRADO — não cadastrou em 7 dias, códigos voltaram ao pool
  const carla = await db.convidado.create({
    data: { nome: "Carla Mendes", email: "carla.mendes@globo.com", empresa: "Globo" },
  });
  await convite({
    host: camila, convidadoId: carla.id, canais: "email", status: "expirado",
    expiraEm: dias(-2), criadoEm: dias(-9), token: "tok-carla",
    parcelas: [{ pool: "corporativo", tipo: "domingo", qtd: 1 }],
  });

  // 4. CANCELADO — host cancelou, códigos devolvidos
  const davi = await db.convidado.create({
    data: { nome: "Davi Fontes", telefone: "+5511987654321" },
  });
  await convite({
    host: diego, convidadoId: davi.id, canais: "whatsapp", status: "cancelado",
    expiraEm: dias(2), criadoEm: dias(-5), token: "tok-davi",
    parcelas: [{ pool: "pessoal", tipo: "sexta", qtd: 1 }],
  });

  // 5. RESGATE DECLARADO — apertou "já resgatei", CSV ainda não confirmou
  const elisa = await db.convidado.create({
    data: {
      nome: "Elisa Prado", email: "elisa.prado@paramount.com",
      empresa: "Paramount", cargo: "Head de Distribuição", nascimento: new Date("1985-11-02"),
      instagram: "@elisaprado", linkedin: "linkedin.com/in/elisaprado",
      consentimentoEm: dias(-6), resgateDeclarado: true,
    },
  });
  await convite({
    host: beto, convidadoId: elisa.id, canais: "email", status: "cadastrado",
    expiraEm: dias(1), vip: true, criadoEm: dias(-6), token: "tok-elisa",
    parcelas: [{ pool: "corporativo", tipo: "quinta", qtd: 1, vip: true }],
    statusCodigos: "entregue",
  });

  // 6. RESGATADO — confirmado via import CSV (não-VIP)
  const fabio = await db.convidado.create({
    data: {
      nome: "Fábio Quintela", email: "fabio.q@ubisoft.com",
      empresa: "Ubisoft", cargo: "Brand Manager", nascimento: new Date("1990-07-21"),
      consentimentoEm: dias(-10), resgateDeclarado: true,
    },
  });
  await convite({
    host: camila, convidadoId: fabio.id, canais: "email", status: "cadastrado",
    expiraEm: dias(-3), criadoEm: dias(-10), token: "tok-fabio",
    parcelas: [{ pool: "corporativo", tipo: "todos_os_dias", qtd: 1 }],
    statusCodigos: "resgatado",
  });

  // 7. CARTEIRA CONSOLIDADA — Luís: convite do Beto (pessoal) + da Camila (corporativo)
  const luis = await db.convidado.create({
    data: { nome: "Luís Hernandez", email: "luis.hernandez@hbo.com", empresa: "HBO", cargo: "VP de Programação", nascimento: new Date("1979-05-30"), instagram: "@luishdz", linkedin: "linkedin.com/in/luishernandez", consentimentoEm: dias(-2) },
  });
  await convite({
    host: beto, convidadoId: luis.id, canais: "email", status: "cadastrado",
    expiraEm: dias(4), criadoEm: dias(-3), token: "tok-luis-beto",
    parcelas: [{ pool: "pessoal", tipo: "sabado", qtd: 2 }],
    statusCodigos: "entregue",
  });
  await convite({
    host: camila, convidadoId: luis.id, canais: "email", status: "cadastrado",
    expiraEm: dias(4), vip: true, criadoEm: dias(-2), token: "tok-luis-camila",
    parcelas: [{ pool: "corporativo", tipo: "sexta", qtd: 1 }],
    statusCodigos: "entregue",
  });

  // 8. Convite só pessoal via WhatsApp (Diego, sem flag corporativa)
  const gabi = await db.convidado.create({
    data: { nome: "Gabi Torres", telefone: "+5511912345678", nascimento: new Date("1995-09-12"), consentimentoEm: dias(-1) },
  });
  await convite({
    host: diego, convidadoId: gabi.id, canais: "whatsapp", status: "cadastrado",
    expiraEm: dias(5), criadoEm: dias(-2), token: "tok-gabi",
    parcelas: [{ pool: "pessoal", tipo: "domingo", qtd: 1 }],
    statusCodigos: "entregue",
  });

  // ── Comunicações ───────────────────────────────────────────────
  const log = (convidadoId: number, categoria: string, passo: string, canal: string, d: Date) =>
    db.comunicacaoLog.create({ data: { convidadoId, categoria, passo, canal, status: "enviado", data: d } });
  await log(ana.id, "transacional", "convite", "email", dias(-1));
  await log(bruno.id, "transacional", "convite", "email", dias(-4));
  await log(bruno.id, "transacional", "instrucao_resgate", "email", dias(-3));
  await log(carla.id, "transacional", "convite", "email", dias(-9));
  await log(carla.id, "transacional", "lembrete_cadastro", "email", dias(-6));
  await log(carla.id, "transacional", "aviso_expiracao", "email", dias(-3));
  await log(elisa.id, "regua", "d-7_falta_uma_semana", "email", dias(-1));
  await log(luis.id, "transacional", "convite", "email", dias(-3));

  // ── Régua de comunicação padrão (§7 do plano) ──────────────────
  await db.reguaPasso.createMany({
    data: [
      // transacionais — todos os convidados, sem opt-out, relativos ao convite
      { categoria: "transacional", ordem: 1, rotulo: "Convite", timing: "imediato", canal: "email,whatsapp",
        assunto: "Você foi convidado pra CCXP26",
        corpo: "Olá, {{nome}}! {{host}} convidou você pra CCXP26 (03 a 06/dez, São Paulo Expo) com {{qtd}} ingresso(s): {{tipos}}. Complete seu cadastro pra receber os códigos: {{link}}" },
      { categoria: "transacional", ordem: 2, rotulo: "Lembrete de cadastro", timing: "D+3", canal: "email,whatsapp", condicao: "pular_se_cadastrado",
        assunto: "Seus ingressos da CCXP26 esperam por você",
        corpo: "{{nome}}, seus {{qtd}} ingresso(s) seguem reservados, mas o cadastro ainda não foi concluído. Leva 1 minuto: {{link}}" },
      { categoria: "transacional", ordem: 3, rotulo: "Aviso de expiração", timing: "D+6", canal: "email,whatsapp", condicao: "pular_se_cadastrado",
        assunto: "Último dia: seu convite expira amanhã",
        corpo: "{{nome}}, seu convite pra CCXP26 expira amanhã e os ingressos voltam ao pool. Garanta os seus: {{link}}" },
      { categoria: "transacional", ordem: 4, rotulo: "Instrução de resgate", timing: "após cadastro", canal: "email",
        assunto: "Como resgatar seus ingressos na Mundo Ticket",
        corpo: "{{nome}}, seus códigos estão na sua carteira. Resgate na Mundo Ticket com o passo a passo: {{link}}. Qualquer dúvida, fale com {{host}}." },
      // régua de relacionamento — só corporativo, com opt-out, ancorada no evento
      { categoria: "regua", ordem: 1, rotulo: "Falta uma semana", timing: "D-7", dataRef: "2026-11-26", canal: "email",
        assunto: "Falta uma semana pra CCXP26",
        corpo: "{{nome}}, em 7 dias a CCXP26 abre os portões no São Paulo Expo. Como chegar, por onde entrar e o que levar: tudo neste guia. Seus ingressos: {{tipos}}." },
      { categoria: "regua", ordem: 2, rotulo: "Lembrete de resgate", timing: "D-3", dataRef: "2026-11-30", canal: "email,whatsapp", condicao: "pular_se_resgatado",
        assunto: "Já resgatou seus ingressos?",
        corpo: "{{nome}}, faltam 3 dias e seus códigos ainda não foram resgatados na Mundo Ticket. Resolve agora em 2 minutos: {{link}}. Mapa do evento em anexo." },
      { categoria: "regua", ordem: 3, rotulo: "Véspera: agenda do dia", timing: "D-1", dataRef: "2026-12-02", canal: "email",
        assunto: "Amanhã tem CCXP26: sua agenda",
        corpo: "{{nome}}, amanhã começa! Agenda do dia, dicas práticas e o lounge VIP Omelete te esperando. Credenciamento VIP abre 1h antes dos portões." },
      { categoria: "regua", ordem: 4, rotulo: "É hoje", timing: "Dia 1", dataRef: "2026-12-03", canal: "whatsapp",
        assunto: "É hoje! CCXP26 abre às 12h",
        corpo: "{{nome}}, chegou o dia. Destaques de hoje no Palco Thunder, entrada VIP pela entrada Sul. Bom evento!" },
      // pós-evento — fechamento do relacionamento
      { categoria: "pos_evento", ordem: 1, rotulo: "Agradecimento + fotos", timing: "D+1", dataRef: "2026-12-07", canal: "email",
        assunto: "Obrigado por viver a CCXP26 com a gente",
        corpo: "{{nome}}, foi incrível ter você na CCXP26. As fotos do lounge VIP Omelete já estão disponíveis na sua conta: {{link}}" },
      { categoria: "pos_evento", ordem: 2, rotulo: "Pesquisa de satisfação", timing: "D+3", dataRef: "2026-12-09", canal: "email",
        assunto: "2 minutos: como foi sua CCXP26?",
        corpo: "{{nome}}, sua opinião define a próxima edição. Responda a pesquisa rápida (NPS + 3 perguntas): {{link}}" },
      { categoria: "pos_evento", ordem: 3, rotulo: "Números + after movie", timing: "D+7", dataRef: "2026-12-13", canal: "email",
        assunto: "CCXP26 em números (e o after movie)",
        corpo: "{{nome}}, a CCXP26 em números: público, palcos e os melhores momentos no after movie. Assista e compartilhe: {{link}}" },
    ],
  });

  // ── Agenda geral (única) ───────────────────────────────────────
  await db.agendaItem.createMany({
    data: [
      { dia: "2026-12-03", horario: "11:00", titulo: "Abertura dos portões", descricao: "Credenciamento VIP na entrada Sul do São Paulo Expo." },
      { dia: "2026-12-03", horario: "14:00", titulo: "Painel de abertura · Palco Thunder", descricao: "Apresentação oficial da CCXP26." },
      { dia: "2026-12-05", horario: "16:00", titulo: "Painel principal · Palco Thunder", descricao: "Convidado internacional surpresa." },
      { dia: "2026-12-06", horario: "18:00", titulo: "Encerramento", descricao: "Último dia: recap e agradecimentos." },
    ],
  });

  // ── Domínios bloqueados (parcela corporativa) ──────────────────
  await db.dominioBloqueado.createMany({
    data: ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com", "msn.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "yandex.com"].map((dominio) => ({ dominio })),
  });

  // ── Config ─────────────────────────────────────────────────────
  await db.config.createMany({
    data: [
      { chave: "expiracao_dias", valor: "7" },
      { chave: "evento_inicio", valor: "2026-12-03" },
      { chave: "evento_fim", valor: "2026-12-06" },
      { chave: "evento_local", valor: "São Paulo Expo" },
      { chave: "link_mundo_ticket", valor: "https://mundo-ticket.com/en-US/login" },
    ],
  });

  // ── Audit log ──────────────────────────────────────────────────
  await db.auditLog.createMany({
    data: [
      { atorId: beto.id, acao: "import_planilha_mestre", alvo: "planilha", detalhe: "55 códigos pessoais importados (Modo A)", data: dias(-12) },
      { atorId: beto.id, acao: "import_lote_corporativo", alvo: "planilha", detalhe: "72 códigos corporativos importados", data: dias(-12) },
      { atorId: diego.id, acao: "cancelar_convite", alvo: "convite:Davi Fontes", detalhe: "1 código devolvido ao pool pessoal", data: dias(-4) },
      { atorId: beto.id, acao: "editar_flag_vip", alvo: "convidado:Elisa Prado", detalhe: "vip_omelete: false → true", data: dias(-5) },
    ],
  });

  console.log("Seed concluído ✓");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
