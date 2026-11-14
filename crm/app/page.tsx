import { redirect } from "next/navigation";
import { eu } from "@/lib/eu";

export default async function Acasa() {
  // fără sesiune, eu() trimite la /intra
  await eu();
  redirect("/azi");
}
