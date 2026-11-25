import { useState } from "react"
import { supabase } from "../lib/supabase"
import Editor from "../components/Editor"

const CAMPOS: [string, string][] = [["avances", "Principales avances"], ["pendientes", "Aspectos que quedan por desarrollar"], ["recomendaciones", "Recomendaciones para los próximos meses"], ["recursos", "Recursos que puede seguir consultando"]]

export default function AdminCierre({ accId }: { accId: string }) {
  const [open, setOpen] = useState(false); const [a, setA] = useState<any>(null); const [c, setC] = useState<any>(null); const [fb, setFb] = useState<any>(null)
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)
  async function abrir() {
    setOpen(true)
    const ac = await supabase.from("accompaniments").select("initial_goals,access_until,status").eq("id", accId).single()
    const cr = await supabase.from("closing_reports").select("*").eq("accompaniment_id", accId).maybeSingle()
    const f = await supabase.from("feedback").select("*").eq("accompaniment_id", accId).maybeSingle()
    setA({ goals: ac.data?.initial_goals || "", until: ac.data?.access_until || "", status: ac.data?.status })
    setC(cr.data || { content: {}, closing_message: "", status: "borrador" }); setFb(f.data)
  }
  async function guardar(status: string) {
    setMsg(null)
    const e1 = await supabase.from("accompaniments").update({ initial_goals: a.goals.trim() || null, access_until: a.until || null }).eq("id", accId)
    const e2 = await supabase.from("closing_reports").upsert({ accompaniment_id: accId, content: c.content, closing_message: c.closing_message?.trim() || null, status, published_at: status === "publicado" ? (c.published_at || new Date().toISOString()) : null }, { onConflict: "accompaniment_id" })
    if (e1.error || e2.error) return setMsg({ t: "No pudimos guardar. Probá de nuevo." })
    setC({ ...c, status }); setMsg({ t: status === "publicado" ? "Ficha publicada: ya la ve la clienta ✓" : "Borrador guardado ✓", ok: true })
  }
  async function finalizar() {
    if (!confirm("¿Finalizar este acompañamiento? Seguirá viendo su espacio hasta la fecha de acceso que configuraste (o sin límite, si la dejaste vacía).")) return
    const { error } = await supabase.from("accompaniments").update({ status: "finalizado" }).eq("id", accId)
    if (error) return setMsg({ t: "No pudimos finalizarlo." })
    setA({ ...a, status: "finalizado" }); setMsg({ t: "Acompañamiento finalizado ✓", ok: true })
  }
  return (<>
    <h2>Cierre del acompañamiento</h2>
    {!open ? <p><button className="btn sec" onClick={abrir}>Abrir ficha de cierre</button></p> : !a ? <p className="small">Cargando…</p> : <div className="card" style={{ borderColor: "var(--rosa)" }}>
      <p className="eyebrow">Ficha de cierre · {c.status === "publicado" ? "Publicada" : "Borrador"} · {a.status === "finalizado" ? "Acompañamiento finalizado" : "Acompañamiento activo"}</p>
      <p className="small">Los encuentros realizados, los temas y las acciones completadas se arman solos con lo que ya cargaste.</p>
      <label htmlFor="og">Objetivos iniciales</label><textarea id="og" value={a.goals} onChange={e => setA({ ...a, goals: e.target.value })} />
      {CAMPOS.map(([k, l]) => <Editor key={k} label={l} value={c.content?.[k] || ""} onChange={h => setC((x: any) => ({ ...x, content: { ...x.content, [k]: h } }))} />)}
      <label htmlFor="mc">Mensaje personalizado de cierre</label><textarea id="mc" value={c.closing_message || ""} onChange={e => setC({ ...c, closing_message: e.target.value })} />
      <label htmlFor="au">Acceso al panel hasta (dejalo vacío para no poner límite)</label><input id="au" type="date" value={a.until} onChange={e => setA({ ...a, until: e.target.value })} />
      <p className="small">Cuando pase esa fecha, la clienta ya no puede ingresar a su espacio.</p>
      <button className="btn sec" onClick={() => guardar("borrador")}>Guardar borrador</button>{" "}
      <button className="btn" onClick={() => guardar("publicado")}>{c.status === "publicado" ? "Actualizar ficha" : "Publicar ficha de cierre"}</button>{" "}
      {a.status !== "finalizado" && <button className="btn sec" onClick={finalizar}>Finalizar acompañamiento</button>}
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}
      <h2>Feedback de la clienta</h2>
      {!fb ? <p className="small">Todavía no dejó su feedback.</p> : <div className="mine card"><p>Puntaje: {fb.rating} de 5</p>{fb.comment && <p>{fb.comment}</p>}
        <p className="small">Autorización para usar su comentario como testimonio comercial: <strong>{fb.testimonial_consent ? "Sí" : "No"}</strong></p></div>}
    </div>}
  </>)
}
