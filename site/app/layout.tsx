import type { Metadata } from "next";
import { preload } from "react-dom";
import "./fonturi.css";
import "./globals.css";
import "@/components/layout/cadru.css";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { LenisProvider } from "@/components/layout/LenisProvider";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/config";
import { PastreazaUtm } from "@/components/PastreazaUtm";

// titlurile și textul se văd din primul ecran: le cerem devreme (un fișier acoperă toate grosimile)
const PRIMELE = ["/fonts/unbounded-latin.woff2", "/fonts/inter-latin.woff2"];

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "buildwithac · AI pe înțelesul tău, în română",
  description: "Ghiduri gratuite, pas cu pas, pentru tot ce vezi pe TikTok la @buildwithac.ai.",
  openGraph: { siteName: "buildwithac", locale: "ro_RO", type: "website", images: ["/hero/l2.webp"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  PRIMELE.forEach((f) => preload(f, { as: "font", type: "font/woff2", crossOrigin: "anonymous" }));
  return (
    <html lang="ro" className="antialiased">
      <body className="font-inter bg-ink text-cream min-h-full">
        <LenisProvider>
          <Nav />
          {children}
          <Footer />
        </LenisProvider>
        <PastreazaUtm />
        <Analytics />
      </body>
    </html>
  );
}
