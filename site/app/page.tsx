import "@/components/home/home.css";
import { Hero } from "@/components/home/Hero";
import { Cortina } from "@/components/home/Cortina";
import { PentruCine } from "@/components/home/PentruCine";
import { PereteClipuri } from "@/components/home/PereteClipuri";
import { SectiuneEmail } from "@/components/home/SectiuneEmail";
import { Servicii } from "@/components/home/Servicii";
import { Contact } from "@/components/home/Contact";
import { SectiuneGhiduri } from "@/components/home/SectiuneGhiduri";
import { faraCorp, toateGhidurile } from "@/lib/ghiduri";

export default function Acasa() {
  return (
    <main>
      <Hero />
      <Cortina />
      <SectiuneGhiduri ghiduri={toateGhidurile().map(faraCorp)} />
      <PentruCine />
      <PereteClipuri />
      <SectiuneEmail />
      {/* Portofoliu: după alegerea lui Andrei (Task 9, pasul 1) */}
      <Servicii />
      <Contact />
    </main>
  );
}
