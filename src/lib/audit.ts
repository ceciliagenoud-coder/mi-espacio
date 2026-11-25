// kind: t = texto corto, a = texto largo, u = enlace
export const AUDIT_FIELDS: [string, string, string][] = [
  ["nombre", "Nombre de la marca o cliente", "t"], ["rubro", "Rubro", "t"], ["sitio_web", "Sitio web", "u"], ["instagram", "Perfil de Instagram", "t"],
  ["otras_redes", "Otras redes sociales", "t"], ["descripcion", "Descripción del negocio", "a"], ["productos", "Productos o servicios que ofrece", "a"],
  ["publico", "Público objetivo", "a"], ["obj_comerciales", "Objetivos comerciales", "a"], ["obj_comunicacion", "Objetivos de comunicación", "a"],
  ["tiempo_gestion", "Tiempo que llevás gestionando esta cuenta", "t"], ["servicios_actuales", "Servicios que le ofrecés hoy a este cliente", "a"],
  ["estrategia_actual", "Estrategia actual", "a"], ["frecuencia", "Frecuencia de publicación", "t"], ["tipos_contenido", "Tipos de contenidos que realizás", "a"],
  ["dificultades", "Principales dificultades", "a"], ["resultados", "Resultados que estás obteniendo", "a"], ["funciona", "Qué considerás que está funcionando", "a"],
  ["no_funciona", "Qué considerás que no está funcionando", "a"], ["revisar", "Qué te gustaría que revise especialmente", "a"],
  ["reportes_url", "Enlace a reportes de métricas", "u"], ["docs_url", "Enlace a documentos estratégicos o calendarios", "u"], ["extra", "Información adicional", "a"]]
export const FB_FIELDS: [string, string][] = [
  ["diagnostico", "Diagnóstico general"], ["fortalezas", "Fortalezas detectadas"], ["oportunidades", "Oportunidades de mejora"], ["analisis_perfil", "Análisis del perfil"],
  ["analisis_posicionamiento", "Análisis de posicionamiento"], ["analisis_contenidos", "Análisis de contenidos"], ["analisis_estrategia", "Análisis de estrategia"],
  ["analisis_metricas", "Análisis de métricas"], ["recomendaciones", "Recomendaciones estratégicas"], ["prioridades", "Prioridades"], ["acciones", "Acciones concretas"],
  ["ideas_contenido", "Ideas de contenido"], ["documentos", "Documentos complementarios"], ["plan_accion", "Plan de acción para esta cuenta"]]
export const AUD_STATUS: any = { pendiente: "Pendiente de completar", borrador: "Borrador", enviada: "Información enviada", en_revision: "En revisión", completada: "Auditoría completada" }
