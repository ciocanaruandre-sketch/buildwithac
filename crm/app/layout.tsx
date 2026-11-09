import type { Metadata } from "next";
import "./tema.css";

export const metadata: Metadata = {
  title: "CRM buildwithac",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ro">
      <body className="antialiased">{children}</body>
    </html>
  );
}
