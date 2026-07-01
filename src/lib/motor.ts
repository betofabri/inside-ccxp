"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { enviarEmail, templateEmail, linkar } from "@/lib/email";

// F4 — Motor de disparo da régua. Processa as etapas ativas ancoradas no
// calendário (dataRef vencida), resolve a audiência por categoria, aplica
// condições e opt-out, deduplica pelo log de comunicação e envia de verdade
// quando há RESEND_API_KEY (mock declarado sem ela).
//
// Gatilho: manual pelo admin ("Processar régua agora"). O agendamento por
// cron do Workers entra na fase de produção (F6) — a lógica é a mesma.

const URL_HUB = "https://betofabri.com/insider-ccxp";

type Resultado = { passo: string; enviados: number; pulados: number; modo: string };

export async function processarRegua() {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");

  const hoje = new Date().toISOString().slice(0, 10);
  const passos = await db.reguaPasso.findMany({
    where: { ativo: true, dataRef: { not: null } },
    orderBy: { ordem: "asc" },
  });

  const resultados: Resultado[] = [];
  let relativosPulados = 0;

  for (const passo of passos) {
    if (!passo.dataRef || passo.dataRef > hoje) continue; // ainda não venceu

    // audiência por categoria
    const convidados =
      passo.categoria === "pre_convite"
        ? await db.convidado.findMany({
            where: { convites: { none: {} }, email: { not: null } },
            include: { convites: { include: { codigos: true, host: true } } },
          })
        : await db.convidado.findMany({
            // regua: o MESMO convite precisa ser ativo E corporativo (chaves
            // duplicadas num objeto se sobrescrevem — por isso o some único)
            where: {
              convites: {
                some: {
                  status: { in: ["pendente", "cadastrado"] },
                  ...(passo.categoria === "regua"
                    ? { parcelas: { some: { pool: "corporativo" } } }
                    : {}),
                },
              },
            },
            include: {
              convites: {
                where: { status: { in: ["pendente", "cadastrado"] } },
                include: { codigos: true, host: true },
              },
            },
          });

    let enviados = 0;
    let pulados = 0;

    for (const c of convidados) {
      // opt-out vale pra régua de relacionamento (LGPD); transacional sempre vai
      if (passo.categoria === "regua" && c.optoutRegua) {
        pulados++;
        continue;
      }
      // condições da etapa
      if (passo.condicao === "pular_se_cadastrado" && c.consentimentoEm) {
        pulados++;
        continue;
      }
      const resgatou =
        c.resgateDeclarado || c.convites.some((cv) => cv.codigos.some((cod) => cod.status === "resgatado"));
      if (passo.condicao === "pular_se_resgatado" && resgatou) {
        pulados++;
        continue;
      }
      // dedupe: este passo já foi entregue pra esta pessoa? (mock conta como entregue)
      const jaFoi = await db.comunicacaoLog.findFirst({
        where: {
          convidadoId: c.id,
          passo: passo.rotulo,
          status: { in: ["enviado", "enviado_mock", "respondida"] },
        },
      });
      if (jaFoi) {
        pulados++;
        continue;
      }

      const convite = c.convites[0];
      const link = convite ? `${URL_HUB}/convite/${convite.magicToken}` : URL_HUB;
      const corpo = passo.corpo
        .replaceAll("{{nome}}", c.nome.split(" ")[0])
        .replaceAll("{{host}}", convite?.host.nome ?? "CCXP INSIDER")
        .replaceAll("{{qtd}}", String(convite?.codigos.length ?? ""))
        .replaceAll("{{tipos}}", "")
        .replaceAll("{{link}}", link);

      let statusEnvio = "enviado";
      if (passo.canal.includes("email") && c.email) {
        const envio = await enviarEmail({
          para: c.email,
          assunto: passo.assunto,
          html: templateEmail(passo.assunto, `<p>${linkar(corpo)}</p>`, {
            cta: convite ? { texto: "Abrir meu convite", url: link } : undefined,
            notaRodape: `Etapa "${passo.rotulo}" da régua CCXP INSIDER.`,
          }),
        });
        statusEnvio = envio.mock ? "enviado_mock" : envio.ok ? "enviado" : "falha";
      } else {
        statusEnvio = "enviado_mock"; // canal whatsapp em massa entra com templates aprovados da Meta
      }

      await db.comunicacaoLog.create({
        data: {
          convidadoId: c.id,
          categoria: passo.categoria,
          passo: passo.rotulo,
          canal: passo.canal,
          status: statusEnvio,
        },
      });
      enviados++;
    }

    resultados.push({
      passo: passo.rotulo,
      enviados,
      pulados,
      modo: passo.canal.includes("email") ? "email" : "mock",
    });
  }

  const relativos = await db.reguaPasso.count({ where: { ativo: true, dataRef: null } });
  relativosPulados = relativos;

  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "processar_regua",
      alvo: "motor_f4",
      detalhe:
        resultados.length === 0
          ? "nenhuma etapa vencida pra processar"
          : resultados.map((r) => `${r.passo}: ${r.enviados} enviado(s), ${r.pulados} pulado(s)`).join(" · "),
    },
  });

  const resumo = resultados.map((r) => `${r.passo}|${r.enviados}|${r.pulados}`).join(";");
  redirect(
    `/admin/regua?motor=${encodeURIComponent(resumo || "vazio")}&relativos=${relativosPulados}`,
  );
}
