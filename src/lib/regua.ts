"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getPersona } from "@/lib/persona";

export async function alternarPassoRegua(formData: FormData) {
  const persona = await getPersona();
  if (!persona || persona.role !== "admin") redirect("/");

  const id = Number(formData.get("passoId"));
  const passo = await db.reguaPasso.findUnique({ where: { id } });
  if (!passo) redirect("/admin/regua");

  await db.reguaPasso.update({ where: { id }, data: { ativo: !passo.ativo } });
  await db.auditLog.create({
    data: {
      atorId: persona.id,
      acao: "alterar_regua",
      alvo: `passo:${passo.rotulo}`,
      detalhe: `ativo: ${passo.ativo} → ${!passo.ativo}`,
    },
  });
  revalidatePath("/admin/regua");
}
