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

  const nomeCompleto = `${input.nome.trim()} ${input.sobrenome.trim()}`.trim();
  if (nomeCompleto.length < 4) return { ok: false, erro: "Preencha nome e sobrenome." };

  const email = normalizaEmail(input.email);
  const telefone = normalizaTelefone(input.ddi, input.telefone);
  const empresa = (input.empresa ?? "").trim() || null;

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

  try {
    await db.$transaction(async (tx) => {
      // carteira única: consolida por email; senão por telefone; senão cria
      let convidado =
        (email && (await tx.convidado.findUnique({ where: { email } }))) ||
        (telefone && (await tx.convidado.findFirst({ where: { telefone } }))) ||
        null;
      if (!convidado) {
        convidado = await tx.convidado.create({
          data: { nome: nomeCompleto, email, telefone, empresa },
        });
      } else {
        await tx.convidado.update({
          where: { id: convidado.id },
          data: {
            telefone: convidado.telefone ?? telefone,
            empresa: convidado.empresa ?? empresa,
          },
        });
      }

      const convite = await tx.convite.create({
        data: {
          hostId: host.id,
          convidadoId: convidado.id,
          canais,
          status: "pendente",
          expiraEm,
          vipOmelete: parcelas.some((p) => p.vip || p.tipo === "todos_os_dias"),
          magicToken: token,
        },
      });

      // reserva atômica: tudo ou nada dentro da transação
      for (const p of parcelas) {
        const livres = await tx.codigo.findMany({
          where: {
            pool,
            tipo: p.tipo,
            status: "disponivel",
            ...(pool === "pessoal" ? { donoId: host.id } : {}),
          },
          take: p.qtd,
        });
        if (livres.length < p.qtd)
          throw new Error(
            `Saldo insuficiente em ${TIPO_LABEL[p.tipo]}: pediu ${p.qtd}, restam ${livres.length}.`,
          );
        await tx.conviteParcela.create({
          data: { conviteId: convite.id, pool, tipo: p.tipo, qtd: p.qtd, vip: p.vip || p.tipo === "todos_os_dias" },
        });
        await tx.codigo.updateMany({
          where: { id: { in: livres.map((c) => c.id) } },
          data: { status: "reservado", conviteId: convite.id },
        });
      }

      await tx.comunicacaoLog.create({
        data: {
          convidadoId: convidado.id,
          categoria: "transacional",
          passo: "convite",
          canal: canais || "email",
          status: "enviado",
        },
      });
    });
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : "Erro ao reservar os códigos." };
  }

  const totalIngressos = parcelas.reduce((acc, p) => acc + p.qtd, 0);
  const preview =
    `Olá, ${input.nome.trim()}! ${host.nome} convidou você pra CCXP26 ` +
    `(03 a 06/dez, São Paulo Expo) com ${totalIngressos} ingresso(s). ` +
    `Complete seu cadastro pra receber os códigos: {{link}}`;

  revalidatePath("/funcionario");
  return { ok: true, token, aviso, preview };
}

// ── F2: gestão do host ─────────────────────────────────────────

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
    await db.$transaction(async (tx) => {
      if (convite.status === "expirado") {
        // nova reserva (os códigos voltaram ao pool quando expirou)
        for (const p of convite.parcelas) {
          const livres = await tx.codigo.findMany({
            where: {
              pool: p.pool,
              tipo: p.tipo,
              status: "disponivel",
              ...(p.pool === "pessoal" ? { donoId: convite.hostId } : {}),
            },
            take: p.qtd,
          });
          if (livres.length < p.qtd)
            throw new Error(`Sem saldo pra reenviar: ${TIPO_LABEL[p.tipo]} esgotado.`);
          await tx.codigo.updateMany({
            where: { id: { in: livres.map((c) => c.id) } },
            data: { status: "reservado", conviteId: convite.id },
          });
        }
      }
      await tx.convite.update({
        where: { id },
        data: { status: "pendente", expiraEm, magicToken: token },
      });
    });
  } catch {
    // saldo esgotado: mantém como está; a F5 ganha feedback de erro melhor
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

  const corporativo = convite.parcelas.some((p) => p.pool === "corporativo");

  const nascimentoRaw = String(formData.get("nascimento") ?? "");
  const nascimento = nascimentoRaw ? new Date(`${nascimentoRaw}T12:00:00`) : null;
  const cargo = String(formData.get("cargo") ?? "").trim() || null;
  const email = normalizaEmail(String(formData.get("email") ?? ""));
  const telefone = normalizaTelefone(
    String(formData.get("ddi") ?? "+55"),
    String(formData.get("celular") ?? ""),
  );
  const lgpd = formData.get("lgpd") === "on";

  if (!nascimento || !lgpd) redirect(`/convite/${token}?erro=campos`);
  if (corporativo && (!cargo || !email || !telefone)) redirect(`/convite/${token}?erro=campos`);

  try {
    await db.$transaction(async (tx) => {
      await tx.convidado.update({
        where: { id: convite.convidadoId },
        data: {
          nascimento,
          cargo: cargo ?? convite.convidado.cargo,
          email: email ?? convite.convidado.email,
          telefone: telefone ?? convite.convidado.telefone,
          consentimentoEm: new Date(),
        },
      });
      await tx.convite.update({ where: { id: convite.id }, data: { status: "cadastrado" } });
      await tx.codigo.updateMany({
        where: { conviteId: convite.id },
        data: { status: "entregue" },
      });
      await tx.comunicacaoLog.create({
        data: {
          convidadoId: convite.convidadoId,
          categoria: "transacional",
          passo: "instrucao_resgate",
          canal: convite.canais.split(",")[0] || "email",
          status: "enviado",
        },
      });
    });
  } catch {
    redirect(`/convite/${token}?erro=email_em_uso`);
  }

  (await cookies()).set(
    "persona",
    JSON.stringify({ role: "convidado", id: convite.convidadoId }),
    { path: "/" },
  );
  redirect("/convidado");
}

export async function entrarNaCarteira(formData: FormData) {
  const convidadoId = Number(formData.get("convidadoId"));
  if (!Number.isFinite(convidadoId)) redirect("/");
  (await cookies()).set("persona", JSON.stringify({ role: "convidado", id: convidadoId }), {
    path: "/",
  });
  redirect("/convidado");
}
