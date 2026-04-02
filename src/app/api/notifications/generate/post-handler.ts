import { NextResponse } from 'next/server'

export type GeneratorRpcResult = {
  data: number | null
  error: { message: string } | null
}

export type NotificationsGenerateClient = {
  rpc: (fn: string) => Promise<GeneratorRpcResult>
}

export type GenerateRouteDeps = {
  createUserClient: () => Promise<NotificationsGenerateClient>
  createServiceClient: () => NotificationsGenerateClient
  requireSupervisor: () => Promise<unknown>
  getCronSecret: () => string | undefined
  getServiceRoleKey: () => string | undefined
  logger: Pick<Console, 'error'>
}

export function createPostNotificationsGenerateHandler(deps: GenerateRouteDeps) {
  return async function POST(request: Request) {
    try {
      const authHeader = request.headers.get('authorization')
      const cronSecret = deps.getCronSecret()
      const isCronRequest = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`)

      let supabase: NotificationsGenerateClient

      if (isCronRequest) {
        if (!deps.getServiceRoleKey()) {
          deps.logger.error('[Notifications/Generate] CRON_SECRET path requires SUPABASE_SERVICE_ROLE_KEY')
          return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
        }
        supabase = deps.createServiceClient()
      } else {
        await deps.requireSupervisor()
        supabase = await deps.createUserClient()
      }

      const errors: string[] = []

      // Generate overdue notifications
      const { data: overdueResult, error: overdueError } = await supabase
        .rpc('generate_overdue_notifications')

      if (overdueError) {
        deps.logger.error('[Notifications/Generate] Overdue notifications error:', overdueError.message)
        errors.push(`overdue: ${overdueError.message}`)
      }

      // Generate seller inactivity alerts
      const { data: inactivityResult, error: inactivityError } = await supabase
        .rpc('generate_seller_inactivity_alerts')

      if (inactivityError) {
        deps.logger.error('[Notifications/Generate] Inactivity alerts error:', inactivityError.message)
        errors.push(`inactivity: ${inactivityError.message}`)
      }

      // Generate birthday follow-up reminders
      const { data: birthdayResult, error: birthdayError } = await supabase
        .rpc('generate_birthday_follow_up_notifications')

      if (birthdayError) {
        deps.logger.error('[Notifications/Generate] Birthday follow-up error:', birthdayError.message)
        errors.push(`birthday_follow_up: ${birthdayError.message}`)
      }

      // Return honest status
      const hasErrors = errors.length > 0
      return NextResponse.json({
        success: !hasErrors,
        overdue_notifications: overdueResult || 0,
        inactivity_alerts: inactivityResult || 0,
        birthday_follow_ups: birthdayResult || 0,
        ...(hasErrors && { errors }),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate notifications'
      const status = error instanceof Error && 'status' in error ? (error as { status: number }).status : 500
      return NextResponse.json({ error: message }, { status })
    }
  }
}

