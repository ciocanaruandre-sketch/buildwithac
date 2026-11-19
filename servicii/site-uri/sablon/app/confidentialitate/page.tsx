// De verificat cu skill-ul legal-advisor-ro dacă site-ul strânge date (formular, programări, newsletter).
// Fără formular, site-ul nu strânge date personale; textul de mai jos e scheletul de adaptat.
import type { Metadata } from "next";
import Link from "next/link";
import { FIRMA } from "@/lib/config";

export const metadata: Metadata = {
  title: `Confidențialitate · ${FIRMA.nume}`,
  alternates: { canonical: "/confidentialitate" },
};

export default function Confidentialitate() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-16 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:mt-3 [&_p]:text-secundar">
      <Link href="/" className="text-sm text-secundar underline-offset-4 hover:underline">
        ← {FIRMA.nume}
      </Link>
      <h1 className="mt-6 text-3xl font-semibold">Confidențialitate</h1>

      <h2>Cine răspunde de date</h2>
      <p>
        {FIRMA.nume}, {FIRMA.adresa}. Ne găsești la telefonul de pe prima pagină.
      </p>

      <h2>Ce date strângem</h2>
      <p>Niciuna. Site-ul nu are formulare și nu îți cere nume, telefon sau e-mail.</p>
      <p>
        Când apeși „Sună”, „WhatsApp” sau „Vezi pe hartă”, deschizi aplicația telefonului, WhatsApp sau Google
        Maps. Ce se întâmplă acolo ține de regulile lor.
      </p>

      {FIRMA.analytics && (
        <>
          <h2>Statistici</h2>
          <p>
            Numărăm vizitele cu Vercel Web Analytics: câte pagini se văd și de unde vin vizitatorii. Nu folosește
            cookie-uri și nu te identifică.
          </p>
        </>
      )}

      <h2>Cookie-uri</h2>
      <p>Site-ul nu pune cookie-uri.</p>
    </main>
  );
}
