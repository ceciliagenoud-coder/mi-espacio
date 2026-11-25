import { useEffect, useState } from "react"
import DOMPurify from "dompurify"
import { supabase } from "../lib/supabase"
import { AUDIT_FIELDS, FB_FIELDS, AUD_STATUS } from "../lib/audit"

function Ficha({ a, fb, n }: { a: any; fb: any; n: number }) {
  const [f, setF] = useState<any>(a.form || {}); const [st, setSt] = useState(a.status); const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)
  const editable = st === "pendiente" || st === "borrador"
  async function guardar(nuevo: string) {
    setMsg(null)
    for (const [k, l, t] of AUDIT_FIELDS) if (t === "u" && f[k] && !/^https:\/\//.test(f[k].trim())) return setMsg({ t: "\"" + l + "\" tiene que empezar con https://" })
    if (nuevo === "enviada" && !confirm("¿Querés enviarme la información? Después no vas a poder editarla.")) return
    const { error } = await supabase.from("audit_accounts").update({ form: f, status: nuevo }).eq("id", a.id)
    if (error) return setMsg({ t: "No pudimos guardar. Probá de nuevo." })
    setSt(nuevo); setMsg({ t: nuevo === "enviada" ? "¡Listo! Ya recibí tu información ✓" : "Borrador guardado ✓", ok: true })
  }
  return (
    <div className="card">
      <p className="eyebrow">Cuenta {n}</p><h2 style={{ marginTop: 0 }}>{f.nombre || "Cuenta " + n}</h2><span className="badge">{AUD_STATUS[st]}</span>
      {editable ? <>
        {AUDIT_FIELDS.map(([k, l, t]) => <div key={k}><label htmlFor={k + a.id}>{l}</label>
          {t === "a" ? <textarea id={k + a.id} value={f[k] || ""} onChange={e => setF({ ...f, [k]: e.target.value })} /> : <input id={k + a.id} type={t === "u" ? "url" : "text"} value={f[k] || ""} onChange={e => setF({ ...f, [k]: e.target.value })} />}</div>)}
        <button className="btn sec" onClick={() => guardar("borrador")}>Guardar borrador</button>{" "}<button className="btn" onClick={() => guardar("enviada")}>Enviar para revisión</button>
      </> : AUDIT_FIELDS.filter(([k]) => f[k]).map(([k, l]) => <p key={k} style={{ marginTop: 8 }}><span className="small">{l}</span><br />{f[k]}</p>)}
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}
      {fb && <div style={{ marginTop: 20 }}><h2>Mi devolución para vos</h2>
        {FB_FIELDS.filter(([k]) => fb.content?.[k]).map(([k, l]) => <div className="sec" key={k}><strong>{l}</strong><div className="rich" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(fb.content[k]) }} /></div>)}
        {fb.recording_url && <p style={{ marginTop: 14 }}><a className="btn" style={{ display: "inline-block", textDecoration: "none" }} href={fb.recording_url} target="_blank" rel="noopener noreferrer">Accedé a la grabación</a></p>}</div>}
    </div>)
}

export default function Auditorias() {
  const [list, setList] = useState<any[] | null>(null); const [fb, setFb] = useState<any>({})
  useEffect(() => {
    supabase.from("audit_accounts").select("*").order("position").then(({ data }) => setList(data || []))
    supabase.from("audit_feedback").select("*").then(({ data }) => setFb(Object.fromEntries((data || []).map((x: any) => [x.audit_account_id, x]))))
  }, [])
  if (!list) return <p className="small">Cargando…</p>
  return (<><p className="small" style={{ marginBottom: 14 }}>Completá una ficha por cada cuenta. No hace falta que respondas todo, y podés guardar y seguir después. Por favor, no cargues contraseñas ni accesos a las redes de tus clientes.</p>
    {list.map((a, i) => <Ficha key={a.id} a={a} fb={fb[a.id]} n={i + 1} />)}</>)
}
