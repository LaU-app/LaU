export const STUDY_TIMEZONE = 'America/El_Salvador'
export function readStudyUser(): {name?:string;username?:string;imagen_url?:string;universidad?:{nombre?:string};carrera?:{nombre?:string}} {
  try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}') || {} } catch { return {} }
}
export function studyTimeParts(value?: string | null) {
  if(!value) return {time:'Elegir',period:'Hora de entrega'}
  const parts=new Intl.DateTimeFormat('es-SV',{timeZone:STUDY_TIMEZONE,hour:'numeric',minute:'2-digit',hourCycle:'h12'}).formatToParts(new Date(value))
  return {time:parts.filter(p=>p.type==='hour'||p.type==='minute'||p.type==='literal').map(p=>p.value).join('').trim(),period:parts.find(p=>p.type==='dayPeriod')?.value || ''}
}
export function studyDate(value?: string | null, withTime = true): string {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-SV', {
    timeZone: STUDY_TIMEZONE, day: 'numeric', month: 'short',
    ...(withTime ? { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' as const } : {}),
  }).format(date)
}
// ion-datetime represents wall time. Convert it explicitly to Salvador time for the API.
export function calendarValue(value?: string | null): string | undefined {
  if (!value) return undefined
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone: STUDY_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value))
  return parts.replace(' ', 'T')
}
export const taskStatus: Record<string, string> = { pending: 'Pendiente', in_progress: 'En curso', completed: 'Completada', cancelled: 'Cancelada' }
export const taskPriority: Record<string, string> = { low: 'Baja', medium: 'Media', high: 'Alta' }
