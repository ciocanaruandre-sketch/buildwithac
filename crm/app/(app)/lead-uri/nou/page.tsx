import { BaraSus } from "@/components/BaraSus";
import { FormularLead } from "@/components/FormularLead";
import { cerRol } from "@/lib/eu";

export default async function LeadNou() {
  const om = await cerRol("admin", "caller", "closer");
  return (
    <>
      <BaraSus cale={[{ eticheta: "Lead-uri", href: "/lead-uri" }, { eticheta: "Lead nou" }]} />
      <h1 className="mb-1 text-[26px] leading-tight sm:text-[30px]">Lead de mână</h1>
      <p className="mb-4 text-[13px] text-ink-2">
        {om.rol === "admin" ? "Pentru oamenii care n-au trecut prin formulare." : "Pentru oamenii care n-au trecut prin formulare. Lead-ul devine al tău."}
      </p>
      <FormularLead admin={om.rol === "admin"} />
    </>
  );
}
