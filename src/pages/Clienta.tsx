import { useState } from "react"
import { supabase } from "../lib/supabase"
import Recorrido from "./Recorrido"
import { Tareas, Recursos, Notas } from "./ClientaExtras"

const TABS: [string, string][] = [["rec", "Mi recorrido"], ["plan", "Plan de acción"], ["res", "Recursos"], ["notas", "Mis notas y consultas"]]

export default function Clienta({ profile }: { profile: any }) {
  const [tab, setTab] = useState("rec")
  return (
    <main>
      <div className="top"><div><p className="eyebrow">Mi espacio</p><h1>Hola, {profile.full_name || "bienvenida"} 🌻</h1></div>
        <button className="btn sec" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button></div>
      <div className="chips" role="group" aria-label="Secciones">{TABS.map(([k, l]) => <button key={k} className="chip" aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "rec" && <Recorrido profile={profile} />}
      {tab === "plan" && <Tareas />}
      {tab === "res" && <Recursos />}
      {tab === "notas" && <Notas profile={profile} />}
    </main>
  )
}
