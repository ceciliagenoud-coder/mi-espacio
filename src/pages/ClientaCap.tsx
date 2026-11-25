import { useEffect, useState } from "react"
import DOMPurify from "dompurify"
import { supabase } from "../lib/supabase"
import { R_FMT } from "../lib/labels"
import { EX_STATUS } from "./AdminCap"

const ROL: any = { antes: "Obligatorio antes", despues: "Obligatorio después", complementario: "Complementario", opcional: "Consulta opcional" }
const H = (h: string) => <div className="rich" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(h) }} />
const fbOf = (s: any) => Array.isArray(s.exercise_feedback) ? s.exercise_feedback[0] : s.exercise_feedback

export function Clases({ profile }: { profile: any }) {
  const [d, setD] = useState<any>(null); const [vista, setVista] = useState<any>({})
  useEffect(() => {
    Promise.all([supabase.from("meetings").select("*").order("position"), supabase.from("meeting_summaries").select("*"),
      supabase.from("resource_assignments").select("id,role,meeting_id,resource:resources(title,url,format)")])
      .then(([m, s, r]) => setD({ m: m.data || [], s: Object.fromEntries((s.data || []).map((x: any) => [x.meeting_id, x])), r: r.data || [] }))
  }, [])
  if (!d) return <p className="small">Cargando…</p>
  if (!d.m.length) return <p className="small">Todavía no hay clases publicadas. Apenas estén listas, las vas a ver acá.</p>
  const lista = (rs: any[]) => rs.map(x => <p key={x.id} style={{ marginBottom: 6 }}><a href={x.resource?.url} target="_blank" rel="noopener noreferrer">{x.resource?.title}</a> <span className="small">· {R_FMT[x.resource?.format]}</span></p>)
  return (<>{d.m.map((c: any) => {
    const v = vista[c.id] || "antes", s = d.s[c.id], rs = d.r.filter((x: any) => x.meeting_id === c.id)
    const fecha = c.starts_at ? new Intl.DateTimeFormat("es-AR", { dateStyle: "full", timeStyle: "short", timeZone: profile.timezone }).format(new Date(c.starts_at)) : "Fecha a coordinar"
    return (<div className="card" key={c.id}>
      <p className="eyebrow">Clase {c.position}</p><h2 style={{ marginTop: 0 }}>{c.title}</h2><p className="small">{fecha}</p>
      {c.learning_goal && <p className="msg" style={{ marginTop: 10 }}>{c.learning_goal}</p>}
      <div className="chips" role="group" aria-label="Momentos de la clase">{[["antes", "Antes"], ["durante", "Durante"], ["despues", "Después"]].map(([k, l]) => <button key={k} className="chip" aria-pressed={v === k} onClick={() => setVista({ ...vista, [c.id]: k })}>{l}</button>)}</div>
      {v === "antes" && <>{c.description && <p>{c.description}</p>}{c.prep_html ? H(c.prep_html) : <p className="small">Todavía no hay preparación cargada.</p>}
        {rs.filter((x: any) => x.role === "antes").length > 0 && <div className="sec"><strong>Material para ver antes</strong>{lista(rs.filter((x: any) => x.role === "antes"))}</div>}
        {c.meet_url && <p style={{ marginTop: 12 }}><a className="btn" style={{ display: "inline-block", textDecoration: "none" }} href={c.meet_url} target="_blank" rel="noopener noreferrer">Entrar a Google Meet</a></p>}</>}
      {v === "durante" && (c.during_html ? H(c.during_html) : <p className="small">El temario de la clase aparece acá cuando esté listo.</p>)}
      {v === "despues" && <>{!s && <p className="small">Después de la clase vas a encontrar acá el resumen y la grabación.</p>}
        {s && [["topics_done", "Temas trabajados"]].map(([k, l]) => s[k] && <p key={k}><span className="small">{l}</span><br />{s[k]}</p>)}
        {s && [["summary_html", "Lo que aprendimos"], ["recommendations_html", "Recomendaciones"], ["next_steps_html", "Próximos pasos"]].map(([k, l]) => s[k] && <div className="sec" key={k}><strong>{l}</strong>{H(s[k])}</div>)}
        {s?.recording_url && <p style={{ marginTop: 12 }}><a className="btn" style={{ display: "inline-block", textDecoration: "none" }} href={s.recording_url} target="_blank" rel="noopener noreferrer">Accedé a tu grabación</a></p>}
        {rs.filter((x: any) => x.role !== "antes").length > 0 && <div className="sec"><strong>Material de la clase</strong>{lista(rs.filter((x: any) => x.role !== "antes"))}</div>}</>}
    </div>)
  })}</>)
}

export function Material() {
  const [list, setList] = useState<any[] | null>(null)
  const cargar = () => supabase.from("resource_assignments").select("id,role,reviewed_at,meeting:meetings(title),resource:resources(title,url,format,description)").order("assigned_at", { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => { cargar() }, [])
  if (!list) return <p className="small">Cargando…</p>
  if (!list.length) return <p className="small">Todavía no tenés material de estudio asignado.</p>
  return (<>{list.map(x => <div className="card" key={x.id}><strong>{x.resource?.title}</strong> <span className="badge">{ROL[x.role]}</span>
    <p className="small">{R_FMT[x.resource?.format]}{x.meeting?.title ? " · " + x.meeting.title : ""}</p>
    {x.resource?.description && <p>{x.resource.description}</p>}
    <p><a className="btn" style={{ display: "inline-block", textDecoration: "none" }} href={x.resource?.url} target="_blank" rel="noopener noreferrer">Abrir material</a></p>
    <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" style={{ width: 20 }} checked={!!x.reviewed_at}
      onChange={async e => { await supabase.from("resource_assignments").update({ reviewed_at: e.target.checked ? new Date().toISOString() : null }).eq("id", x.id); cargar() }} /> Marcar como revisado</label></div>)}</>)
}

function Ejercicio({ x, onChange }: { x: any; onChange: () => void }) {
  const subs = [...(x.exercise_submissions || [])].sort((a: any, b: any) => b.version - a.version), ult = subs[0]
  const editable = ult?.status === "borrador" ? ult : null
  const puedeNueva = !ult || (ult.status === "enviada" && x.status === "necesita_correcciones")
  const [f, setF] = useState({ answer: editable?.answer || "", links: editable?.links || "" }); const [nueva, setNueva] = useState(false); const [msg, setMsg] = useState("")
  async function guardar(status: string) {
    setMsg("")
    for (const l of f.links.split("\n").map(s => s.trim()).filter(Boolean)) if (!/^https:\/\//.test(l)) return setMsg("Cada enlace tiene que empezar con https://")
    if (status === "enviada" && !confirm("¿Querés enviar este ejercicio para revisión?")) return
    const body = { answer: f.answer.trim() || null, links: f.links.trim() || null, status }
    const { error } = editable ? await supabase.from("exercise_submissions").update(body).eq("id", editable.id)
      : await supabase.from("exercise_submissions").insert({ ...body, exercise_id: x.id, version: (ult?.version || 0) + 1 })
    if (error) return setMsg("No pudimos guardar. Probá de nuevo.")
    setNueva(false); onChange()
  }
  return (<div className="card"><strong>{x.title}</strong> <span className="badge">{EX_STATUS[x.status]}</span>
    <p className="small">{x.due_date ? "Para el " + x.due_date : "Sin fecha de entrega"}</p>
    {x.goal && <p>{x.goal}</p>}{x.instructions && <p style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{x.instructions}</p>}
    {subs.filter((s: any) => s.status === "enviada").map((s: any) => <div className="card mine" key={s.id} style={{ marginTop: 10 }}>
      <p className="small">Tu entrega · versión {s.version}</p>{s.answer && <p style={{ whiteSpace: "pre-wrap" }}>{s.answer}</p>}{s.links && <p style={{ whiteSpace: "pre-wrap" }}>{s.links}</p>}
      {fbOf(s) && <div className="sec"><strong>Devolución de Ceci</strong>{H(fbOf(s).content_html || "")}</div>}</div>)}
    {(editable || (puedeNueva && (nueva || !ult))) ? <>
      <label htmlFor={"a" + x.id}>Tu respuesta o comentarios</label><textarea id={"a" + x.id} value={f.answer} onChange={e => setF({ ...f, answer: e.target.value })} />
      <label htmlFor={"l" + x.id}>Enlaces a tu trabajo (Canva, Drive, Trello o Notion; uno por línea)</label><textarea id={"l" + x.id} value={f.links} onChange={e => setF({ ...f, links: e.target.value })} />
      <button className="btn sec" onClick={() => guardar("borrador")}>Guardar borrador</button>{" "}<button className="btn" onClick={() => guardar("enviada")}>Enviar para revisión</button></>
      : puedeNueva ? <button className="btn" onClick={() => { setNueva(true); setF({ answer: "", links: "" }) }}>Enviar una nueva versión</button> : null}
    {msg && <p className="err" role="status">{msg}</p>}</div>)
}

export function Ejercicios() {
  const [list, setList] = useState<any[] | null>(null)
  const cargar = () => supabase.from("exercises").select("*, exercise_submissions(*, exercise_feedback(*))").order("created_at", { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => { cargar() }, [])
  if (!list) return <p className="small">Cargando…</p>
  if (!list.length) return <p className="small">Todavía no tenés ejercicios. Cuando te asigne uno, lo vas a ver acá.</p>
  return <>{list.map(x => <Ejercicio key={x.id + "-" + (x.exercise_submissions || []).length + x.status} x={x} onChange={cargar} />)}</>
}
