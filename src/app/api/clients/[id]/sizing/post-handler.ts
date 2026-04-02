import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { getSizeConfig, getSizeValues, getSupportedSizeSystems, SIZE_ITEM_TYPES } from '@/lib/config/sizeSystem'
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

type RequiredSizingFields = {
  category: string
  size: string
  size_system: SizeSystem
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
    code: error.code ?? null,
    message: error.message,
  }
}

function pickRequiredSizingFields(data: NormalizedSizingPayload): RequiredSizingFields {
  return {
    category: data.category,
    size: data.size,
    size_system: data.size_system,
  }
}

function isOptionalColumnSchemaCacheError(error: SupabaseErrorLike | null | undefined): boolean {
  if (!error) return false

  const message = `${error.message} ${error.details ?? ''} ${error.hint ?? ''}`.toLowerCase()
  if (error.code !== 'PGRST204' && !message.includes('schema cache')) {
    return false
  }

  return message.includes('notes') || message.includes('fit_preference')
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

  const selectedSystem = parsed.data.size_system ?? config.system
  const supportedSystems = getSupportedSizeSystems(category)

  if (!supportedSystems.includes(selectedSystem)) {
    return {
      success: false,
      details: flattenFieldError(
        'size_system',
        `Unsupported size system "${selectedSystem}" for category "${category}"`
      ),
    }
  }

  const allowedSizes = getSizeValues(category, selectedSystem)

  if (!allowedSizes.includes(parsed.data.size)) {
    return {
      success: false,
      details: flattenFieldError(
        'size',
        `Invalid size "${parsed.data.size}" for category "${category}" in ${selectedSystem}`
      ),
    }
  }

  return {
    success: true,
    data: {
      category,
      size: parsed.data.size,
      size_system: selectedSystem,
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

  if (error.code === 'PGRST204' && message.includes('schema cache')) {
    return { status: 500, error: 'Sizing schema mismatch in database' }
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
      await deps.requireAuth()
      const supabase = await deps.createClient()
      const { id: client_id } = await params
      const searchParamKeys = Array.from(request.nextUrl.searchParams.keys())
      const rawBodyText = await request.text()

      let body: unknown = null
      if (rawBodyText) {
        try {
          body = JSON.parse(rawBodyText)
        } catch {
          logSizing(deps.logger, 'warn', 'request.invalid_json', {
            search_param_keys: searchParamKeys,
          })

          return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
        }
      }

      logSizing(deps.logger, 'info', 'request.received', {
        search_param_keys: searchParamKeys,
        has_body: body !== null,
      })

      const validated = validateSizingPayload(body)
      if (!validated.success) {
        logSizing(deps.logger, 'warn', 'request.validation_failed', {
          validation_fields: Object.keys(validated.details.fieldErrors),
          validation: validated.details,
        })

        return NextResponse.json(
          { error: 'Validation failed', details: validated.details },
          { status: 400 }
        )
      }

      const fullInsertPayload = {
        client_id,
        ...validated.data,
      }
      const requiredFields = pickRequiredSizingFields(validated.data)
      const fallbackInsertPayload = {
        client_id,
        ...requiredFields,
      }
      const fallbackUpdatePayload = {
        size: requiredFields.size,
        size_system: requiredFields.size_system,
      }

      logSizing(deps.logger, 'info', 'request.validated', {
        table: SIZING_TABLE,
      })

      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .eq('id', client_id)
        .maybeSingle()

      if (clientErr) {
        logSizing(deps.logger, 'error', 'client.lookup_failed', {
          supabase_error: getSupabaseErrorSummary(clientErr),
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
          table: SIZING_TABLE,
          supabase_error: getSupabaseErrorSummary(existingErr),
        })

        const mapped = mapSizingSupabaseError(existingErr)
        return NextResponse.json({ error: mapped.error }, { status: mapped.status })
      }

      const operation = existing?.id ? 'update' : 'insert'
      const runWrite = async (useFullPayload: boolean) => {
        if (operation === 'update') {
          const updatePayload = useFullPayload ? validated.data : fallbackUpdatePayload
          return await supabase
            .from(SIZING_TABLE)
            .update(updatePayload as any)
            .eq('id', existing!.id)
            .select()
            .single()
        }

        const insertPayload = useFullPayload ? fullInsertPayload : fallbackInsertPayload
        return await supabase
          .from(SIZING_TABLE)
          .insert(insertPayload as any)
          .select()
          .single()
      }

      let { data, error } = await runWrite(true)

      if (error && isOptionalColumnSchemaCacheError(error)) {
        logSizing(deps.logger, 'warn', 'sizing.write_retry_without_optional_columns', {
          table: SIZING_TABLE,
          operation,
          supabase_error: getSupabaseErrorSummary(error),
        })

        const retryResult = await runWrite(false)
        data = retryResult.data
        error = retryResult.error
      }

      if (error) {
        logSizing(deps.logger, 'error', 'sizing.write_failed', {
          table: SIZING_TABLE,
          operation,
          supabase_error: getSupabaseErrorSummary(error),
        })

        const mapped = mapSizingSupabaseError(error)
        return NextResponse.json({ error: mapped.error }, { status: mapped.status })
      }

      return NextResponse.json(data, { status: existing?.id ? 200 : 201 })
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: err.status })
      }

      deps.logger.error(
        '[client-sizing] request.unhandled_error:',
        err instanceof Error ? err.message : 'unknown'
      )

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

