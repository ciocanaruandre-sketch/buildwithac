import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { imagineGhid } from "@/lib/imagine";

type Copii = { children: React.ReactNode };

// textul scris pe un singur rând vine ca șir; cel pe mai multe rânduri vine deja în paragrafe
const Text = ({ children }: Copii) => (typeof children === "string" ? <p>{children}</p> : <>{children}</>);

export function DeCeAiNevoie({ children }: Copii) {
  return (
    <div className="need-wrap">
      <div className="eb">De ce ai nevoie</div>
      <div className="need">{children}</div>
    </div>
  );
}

export function GresealaMea({ children }: Copii) {
  return (
    <aside className="mistake">
      <div className="tape" />
      <div className="k">greșeala mea ↓</div>
      <Text>{children}</Text>
    </aside>
  );
}

export function Atentie({ children }: Copii) {
  return (
    <aside className="atentie">
      <div className="k">atenție ↓</div>
      <Text>{children}</Text>
    </aside>
  );
}

export function DacaNuMerge({ children }: Copii) {
  return (
    <aside className="daca-nu">
      <div className="k">dacă nu merge ↓</div>
      <Text>{children}</Text>
    </aside>
  );
}

/** „Ce ar trebui să vezi”: o captură lipită cu bandă. `src` e numele fișierului din public/ghiduri/<dosar>/. */
export function CeVezi({ src, alt, dosar }: { src: string; alt: string; dosar: string }) {
  // captura pe care Andrei n-a trimis-o încă: loc marcat în previzualizare; `npm run verifica` nu o lasă în main
  if (!fs.existsSync(path.join(process.cwd(), "public", "ghiduri", dosar, src))) {
    return (
      <figure className="shot lipsa">
        <figcaption>captură de pus: {alt}</figcaption>
      </figure>
    );
  }
  return (
    <figure className="shot">
      <div className="tp" />
      <div className="in">
        <div className="bar" aria-hidden><i /><i /><i /></div>
        <div className="scr">
          <Image src={imagineGhid({ dosar }, src)} alt={alt} fill sizes="(max-width: 760px) 100vw, 680px" />
          <figcaption>{alt}</figcaption>
        </div>
      </div>
    </figure>
  );
}
