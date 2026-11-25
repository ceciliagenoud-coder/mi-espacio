import { useEffect, useRef } from "react"
import DOMPurify from "dompurify"

// Editor simple: se puede pegar texto con títulos, negritas, listas y links sin perder el formato.
export default function Editor({ label, value, onChange }: { label: string; value: string; onChange: (h: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) ref.current.innerHTML = DOMPurify.sanitize(value || "") }, [])
  const cmd = (c: string, v?: string) => (e: React.MouseEvent) => { e.preventDefault(); document.execCommand(c, false, v); emit() }
  const emit = () => onChange(DOMPurify.sanitize(ref.current!.innerHTML))
  const link = (e: React.MouseEvent) => {
    e.preventDefault(); const u = prompt("Pegá el enlace (tiene que empezar con https://)")
    if (u && /^https:\/\//.test(u.trim())) { document.execCommand("createLink", false, u.trim()); emit() }
  }
  return (
    <div>
      <label>{label}</label>
      <div className="tools" role="toolbar" aria-label={"Formato de " + label}>
        <button onMouseDown={cmd("bold")}>Negrita</button>
        <button onMouseDown={cmd("formatBlock", "h3")}>Título</button>
        <button onMouseDown={cmd("insertUnorderedList")}>Lista</button>
        <button onMouseDown={link}>Enlace</button>
      </div>
      <div ref={ref} className="editor rich" contentEditable role="textbox" aria-multiline="true" aria-label={label} onInput={emit} />
    </div>
  )
}
