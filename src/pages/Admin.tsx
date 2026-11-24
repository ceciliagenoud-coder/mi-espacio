import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function Admin({ profile }: { profile: any }) {
  const [rows, setRows] = useState<any[]>([])
  const [tpls, setTpls] = useState<any[]>([])
  const [f, setF] = useState({ name: "", email: "", template: "", start: new Date().toISOString().slice(0, 10) })
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  async function cargar() {
    const a = await supabase.from("accompaniments").select("id,service_name,status,start_date,client:profiles!accompaniments_client_id_fkey(full_name,email)").order("created_at", { ascending: false })
    setRows(a.data || [])
    const t = await supabase.from("service_templates").select("id,name").eq("active", true)
    setTpls(t.data || []); if (t.data?.[0]) setF(x => x.template ? x : { ...x, template: t.data[0].id })
  }
  useEffect(() => { cargar() }, [])

  async function invitar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const { data } = await supabase.auth.getSession()
    const r = await fetch("/.netlify/functions/invitar", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.session?.access_token },
      body: JSON.stringify(f)
    })
    const j = await r.json().catch(() => ({}))
    if (r.ok) { setMsg({ t: "Listo: creamos su espacio y le enviamos la invitación por email.", ok: true }); setF({ ...f, name: "", email: "" }); cargar() }
    else setMsg({ t: j.error || "No pudimos crear la clienta." })
    setBusy(false)
  }

  return (
    <main>
      <div className="top"><div><p className="eyebrow">Panel de administración</p><h1>Hola, {profile.full_name || "Ceci"} 🌻</h1></div>
        <button className="btn sec" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button></div>
      <h2>Crear nueva clienta</h2>
      <form className="card" onSubmit={invitar}>
        <label htmlFor="n">Nombre y apellido</label><input id="n" required maxLength={120} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <label htmlFor="e">Email</label><input id="e" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <label htmlFor="s">Servicio contratado</label>
        <select id="s" value={f.template} onChange={e => setF({ ...f, template: e.target.value })}>{tpls.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <label htmlFor="d">Fecha de inicio</label><input id="d" type="date" required value={f.start} onChange={e => setF({ ...f, start: e.target.value })} />
        <button className="btn" disabled={busy}>{busy ? "Creando…" : "Crear y enviar invitación"}</button>
        {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}
      </form>
      <h2>Tus clientas</h2>
      {rows.length === 0 && <p className="small">Todavía no creaste ninguna clienta.</p>}
      {rows.map(r => (
        <div className="card" key={r.id}><strong>{r.client?.full_name || r.client?.email}</strong>
          <p className="small">{r.client?.email} · {r.service_name} · desde {r.start_date}</p><span className="badge">{r.status}</span></div>
      ))}
    </main>
  )
}
