import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24">
      <h1 className="text-3xl font-semibold">Pagina nu există</h1>
      <p className="mt-3 text-secundar">Poate a fost mutată sau adresa are o greșeală.</p>
      <Link href="/" className="mt-8 inline-block underline underline-offset-4">
        Înapoi la prima pagină
      </Link>
    </main>
  );
}
