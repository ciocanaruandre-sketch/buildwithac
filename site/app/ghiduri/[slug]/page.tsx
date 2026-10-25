import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import "@/components/ghid/ghid.css";
import { faraCorp, ghidDupaSlug, numeroteazaPasii, parametriGhiduri, toateGhidurile, type Ghid } from "@/lib/ghiduri";
import { imagineGhid } from "@/lib/imagine";
import { formatData } from "@/lib/data";
import { Aurora } from "@/components/layout/Aurora";
import { Caiet } from "@/components/ghid/Caiet";
import { Pas } from "@/components/ghid/Pas";
import { Prompt } from "@/components/ghid/Prompt";
import { Atentie, CeVezi, DacaNuMerge, DeCeAiNevoie, GresealaMea } from "@/components/ghid/Notite";
import { CasetaPdf } from "@/components/ghid/CasetaPdf";
import { FinalGhid } from "@/components/ghid/FinalGhid";

export function generateStaticParams() {
  return parametriGhiduri(toateGhidurile());
}

export async function generateMetadata({ params }: PageProps<"/ghiduri/[slug]">): Promise<Metadata> {
  const g = ghidDupaSlug((await params).slug);
  if (!g) return {};
  return {
    title: `${g.titlu} · buildwithac`,
    description: g.descriere,
    openGraph: { title: g.titlu, description: g.descriere, images: [imagineGhid(g, g.imagine)], type: "article" },
  };
}

const urmatorul = (g: Ghid) => {
  const toate = toateGhidurile();
  const i = toate.findIndex((x) => x.slug === g.slug);
  const u = toate[i + 1] ?? toate[0];
  return u && u.slug !== g.slug ? faraCorp(u) : undefined;
};

export default async function PaginaGhid({ params }: PageProps<"/ghiduri/[slug]">) {
  const g = ghidDupaSlug((await params).slug);
  if (!g) notFound();

  const componente = {
    Pas, Prompt, Atentie, DacaNuMerge, DeCeAiNevoie, GresealaMea,
    CeVezi: (p: { src: string; alt: string }) => <CeVezi {...p} dosar={g.dosar} />,
  };

  return (
    <main className="ghid">
      <Aurora />
      <Caiet
        ghid={faraCorp(g)}
        actualizat={formatData(g.actualizat)}
        dupa={<>{g.pdf && <CasetaPdf titlu={g.titlu} cuvant={g.cuvant} />}<FinalGhid urmator={urmatorul(g)} /></>}
      >
        <MDXRemote source={numeroteazaPasii(g.corp)} components={componente} />
      </Caiet>
    </main>
  );
}
