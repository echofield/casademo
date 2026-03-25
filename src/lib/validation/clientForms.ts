import { z } from 'zod'

/** Empty / null / omitted → null; valid email otherwise */
export const optionalEmail = z
  .union([z.literal(''), z.string().email(), z.null()])
  .optional()
  .transform((v) => (v === '' || v === undefined || v === null ? null : v))

export const createClientBodySchema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: optionalEmail,
    phone: z.string().optional().nullable().transform((v) => (v === '' || v === undefined ? null : v)),
    notes: z.string().optional().nullable().transform((v) => (v === '' || v === undefined ? null : v)),
    seller_id: z.string().uuid().optional(),
  })
  .strict()

// Valid signal values
const signalValues = ['very_hot', 'hot', 'warm', 'cold', 'lost'] as const

export const updateClientBodySchema = z
  .object({
    first_name: z.string().min(1).optional(),
    last_name: z.string().min(1).optional(),
    email: z
      .union([z.literal(''), z.string().email()])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === '' ? null : v)),
    phone: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : v.trim() === '' ? null : v.trim())),
    notes: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : v.trim() === '' ? null : v)),
    life_notes: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v === undefined ? undefined : v?.trim() === '' ? null : v?.trim())),
    locale: z
      .enum(['local', 'foreign'])
      .optional(),
    // Signal fields
    seller_signal: z
      .enum(signalValues)
      .nullable()
      .optional(),
    signal_note: z
      .string()
      .nullable()
      .optional()
      .transform((v) => (v === undefined ? undefined : v?.trim() === '' ? null : v?.trim())),
    // Fashion interest signal
    interest_in_fashion: z
      .enum(['low', 'medium', 'high'] as const)
      .nullable()
      .optional(),
  })
  .strict()
