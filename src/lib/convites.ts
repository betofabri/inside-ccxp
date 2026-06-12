"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";
import { TIPO_LABEL } from "@/lib/labels";

// ── tipos ──────────────────────────────────────────────────────

export type ParcelaInput = { tipo: string; qtd: number; vip: boolean };

export type CriarConviteInput = {
  fluxo: "pessoal" | "corporativo";
  convidadoId?: number; // re-convite: consolida na carteira existente
  nome: string;
  sobrenome: string;
  empresa?: string;
  email?: string;
  ddi?: string;
  telefone?: string;
  parcelas: ParcelaInput[];
};

export type CriarConviteResultado = {
  ok: boolean;
  erro?: string;
  aviso?: string;
  token?: string;
  preview?: string;
  entregaDireta?: boolean; // convidado já cadastrado: códigos caem direto na carteira
};

// ── helpers ────────────────────────────────────────────────────

async function diasDeExpiracao() {
  const cfg = await db.config.findUnique({ where: { chave: "expiracao_dias" } });
  return Number(cfg?.valor ?? 7);
}

const normalizaEmail = (e?: string) => {
  const v = (e ?? "").trim().toLowerCase();
  return v.length > 3 && v.includes("@") ? v : null;
};

const normalizaTelefone = (ddi?: string, tel?: string) => {
  const digitos = (tel ?? "").replace(/\D/g, "");
  return digitos.length >= 8 ? `${ddi ?? "+55"}${digitos}` : null;
};

/** Expira convites pendentes vencidos e devolve os códigos ao pool (lazy). */
export async function expirarVencidos() {
  const vencidos = await db.convite.findMany({
    where: { status: "pendente", expiraEm: { lt: new Date() } },
    select: { id: true },
  });
  if (vencidos.length === 0) return;
  const ids = vencidos.map((v) => v.id);
  await db.$transaction([
    db.codigo.updateMany({
      where: { conviteId: { in: ids } },
      data: { status: "disponivel", conviteId: null },
    }),
    db.convite.updateMany({ where: { id: { in: ids } }, data: { status: "expirado" } }),
  ]);
}

// ── F2: criar convite ──────────────────────────────────────────

export async function criarConvite(input: CriarConviteInput): Promise<CriarConviteResultado> {
  const persona = await getPersona();
  if (!persona || (persona.role !== "funcionario" && persona.role !== "admin"))
    return { ok: false, erro: "Sessão inválida; troque de papel e tente de novo." };

  const host = await db.funcionario.findUnique({ where: { id: persona.id } });
  if (!host) return { ok: false, erro: "Host não encontrado." };

  const fluxo = input.fluxo;
  if (fluxo === "corporativo" && !host.podeCorporativo)
    return { ok: false, erro: "Você não tem a flag corporativa." };

  // re-convite: parte dos dados já conhecidos do convidado
  const existente = input.convidadoId
    ? await db.convidado.findUnique({ where: { id: input.convidadoId } })
    : null;
  if (input.convidadoId && !existente) return { ok: false, erro: "Convidado não encontrado." };

  const nomeCompleto =
    `${input.nome.trim()} ${input.sobrenome.trim()}`.trim() || existente?.nome || "";
  if (nomeCompleto.length < 4) return { ok: false, erro: "Preencha nome e sobrenome." };

  const email = normalizaEmail(input.email) ?? (existente ? normalizaEmail(existente.email ?? undefined) : null);
  const telefone = normalizaTelefone(input.ddi, input.telefone) ?? existente?.telefone ?? null;
  const empresa = (input.empresa ?? "").trim() || existente?.empresa || null;

  if (fluxo === "corporativo") {
    if (!empresa) return { ok: false, erro: "O convite corporativo exige o nome da empresa." };
    if (!email) return { ok: false, erro: "O convite corporativo exige email." };
    const dominio = email.split("@")[1];
    const bloqueado = await db.dominioBloqueado.findUnique({ where: { dominio } });
    if (bloqueado)
      return { ok: false, erro: `${dominio} é um domínio genérico; use o email da empresa.` };
  } else if (!email && !telefone) {
    return { ok: false, erro: "Informe email ou WhatsApp." };
  }

  const parcelas = input.parcelas.filter((p) => p.qtd > 0);
  if (parcelas.length === 0) return { ok: false, erro: "Selecione pelo menos um ingresso." };
  const pool = fluxo === "corporativo" ? "corporativo" : "pessoal";

  // dedupe — só corporativo, nunca bloqueia (plano §4)
  let aviso: string | undefined;
  if (fluxo === "corporativo" && email) {
    const anterior = await db.convite.findFirst({
      where: {
        convidado: { email },
        status: { in: ["pendente", "cadastrado"] },
        parcelas: { some: { pool: "corporativo" } },
      },
      include: { host: true, parcelas: true },
    });
    if (anterior) {
      const qtdAnterior = anterior.parcelas.reduce((acc, p) => acc + p.qtd, 0);
      aviso = `${nomeCompleto.split(" ")[0]} já foi convidado por ${anterior.host.nome} (${qtdAnterior} ingresso(s)). Os códigos consolidam na mesma carteira.`;
    }
  }

  const token = randomUUID().slice(0, 13);
  const expiraEm = new Date(Date.now() + (await diasDeExpiracao()) * 24 * 60 * 60 * 1000);
  const canais = [email && "email", telefone && "whatsapp"].filter(Boolean).join(",");
  let entregaDireta = false;

  // D1 não suporta transação interativa do Prisma; a reserva usa operações
  // sequenciais com guarda contra corrida (updateMany condicionado a
  // status='disponivel' + conferência do count) e compensação em caso de erro.
  let conviteId: number | null = null;
  try {
    // carteira única: por id (re-convite), senão por email, senão telefone, senão cria
    let convidado =
      existente ||
      (email && (await db.convidado.findUnique({ where: { email } }))) ||
      (telefone && (await db.convidado.findFirst({ where: { telefone } }))) ||
      null;
    if (!convidado) {
      convidado = await db.convidado.create({
        data: { nome: nomeCompleto, email, telefone, empresa },
      });
    } else {
      await db.convidado.update({
        where: { id: convidado.id },
        data: {
          nome: nomeCompleto || convidado.nome,
          email: convidado.email ?? email,
          telefone: telefone ?? convidado.telefone,
          empresa: empresa ?? convidado.empresa,
        },
      });
    }

    // já cadastrado (LGPD ok)? entrega direto na carteira, sem novo cadastro
    entregaDireta = convidado.consentimentoEm != null;

    const convite = await db.convite.create({
      data: {
        hostId: host.id,
        convidadoId: convidado.id,
        canais,
        status: entregaDireta ? "cadastrado" : "pendente",
        expiraEm,
        vipOmelete: parcelas.some((p) => p.vip || p.tipo === "todos_os_dias"),
        magicToken: token,
      },
    });
    conviteId = convite.id;

    for (const p of parcelas) {
      const livres = await db.codigo.findMany({
        where: {
          pool,
          tipo: p.tipo,
          status: "disponivel",
          ...(pool === "pessoal" ? { donoId: host.id } : {}),
        },
        take: p.qtd,
        select: { id: true },
      });
      if (livres.length < p.qtd)
        throw new Error(
          `Saldo insuficiente em ${TIPO_LABEL[p.tipo]}: pediu ${p.qtd}, restam ${livres.length}.`,
        );
      const reservados = await db.codigo.updateMany({
        where: { id: { in: livres.map((c) => c.id) }, status: "disponivel" },
        data: { status: entregaDireta ? "entregue" : "reservado", conviteId: convite.id },
      });
      if (reservados.count < p.qtd)
        throw new Error(`Outro convite reservou ${TIPO_LABEL[p.tipo]} primeiro; tente de novo.`);
      await db.conviteParcela.create({
        data: { conviteId: convite.id, pool, tipo: p.tipo, qtd: p.qtd, vip: p.vip || p.tipo === "todos_os_dias" },
      });
    }

    await db.comunicacaoLog.create({
      data: {
        convidadoId: convidado.id,
        categoria: "transacional",
        passo: entregaDireta ? "novos_ingressos" : "convite",
        canal: canais || "email",
        status: "enviado",
      },
    });
  } catch (e) {
    // compensação: devolve códigos e remove o convite incompleto
    if (conviteId) {
      await db.codigo
        .updateMany({ where: { conviteId }, data: { status: "disponivel", conviteId: null } })
        .catch(() => {});
      await db.conviteParcela.deleteMany({ where: { conviteId } }).catch(() => {});
      await db.convite.delete({ where: { id: conviteId } }).catch(() => {});
    }
    return { ok: false, erro: e instanceof Error ? e.message : "Erro ao reservar os códigos." };
  }

  const totalIngressos = parcelas.reduce((acc, p) => acc + p.qtd, 0);
  const primeiroNome = nomeCompleto.split(" ")[0];
  const preview = entregaDireta
    ? `Olá, ${primeiroNome}! ${host.nome} adicionou ${totalIngressos} ingresso(s) na sua carteira ` +
      `da CCXP26 (03 a 06/dez, São Paulo Expo). Eles já estão disponíveis: {{link}}`
    : `Olá, ${primeiroNome}! ${host.nome} convidou você pra CCXP26 ` +
      `(03 a 06/dez, São Paulo Expo) com ${totalIngressos} ingresso(s). ` +
      `Complete seu cadastro pra receber os códigos: {{link}}`;

  revalidatePath("/funcionario");
  return { ok: true, token, aviso, preview, entregaDireta };
}

// ── F2: gestão do host ─────────────────────────────────────────

// Item 15 do backlog: typo no email trava o convidado no gate de OTP.
// Host (ou admin) corrige o contato do convite pendente; o código OTP em
// trânsito é invalidado pra forçar reenvio pro endereço novo.
export async function corrigirContatoConvite(formData: FormData) {
  const persona = await getPersona();
  if (!persona || persona.role === "convidado") redirect("/");
  const id = Number(formData.get("conviteId"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const convite = await db.convite.findUnique({ where: { id }, include: { convidado: true } });
  if (!convite || (convite.hostId !== persona.id && persona.role !== "admin")) redirect("/funcionario");
  if (convite.status !== "pendente") redirect("/funcionario?contato=nao_pendente");
  if (!email && !telefone) redirect("/funcionario?contato=vazio");

  if (email && email !== convite.convidado.email) {
    const emUso = await db.convidado.findUnique({ where: { email } });
    if (emUso && emUso.id !== convite.convidadoId) redirect("/funcionario?contato=email_em_uso");
  }

  await db.convidado.update({
    where: { id: convite.convidadoId },
    data: {
      ...(email ? { email } : {}),
      ...(telefone ? { telefone } : {}),
    },
  });
  // invalida OTP pendente/verificado do token (chega no email antigo)
  try {
    const { env } = (await import("@opennextjs/cloudflare")).getCloudflareContext() as unknown as {
      env: { OTP: { delete(k: string): Promise<void> } };
    };
    await env.OTP.delete(`otp:${convite.magicToken}`);
    await env.OTP.delete(`otpok:${convite.magicToken}`);
  } catch {}

  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "corrigir_contato",
      alvo: `convite:${id}`,
      detalhe: `contato de ${convite.convidado.nome} atualizado${email ? ` · email ${email}` : ""}${telefone ? ` · whats ${telefone}` : ""}; OTP invalidado`,
    },
  });
  revalidatePath("/funcionario");
  redirect("/funcionario?contato=ok");
}

export async function cancelarConvite(formData: FormData) {
  const persona = await getPersona();
  if (!persona || persona.role === "convidado") redirect("/");
  const id = Number(formData.get("conviteId"));
  const convite = await db.convite.findUnique({ where: { id } });
  if (!convite || (convite.hostId !== persona.id && persona.role !== "admin")) redirect("/funcionario");

  await db.$transaction([
    db.codigo.updateMany({
      where: { conviteId: id },
      data: { status: "disponivel", conviteId: null },
    }),
    db.convite.update({ where: { id }, data: { status: "cancelado" } }),
  ]);
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "cancelar_convite",
      alvo: `convite:${id}`,
      detalhe: "Códigos devolvidos ao pool",
    },
  });
  revalidatePath("/funcionario");
}

export async function reenviarConvite(formData: FormData) {
  const persona = await getPersona();
  if (!persona || persona.role === "convidado") redirect("/");
  const id = Number(formData.get("conviteId"));
  const convite = await db.convite.findUnique({
    where: { id },
    include: { parcelas: true },
  });
  if (!convite || (convite.hostId !== persona.id && persona.role !== "admin")) redirect("/funcionario");

  const expiraEm = new Date(Date.now() + (await diasDeExpiracao()) * 24 * 60 * 60 * 1000);
  const token = randomUUID().slice(0, 13);

  try {
    if (convite.status === "expirado") {
      // nova reserva (os códigos voltaram ao pool quando expirou)
      for (const p of convite.parcelas) {
        const livres = await db.codigo.findMany({
          where: {
            pool: p.pool,
            tipo: p.tipo,
            status: "disponivel",
            ...(p.pool === "pessoal" ? { donoId: convite.hostId } : {}),
          },
          take: p.qtd,
          select: { id: true },
        });
        if (livres.length < p.qtd)
          throw new Error(`Sem saldo pra reenviar: ${TIPO_LABEL[p.tipo]} esgotado.`);
        const reservados = await db.codigo.updateMany({
          where: { id: { in: livres.map((c) => c.id) }, status: "disponivel" },
          data: { status: "reservado", conviteId: convite.id },
        });
        if (reservados.count < p.qtd)
          throw new Error(`Corrida na reserva de ${TIPO_LABEL[p.tipo]}; tente de novo.`);
      }
    }
    await db.convite.update({
      where: { id },
      data: { status: "pendente", expiraEm, magicToken: token },
    });
  } catch {
    // compensação: solta o que tiver sido re-reservado e mantém expirado
    await db.codigo
      .updateMany({
        where: { conviteId: convite.id, status: "reservado" },
        data: { status: "disponivel", conviteId: null },
      })
      .catch(() => {});
  }
  revalidatePath("/funcionario");
}

// ── F3: cadastro do convidado via link mágico ──────────────────

export async function completarCadastro(token: string, formData: FormData) {
  await expirarVencidos();
  const convite = await db.convite.findUnique({
    where: { magicToken: token },
    include: { convidado: true, parcelas: true },
  });
  if (!convite || convite.status !== "pendente") redirect(`/convite/${token}`);

  // com email, o cadastro exige OTP validado (prova de posse server-side)
  if (convite.convidado.email) {
    const { verificado } = await import("@/lib/otp");
    if (!(await verificado(token))) redirect(`/convite/${token}`);
  }

  const corporativo = convite.parcelas.some((p) => p.pool === "corporativo");

  const nascimentoRaw = String(formData.get("nascimento") ?? "");
  const nascimento = nascimentoRaw ? new Date(`${nascimentoRaw}T12:00:00`) : null;
  const cargo = String(formData.get("cargo") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const linkedin = String(formData.get("linkedin") ?? "").trim() || null;
  const email = normalizaEmail(String(formData.get("email") ?? ""));
  const telefone = normalizaTelefone(
    String(formData.get("ddi") ?? "+55"),
    String(formData.get("celular") ?? ""),
  );
  const lgpd = formData.get("lgpd") === "on";

  if (!nascimento || !lgpd) redirect(`/convite/${token}?erro=campos`);
  if (corporativo && (!cargo || !email || !telefone)) redirect(`/convite/${token}?erro=campos`);

  try {
    // batch atômico (D1 não aceita transação interativa)
    await db.$transaction([
      db.convidado.update({
        where: { id: convite.convidadoId },
        data: {
          nascimento,
          cargo: cargo ?? convite.convidado.cargo,
          email: email ?? convite.convidado.email,
          telefone: telefone ?? convite.convidado.telefone,
          instagram: instagram ?? convite.convidado.instagram,
          linkedin: linkedin ?? convite.convidado.linkedin,
          consentimentoEm: new Date(),
        },
      }),
      db.convite.update({ where: { id: convite.id }, data: { status: "cadastrado" } }),
      db.codigo.updateMany({
        where: { conviteId: convite.id },
        data: { status: "entregue" },
      }),
      db.comunicacaoLog.create({
        data: {
          convidadoId: convite.convidadoId,
          categoria: "transacional",
          passo: "instrucao_resgate",
          canal: convite.canais.split(",")[0] || "email",
          status: "enviado",
        },
      }),
    ]);
  } catch {
    redirect(`/convite/${token}?erro=email_em_uso`);
  }

  (await cookies()).set(
    "persona",
    JSON.stringify({ role: "convidado", id: convite.convidadoId }),
    { path: "/" },
  );
  // mini pesquisa de afinidade antes da carteira (decisão: antes do resgate)
  redirect("/convidado/interesses?origem=cadastro");
}

export async function entrarNaCarteira(formData: FormData) {
  const convidadoId = Number(formData.get("convidadoId"));
  if (!Number.isFinite(convidadoId)) redirect("/");
  (await cookies()).set("persona", JSON.stringify({ role: "convidado", id: convidadoId }), {
    path: "/",
  });
  redirect("/convidado");
}
