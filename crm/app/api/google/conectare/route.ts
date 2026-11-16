import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { urlConectare } from "@/lib/calendar/google";
import { cerRol } from "@/lib/eu";

/** „Conectează Google Calendar”: trimite omul la ecranul Google, cu o stare aleatoare ținută într-un cookie. */
export async function GET(cerere: Request) {
  await cerRol("admin", "closer");
  const origine = new URL(cerere.url).origin;
  if (!process.env.GOOGLE_CLIENT_ID) return Response.redirect(`${origine}/program`, 303);
  const stare = randomBytes(24).toString("base64url");
  (await cookies()).set("google_stare", stare, {
    httpOnly: true,
    sameSite: "lax",
    secure: origine.startsWith("https://"),
    path: "/api/google",
    maxAge: 600,
  });
  return Response.redirect(urlConectare({ redirect: `${origine}/api/google/intoarcere`, stare }), 303);
}
