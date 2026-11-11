import { CRM } from "@/lib/config";
import { eAdresaFaraCasuta } from "@/lib/echipa-test";

/** `continut` e în base64. */
export type Atasament = { nume: string; continut: string };
export type Email = { catre: string; subiect: string; text: string; html: string; atasamente?: Atasament[] };

/** Un e-mail prin Resend. Fără cheie (pe test), spre o adresă fără căsuță sau la eroare întoarce false; nu aruncă. */
export async function trimiteEmail(e: Email, f: typeof fetch = fetch): Promise<boolean> {
  const cheie = process.env.RESEND_API_KEY;
  if (!cheie || eAdresaFaraCasuta(e.catre)) return false;
  try {
    const r = await f("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cheie}` },
      body: JSON.stringify({
        from: `CRM buildwithac <${CRM.emailExpeditor}>`,
        to: [e.catre],
        subject: e.subiect,
        text: e.text,
        html: e.html,
        ...(e.atasamente?.length ? { attachments: e.atasamente.map((a) => ({ filename: a.nume, content: a.continut })) } : {}),
      }),
      signal: AbortSignal.timeout(e.atasamente?.length ? 30_000 : 5000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export const escapa = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
