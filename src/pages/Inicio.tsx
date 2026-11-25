import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { R_FMT } from "../lib/labels"

const WA = import.meta.env.VITE_WHATSAPP_NUMBER
const stamp = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "")

export default function Inicio({ profile, onGo }: { profile: any; onGo: (t: string) => void }) {
  const [d, setD] = useState<any>(null)
  useEffect(() => {
    Promise.all([
      supabase.from("accompaniments").select("service_name").limit(1),
      supabase.from("meetings").select("*").order("position"),
      supabase.from("tasks").select("*"),
      supabase.from("resources").select("*").order("published_at", { ascending: false }).limit(3)
    ]).then(([a, m, t, r]) => setD({ servicio: a.data?.[0]?.service_name, m: m.data || [], t: t.data || [], r: r.data || [] }))
  }, [])
  if (!d) return <p className="small">Cargando tu espacio…</p>

  const hechos = d.m.filter((x: any) => x.status === "completada").length, pctM = d.m.length ? Math.round(hechos / d.m.length * 100) : 0
  const tHechas = d.t.filter((x: any) => x.status === "completada").length, pctT = d.t.length ? Math.round(tHechas / d.t.length * 100) : 0
  const prox = d.m.filter((x: any) => x.starts_at && x.status !== "completada" && new Date(x.starts_at) > new Date()).sort((a: any, b: any) => a.starts_at.localeCompare(b.starts_at))[0]
  const pendientes = d.t.filter((x: any) => x.status !== "completada").sort((a: any, b: any) => (a.due_date || "9999").localeCompare(b.due_date || "9999")).slice(0, 3)
  const ini = prox && new Date(prox.starts_at), fin = prox && new Date(ini.getTime() + (prox.duration_min || 60) * 60000)
  const gcal = prox && "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(prox.title + " · Ceci G Marketing") + "&dates=" + stamp(ini) + "/" + stamp(fin) + "&details=" + encodeURIComponent(prox.meet_url || "") + "&location=" + encodeURIComponent(prox.meet_url || "")
  function ics() {
    const txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", "UID:" + prox.id + "@cecig", "DTSTAMP:" + stamp(new Date()), "DTSTART:" + stamp(ini), "DTEND:" + stamp(fin), "SUMMARY:" + prox.title + " · Ceci G Marketing", "DESCRIPTION:" + (prox.meet_url || ""), "END:VEVENT", "END:VCALENDAR"].join("\r\n")
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/calendar" })); a.download = "mentoria.ics"; a.click()
  }
  const fecha = prox && new Intl.DateTimeFormat("es-AR", { dateStyle: "full", timeStyle: "short", timeZone: profile.timezone }).format(ini)
  return (<>
    <p className="small msg">¡Bienvenida a tu espacio! Este es nuestro lugar de trabajo durante las próximas semanas. Acá vas a encontrar todo lo que construyamos juntas, los recursos que necesites y los próximos pasos para seguir creciendo profesionalmente.</p>
    <div className="grid2">
      <div className="card hero">
        <p className="eyebrow" style={{ color: "var(--durazno)" }}>Tu próximo encuentro</p>
        {prox ? <><h2 style={{ margin: "6px 0", color: "#fff" }}>{prox.title}</h2><p>{fecha}<br /><span className="small" style={{ color: "var(--durazno)" }}>Hora de {profile.timezone.split("/").pop().replace(/_/g, " ")}</span></p>
          <p style={{ marginTop: 14 }}>{prox.meet_url && <a className="btn" style={{ textDecoration: "none", display: "inline-block", marginRight: 8 }} href={prox.meet_url} target="_blank" rel="noopener noreferrer">Entrar a Google Meet</a>}
            <a className="btn sec" style={{ textDecoration: "none", display: "inline-block", color: "#fff", borderColor: "#fff", marginRight: 8 }} href={gcal} target="_blank" rel="noopener noreferrer">Agregar a Google Calendar</a>
            <button className="btn sec" style={{ color: "#fff", borderColor: "#fff" }} onClick={ics}>Descargar .ics</button></p></>
          : <p style={{ marginTop: 8 }}>Todavía no hay una fecha confirmada. Lo coordinamos por WhatsApp y lo ves acá apenas esté agendado.</p>}
      </div>
      <div className="card">
        <p className="eyebrow">{d.servicio || "Tu acompañamiento"}</p>
        <p className="small" style={{ margin: "8px 0 4px" }}>Encuentros: {hechos} realizados · {d.m.length - hechos} pendientes</p>
        <div className="bar" role="progressbar" aria-valuenow={pctM} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de encuentros"><i style={{ width: pctM + "%", background: "var(--accent)" }} /></div>
        <p className="small" style={{ margin: "16px 0 4px" }}>Tus acciones: {tHechas} de {d.t.length} completadas</p>
        <div className="bar" role="progressbar" aria-valuenow={pctT} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de acciones"><i style={{ width: pctT + "%" }} /></div>
      </div>
    </div>
    <div className="grid2">
      <div className="card"><h2 style={{ marginTop: 0 }}>Tus próximos pasos</h2>
        {pendientes.length === 0 ? <p className="small">No tenés tareas pendientes. ¡Mirá todo lo que avanzaste!</p> : pendientes.map((t: any) => <p key={t.id} style={{ marginBottom: 8 }}>{t.title}{t.due_date && <span className="small"> · para el {t.due_date}</span>}</p>)}
        <button className="lnk" onClick={() => onGo("plan")}>Ver mi plan de acción</button></div>
      <div className="card"><h2 style={{ marginTop: 0 }}>Últimos recursos</h2>
        {d.r.length === 0 ? <p className="small">Todavía no tenés recursos asignados.</p> : d.r.map((r: any) => <p key={r.id} style={{ marginBottom: 8 }}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a> <span className="small">· {R_FMT[r.format]}</span></p>)}
        <button className="lnk" onClick={() => onGo("res")}>Ver todos mis recursos</button></div>
    </div>
    {WA && <div className="card"><h2 style={{ marginTop: 0 }}>¿Te quedó una duda?</h2><p className="small">Seguimos charlando por WhatsApp. Este espacio es para ordenar todo lo importante.</p>
      <p><a className="btn" style={{ textDecoration: "none", display: "inline-block" }} href={"https://wa.me/" + WA + "?text=" + encodeURIComponent("Hola Ceci, te escribo desde Mi espacio 🌻")} target="_blank" rel="noopener noreferrer">Escribime por WhatsApp</a></p></div>}
  </>)
}
