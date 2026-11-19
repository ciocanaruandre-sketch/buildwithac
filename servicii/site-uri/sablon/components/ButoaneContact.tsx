import { FIRMA, type Firma } from "@/lib/config";
import { linkTelefon, linkWhatsapp } from "@/lib/telefon";

const buton =
  "inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-medium transition-opacity hover:opacity-85";

/** Contactul implicit: Sună, WhatsApp (dacă firma are), Vezi pe hartă. */
export function ButoaneContact({ firma = FIRMA }: { firma?: Firma }) {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={linkTelefon(firma.telefon)} className={`${buton} bg-accent text-fundal`}>
        Sună
      </a>
      {firma.whatsapp && (
        <a href={linkWhatsapp(firma.whatsapp)} target="_blank" rel="noopener" className={`${buton} border border-text/20`}>
          WhatsApp
        </a>
      )}
      <a href={firma.harta} target="_blank" rel="noopener" className={`${buton} border border-text/20`}>
        Vezi pe hartă
      </a>
    </div>
  );
}
