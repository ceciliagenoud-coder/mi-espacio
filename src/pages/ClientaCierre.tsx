import { useEffect, useState } from "react"
import DOMPurify from "dompurify"
import { supabase } from "../lib/supabase"

const CAMPOS: [string, string][] = [["avances", "Tus principales avances"], ["pendientes", "Lo que queda por desarrollar"], ["recomendaciones", "Mis recomendaciones para los próximos meses"], ["recursos", "Recursos que podés seguir consultando"]]

export default function Cierre() {
  const [d, setD] = useState<any>(null); const [fb, setFb] = useState<any>(null)
  const [f, setF] = useState({ rating: "5", comment: "", consent: false }); const [msg, setMsg] = useState("")
  useEffect(() => {
    Promise.all([
      supabase.from("accompaniments").select("id,initial_goals").limit(1), supabase.from("closing_reports").select("*").limit(1),
      supabase.from("meetings").select("title,status").order("position"), supabase.from("meeting_summaries").select("topics_done"),
      supabase.from("tasks").select("title,status"), supabase.from("feedback").select("*").limit(1)
    ]).then(([a, c, m, s, t, g]) => { setD({ acc: a.data?.[0], c: c.data?.[0], m: m.data || [], s: s.data || [], t: t.data || [] }); setFb(g.data?.[0] || null) })
  }, [])
  async function enviar(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    const body = { accompaniment_id: d.acc.id, rating: Number(f.rating), comment: f.comment.trim() || null, testimonial_consent: f.consent, consent_at: f.consent ? new Date().toISOString() : null }
    const { error } = await supabase.from("feedback").insert(body)
    if (error) return setMsg("No pudimos enviar tu feedback. Probá de nuevo.")
    setFb(body)
  }
  if (!d) return <p className="small">Cargando…</p>
  if (!d.c) return <p className="small">Tu ficha de cierre todavía no está publicada.</p>
  const hechos = d.m.filter((x: any) => x.status === "completada"), tareas = d.t.filter((x: any) => x.status === "completada"), temas = d.s.map((x: any) => x.topics_done).filter(Boolean)
  const html = (h: string) => <div className="rich" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(h) }} />
  return (<>
    {d.c.closing_message && <div className="card hero"><p style={{ whiteSpace: "pre-wrap" }}>{d.c.closing_message}</p></div>}
    <div className="card"><h2 style={{ marginTop: 0 }}>Mirá todo lo que avanzaste</h2>
      {d.acc?.initial_goals && <p><span className="small">Objetivos iniciales</span><br />{d.acc.initial_goals}</p>}
      <p style={{ marginTop: 10 }}><span className="small">Encuentros realizados: {hechos.length}</span><br />{hechos.map((x: any) => x.title).join(" · ")}</p>
      {temas.length > 0 && <p style={{ marginTop: 10 }}><span className="small">Temas que trabajamos</span><br />{temas.join(" · ")}</p>}
      <p style={{ marginTop: 10 }}><span className="small">Acciones completadas: {tareas.length} de {d.t.length}</span></p>
      {CAMPOS.map(([k, l]) => d.c.content?.[k] && <div className="sec" key={k}><strong>{l}</strong>{html(d.c.content[k])}</div>)}
    </div>
    <div className="card mine"><h2 style={{ marginTop: 0 }}>Tu opinión sobre la mentoría</h2>
      {fb ? <p>¡Gracias por tu feedback! 🌻</p> : <form onSubmit={enviar}>
        <label htmlFor="fr">¿Cómo fue tu experiencia?</label>
        <select id="fr" value={f.rating} onChange={e => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} de 5</option>)}</select>
        <label htmlFor="fc">¿Qué te llevás? ¿Qué mejorarías?</label><textarea id="fc" maxLength={2000} value={f.comment} onChange={e => setF({ ...f, comment: e.target.value })} />
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><input type="checkbox" style={{ width: 20, marginTop: 3 }} checked={f.consent} onChange={e => setF({ ...f, consent: e.target.checked })} />
          Autorizo expresamente a Ceci G Marketing a usar mi comentario como testimonio con fines comerciales. (Es opcional.)</label>
        <button className="btn">Enviar feedback</button>{msg && <p className="err" role="status">{msg}</p>}</form>}
    </div>
  </>)
}
