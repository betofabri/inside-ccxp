import type { Metadata } from "next";
import { Archivo, Marcellus, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getPersona } from "@/lib/persona";
import { NIVEL_LABEL, fmtData } from "@/lib/labels";
import { db } from "@/lib/db";
import PerfilTopo from "@/components/perfil-topo";
import ImportarBotao from "@/app/funcionario/importar-botao";
import LangToggle from "@/components/lang-toggle";
import { getT } from "@/lib/i18n";

const display = Marcellus({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const corpo = Archivo({ subsets: ["latin"], variable: "--font-corpo" });
const mono = IBM_Plex_Mono({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-mono" });

const URL_PUBLICA = `https://betofabri.com${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;
const DESCRICAO =
  "A plataforma de convites e relacionamento corporativo da CCXP. CCXP26: 03 a 06 de dezembro, São Paulo Expo.";

export const metadata: Metadata = {
  title: "CCXP INSIDER · O Backstage do Backstage",
  description: DESCRICAO,
  // fase de teste pública: fora dos buscadores (link continua compartilhável)
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: {
    title: "CCXP INSIDER",
    description: DESCRICAO,
    url: URL_PUBLICA,
    siteName: "CCXP INSIDER",
    locale: "pt_BR",
    type: "website",
    images: [{ url: `${URL_PUBLICA}/og.png`, width: 1200, height: 630, alt: "CCXP INSIDER · O Backstage do Backstage" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CCXP INSIDER · O Backstage do Backstage",
    description: DESCRICAO,
    images: [`${URL_PUBLICA}/og.png`],
  },
};

const PAPEL_LABEL: Record<string, string> = {
  admin: "Admin",
  funcionario: "Colaborador O&CO",
  convidado: "Convidado",
};

type Perfil = {
  nome: string;
  papel: string;
  corpOn: boolean;
  detalhes: { rotulo: string; valor: React.ReactNode }[];
};

async function carregarPerfil(role: string, id: number): Promise<Perfil | null> {
  if (role === "convidado") {
    const c = await db.convidado.findUnique({ where: { id } });
    if (!c) return null;
    return {
      nome: c.nome,
      papel: PAPEL_LABEL[role],
      corpOn: false,
      detalhes: [
        { rotulo: "Contato", valor: <span className="mono">{c.email ?? c.telefone ?? "—"}</span> },
        ...(c.empresa ? [{ rotulo: "Empresa", valor: c.empresa }] : []),
        {
          rotulo: "LGPD",
          valor: c.consentimentoEm ? `aceita em ${fmtData(c.consentimentoEm)}` : "pendente",
        },
      ],
    };
  }

  const f = await db.funcionario.findUnique({ where: { id } });
  if (!f) return null;
  const saldoPessoal = await db.codigo.count({
    where: { pool: "pessoal", donoId: f.id, status: "disponivel" },
  });
  return {
    nome: f.nome,
    papel: PAPEL_LABEL[role],
    corpOn: f.podeCorporativo,
    detalhes: [
      { rotulo: "Email", valor: <span className="mono">{f.email}</span> },
      { rotulo: "Nível", valor: NIVEL_LABEL[f.nivel] },
      {
        rotulo: "Convite corporativo",
        valor: f.podeCorporativo ? <span className="badge resgatado">Ativo</span> : <span className="dim">—</span>,
      },
      { rotulo: "Cota pessoal disponível", valor: <b>{saldoPessoal} código(s)</b> },
    ],
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const persona = await getPersona();
  const perfil = persona ? await carregarPerfil(persona.role, persona.id) : null;
  const { L, t } = await getT();

  return (
    <html lang={L === "pt" ? "pt-BR" : L}>
      <body className={`${display.variable} ${corpo.variable} ${mono.variable}`}>
        <header className="topbar">
          <Link href="/" aria-label="Início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/ccxp-insider.svg`} alt="CCXP Insider" className="logo" />
          </Link>
          <span className="sistema">
            <b>CCXP INSIDER.</b> {t.header.tagline}
          </span>
          <nav className="topo-nav">
            <Link href="/apoio" className="topo-link">{t.header.assets}</Link>
            <Link href="/faq" className="topo-link">{t.header.faq}</Link>
            <button className="topo-link breve" type="button" disabled title={`${t.header.fotos}: ${t.header.breve}`}>
              {t.header.fotos} <span className="selo-breve">{t.header.breve}</span>
            </button>
          </nav>
          <span className="spacer" />
          <LangToggle atual={L} />
          {perfil && (
            <PerfilTopo
              nome={perfil.nome}
              papel={perfil.papel}
              corpOn={perfil.corpOn}
              detalhes={perfil.detalhes}
              acoes={
                persona && persona.role !== "convidado" ? (
                  <ImportarBotao pool="pessoal" eventoEsperado="CCXP26" variante="item" />
                ) : null
              }
            />
          )}
        </header>
        <main>{children}</main>
        <footer className="rodape-app">
          <span className="assinatura">
            <b>CCXP INSIDER</b> · {t.rodape.assinatura}
          </span>
          <span>CCXP26 · {t.evento.datas} · {t.evento.local}</span>
          <span>{t.rodape.proto}</span>
        </footer>
      </body>
    </html>
  );
}
