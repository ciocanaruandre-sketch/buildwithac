import "@/components/home/home.css";
import { Hero } from "@/components/home/Hero";
import { Cortina } from "@/components/home/Cortina";
import { PentruCine } from "@/components/home/PentruCine";
import { PereteClipuri } from "@/components/home/PereteClipuri";
import { SectiuneEmail } from "@/components/home/SectiuneEmail";
import { Portofoliu } from "@/components/home/Portofoliu";
import { Servicii } from "@/components/home/Servicii";
import { Contact } from "@/components/home/Contact";
import { SectiuneGhiduri } from "@/components/home/SectiuneGhiduri";
import { faraCorp, toateGhidurile } from "@/lib/ghiduri";

export default function Acasa() {
  const ghiduri = toateGhidurile().map(faraCorp);
  return (
    <main>
      <Hero />
      <Cortina />
      {/* în producție, până la primul ghid real, lista e goală */}
      {ghiduri.length > 0 && <SectiuneGhiduri ghiduri={ghiduri} />}
      <PentruCine />
      <PereteClipuri />
      <SectiuneEmail />
      <Portofoliu />
      <Servicii />
      <Contact />
    </main>
  );
}
