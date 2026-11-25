import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import Inicio from "./Inicio"
import Recorrido from "./Recorrido"
import Auditorias from "./ClientaAudit"
import Novedades from "../components/Novedades"
import { Tareas, Recursos, Notas } from "./ClientaExtras"

const TABS: [string, string][] = [["ini", "Inicio"], ["rec", "Mi recorrido"], ["aud", "Mis auditorías"], ["plan", "Plan de acción"], ["res", "Biblioteca de recursos"], ["notas", "Mis notas y consultas"]]
const Girasol = () => <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true"><g fill="#F9BA00">{[0, 45, 90, 135, 180, 225, 270, 315].map(r => <ellipse key={r} cx="20" cy="9" rx="4" ry="8" transform={"rotate(" + r + " 20 20)"} />)}</g><circle cx="20" cy="20" r="7" fill="#601938" /></svg>

export default function Clienta({ profile }: { profile: any }) {
  const [tab, setTab] = useState("ini")
  const [tieneAud, setTieneAud] = useState(false)
  useEffect(() => { supabase.from("audit_accounts").select("id", { count: "exact", head: true }).then(({ count }) => setTieneAud((count || 0) > 0)) }, [])
  const go = (t: string) => { setTab(t); window.scrollTo(0, 0) }
  return (
    <div className="shell">
      <nav className="side" aria-label="Secciones">
        <div className="logo"><Girasol /><span>Mi espacio<small>Ceci G Marketing</small></span></div>
        {TABS.filter(([k]) => k !== "aud" || tieneAud).map(([k, l]) => <button key={k} className="nv" aria-current={tab === k ? "page" : undefined} onClick={() => go(k)}>{l}</button>)}
      </nav>
      <main>
        <div className="top"><div><p className="eyebrow">Mi espacio</p><h1>Hola, {profile.full_name || "bienvenida"} 🌻</h1></div>
          <div><Novedades /><button className="btn sec" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button></div></div>
        {tab === "ini" && <Inicio profile={profile} onGo={go} />}
        {tab === "rec" && <Recorrido profile={profile} />}
        {tab === "aud" && <Auditorias />}
        {tab === "plan" && <Tareas />}
        {tab === "res" && <Recursos />}
        {tab === "notas" && <Notas profile={profile} />}
      </main>
    </div>
  )
}
