import { sairPersona } from "@/lib/actions";
import { NIVEL_LABEL } from "@/lib/labels";

type Props = {
  nome: string;
  email: string;
  nivel: string;
  podeCorporativo: boolean;
  saldoPessoal: number;
};

export default function PerfilHost({ nome, email, nivel, podeCorporativo, saldoPessoal }: Props) {
  const inicial = nome.trim().charAt(0).toUpperCase();

  return (
    <details className="perfil-host">
      <summary>
        <span className="avatar" aria-hidden>{inicial}</span>
        <span className="perfil-nome">
          {nome}
          {podeCorporativo && <small className="corp-on">Corp On</small>}
        </span>
        <span className="chevron" aria-hidden />
      </summary>
      <div className="perfil-drop">
        <dl>
          <div><dt>Email</dt><dd className="mono">{email}</dd></div>
          <div><dt>Nível</dt><dd>{NIVEL_LABEL[nivel]}</dd></div>
          <div>
            <dt>Convite corporativo</dt>
            <dd>{podeCorporativo ? <span className="badge resgatado">Ativo</span> : <span className="dim">—</span>}</dd>
          </div>
          <div><dt>Cota pessoal disponível</dt><dd><b>{saldoPessoal}</b> código(s)</dd></div>
        </dl>
        <form action={sairPersona}>
          <button className="acao" type="submit">Trocar papel</button>
        </form>
      </div>
    </details>
  );
}
