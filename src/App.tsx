import { useEffect, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { supabase } from "./lib/supabase"
import Login from "./pages/Login"
import SetPassword from "./pages/SetPassword"
import Admin from "./pages/Admin"
import Clienta from "./pages/Clienta"
import Biblioteca from "./pages/Biblioteca"
import CierrePdf from "./pages/CierrePdf"
import AdminClienta from "./pages/AdminClienta"

export default function App() {
  const [session, setSession] = useState<any>(undefined)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setProfile(null); return }
    supabase.from("profiles").select("*").eq("id", session.user.id).single().then(({ data }) => setProfile(data))
  }, [session])

  if (session === undefined || (session && !profile)) return <main><p className="small">Cargando tu espacio…</p></main>
  if (!session) return <Routes><Route path="*" element={<Login />} /></Routes>

  const home = profile.role === "admin" ? "/admin" : "/inicio"
  return (
    <Routes>
      <Route path="/definir-clave" element={<SetPassword home={home} />} />
      <Route path="/admin" element={profile.role === "admin" ? <Admin profile={profile} /> : <Navigate to="/inicio" />} />
      <Route path="/admin/clienta/:id" element={profile.role === "admin" ? <AdminClienta /> : <Navigate to="/inicio" />} />
      <Route path="/admin/recursos" element={profile.role === "admin" ? <Biblioteca /> : <Navigate to="/inicio" />} />
      <Route path="/admin/cierre/:id" element={profile.role === "admin" ? <CierrePdf /> : <Navigate to="/inicio" />} />
      <Route path="/inicio" element={profile.role === "clienta" ? <Clienta profile={profile} /> : <Navigate to="/admin" />} />
      <Route path="*" element={<Navigate to={home} />} />
    </Routes>
  )
}
