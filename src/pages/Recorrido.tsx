import { useEffect, useState } from "react"
import DOMPurify from "dompurify"
import { supabase } from "../lib/supabase"

const ESTADOS: any = { pendiente_agendar: "Pendiente de agendar", agendada: "Agendada", completada: "Completada", reprogramada: "Reprogramada" }
const SECCIONES: [string, string][] = [["summary_html", "Lo que trabajamos juntas"], ["conclusions_html", "Conclusiones"], ["recommendations_html", "Mis recomendaciones para vos"], ["next_steps_html", "Tus próximos pasos"]]

export default function Recorrido({ profile }: { profile: any }) {
  const [meets, setMeets] = useState<any[] | null>(null)
  const [sums, setSums] = useState<any>({})
  useEffect(() => {
    supabase.from("meetings").select("*").order("position").then(({ data }) => setMeets(data || []))
    supabase.from("meeting_summaries").select("*").then(({ data }) => setSums(Object.fromEntries((data || []).map((x: any) => [x.meeting_id, x]))))
  }, [])
  const fecha = (d: string) => d ? new Intl.DateTimeFormat("es-AR", { dateStyle: "full", timeStyle: "short", timeZone: profile.timezone }).format(new Date(d)) + " (" + profile.timezone + ")" : "Fecha a coordinar"
  return (
    <div>
      {meets === null && <p className="small">Cargando…</p>}
      {meets?.length === 0 && <p className="small">Todavía no tenés encuentros cargados.</p>}
      {meets?.map(m => {
        const s = sums[m.id]
        return (
          <div className="card" key={m.id}><strong>{m.title}</strong><p className="small">{fecha(m.starts_at)}</p>
            <span className="badge">{ESTADOS[m.status]}</span>
            {m.meet_url && <p style={{ marginTop: 10 }}><a href={m.meet_url} target="_blank" rel="noopener noreferrer">Entrar a Google Meet</a></p>}
            {s && <div style={{ marginTop: 8 }}>
              {s.topics_done && <p className="small" style={{ marginTop: 10 }}>Temas: {s.topics_done}</p>}
              {SECCIONES.map(([k, l]) => s[k] && <div className="sec" key={k}><strong>{l}</strong><div className="rich" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(s[k]) }} /></div>)}
              {s.recording_url && <p style={{ marginTop: 14 }}><a className="btn" style={{ display: "inline-block", textDecoration: "none" }} href={s.recording_url} target="_blank" rel="noopener noreferrer">Accedé a tu grabación</a></p>}
            </div>}
          </div>)
      })}
    </div>
  )
}
