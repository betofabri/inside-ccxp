"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";

// Mini pesquisa de afinidade — gravada no perfil ANTES do resgate (decisão
// 12/jun). As opções vivem em labels.ts (INTERESSES_OPCOES).
export async function salvarInteresses(formData: FormData) {
  const persona = await getPersona();
  if (!persona || persona.role !== "convidado") redirect("/");

  const escolhidos = formData.getAll("interesse").map(String).filter(Boolean);
  if (escolhidos.length === 0) redirect("/convidado/interesses?erro=vazio");

  await db.convidado.update({
    where: { id: persona.id },
    data: { interesses: JSON.stringify(escolhidos) },
  });
  await db.comunicacaoLog.create({
    data: {
      convidadoId: persona.id,
      categoria: "transacional",
      passo: "mini_pesquisa",
      canal: "app",
      status: "respondida",
    },
  });

  const origem = String(formData.get("origem") ?? "");
  redirect(origem === "cadastro" ? "/convidado?cadastro=ok" : "/convidado?interesses=ok");
}
