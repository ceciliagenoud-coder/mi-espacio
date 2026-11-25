import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

const ESTADOS: any = { pendiente_agendar: "Pendiente de agendar", agendada: "Agendada", completada: "Completada", reprogramada: "Reprogramada" }

export default function Clienta({ profile }: { profile: any }) {
  const [meets, setMeets] = useState<any[] | null>(null)
  useEffect(() => { supabase.from("meetings").select("*").order("position").then(({ data }) => setMeets(data || [])) }, [])
  const fecha = (d: string) => d ? new Intl.DateTimeFormat("es-AR", { dateStyle: "full", timeStyle: "short", timeZone: profile.timezone }).format(new Date(d)) + " (" + profile.timezone + ")" : "Fecha a coordinar"
  return (
    <main>
      <div className="top"><div><p className="eyebrow">Mi espacio</p><h1>Hola, {profile.full_name || "bienvenida"} 🌻</h1></div>
        <button className="btn sec" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button></div>
      <h2>Tu recorrido</h2>
      {meets === null && <p className="small">Cargando…</p>}
      {meets?.length === 0 && <p className="small">Todavía no tenés encuentros cargados.</p>}
      {meets?.map(m => (
        <div className="card" key={m.id}><strong>{m.title}</strong><p className="small">{fecha(m.starts_at)}</p>
          <span className="badge">{ESTADOS[m.status]}</span>
          {m.meet_url && <p style={{ marginTop: 10 }}><a href={m.meet_url} target="_blank" rel="noopener noreferrer">Entrar a Google Meet</a></p>}</div>
      ))}
    </main>
  )
}
