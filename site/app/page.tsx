import "@/components/home/home.css";
import { Hero } from "@/components/home/Hero";
import { Cortina } from "@/components/home/Cortina";
import { SectiuneGhiduri } from "@/components/home/SectiuneGhiduri";
import { faraCorp, toateGhidurile } from "@/lib/ghiduri";

export default function Acasa() {
  return (
    <main>
      <Hero />
      <Cortina />
      <SectiuneGhiduri ghiduri={toateGhidurile().map(faraCorp)} />
    </main>
  );
}
