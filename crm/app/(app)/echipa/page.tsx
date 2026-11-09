import { cerRol } from "@/lib/eu";

export default async function Echipa() {
  await cerRol("admin");
  return <h1 className="text-[26px] font-bold">Echipa</h1>;
}
