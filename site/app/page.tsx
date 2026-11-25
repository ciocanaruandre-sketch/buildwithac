import "@/components/home/home.css";
import { Hero } from "@/components/home/Hero";
import { Cortina } from "@/components/home/Cortina";
import { Banda } from "@/components/home/Banda";
import { Portofoliu } from "@/components/home/Portofoliu";
import { Servicii } from "@/components/home/Servicii";
import { Calculator } from "@/components/home/Calculator";
import { Colaborare } from "@/components/home/Colaborare";
import { Ghiduri } from "@/components/home/Ghiduri";
import { PereteClipuri } from "@/components/home/PereteClipuri";
import { SectiuneEmail } from "@/components/home/SectiuneEmail";
import { Intrebari } from "@/components/home/Intrebari";
import { Contact } from "@/components/home/Contact";
import { toateGhidurile } from "@/lib/ghiduri";

// ordinea e pentru vânzare: cine e, ce a făcut, ce oferă, formularul; ghidurile vin după (docs/superpowers/specs/2026-11-25-homepage-vanzari-design.md)
export default function Acasa() {
  return (
    <main>
      <Hero />
      <Cortina />
      <Banda />
      <Portofoliu />
      <Servicii />
      <Calculator />
      <Colaborare />
      <Ghiduri numar={toateGhidurile().length} />
      <PereteClipuri />
      <SectiuneEmail />
      <Intrebari />
      <Contact />
    </main>
  );
}
