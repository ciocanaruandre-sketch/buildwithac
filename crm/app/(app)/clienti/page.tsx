import { eu } from "@/lib/eu";

export default async function Clienti() {
  await eu();
  return <h1 className="text-[26px] font-bold">Clienți</h1>;
}
