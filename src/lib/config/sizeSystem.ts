import type { SizeSystem } from '@/lib/types'

export interface SizeCategoryConfig {
  label: string
  system: SizeSystem
  values: string[]
  alternateSystems?: Partial<Record<SizeSystem, string[]>>
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
    values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  },
  shirts: {
    label: 'Shirts',
    system: 'INTL',
    values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  },
  t_shirts: {
    label: 'T-shirts',
    system: 'INTL',
    values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
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
    values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  },
  shoes: {
    label: 'Shoes',
    system: 'EU',
    values: ['39', '40', '41', '42', '43', '44', '45'],
    alternateSystems: {
      UK: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
    },
  },
  sneakers: {
    label: 'Sneakers',
    system: 'EU',
    values: ['39', '40', '41', '42', '43', '44', '45'],
    alternateSystems: {
      UK: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
    },
  },
  accessories: {
    label: 'Accessories',
    system: 'INTL',
    values: ['ONE SIZE'],
  },
  swimwear: {
    label: 'Swimwear',
    system: 'INTL',
    values: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  },
} as const

export const SIZE_ITEM_TYPES = Object.keys(SIZE_SYSTEM)

export function getSizeConfig(itemType: string): SizeCategoryConfig | null {
  return SIZE_SYSTEM[itemType.toLowerCase()] ?? null
}

export function getSupportedSizeSystems(itemType: string): SizeSystem[] {
  const config = getSizeConfig(itemType)
  if (!config) return []

  const alternate = config.alternateSystems ? Object.keys(config.alternateSystems) as SizeSystem[] : []
  return [config.system, ...alternate.filter((system) => system !== config.system)]
}

export function getSizeValues(itemType: string, sizeSystem?: SizeSystem | null): string[] {
  const config = getSizeConfig(itemType)
  if (!config) return []

  if (!sizeSystem || sizeSystem === config.system) return config.values

  return config.alternateSystems?.[sizeSystem] ?? []
}

export function getItemTypeLabel(itemType: string): string {
  return SIZE_SYSTEM[itemType.toLowerCase()]?.label ?? itemType.charAt(0).toUpperCase() + itemType.slice(1)
}
