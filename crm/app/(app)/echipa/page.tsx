import { ActiuniOm, FormularInvitatie } from "@/components/Echipa";
import { cerRol } from "@/lib/eu";
import { admin } from "@/lib/supabase/admin";
import { supabase } from "@/lib/supabase/server";
import { ETICHETE } from "@/lib/tipuri";

const INCHISE = "(client,pierdut,descalificat)";

export default async function Echipa() {
  const eu = await cerRol("admin");
  const db = await supabase();
  const { data: oameni } = await db.from("profiluri").select("id, nume, email, rol, activ").order("creat_la");
  // „Invitat” = n-a intrat niciodată; asta știe doar Supabase Auth (cheia de serviciu, după verificarea rolului de mai sus)
  const { data: conturi } = await admin().auth.admin.listUsers({ perPage: 1000 });
  const aIntrat = new Set((conturi?.users ?? []).filter((u) => u.last_sign_in_at).map((u) => u.id));
  const deschise = await Promise.all(
    (oameni ?? []).map(async (o) => {
      // constructorul n-are lead-uri: la el se numără task-urile neterminate
      const { count } =
        o.rol === "constructor"
          ? await db.from("taskuri").select("id", { count: "exact", head: true }).eq("om_id", o.id).eq("gata", false)
          : await db.from("lead_uri").select("id", { count: "exact", head: true }).or(`caller_id.eq.${o.id},closer_id.eq.${o.id}`).not("stare", "in", INCHISE);
      return count ?? 0;
    }),
  );
  const activi = (oameni ?? []).filter((o) => o.activ);

  return (
    <>
      <div className="mb-4">
        <p className="lbl mb-1.5">CRM</p>
        <h1 className="text-[26px] font-bold">Echipa</h1>
      </div>

      <div className="mb-4">
        <FormularInvitatie />
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left">
              {["Nume", "Stare", "Lead-uri / task-uri deschise", "Rol și cont"].map((t) => (
                <th key={t} className="lbl px-3.5 py-2.5 font-semibold">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(oameni ?? []).map((o, i) => {
              const invitat = !aIntrat.has(o.id);
              const stare = !o.activ ? { t: "Oprit", c: "red" } : invitat ? { t: "Invitat", c: "amber" } : { t: "Activ", c: "green" };
              return (
                <tr key={o.id} className="border-b border-line align-top last:border-0">
                  <td className="px-3.5 py-3">
                    <b className="block font-medium">{o.nume}</b>
                    <span className="block font-mono text-[11px] text-ink-3">{o.email}</span>
                  </td>
                  <td className="px-3.5 py-3"><span className={`chip ${stare.c}`}>{stare.t}</span></td>
                  <td className="px-3.5 py-3 font-mono text-ink-2">{deschise[i]}</td>
                  <td className="px-3.5 py-2.5">
                    {o.id === eu.id || o.rol === "admin" ? (
                      <span className="text-ink-2">{ETICHETE.rol[o.rol]}{o.id === eu.id ? " (tu)" : ""}</span>
                    ) : (
                      <ActiuniOm
                        om={{ id: o.id, nume: o.nume, rol: o.rol }}
                        activ={o.activ}
                        invitat={invitat}
                        deschise={deschise[i]}
                        ceilalti={activi.filter((c) => c.id !== o.id).map((c) => ({ id: c.id, nume: c.nume, rol: c.rol }))}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
