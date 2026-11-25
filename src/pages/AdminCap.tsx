import { useEffect, useState } from "react"
import DOMPurify from "dompurify"
import { supabase } from "../lib/supabase"
import Editor from "../components/Editor"

export const EX_STATUS: any = { pendiente: "Pendiente", en_proceso: "En proceso", entregado: "Entregado", necesita_correcciones: "Necesita correcciones", completado: "Completado" }
const fbOf = (s: any) => Array.isArray(s.exercise_feedback) ? s.exercise_feedback[0] : s.exercise_feedback

function Devolucion({ sub, onDone }: { sub: any; onDone: () => void }) {
  const [h, setH] = useState(""); const [nc, setNc] = useState(false); const [msg, setMsg] = useState("")
  async function enviar() {
    const { error } = await supabase.from("exercise_feedback").insert({ submission_id: sub.id, content_html: h || null, needs_changes: nc })
    if (error) return setMsg("No pudimos publicar la devolución."); onDone()
  }
  return (<div className="mine card" style={{ marginTop: 10 }}>
    <Editor label="Tu devolución (fortalezas, aspectos por mejorar, correcciones, recomendaciones)" value="" onChange={setH} />
    <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" style={{ width: 20 }} checked={nc} onChange={e => setNc(e.target.checked)} /> Necesita correcciones (puede enviar una nueva versión)</label>
    <button className="btn" onClick={enviar}>Publicar devolución</button>{msg && <p className="err" role="status">{msg}</p>}</div>)
}

export function AdminEjercicios({ accId, metas }: { accId: string; metas: any[] }) {
  const [list, setList] = useState<any[]>([]); const [msg, setMsg] = useState("")
  const [f, setF] = useState({ title: "", goal: "", instr: "", due: "", meeting: "", pub: true })
  const cargar = () => supabase.from("exercises").select("*, exercise_submissions(*, exercise_feedback(*))").eq("accompaniment_id", accId).order("created_at", { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => { cargar() }, [accId])
  async function crear(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    const { error } = await supabase.from("exercises").insert({ accompaniment_id: accId, meeting_id: f.meeting || null, title: f.title.trim(), goal: f.goal.trim() || null, instructions: f.instr.trim() || null, due_date: f.due || null, published: f.pub })
    if (error) return setMsg("No pudimos crear el ejercicio.")
    setF({ ...f, title: "", goal: "", instr: "", due: "" }); cargar()
  }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return (<>
    <h2>Ejercicios prácticos</h2>
    <form className="card" onSubmit={crear}>
      <label htmlFor="xt">Título</label><input id="xt" required value={f.title} onChange={set("title")} />
      <label htmlFor="xg">Objetivo</label><input id="xg" value={f.goal} onChange={set("goal")} />
      <label htmlFor="xi">Consigna e instrucciones</label><textarea id="xi" value={f.instr} onChange={set("instr")} />
      <label htmlFor="xc">Clase relacionada (opcional)</label>
      <select id="xc" value={f.meeting} onChange={set("meeting")}><option value="">Ninguna</option>{metas.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
      <label htmlFor="xd">Fecha de entrega (opcional)</label><input id="xd" type="date" value={f.due} onChange={set("due")} />
      <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" style={{ width: 20 }} checked={f.pub} onChange={e => setF({ ...f, pub: e.target.checked })} /> Publicar para la alumna (si no, queda como borrador)</label>
      <button className="btn">Crear ejercicio</button>{msg && <p className="err" role="status">{msg}</p>}
    </form>
    {list.length === 0 && <p className="small">Todavía no creaste ejercicios.</p>}
    {list.map(x => {
      const subs = [...(x.exercise_submissions || [])].sort((a: any, b: any) => b.version - a.version), ult = subs[0]
      return (<div className="card" key={x.id}><strong>{x.title}</strong> {!x.published && <span className="badge">Borrador</span>}
        <p className="small">{x.due_date ? "Entrega: " + x.due_date : "Sin fecha"} · <span className="badge">{EX_STATUS[x.status]}</span></p>
        {subs.map((s: any) => <div className="card mine" key={s.id} style={{ marginTop: 10 }}>
          <p className="small">Versión {s.version} · {s.status === "enviada" ? "Enviada" : "Borrador de la alumna"}</p>
          {s.answer && <p style={{ whiteSpace: "pre-wrap" }}>{s.answer}</p>}
          {s.links && <p style={{ whiteSpace: "pre-wrap" }}>{s.links.split("\n").filter(Boolean).map((l: string, i: number) => <span key={i}><a href={/^https:\/\//.test(l.trim()) ? l.trim() : undefined} target="_blank" rel="noopener noreferrer">{l}</a><br /></span>)}</p>}
          {fbOf(s) && <div className="sec"><strong>Tu devolución{fbOf(s).needs_changes ? " (pediste correcciones)" : ""}</strong><div className="rich" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fbOf(s).content_html || "") }} /></div>}
          {s.status === "enviada" && !fbOf(s) && <Devolucion sub={s} onDone={cargar} />}</div>)}
        <p style={{ marginTop: 8 }}><button className="lnk" onClick={async () => { if (confirm("¿Eliminar este ejercicio y sus entregas?")) { await supabase.from("exercises").delete().eq("id", x.id); cargar() } }}>Eliminar ejercicio</button></p></div>)
    })}
  </>)
}
