import type { Metadata } from "next";
import { Unbounded, Inter, Instrument_Serif, Caveat, Anton, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/components/layout/cadru.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/layout/LenisProvider";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/config";

const unbounded = Unbounded({ variable: "--nf-unbounded", subsets: ["latin", "latin-ext"], weight: ["600", "800"] });
const inter = Inter({ variable: "--nf-inter", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const serif = Instrument_Serif({ preload: false, variable: "--nf-serif", subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"] });
const caveat = Caveat({ preload: false, variable: "--nf-caveat", subsets: ["latin", "latin-ext"], weight: ["600", "700"] });
const anton = Anton({ preload: false, variable: "--nf-anton", subsets: ["latin", "latin-ext"], weight: "400" });
const mono = JetBrains_Mono({ preload: false, variable: "--nf-mono", subsets: ["latin", "latin-ext"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "buildwithac · AI pe înțelesul tău, în română",
  description: "Ghiduri gratuite, pas cu pas, pentru tot ce vezi pe TikTok la @buildwithac.ai.",
  openGraph: { siteName: "buildwithac", locale: "ro_RO", type: "website", images: ["/hero/l2.webp"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonturi = [unbounded, inter, serif, caveat, anton, mono].map((f) => f.variable).join(" ");
  return (
    <html lang="ro" className={`${fonturi} antialiased`}>
      <body className="font-inter bg-ink text-cream min-h-full">
        <LenisProvider>
          <Nav />
          {children}
          <Footer />
        </LenisProvider>
        <Analytics />
      </body>
    </html>
  );
}
