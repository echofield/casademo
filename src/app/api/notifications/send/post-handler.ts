import { NextResponse } from 'next/server'

export type NotificationsSendClient = {
  rpc: (
    fn: string,
    args: {
      p_user_id: string
      p_type: 'manual'
      p_title: string
      p_message: string
      p_client_id: string | null
    }
  ) => Promise<{ data: string | null; error: { message: string } | null }>
}

export type SendRouteUser = {
  effectiveRole: 'seller' | 'supervisor'
}

export type AuthErrorLike = {
  message: string
  status: number
}

export type SendRouteDeps = {
  requireAuth: () => Promise<SendRouteUser>
  createClient: () => Promise<NotificationsSendClient>
  logger: Pick<Console, 'error'>
  isAuthError: (err: unknown) => err is AuthErrorLike
}

export function createPostNotificationsSendHandler(deps: SendRouteDeps) {
  return async function POST(request: Request) {
    try {
      const user = await deps.requireAuth()

      if (user.effectiveRole !== 'supervisor') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const { seller_id, client_id, client_name, message } = body

      if (!seller_id) {
        return NextResponse.json({ error: 'seller_id required' }, { status: 400 })
      }

      const supabase = await deps.createClient()

      const { data: funcResult, error: funcError } = await supabase.rpc('send_notification', {
        p_user_id: seller_id,
        p_type: 'manual',
        p_title: client_name ? `Reminder: ${client_name}` : 'Supervisor reminder',
        p_message: message || 'Please check your queue',
        p_client_id: client_id || null,
      })

      if (funcError) {
        deps.logger.error('Notification send rpc error:', funcError.message)
        return NextResponse.json({ error: funcError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, notification_id: funcResult })
    } catch (err) {
      if (deps.isAuthError(err)) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }

      deps.logger.error('Notification send error:', err instanceof Error ? err.message : 'unknown')
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

