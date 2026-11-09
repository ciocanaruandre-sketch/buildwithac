import { redirect } from "next/navigation";
import { eu } from "@/lib/eu";

export default async function Acasa() {
  const om = await eu();
  redirect(om.rol === "constructor" ? "/clienti" : "/lead-uri");
}
