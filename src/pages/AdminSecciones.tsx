import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { T_STATUS, T_CAT, PRIO, opts } from "../lib/labels"

export function AdminTareas({ accId }: { accId: string }) {
  const [list, setList] = useState<any[]>([])
  const [f, setF] = useState({ title: "", description: "", due: "", priority: "media", category: "estrategia" })
  const [msg, setMsg] = useState("")
  const cargar = () => supabase.from("tasks").select("*").eq("accompaniment_id", accId).order("created_at", { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => { cargar() }, [accId])
  async function crear(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    const { error } = await supabase.from("tasks").insert({ accompaniment_id: accId, title: f.title.trim(), description: f.description.trim() || null, due_date: f.due || null, priority: f.priority, category: f.category })
    if (error) return setMsg("No pudimos crear la tarea.")
    setF({ ...f, title: "", description: "", due: "" }); cargar()
  }
  async function borrar(id: string) { if (!confirm("¿Eliminar esta tarea? No se puede deshacer.")) return; await supabase.from("tasks").delete().eq("id", id); cargar() }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return (<>
    <h2>Plan de acción</h2>
    <form className="card" onSubmit={crear}>
      <label htmlFor="tt">Título de la tarea</label><input id="tt" required value={f.title} onChange={set("title")} />
      <label htmlFor="td">Descripción (opcional)</label><textarea id="td" value={f.description} onChange={set("description")} />
      <label htmlFor="tf">Fecha objetivo (opcional)</label><input id="tf" type="date" value={f.due} onChange={set("due")} />
      <label htmlFor="tp">Prioridad</label><select id="tp" value={f.priority} onChange={set("priority")}>{opts(PRIO)}</select>
      <label htmlFor="tc">Categoría</label><select id="tc" value={f.category} onChange={set("category")}>{opts(T_CAT)}</select>
      <button className="btn">Asignar tarea</button>{msg && <p className="err" role="status">{msg}</p>}
    </form>
    {list.length === 0 && <p className="small">Todavía no asignaste tareas.</p>}
    {list.map(t => <div className="card" key={t.id}><strong>{t.title}</strong>
      <p className="small">{T_CAT[t.category]} · Prioridad {PRIO[t.priority]}{t.due_date ? " · para el " + t.due_date : ""}</p>
      <span className="badge">{T_STATUS[t.status]}</span>
      {t.client_comment && <p className="mine card" style={{ marginTop: 10, marginBottom: 0 }}>Comentario de la clienta: {t.client_comment}</p>}
      <p style={{ marginTop: 8 }}><button className="lnk" onClick={() => borrar(t.id)}>Eliminar</button></p></div>)}
  </>)
}

export function AdminRecursos({ accId, cap, metas }: { accId: string; cap?: boolean; metas?: any[] }) {
  const [mt, setMt] = useState(""); const [rol, setRol] = useState("complementario")
  const [all, setAll] = useState<any[]>([]); const [asg, setAsg] = useState<any[]>([]); const [sel, setSel] = useState(""); const [msg, setMsg] = useState("")
  async function cargar() {
    const r = await supabase.from("resources").select("id,title").order("title"); setAll(r.data || [])
    const a = await supabase.from("resource_assignments").select("id,role,meeting_id,resource:resources(title)").eq("accompaniment_id", accId); setAsg(a.data || [])
  }
  useEffect(() => { cargar() }, [accId])
  async function asignar(e: React.FormEvent) {
    e.preventDefault(); setMsg(""); if (!sel) return setMsg("Elegí un recurso.")
    const { error } = await supabase.from("resource_assignments").insert({ resource_id: sel, accompaniment_id: accId, ...(cap ? { meeting_id: mt || null, role: rol } : {}) })
    if (error) return setMsg(error.code === "23505" ? "Ya tiene ese recurso asignado." : "No pudimos asignarlo.")
    cargar()
  }
  return (<>
    <h2>Recursos asignados</h2>
    <form className="card" onSubmit={asignar}>
      <label htmlFor="rs">Elegí un recurso de tu biblioteca</label>
      <select id="rs" value={sel} onChange={e => setSel(e.target.value)}><option value="">Elegir…</option>{all.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}</select>
      {cap && <><label htmlFor="rm">Clase</label><select id="rm" value={mt} onChange={e => setMt(e.target.value)}><option value="">Sin clase específica</option>{(metas || []).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</select>
      <label htmlFor="rr">Uso del material</label><select id="rr" value={rol} onChange={e => setRol(e.target.value)}><option value="antes">Obligatorio antes de la clase</option><option value="despues">Obligatorio después de la clase</option><option value="complementario">Complementario</option><option value="opcional">Consulta opcional</option></select></>}
      <button className="btn">Asignar recurso</button>{msg && <p className="err" role="status">{msg}</p>}
    </form>
    {asg.length === 0 && <p className="small">Todavía no le asignaste recursos.</p>}
    {asg.map(a => <div className="card" key={a.id}>{a.resource?.title}{cap && <span className="small"> · {({ antes: "antes", despues: "después", complementario: "complementario", opcional: "opcional" } as any)[a.role]}</span>} <button className="lnk" style={{ marginLeft: 12 }} onClick={async () => { await supabase.from("resource_assignments").delete().eq("id", a.id); cargar() }}>Quitar</button></div>)}
  </>)
}

export function AdminNotas({ clientId }: { clientId: string }) {
  const [list, setList] = useState<any[]>([])
  useEffect(() => { supabase.from("client_notes").select("*").eq("owner_id", clientId).eq("shared", true).order("created_at", { ascending: false }).then(({ data }) => setList(data || [])) }, [clientId])
  return (<>
    <h2>Consultas compartidas</h2>
    {list.length === 0 && <p className="small">Todavía no te dejó consultas. Sus notas personales son privadas y no las ves.</p>}
    {list.map(n => <div className="card mine" key={n.id}><p className="small">{new Date(n.created_at).toLocaleDateString("es-AR")} · {n.kind}</p><p>{n.body}</p></div>)}
  </>)
}
