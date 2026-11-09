"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase/server";

export type StareFormular = { eroare?: string; mesaj?: string } | undefined;

export async function intra(_: StareFormular, f: FormData): Promise<StareFormular> {
  const email = String(f.get("email") ?? "").trim();
  const parola = String(f.get("parola") ?? "");
  if (!email || !parola) return { eroare: "Scrie e-mailul și parola." };
  const db = await supabase();
  const { data, error } = await db.auth.signInWithPassword({ email, password: parola });
  if (error) {
    if (/banned/i.test(error.message)) return { eroare: "Contul tău e oprit. Vorbește cu Andrei." };
    return { eroare: "E-mailul sau parola nu se potrivesc." };
  }
  const { data: p } = await db.from("profiluri").select("id").eq("id", data.user.id).maybeSingle();
  if (!p) {
    await db.auth.signOut();
    return { eroare: "Contul tău e oprit. Vorbește cu Andrei." };
  }
  redirect("/");
}

export async function cereParolaNoua(_: StareFormular, f: FormData): Promise<StareFormular> {
  const email = String(f.get("email") ?? "").trim();
  if (!email.includes("@")) return { eroare: "Scrie adresa de e-mail a contului." };
  const db = await supabase();
  const h = await headers();
  const origine = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  await db.auth.resetPasswordForEmail(email, { redirectTo: `${origine}/parola` });
  // același mesaj, fie că adresa are cont, fie că nu
  return { mesaj: "Dacă adresa are cont, ți-am trimis un link pentru parola nouă." };
}

export async function seteazaParola(_: StareFormular, f: FormData): Promise<StareFormular> {
  const parola = String(f.get("parola") ?? "");
  const dinNou = String(f.get("parola2") ?? "");
  if (parola.length < 10) return { eroare: "Parola are nevoie de cel puțin 10 caractere." };
  if (parola !== dinNou) return { eroare: "Cele două parole nu sunt la fel." };
  const db = await supabase();
  const { error } = await db.auth.updateUser({ password: parola });
  if (error) return { eroare: "Linkul a expirat. Cere unul nou de pe pagina de conectare." };
  redirect("/");
}

export async function iesi() {
  const db = await supabase();
  await db.auth.signOut();
  redirect("/intra");
}
