import type { Metadata } from "next";
import Link from "next/link";
import "@/components/ghiduri/ghiduri.css";
import "./confidentialitate/confidentialitate.css";
import { Aurora } from "@/components/layout/Aurora";
import { LupaSpreGhiduri } from "@/components/ghiduri/LupaSpreGhiduri";

export const metadata: Metadata = { title: "Pagina nu există · buildwithac" };

export default function NuExista() {
  return (
    <main className="legal">
      <Aurora />
      <article>
        <div className="eb">404</div>
        <h1>Pagina asta nu există.</h1>
        <p>Poate ai venit după un ghid. Caută-l aici, după cuvântul din clip sau numele unei unelte:</p>
        <LupaSpreGhiduri />
        <p style={{ marginTop: 28 }}><Link className="toate-link" href="/ghiduri">Toate ghidurile →</Link></p>
      </article>
    </main>
  );
}
