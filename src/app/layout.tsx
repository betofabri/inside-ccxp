import type { Metadata } from "next";
import { Archivo, Marcellus, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getPersona } from "@/lib/persona";
import { sairPersona } from "@/lib/actions";
import { db } from "@/lib/db";

const display = Marcellus({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const corpo = Archivo({ subsets: ["latin"], variable: "--font-corpo" });
const mono = IBM_Plex_Mono({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CCXP INSIDER · Convidados VIP",
  description: "CCXP INSIDER, a plataforma de convidados VIP da CCXP26, de 03 a 06 de dezembro no São Paulo Expo.",
};

const PAPEL_LABEL: Record<string, string> = {
  admin: "Admin",
  funcionario: "Funcionário",
  convidado: "Convidado",
};

async function nomePersona(role: string, id: number): Promise<string | null> {
  if (role === "convidado") {
    const c = await db.convidado.findUnique({ where: { id } });
    return c?.nome ?? null;
  }
  const f = await db.funcionario.findUnique({ where: { id } });
  return f?.nome ?? null;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const persona = await getPersona();
  const nome = persona ? await nomePersona(persona.role, persona.id) : null;

  return (
    <html lang="pt-BR">
      <body className={`${display.variable} ${corpo.variable} ${mono.variable}`}>
        <header className="topbar">
          <Link href="/" aria-label="Início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/ccxp-insider.svg`} alt="CCXP Insider" className="logo" />
          </Link>
          <span className="sistema">Convidados VIP</span>
          <nav className="topo-nav">
            <Link href="/apoio" className="topo-link">Material de apoio</Link>
            <button className="topo-link breve" type="button" disabled title="Fotos do dia: em breve">
              Fotos do dia <span className="selo-breve">em breve</span>
            </button>
          </nav>
          <span className="spacer" />
          {persona && nome && (
            <div className="persona-chip">
              <span className="papel">{PAPEL_LABEL[persona.role]}</span>
              <span className="quem">{nome}</span>
              <form action={sairPersona}>
                <button type="submit">Trocar</button>
              </form>
            </div>
          )}
        </header>
        <main>{children}</main>
        <footer className="rodape-app">
          <span>CCXP26 · 03 a 06 dez 2026 · São Paulo Expo</span>
          <span>Protótipo F0 · envio mockado · dados de exemplo</span>
        </footer>
      </body>
    </html>
  );
}
