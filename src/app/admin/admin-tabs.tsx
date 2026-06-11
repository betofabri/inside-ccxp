import Link from "next/link";

export default function AdminTabs({ ativa }: { ativa: "dashboard" | "regua" }) {
  return (
    <nav className="admin-tabs" aria-label="Seções do admin">
      <Link href="/admin" className={`admin-tab ${ativa === "dashboard" ? "ativa" : ""}`}>
        Dashboard
      </Link>
      <Link href="/admin/regua" className={`admin-tab ${ativa === "regua" ? "ativa" : ""}`}>
        Follow up
      </Link>
    </nav>
  );
}
