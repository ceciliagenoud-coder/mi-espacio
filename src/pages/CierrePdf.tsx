import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import DOMPurify from "dompurify"
import { supabase } from "../lib/supabase"

const CAMPOS: [string, string][] = [["avances", "Principales avances"], ["pendientes", "Lo que queda por desarrollar"], ["recomendaciones", "Recomendaciones para los próximos meses"], ["recursos", "Recursos que podés seguir consultando"]]

export default function CierrePdf() {
  const { id } = useParams(); const [d, setD] = useState<any>(null)
  useEffect(() => {
    Promise.all([
      supabase.from("accompaniments").select("service_name,initial_goals,client:profiles!accompaniments_client_id_fkey(full_name)").eq("id", id).single(),
      supabase.from("closing_reports").select("*").eq("accompaniment_id", id).maybeSingle(),
      supabase.from("meetings").select("id,title,status").eq("accompaniment_id", id).order("position"),
      supabase.from("tasks").select("title,status").eq("accompaniment_id", id)
    ]).then(async ([a, c, m, t]) => {
      const ids = (m.data || []).map((x: any) => x.id)
      const s: any = ids.length ? await supabase.from("meeting_summaries").select("topics_done").in("meeting_id", ids) : { data: [] }
      setD({ a: a.data, c: c.data, m: m.data || [], t: t.data || [], temas: (s.data || []).map((x: any) => x.topics_done).filter(Boolean) })
    })
  }, [id])
  if (!d) return <main><p className="small">Preparando el documento…</p></main>
  const hechos = d.m.filter((x: any) => x.status === "completada"), tareas = d.t.filter((x: any) => x.status === "completada")
  return (
    <main>
      <p className="noprint"><Link to={"/admin/clienta/" + id}>← Volver al perfil</Link></p>
      <div className="noprint card" style={{ marginTop: 12 }}><p className="small">Tocá el botón y, en la ventana que se abre, elegí <strong>Guardar como PDF</strong> como destino. Tildá la opción <strong>Gráficos de fondo</strong> para que se vean los colores. Esta vista muestra lo que cargaste, aunque la ficha todavía esté en borrador.</p>
        <button className="btn" onClick={() => window.print()}>Descargar PDF</button></div>
      <p className="eyebrow" style={{ marginTop: 24 }}>Ceci G Marketing</p>
      <h1>Cierre de tu acompañamiento 🌻</h1>
      <p className="small">{d.a?.client?.full_name} · {d.a?.service_name} · {new Date().toLocaleDateString("es-AR", { dateStyle: "long" })}</p>
      {d.c?.closing_message && <div className="card hero" style={{ marginTop: 20 }}><p style={{ whiteSpace: "pre-wrap" }}>{d.c.closing_message}</p></div>}
      <h2>Mirá todo lo que avanzaste</h2>
      {d.a?.initial_goals && <p><span className="small">Objetivos iniciales</span><br />{d.a.initial_goals}</p>}
      <p style={{ marginTop: 10 }}><span className="small">Encuentros realizados: {hechos.length}</span><br />{hechos.map((x: any) => x.title).join(" · ")}</p>
      {d.temas.length > 0 && <p style={{ marginTop: 10 }}><span className="small">Temas que trabajamos</span><br />{d.temas.join(" · ")}</p>}
      <p style={{ marginTop: 10 }}><span className="small">Acciones completadas: {tareas.length} de {d.t.length}</span></p>
      {CAMPOS.map(([k, l]) => d.c?.content?.[k] && <div className="sec" key={k}><strong>{l}</strong><div className="rich" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(d.c.content[k]) }} /></div>)}
    </main>
  )
}
