import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireSupervisor } from '@/lib/auth'
import {
  createPostNotificationsGenerateHandler,
  type GenerateRouteDeps,
  type NotificationsGenerateClient,
} from './post-handler'

const defaultDeps: GenerateRouteDeps = {
  createUserClient: async () => (await createClient()) as unknown as NotificationsGenerateClient,
  createServiceClient: () => createAdminClient() as unknown as NotificationsGenerateClient,
  requireSupervisor,
  getCronSecret: () => process.env.CRON_SECRET,
  getServiceRoleKey: () => process.env.SUPABASE_SERVICE_ROLE_KEY,
  logger: console,
}

// POST /api/notifications/generate - Generate operational notifications
// Can be called by cron or manually by supervisor
export const POST = createPostNotificationsGenerateHandler(defaultDeps)
