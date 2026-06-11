import { cookies } from "next/headers";

export type Persona = {
  role: "admin" | "funcionario" | "convidado";
  id: number;
};

export async function getPersona(): Promise<Persona | null> {
  const raw = (await cookies()).get("persona")?.value;
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p.id === "number" && ["admin", "funcionario", "convidado"].includes(p.role)) return p;
    return null;
  } catch {
    return null;
  }
}
