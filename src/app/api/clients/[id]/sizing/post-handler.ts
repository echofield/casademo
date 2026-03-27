import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { getSizeConfig, SIZE_ITEM_TYPES } from '@/lib/config/sizeSystem'
import type { SizeSystem } from '@/lib/types'

const SIZING_TABLE = 'client_sizing'

const optionalTextSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}, z.string().nullable().optional())

const sizingSchema = z.object({
  category: z.string().trim().min(1),
  size: z.string().trim().min(1),
  size_system: z.enum(['EU', 'US', 'UK', 'INTL']).optional(),
  fit_preference: optionalTextSchema,
  notes: optionalTextSchema,
})

type FlattenedValidation = {
  formErrors: string[]
  fieldErrors: Record<string, string[] | undefined>
}

type NormalizedSizingPayload = {
  category: string
  size: string
  size_system: SizeSystem
  fit_preference: string | null
  notes: string | null
}

type SupabaseErrorLike = {
  message: string
  details?: string | null
  hint?: string | null
  code?: string | null
}

type Logger = Pick<Console, 'info' | 'warn' | 'error'>

type PostSizingDeps = {
  createClient: typeof createClient
  requireAuth: typeof requireAuth
  logger: Logger
}

function flattenFieldError(field: string, message: string): FlattenedValidation {
  return {
    formErrors: [],
    fieldErrors: {
      [field]: [message],
    },
  }
}

function logSizing(
  logger: Logger,
  level: 'info' | 'warn' | 'error',
  event: string,
  payload: Record<string, unknown>
) {
  logger[level]('[client-sizing]', {
    event,
    ...payload,
  })
}

function getSupabaseErrorSummary(error: SupabaseErrorLike | null | undefined) {
  if (!error) {
    return null
  }

  return {
    message: error.message,
    details: error.details ?? null,
    hint: error.hint ?? null,
    code: error.code ?? null,
  }
}

export function validateSizingPayload(body: unknown):
  | { success: true; data: NormalizedSizingPayload }
  | { success: false; details: FlattenedValidation } {
  const parsed = sizingSchema.safeParse(body)

  if (!parsed.success) {
    return {
      success: false,
      details: parsed.error.flatten(),
    }
  }

  const category = parsed.data.category.toLowerCase()
  if (!SIZE_ITEM_TYPES.includes(category)) {
    return {
      success: false,
      details: flattenFieldError('category', `Unsupported sizing category: ${parsed.data.category}`),
    }
  }

  const config = getSizeConfig(category)
  if (!config) {
    return {
      success: false,
      details: flattenFieldError('category', `No sizing configuration found for ${parsed.data.category}`),
    }
  }

  if (!config.values.includes(parsed.data.size)) {
    return {
      success: false,
      details: flattenFieldError('size', `Invalid size "${parsed.data.size}" for category "${category}"`),
    }
  }

  if (parsed.data.size_system && parsed.data.size_system !== config.system) {
    return {
      success: false,
      details: flattenFieldError(
        'size_system',
        `size_system must be ${config.system} for category "${category}"`
      ),
    }
  }

  return {
    success: true,
    data: {
      category,
      size: parsed.data.size,
      size_system: parsed.data.size_system ?? config.system,
      fit_preference: parsed.data.fit_preference ?? null,
      notes: parsed.data.notes ?? null,
    },
  }
}

export function mapSizingSupabaseError(error: SupabaseErrorLike) {
  const message = `${error.message} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase()

  if (error.code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return { status: 403, error: 'Forbidden' }
  }

  if (error.code === 'PGRST116' || message.includes('no rows')) {
    return { status: 404, error: 'Client not found' }
  }

  if (
    error.code === '22P02' ||
    error.code === '23502' ||
    error.code === '23503' ||
    error.code === '23505' ||
    error.code === '23514' ||
    error.code === '42703' ||
    error.code === '42P10'
  ) {
    return { status: 400, error: 'Invalid sizing payload' }
  }

  return { status: 500, error: 'Failed to save sizing' }
}

export function createPostSizingHandler(deps: PostSizingDeps = { createClient, requireAuth, logger: console }) {
  return async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await deps.requireAuth()
      const supabase = await deps.createClient()
      const { id: client_id } = await params
      const routeParams = { id: client_id }
      const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
      const rawBodyText = await request.text()

      let body: unknown = null
      if (rawBodyText) {
        try {
          body = JSON.parse(rawBodyText)
        } catch {
          logSizing(deps.logger, 'warn', 'request.invalid_json', {
            client_id,
            routeParams,
            searchParams,
            rawBodyText,
            user_id: user.id,
          })

          return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
        }
      }

      logSizing(deps.logger, 'info', 'request.received', {
        client_id,
        routeParams,
        searchParams,
        incomingBody: body,
        user_id: user.id,
      })

      const validated = validateSizingPayload(body)
      if (!validated.success) {
        logSizing(deps.logger, 'warn', 'request.validation_failed', {
          client_id,
          routeParams,
          parsedPayload: body,
          validation: validated.details,
        })

        return NextResponse.json(
          { error: 'Validation failed', details: validated.details },
          { status: 400 }
        )
      }

      const writePayload = {
        client_id,
        ...validated.data,
      }

      logSizing(deps.logger, 'info', 'request.validated', {
        client_id,
        routeParams,
        parsedPayload: writePayload,
        table: SIZING_TABLE,
      })

      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .eq('id', client_id)
        .maybeSingle()

      if (clientErr) {
        logSizing(deps.logger, 'error', 'client.lookup_failed', {
          client_id,
          routeParams,
          supabaseError: getSupabaseErrorSummary(clientErr),
        })

        const mapped = mapSizingSupabaseError(clientErr)
        return NextResponse.json({ error: mapped.error }, { status: mapped.status })
      }

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      const { data: existing, error: existingErr } = await supabase
        .from(SIZING_TABLE)
        .select('id')
        .eq('client_id', client_id)
        .eq('category', validated.data.category)
        .maybeSingle()

      if (existingErr) {
        logSizing(deps.logger, 'error', 'sizing.lookup_failed', {
          client_id,
          routeParams,
          table: SIZING_TABLE,
          supabaseError: getSupabaseErrorSummary(existingErr),
        })

        const mapped = mapSizingSupabaseError(existingErr)
        return NextResponse.json({ error: mapped.error }, { status: mapped.status })
      }

      const writeQuery = existing?.id
        ? supabase
            .from(SIZING_TABLE)
            .update(validated.data as any)
            .eq('id', existing.id)
        : supabase
            .from(SIZING_TABLE)
            .insert(writePayload as any)

      const { data, error } = await writeQuery
        .select()
        .single()

      if (error) {
        logSizing(deps.logger, 'error', 'sizing.write_failed', {
          client_id,
          routeParams,
          table: SIZING_TABLE,
          operation: existing?.id ? 'update' : 'insert',
          incomingBody: body,
          parsedPayload: writePayload,
          supabaseError: getSupabaseErrorSummary(error),
        })

        const mapped = mapSizingSupabaseError(error)
        return NextResponse.json({ error: mapped.error }, { status: mapped.status })
      }

      return NextResponse.json(data, { status: existing?.id ? 200 : 201 })
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }

      deps.logger.error('[client-sizing]', {
        event: 'request.unhandled_error',
        error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      })

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
