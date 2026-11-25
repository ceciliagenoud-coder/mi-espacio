import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { T_STATUS, T_CAT, PRIO, R_CAT, R_FMT, opts } from "../lib/labels"

export function Tareas() {
  const [list, setList] = useState<any[] | null>(null); const [fil, setFil] = useState("all"); const [msg, setMsg] = useState("")
  useEffect(() => { supabase.from("tasks").select("*").order("assigned_on", { ascending: false }).then(({ data }) => setList(data || [])) }, [])
  async function guardar(t: any, cambios: any) {
    setMsg(""); const { error } = await supabase.from("tasks").update(cambios).eq("id", t.id)
    if (error) return setMsg("No pudimos guardar el cambio. Probá de nuevo.")
    setList(l => l!.map(x => x.id === t.id ? { ...x, ...cambios } : x))
  }
  if (!list) return <p className="small">Cargando…</p>
  const hechas = list.filter(t => t.status === "completada").length, pct = list.length ? Math.round(hechas / list.length * 100) : 0
  return (<>
    <div className="card"><p className="small">Tus acciones completadas: {hechas} de {list.length}</p><div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: pct + "%" }} /></div></div>
    <div className="chips" role="group" aria-label="Filtrar por estado">{["all", ...Object.keys(T_STATUS)].map(k => <button key={k} className="chip" aria-pressed={fil === k} onClick={() => setFil(k)}>{k === "all" ? "Todas" : T_STATUS[k]}</button>)}</div>
    {msg && <p className="err" role="alert">{msg}</p>}
    {list.length === 0 && <p className="small">Todavía no tenés tareas. Cuando las armemos juntas, las vas a ver acá.</p>}
    {list.filter(t => fil === "all" || t.status === fil).map(t => (
      <div className="card" key={t.id}><strong>{t.title}</strong>
        <p className="small">{T_CAT[t.category]} · Prioridad {PRIO[t.priority]}{t.due_date ? " · para el " + t.due_date : ""}</p>
        {t.description && <p style={{ marginTop: 6 }}>{t.description}</p>}
        <label htmlFor={"e" + t.id}>Estado</label>
        <select id={"e" + t.id} value={t.status} onChange={e => guardar(t, { status: e.target.value })}>{opts(T_STATUS)}</select>
        <label htmlFor={"c" + t.id}>Tus comentarios</label>
        <textarea id={"c" + t.id} defaultValue={t.client_comment || ""} onBlur={e => e.target.value !== (t.client_comment || "") && guardar(t, { client_comment: e.target.value.trim() || null })} />
      </div>))}
  </>)
}

export function Recursos() {
  const [list, setList] = useState<any[] | null>(null)
  useEffect(() => { supabase.from("resources").select("*").order("published_at", { ascending: false }).then(({ data }) => setList(data || [])) }, [])
  if (!list) return <p className="small">Cargando…</p>
  if (list.length === 0) return <p className="small">Todavía no tenés recursos asignados.</p>
  return (<>{list.map(r => (
    <div className="card" key={r.id}>
      <strong>{r.title}</strong> {Date.now() - new Date(r.published_at).getTime() < 14 * 864e5 && <span className="badge">Nuevo</span>}
      <p className="small">{R_CAT[r.category]} · {R_FMT[r.format]}{r.duration_min ? " · " + r.duration_min + " min" : ""}</p>
      {r.description && <p style={{ marginTop: 6 }}>{r.description}</p>}
      <p><a className="btn" style={{ display: "inline-block", textDecoration: "none" }} href={r.url} target="_blank" rel="noopener noreferrer">Abrir recurso</a></p>
    </div>))}</>)
}

const KINDS: any = { aprendizaje: "Aprendizaje", idea: "Idea", pregunta: "Pregunta para la próxima mentoría", dificultad: "Dificultad", avance: "Avance", tema: "Tema que quiero trabajar" }
export function Notas({ profile }: { profile: any }) {
  const [list, setList] = useState<any[] | null>(null); const [accId, setAccId] = useState<string | null>(null)
  const [f, setF] = useState({ kind: "aprendizaje", body: "", shared: false }); const [edit, setEdit] = useState<any>(null); const [msg, setMsg] = useState("")
  const cargar = () => supabase.from("client_notes").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => { cargar(); supabase.from("accompaniments").select("id").limit(1).then(({ data }) => setAccId(data?.[0]?.id || null)) }, [])
  async function crear(e: React.FormEvent) {
    e.preventDefault(); setMsg("")
    const { error } = await supabase.from("client_notes").insert({ owner_id: profile.id, accompaniment_id: accId, kind: f.kind, body: f.body.trim(), shared: f.shared })
    if (error) return setMsg("No pudimos guardar tu nota.")
    setF({ ...f, body: "" }); cargar()
  }
  async function guardarEdicion() { await supabase.from("client_notes").update({ body: edit.body.trim(), shared: edit.shared }).eq("id", edit.id); setEdit(null); cargar() }
  async function borrar(id: string) { if (confirm("¿Querés eliminar esta nota?")) { await supabase.from("client_notes").delete().eq("id", id); cargar() } }
  return (<>
    <form className="card mine" onSubmit={crear}>
      <label htmlFor="nk">Tipo de nota</label><select id="nk" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}>{opts(KINDS)}</select>
      <label htmlFor="nb">¿Qué querés anotar?</label><textarea id="nb" required maxLength={5000} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
      <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" style={{ width: 20 }} checked={f.shared} onChange={e => setF({ ...f, shared: e.target.checked })} /> Compartir con Ceci como consulta</label>
      <p className="small">Si no lo tildás, la nota es solo tuya: nadie más la ve.</p>
      <button className="btn">Guardar nota</button>{msg && <p className="err" role="status">{msg}</p>}
    </form>
    {list?.length === 0 && <p className="small">Todavía no escribiste notas.</p>}
    {list?.map(n => <div className="card mine" key={n.id}>
      <p className="small">{KINDS[n.kind]} · {n.shared ? "Compartida con Ceci" : "Solo tuya"} · {new Date(n.created_at).toLocaleDateString("es-AR")}</p>
      {edit?.id === n.id ? <><textarea aria-label="Editar nota" value={edit.body} onChange={e => setEdit({ ...edit, body: e.target.value })} />
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" style={{ width: 20 }} checked={edit.shared} onChange={e => setEdit({ ...edit, shared: e.target.checked })} /> Compartir con Ceci</label>
        <p style={{ marginTop: 10 }}><button className="btn" onClick={guardarEdicion}>Guardar</button> <button className="btn sec" onClick={() => setEdit(null)}>Cancelar</button></p></>
        : <><p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p><p style={{ marginTop: 8 }}><button className="lnk" onClick={() => setEdit(n)}>Editar</button><button className="lnk" onClick={() => borrar(n.id)}>Eliminar</button></p></>}
    </div>)}
  </>)
}
