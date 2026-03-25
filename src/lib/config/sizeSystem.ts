import type { SizeSystem } from '@/lib/types'

export interface SizeCategoryConfig {
  label: string
  system: SizeSystem
  values: string[]
}

/**
 * Brand-aligned size taxonomy.
 * Based on internal store manual (2025).
 *
 * Keys = item types stored in client_sizing.category.
 * Extend here when new product lines are added.
 */
export const SIZE_SYSTEM: Record<string, SizeCategoryConfig> = {
  knitwear: {
    label: 'Knitwear',
    system: 'INTL',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  shirts: {
    label: 'Shirts',
    system: 'INTL',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  t_shirts: {
    label: 'T-shirts',
    system: 'INTL',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  tailoring: {
    label: 'Tailoring',
    system: 'EU',
    values: ['44', '46', '48', '50', '52', '54'],
  },
  jackets: {
    label: 'Jackets / Outerwear',
    system: 'EU',
    values: ['44', '46', '48', '50', '52', '54'],
  },
  pants: {
    label: 'Pants / Trousers',
    system: 'US',
    values: ['28', '29', '30', '31', '32', '33', '34', '36'],
  },
  shorts: {
    label: 'Shorts',
    system: 'INTL',
    values: ['XS', 'S', 'M', 'L', 'XL'],
  },
  shoes: {
    label: 'Shoes',
    system: 'EU',
    values: ['39', '40', '41', '42', '43', '44', '45'],
  },
  sneakers: {
    label: 'Sneakers',
    system: 'EU',
    values: ['39', '40', '41', '42', '43', '44', '45'],
  },
  accessories: {
    label: 'Accessories',
    system: 'INTL',
    values: ['ONE SIZE'],
  },
  swimwear: {
    label: 'Swimwear',
    system: 'INTL',
    values: ['XS', 'S', 'M', 'L', 'XL'],
  },
} as const

export const SIZE_ITEM_TYPES = Object.keys(SIZE_SYSTEM)

export function getSizeConfig(itemType: string): SizeCategoryConfig | null {
  return SIZE_SYSTEM[itemType.toLowerCase()] ?? null
}

export function getItemTypeLabel(itemType: string): string {
  return SIZE_SYSTEM[itemType.toLowerCase()]?.label ?? itemType.charAt(0).toUpperCase() + itemType.slice(1)
}
