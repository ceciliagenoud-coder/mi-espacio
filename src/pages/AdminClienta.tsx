import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import Resumen from "./Resumen"
import AdminAudit from "./AdminAudit"
import { AdminTareas, AdminRecursos, AdminNotas } from "./AdminSecciones"

const ESTADOS: any = { pendiente_agendar: "Pendiente de agendar", agendada: "Agendada", completada: "Completada", reprogramada: "Reprogramada" }
const aLocal = (iso: string) => { if (!iso) return ""; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }

function Encuentro({ m }: { m: any }) {
  const [f, setF] = useState({ title: m.title, objective: m.objective || "", status: m.status, starts: aLocal(m.starts_at), dur: m.duration_min || 60, meet: m.meet_url || "" })
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    if (f.meet && !/^https:\/\//.test(f.meet.trim())) return setMsg({ t: "El enlace de Meet tiene que empezar con https://" })
    const status = f.starts && f.status === "pendiente_agendar" ? "agendada" : f.status
    const { error } = await supabase.from("meetings").update({
      title: f.title.trim(), objective: f.objective.trim() || null, status,
      starts_at: f.starts ? new Date(f.starts).toISOString() : null, duration_min: Number(f.dur) || 60, meet_url: f.meet.trim() || null
    }).eq("id", m.id)
    if (error) return setMsg({ t: "No pudimos guardar los cambios. Probá de nuevo." })
    setF({ ...f, status }); setMsg({ t: "Guardado ✓", ok: true })
  }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return (
    <div>
    <form className="card" onSubmit={guardar}>
      <p className="eyebrow">{m.kind === "auditoria" ? "Auditoría" : "Mentoría"} {m.position}</p>
      <label htmlFor={"t" + m.id}>Título</label><input id={"t" + m.id} required value={f.title} onChange={set("title")} />
      <label htmlFor={"o" + m.id}>Objetivo (opcional)</label><input id={"o" + m.id} value={f.objective} onChange={set("objective")} />
      <label htmlFor={"s" + m.id}>Estado</label>
      <select id={"s" + m.id} value={f.status} onChange={set("status")}>{Object.keys(ESTADOS).map(k => <option key={k} value={k}>{ESTADOS[k]}</option>)}</select>
      <label htmlFor={"d" + m.id}>Fecha y hora (en la hora de tu computadora)</label><input id={"d" + m.id} type="datetime-local" value={f.starts} onChange={set("starts")} />
      <label htmlFor={"u" + m.id}>Duración (minutos)</label><input id={"u" + m.id} type="number" min={15} max={300} value={f.dur} onChange={set("dur")} />
      <label htmlFor={"m" + m.id}>Enlace de Google Meet</label><input id={"m" + m.id} type="url" placeholder="https://meet.google.com/..." value={f.meet} onChange={set("meet")} />
      <button className="btn">Guardar encuentro</button>
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}
    </form>
    <Resumen m={m} />
    </div>
  )
}

export default function AdminClienta() {
  const { id } = useParams()
  const [a, setA] = useState<any>(null)
  const [meets, setMeets] = useState<any[] | null>(null)
  useEffect(() => {
    supabase.from("accompaniments").select("client_id,service_name,status,start_date,client:profiles!accompaniments_client_id_fkey(full_name,email,timezone)").eq("id", id).single().then(({ data }) => setA(data))
    supabase.from("meetings").select("*").eq("accompaniment_id", id).order("position").then(({ data }) => setMeets(data || []))
  }, [id])
  return (
    <main>
      <p className="small"><Link to="/admin">← Volver a tus clientas</Link></p>
      <h1 style={{ marginTop: 12 }}>{a?.client?.full_name || "Clienta"}</h1>
      <p className="small">{a?.client?.email} · {a?.service_name} · zona horaria de ella: {a?.client?.timezone}</p>
      <h2>Encuentros</h2>
      {meets === null && <p className="small">Cargando…</p>}
      {meets?.map(m => <Encuentro key={m.id} m={m} />)}
      <AdminAudit accId={id!} />
      <AdminTareas accId={id!} />
      <AdminRecursos accId={id!} />
      {a?.client_id && <AdminNotas clientId={a.client_id} />}
    </main>
  )
}
