import Link from "next/link";
import { FIRMA, type Firma } from "@/lib/config";

export function Subsol({ firma = FIRMA }: { firma?: Firma }) {
  return (
    <footer className="border-t border-text/10 px-4 py-10 text-sm text-secundar">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        <div>
          <p className="font-medium text-text">{firma.nume}</p>
          <p>{firma.adresa}</p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <Link href="/confidentialitate" className="py-1 underline-offset-4 hover:underline">
            Confidențialitate
          </Link>
          {firma.creditBuildwithac && (
            <a href="https://buildwithac.ro" className="py-1 underline-offset-4 hover:underline">
              Site făcut de buildwithac
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
