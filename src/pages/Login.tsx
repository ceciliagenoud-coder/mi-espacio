import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [pass, setPass] = useState("")
  const [msg, setMsg] = useState<{ t: string; ok?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    if (error) setMsg({ t: "No pudimos ingresar. Revisá tu email y tu clave." })
    setBusy(false)
  }
  async function recuperar() {
    if (!email.trim()) return setMsg({ t: "Escribí tu email arriba y volvé a tocar este botón." })
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin + "/definir-clave" })
    setMsg(error ? { t: "No pudimos enviar el mensaje. Probá de nuevo en unos minutos." } : { t: "Listo, te enviamos un email para crear una clave nueva.", ok: true })
  }
  return (
    <main className="center">
      <p className="eyebrow">Ceci G Marketing</p>
      <h1>Mi espacio 🌻</h1>
      <p className="small">Ingresá para ver todo lo que construimos juntas.</p>
      <form className="card" style={{ marginTop: 20 }} onSubmit={entrar}>
        <label htmlFor="em">Email</label>
        <input id="em" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <label htmlFor="pw">Clave</label>
        <input id="pw" type="password" autoComplete="current-password" required value={pass} onChange={e => setPass(e.target.value)} />
        <button className="btn" disabled={busy}>{busy ? "Ingresando…" : "Ingresar a mi espacio"}</button>
        <button type="button" className="btn sec" style={{ marginLeft: 8 }} onClick={recuperar}>Olvidé mi clave</button>
        {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.t}</p>}
      </form>
    </main>
  )
}
