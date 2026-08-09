// Canal Portal para reportes en vivo.
//
// Los formularios de reporte publican aquí un evento justo después de guardar
// el reporte en Supabase, y la pantalla de resultados de rutas (planear) escucha
// este canal para refrescar sus contadores de incidentes al instante.
//
// El evento es efímero y la severidad inicial es un "hint" (la IA la infiere
// después con infer-report): los consumidores re-consultan Supabase al recibirlo.
import { portal } from './client'

export const REPORTS_CHANNEL_ID = 'reports:global'

export interface ReportEvent {
  type: string
  targetId: string
  severity: string
}

let channel: ReturnType<typeof portal.channel<ReportEvent>> | null = null

/** Publica un evento de reporte recién creado (fire-and-forget, nunca lanza). */
export function publishReportEvent(event: ReportEvent): void {
  try {
    if (!channel) {
      channel = portal.channel<ReportEvent>(REPORTS_CHANNEL_ID, { history: 'none' })
    }
    channel.acquire()
    channel.send({ ephemeral: true, content: event }).catch(() => {})
    channel.release()
  } catch {
    // Si Portal no está disponible, el polling de respaldo mantiene los contadores al día.
  }
}
