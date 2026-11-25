import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { supabase } from "../lib/supabase"
import Editor from "../components/Editor"
import Resumen from "./Resumen"
import AdminAudit from "./AdminAudit"
import AdminCierre from "./AdminCierre"
import { AdminTareas, AdminRecursos, AdminNotas } from "./AdminSecciones"
import { AdminEjercicios } from "./AdminCap"

const ESTADOS: any = { pendiente_agendar: "Pendiente de agendar", agendada: "Agendada", completada: "Completada", reprogramada: "Reprogramada" }
const aLocal = (iso: string) => { if (!iso) return ""; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16) }

function Encuentro({ m, cap }: { m: any; cap: boolean }) {
  const [f, setF] = useState({ title: m.title, objective: m.objective || "", status: m.status, starts: aLocal(m.starts_at), dur: m.duration_min || 60, meet: m.meet_url || "",
    goal: m.learning_goal || "", desc: m.description || "", prep: m.prep_html || "", during: m.during_html || "", pub: m.published })
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    if (f.meet && !/^https:\/\//.test(f.meet.trim())) return setMsg({ t: "El enlace de Meet tiene que empezar con https://" })
    const status = f.starts && f.status === "pendiente_agendar" ? "agendada" : f.status
    const { error } = await supabase.from("meetings").update({
      title: f.title.trim(), objective: f.objective.trim() || null, status,
      starts_at: f.starts ? new Date(f.starts).toISOString() : null, duration_min: Number(f.dur) || 60, meet_url: f.meet.trim() || null,
      ...(cap ? { learning_goal: f.goal.trim() || null, description: f.desc.trim() || null, prep_html: f.prep || null, during_html: f.during || null, published: f.pub } : {})
    }).eq("id", m.id)
    if (error) return setMsg({ t: "No pudimos guardar los cambios. Probá de nuevo." })
    setF({ ...f, status }); setMsg({ t: "Guardado ✓", ok: true })
  }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return (
    <div>
      <form className="card" onSubmit={guardar}>
        <p className="eyebrow">{m.kind === "auditoria" ? "Auditoría" : cap ? "Clase" : "Mentoría"} {m.position}{cap && !f.pub ? " · borrador (la alumna no la ve)" : ""}</p>
        <label htmlFor={"t" + m.id}>Título</label><input id={"t" + m.id} required value={f.title} onChange={set("title")} />
        {!cap && <><label htmlFor={"o" + m.id}>Objetivo (opcional)</label><input id={"o" + m.id} value={f.objective} onChange={set("objective")} /></>}
        {cap && <>
          <label htmlFor={"lg" + m.id}>Objetivo de aprendizaje</label><input id={"lg" + m.id} placeholder="Al finalizar esta clase vas a poder…" value={f.goal} onChange={set("goal")} />
          <label htmlFor={"ds" + m.id}>Descripción de la clase</label><textarea id={"ds" + m.id} value={f.desc} onChange={set("desc")} />
          <Editor label="Antes de la clase: preparación y actividad previa" value={f.prep} onChange={h => setF(x => ({ ...x, prep: h }))} />
          <Editor label="Durante la clase: temario y actividades" value={f.during} onChange={h => setF(x => ({ ...x, during: h }))} />
        </>}
        <label htmlFor={"s" + m.id}>Estado</label>
        <select id={"s" + m.id} value={f.status} onChange={set("status")}>{Object.keys(ESTADOS).map(k => <option key={k} value={k}>{ESTADOS[k]}</option>)}</select>
        <label htmlFor={"d" + m.id}>Fecha y hora (en la hora de tu computadora)</label><input id={"d" + m.id} type="datetime-local" value={f.starts} onChange={set("starts")} />
        <label htmlFor={"u" + m.id}>Duración (minutos)</label><input id={"u" + m.id} type="number" min={15} max={300} value={f.dur} onChange={set("dur")} />
        <label htmlFor={"m" + m.id}>Enlace de Google Meet</label><input id={"m" + m.id} type="url" placeholder="https://meet.google.com/..." value={f.meet} onChange={set("meet")} />
        {cap && <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" style={{ width: 20 }} checked={f.pub} onChange={e => setF({ ...f, pub: e.target.checked })} /> Visible para la alumna (si lo destildás, queda como borrador)</label>}
        <button className="btn">Guardar {cap ? "clase" : "encuentro"}</button>
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
  const cargarM = () => supabase.from("meetings").select("*").eq("accompaniment_id", id).order("position").then(({ data }) => setMeets(data || []))
  useEffect(() => {
    supabase.from("accompaniments").select("client_id,kind,service_name,status,start_date,client:profiles!accompaniments_client_id_fkey(full_name,email,timezone)").eq("id", id).single().then(({ data }) => setA(data))
    cargarM()
  }, [id])
  const cap = a?.kind === "capacitacion"
  async function mover(i: number, dir: number) {
    const x = meets![i], y = meets![i + dir]; if (!y) return
    await supabase.from("meetings").update({ position: 0 }).eq("id", x.id)
    await supabase.from("meetings").update({ position: x.position }).eq("id", y.id)
    await supabase.from("meetings").update({ position: y.position }).eq("id", x.id); cargarM()
  }
  async function quitar(m: any) { if (!confirm("¿Eliminar esta clase? Se borran también su resumen y sus materiales asignados.")) return; await supabase.from("meetings").delete().eq("id", m.id); cargarM() }
  async function agregar() {
    const pos = Math.max(0, ...meets!.map(x => x.position)) + 1
    await supabase.from("meetings").insert({ accompaniment_id: id, position: pos, kind: "mentoria", title: "Clase " + pos, published: false }); cargarM()
  }
  return (
    <main>
      <p className="small"><Link to="/admin">← Volver a tus clientas</Link></p>
      <h1 style={{ marginTop: 12 }}>{a?.client?.full_name || "Clienta"}</h1>
      <p className="small">{a?.client?.email} · {a?.service_name} · zona horaria de ella: {a?.client?.timezone}</p>
      <h2>{cap ? "Programa y clases" : "Encuentros"}</h2>
      {meets === null && <p className="small">Cargando…</p>}
      {meets?.map((m, i) => <div key={m.id + "-" + m.position}><Encuentro m={m} cap={cap} />
        {cap && <p style={{ marginBottom: 20 }}><button className="lnk" onClick={() => mover(i, -1)}>Subir clase</button><button className="lnk" onClick={() => mover(i, 1)}>Bajar clase</button><button className="lnk" onClick={() => quitar(m)}>Eliminar clase</button></p>}</div>)}
      {cap && <p><button className="btn sec" onClick={agregar}>Agregar clase</button></p>}
      {cap && <AdminEjercicios accId={id!} metas={meets || []} />}
      <AdminAudit accId={id!} />
      <AdminTareas accId={id!} />
      <AdminRecursos accId={id!} cap={cap} metas={meets || []} />
      {a?.client_id && <AdminNotas clientId={a.client_id} />}
      <AdminCierre accId={id!} />
    </main>
  )
}
