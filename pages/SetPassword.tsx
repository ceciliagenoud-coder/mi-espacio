import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function SetPassword({ home }: { home: string }) {
  const [p1, setP1] = useState(""); const [p2, setP2] = useState("")
  const [err, setErr] = useState(""); const nav = useNavigate()
  async function guardar(e: React.FormEvent) {
    e.preventDefault(); setErr("")
    if (p1.length < 10) return setErr("Tu clave tiene que tener al menos 10 caracteres.")
    if (p1 !== p2) return setErr("Las dos claves no coinciden.")
    const { error } = await supabase.auth.updateUser({ password: p1 })
    if (error) return setErr("No pudimos guardar tu clave. Probá con otra.")
    nav(home)
  }
  return (
    <main className="center">
      <p className="eyebrow">Mi espacio</p><h1>Creá tu clave</h1>
      <form className="card" onSubmit={guardar}>
        <label htmlFor="a">Clave nueva</label><input id="a" type="password" autoComplete="new-password" value={p1} onChange={e => setP1(e.target.value)} />
        <label htmlFor="b">Repetí tu clave</label><input id="b" type="password" autoComplete="new-password" value={p2} onChange={e => setP2(e.target.value)} />
        <button className="btn">Guardar y entrar</button>
        {err && <p className="err" role="alert">{err}</p>}
      </form>
    </main>
  )
}
