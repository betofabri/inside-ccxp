import Link from "next/link";
import { FOOTPRINT_ENABLED } from "@/lib/flags";

export default function AdminTabs({ ativa }: { ativa: "dashboard" | "regua" | "footprint" | "settings" }) {
  return (
    <nav className="admin-tabs" aria-label="Seções do admin">
      <Link href="/admin" className={`admin-tab ${ativa === "dashboard" ? "ativa" : ""}`}>
        Dashboard
      </Link>
      <Link href="/admin/regua" className={`admin-tab ${ativa === "regua" ? "ativa" : ""}`}>
        Follow up
      </Link>
      {FOOTPRINT_ENABLED ? (
        <Link href="/admin/footprint" className={`admin-tab ${ativa === "footprint" ? "ativa" : ""}`}>
          Footprint
        </Link>
      ) : (
        <button
          type="button"
          className="admin-tab breve"
          disabled
          title="Footprint: ficha do convidado + trajeto via bipagens. Em breve."
        >
          Footprint <span className="selo-breve">em breve</span>
        </button>
      )}
      {/* Settings sempre por último */}
      <Link href="/admin/settings" className={`admin-tab ${ativa === "settings" ? "ativa" : ""}`}>
        Settings
      </Link>
    </nav>
  );
}
