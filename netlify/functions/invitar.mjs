// Solo la administradora puede usar esta función. La clave secreta vive únicamente en Netlify.
import { createClient } from "@supabase/supabase-js"

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Método no permitido" })
  const url = process.env.VITE_SUPABASE_URL
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "")
  const asUser = createClient(url, process.env.VITE_SUPABASE_PUBLISHABLE_KEY, { global: { headers: { Authorization: "Bearer " + token } } })

  const { data: { user } } = await asUser.auth.getUser(token)
  if (!user) return json(401, { error: "Tu sesión venció. Volvé a ingresar." })
  const { data: me } = await asUser.from("profiles").select("role").eq("id", user.id).single()
  if (me?.role !== "admin") return json(403, { error: "No tenés permisos para esto." })

  const b = await req.json().catch(() => ({}))
  const email = String(b.email || "").trim().toLowerCase()
  const name = String(b.name || "").trim().slice(0, 120)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name || !/^[0-9a-f-]{36}$/i.test(b.template || "") || !/^\d{4}-\d{2}-\d{2}$/.test(b.start || ""))
    return json(400, { error: "Revisá los datos: nombre, email, servicio y fecha." })

  const admin = createClient(url, process.env.SUPABASE_SECRET_KEY)
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name }, redirectTo: process.env.SITE_URL + "/definir-clave"
  })
  if (error) return json(400, { error: "No pudimos invitarla: " + error.message })

  const { error: e2 } = await asUser.rpc("create_accompaniment", { p_client: data.user.id, p_template: b.template, p_start: b.start })
  if (e2) return json(500, { error: "Se envió la invitación pero falló la creación del servicio: " + e2.message })
  return json(200, { ok: true })
}
