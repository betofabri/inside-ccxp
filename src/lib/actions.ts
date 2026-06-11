"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function assumirPersona(formData: FormData) {
  const role = String(formData.get("role"));
  const id = Number(formData.get("id"));
  if (!["admin", "funcionario", "convidado"].includes(role) || !Number.isFinite(id)) redirect("/");
  (await cookies()).set("persona", JSON.stringify({ role, id }), { path: "/" });
  redirect(role === "convidado" ? "/convidado" : role === "admin" ? "/admin" : "/funcionario");
}

export async function sairPersona() {
  (await cookies()).delete("persona");
  redirect("/");
}
