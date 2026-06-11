import { sairPersona } from "@/lib/actions";

type Detalhe = { rotulo: string; valor: React.ReactNode };

type Props = {
  nome: string;
  papel: string; // "Funcionário" | "Admin" | "Convidado"
  corpOn?: boolean;
  detalhes: Detalhe[];
};

export default function PerfilTopo({ nome, papel, corpOn, detalhes }: Props) {
  const inicial = nome.trim().charAt(0).toUpperCase();

  return (
    <details className="perfil-host perfil-topo">
      <summary>
        <span className="avatar" aria-hidden>{inicial}</span>
        <span className="perfil-nome">
          {nome}
          <small className="perfil-sub">
            {papel}
            {corpOn && (
              <>
                {" · "}
                <span className="corp-on">Corp On</span>
              </>
            )}
          </small>
        </span>
        <span className="chevron" aria-hidden />
      </summary>
      <div className="perfil-drop">
        <dl>
          {detalhes.map((d) => (
            <div key={d.rotulo}>
              <dt>{d.rotulo}</dt>
              <dd>{d.valor}</dd>
            </div>
          ))}
        </dl>
        <form action={sairPersona}>
          <button className="acao" type="submit">Trocar papel</button>
        </form>
      </div>
    </details>
  );
}
