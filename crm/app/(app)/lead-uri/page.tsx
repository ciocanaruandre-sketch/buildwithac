import { cerRol } from "@/lib/eu";

export default async function LeadUri() {
  await cerRol("admin", "caller", "closer");
  return <h1 className="text-[26px] font-bold">Lead-uri</h1>;
}
