import { useState } from "react"
import { supabase } from "../lib/supabase"
import Editor from "../components/Editor"

const CAMPOS: [string, string][] = [["summary_html", "Resumen de la sesión"], ["conclusions_html", "Principales conclusiones"], ["recommendations_html", "Recomendaciones personalizadas"], ["next_steps_html", "Próximos pasos"]]

export default function Resumen({ m }: { m: any }) {
  const [f, setF] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)

  async function abrir() {
    setOpen(true)
    const { data } = await supabase.from("meeting_summaries").select("*").eq("meeting_id", m.id).maybeSingle()
    setF(data || { status: "borrador", topics_done: "", recording_url: "" })
  }
  async function guardar(status: "borrador" | "publicado") {
    setMsg(null)
    if (f.recording_url && !/^https:\/\//.test(f.recording_url.trim())) return setMsg({ t: "El enlace de la grabación tiene que empezar con https://" })
    const body: any = { meeting_id: m.id, topics_done: f.topics_done || null, recording_url: f.recording_url?.trim() || null, status,
      published_at: status === "publicado" ? (f.published_at || new Date().toISOString()) : null }
    CAMPOS.forEach(([k]) => (body[k] = f[k] || null))
    const { error } = await supabase.from("meeting_summaries").upsert(body, { onConflict: "meeting_id" })
    if (error) return setMsg({ t: "No pudimos guardar. Probá de nuevo." })
    if (status === "publicado") await supabase.from("meetings").update({ status: "completada" }).eq("id", m.id).eq("status", "agendada")
    setF({ ...f, status, published_at: body.published_at })
    setMsg({ t: status === "publicado" ? "Publicado: ya lo ve la clienta ✓" : "Borrador guardado ✓ (la clienta todavía no lo ve)", ok: true })
  }
  if (!open) return <p style={{ marginBottom: 20 }}><button className="btn sec" onClick={abrir}>Resumen y grabación</button></p>
  if (!f) return <p className="small">Cargando…</p>
  return (
    <div className="card" style={{ borderColor: "var(--rosa)" }}>
      <p className="eyebrow">Resumen · {f.status === "publicado" ? "Publicado" : "Borrador"}</p>
      <label htmlFor={"tp" + m.id}>Temas que trabajamos</label>
      <input id={"tp" + m.id} value={f.topics_done || ""} onChange={e => setF({ ...f, topics_done: e.target.value })} />
      {CAMPOS.map(([k, l]) => <Editor key={k} label={l} value={f[k] || ""} onChange={h => setF((x: any) => ({ ...x, [k]: h }))} />)}
      <label htmlFor={"g" + m.id}>Enlace a la grabación</label>
      <input id={"g" + m.id} type="url" placeholder="https://drive.google.com/..." value={f.recording_url || ""} onChange={e => setF({ ...f, recording_url: e.target.value })} />
      <p className="small" style={{ marginTop: 8 }}>Recordá darle permiso de acceso a la grabación en Drive, solo a esta clienta.</p>
      <button className="btn sec" onClick={() => guardar("borrador")}>Guardar borrador</button>{" "}
      <button className="btn" onClick={() => guardar("publicado")}>{f.status === "publicado" ? "Actualizar publicación" : "Publicar para la clienta"}</button>
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}
    </div>
  )
}
