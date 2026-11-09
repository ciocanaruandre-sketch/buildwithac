import Link from "next/link";
import { FormularLead } from "@/components/FormularLead";
import { cerRol } from "@/lib/eu";

export default async function LeadNou() {
  const om = await cerRol("admin", "caller", "closer");
  return (
    <>
      <p className="lbl mb-1.5">
        <Link href="/lead-uri" className="hover:text-ink">Lead-uri</Link> / nou
      </p>
      <h1 className="mb-1 text-[26px] font-bold">Lead de mână</h1>
      <p className="mb-4 text-[13px] text-ink-2">
        {om.rol === "admin" ? "Pentru oamenii care n-au trecut prin formulare." : "Pentru oamenii care n-au trecut prin formulare. Lead-ul devine al tău."}
      </p>
      <FormularLead admin={om.rol === "admin"} productie={process.env.CRM_MEDIU === "productie"} />
    </>
  );
}
