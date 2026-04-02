import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import {
  createPostNotificationsSendHandler,
  type NotificationsSendClient,
  type SendRouteDeps,
  type SendRouteUser,
} from './post-handler'

const defaultDeps: SendRouteDeps = {
  requireAuth: requireAuth as () => Promise<SendRouteUser>,
  createClient: async () => (await createClient()) as unknown as NotificationsSendClient,
  logger: console,
  isAuthError: (err: unknown): err is AuthError => err instanceof AuthError,
}

export const POST = createPostNotificationsSendHandler(defaultDeps)
