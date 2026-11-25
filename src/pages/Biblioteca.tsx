import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { R_CAT, R_FMT, opts } from "../lib/labels"

export default function Biblioteca() {
  const [list, setList] = useState<any[]>([])
  const [f, setF] = useState({ title: "", description: "", category: "estrategia_redes", format: "guia", url: "", duration: "", general: false })
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)
  const cargar = () => supabase.from("resources").select("*").order("published_at", { ascending: false }).then(({ data }) => setList(data || []))
  useEffect(() => { cargar() }, [])
  async function crear(e: React.FormEvent) {
    e.preventDefault(); setMsg(null)
    if (!/^https:\/\//.test(f.url.trim())) return setMsg({ t: "El enlace tiene que empezar con https://" })
    const { error } = await supabase.from("resources").insert({ title: f.title.trim(), description: f.description.trim() || null, category: f.category, format: f.format, url: f.url.trim(), duration_min: f.duration ? Number(f.duration) : null, is_general: f.general })
    if (error) return setMsg({ t: "No pudimos guardar el recurso." })
    setF({ ...f, title: "", description: "", url: "", duration: "" }); setMsg({ t: "Recurso guardado ✓", ok: true }); cargar()
  }
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  return (
    <main>
      <p className="small"><Link to="/admin">← Volver a tus clientas</Link></p>
      <h1 style={{ marginTop: 12 }}>Biblioteca de recursos</h1>
      <p className="small">Cargá un recurso una sola vez y asignalo a las clientas desde su perfil. Acordate de darle permiso en Drive a cada una.</p>
      <form className="card" style={{ marginTop: 16 }} onSubmit={crear}>
        <label htmlFor="bt">Título</label><input id="bt" required value={f.title} onChange={set("title")} />
        <label htmlFor="bd">Descripción</label><textarea id="bd" value={f.description} onChange={set("description")} />
        <label htmlFor="bc">Categoría</label><select id="bc" value={f.category} onChange={set("category")}>{opts(R_CAT)}</select>
        <label htmlFor="bf">Formato</label><select id="bf" value={f.format} onChange={set("format")}>{opts(R_FMT)}</select>
        <label htmlFor="bu">Enlace (Drive u otro)</label><input id="bu" type="url" required placeholder="https://..." value={f.url} onChange={set("url")} />
        <label htmlFor="bm">Duración en minutos (opcional)</label><input id="bm" type="number" min={1} value={f.duration} onChange={set("duration")} />
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" style={{ width: 20 }} checked={f.general} onChange={e => setF({ ...f, general: e.target.checked })} /> Visible para todas mis clientas activas</label>
        <button className="btn">Guardar recurso</button>{msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}
      </form>
      <h2>Tus recursos</h2>
      {list.length === 0 && <p className="small">Todavía no cargaste recursos.</p>}
      {list.map(r => <div className="card" key={r.id}><strong>{r.title}</strong><p className="small">{R_CAT[r.category]} · {R_FMT[r.format]}{r.is_general ? " · para todas" : ""}</p>
        <button className="lnk" onClick={async () => { if (confirm("¿Eliminar este recurso? Se quita de todas las clientas.")) { await supabase.from("resources").delete().eq("id", r.id); cargar() } }}>Eliminar</button></div>)}
    </main>
  )
}
