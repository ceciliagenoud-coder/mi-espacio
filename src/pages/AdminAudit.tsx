import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Editor from "../components/Editor"
import { AUDIT_FIELDS, FB_FIELDS, AUD_STATUS } from "../lib/audit"

function Cuenta({ a, n }: { a: any; n: number }) {
  const [st, setSt] = useState(a.status); const [fb, setFb] = useState<any>(null); const [open, setOpen] = useState(false); const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)
  const form = a.form || {}
  async function abrir() { setOpen(true); const { data } = await supabase.from("audit_feedback").select("*").eq("audit_account_id", a.id).maybeSingle(); setFb(data || { content: {}, recording_url: "", status: "borrador" }) }
  async function estado(v: string) { await supabase.from("audit_accounts").update({ status: v }).eq("id", a.id); setSt(v) }
  async function guardar(status: string) {
    setMsg(null); if (fb.recording_url && !/^https:\/\//.test(fb.recording_url.trim())) return setMsg({ t: "El enlace tiene que empezar con https://" })
    const { error } = await supabase.from("audit_feedback").upsert({ audit_account_id: a.id, content: fb.content, recording_url: fb.recording_url?.trim() || null, status, published_at: status === "publicado" ? (fb.published_at || new Date().toISOString()) : null }, { onConflict: "audit_account_id" })
    if (error) return setMsg({ t: "No pudimos guardar." })
    if (status === "publicado") { await estado("completada") }
    setFb({ ...fb, status }); setMsg({ t: status === "publicado" ? "Publicada: ya la ve la clienta ✓" : "Borrador guardado ✓", ok: true })
  }
  return (
    <div className="card">
      <p className="eyebrow">Cuenta {n}</p><strong>{form.nombre || "Sin nombre todavía"}</strong>
      <label htmlFor={"es" + a.id}>Estado de la auditoría</label>
      <select id={"es" + a.id} value={st} onChange={e => estado(e.target.value)}>{Object.keys(AUD_STATUS).map(k => <option key={k} value={k}>{AUD_STATUS[k]}</option>)}</select>
      {AUDIT_FIELDS.filter(([k]) => form[k]).map(([k, l]) => <p key={k} style={{ marginTop: 8 }}><span className="small">{l}</span><br />{form[k]}</p>)}
      {!open ? <p><button className="btn sec" onClick={abrir}>Devolución de esta cuenta</button></p> : !fb ? <p className="small">Cargando…</p> : <div style={{ marginTop: 16 }}>
        <p className="eyebrow">Devolución · {fb.status === "publicado" ? "Publicada" : "Borrador"}</p>
        {FB_FIELDS.map(([k, l]) => <Editor key={k} label={l} value={fb.content?.[k] || ""} onChange={h => setFb((x: any) => ({ ...x, content: { ...x.content, [k]: h } }))} />)}
        <label htmlFor={"gr" + a.id}>Enlace a la grabación</label><input id={"gr" + a.id} type="url" value={fb.recording_url || ""} onChange={e => setFb({ ...fb, recording_url: e.target.value })} />
        <button className="btn sec" onClick={() => guardar("borrador")}>Guardar borrador</button>{" "}<button className="btn" onClick={() => guardar("publicado")}>{fb.status === "publicado" ? "Actualizar publicación" : "Publicar devolución"}</button>
        {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}</div>}
    </div>)
}

export default function AdminAudit({ accId }: { accId: string }) {
  const [list, setList] = useState<any[]>([])
  useEffect(() => { supabase.from("audit_accounts").select("*").eq("accompaniment_id", accId).order("position").then(({ data }) => setList(data || [])) }, [accId])
  if (!list.length) return null
  return (<><h2>Auditoría de cuentas</h2>{list.map((a, i) => <Cuenta key={a.id} a={a} n={i + 1} />)}</>)
}
