import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Novedades() {
  const [list, setList] = useState<any[] | null>(null); const [open, setOpen] = useState(false)
  const cargar = () => supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(15).then(({ data }) => setList(data || []))
  useState(() => { cargar() })
  const nuevas = (list || []).filter(n => !n.read_at).length
  async function leidas() { await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null); cargar() }
  return (
    <span style={{ position: "relative", marginRight: 8 }}>
      <button className="btn sec" aria-expanded={open} onClick={() => { setOpen(!open); cargar() }}>Novedades{nuevas ? " (" + nuevas + ")" : ""}</button>
      {open && <div className="card" style={{ position: "absolute", right: 0, top: 54, width: 300, maxWidth: "80vw", zIndex: 5 }}>
        {list?.length === 0 && <p className="small">No hay novedades todavía.</p>}
        {list?.map(n => <p key={n.id} style={{ marginBottom: 10, fontWeight: n.read_at ? 400 : 600 }}>{n.title}<br /><span className="small">{new Date(n.created_at).toLocaleDateString("es-AR")}</span></p>)}
        {nuevas > 0 && <button className="lnk" onClick={leidas}>Marcar todas como leídas</button>}</div>}
    </span>)
}
