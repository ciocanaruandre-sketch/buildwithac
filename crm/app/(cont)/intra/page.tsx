import Link from "next/link";
import { Formular } from "@/components/Formular";
import { cereParolaNoua, intra } from "../actiuni";

export default async function Intra({ searchParams }: PageProps<"/intra">) {
  const { uitat, oprit } = await searchParams;
  if (uitat) {
    return (
      <>
        <h1 className="mb-4 text-xl font-bold">Parolă nouă</h1>
        <Formular actiune={cereParolaNoua} buton="Trimite linkul" campuri={[{ nume: "email", eticheta: "E-mail", tip: "email", autocomplete: "email" }]} />
        <Link href="/intra" className="mt-4 block text-[13px] text-ink-3">
          Înapoi la conectare
        </Link>
      </>
    );
  }
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Intră</h1>
      {oprit && (
        <p role="alert" className="mb-3 text-[13px] text-[#ff7a66]">
          Contul tău e oprit. Vorbește cu Andrei.
        </p>
      )}
      <Formular
        actiune={intra}
        buton="Intră"
        campuri={[
          { nume: "email", eticheta: "E-mail", tip: "email", autocomplete: "email" },
          { nume: "parola", eticheta: "Parola", tip: "password", autocomplete: "current-password" },
        ]}
      />
      <Link href="/intra?uitat=1" className="mt-4 block text-[13px] text-ink-3">
        Am uitat parola
      </Link>
    </>
  );
}
