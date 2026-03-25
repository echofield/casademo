// ═══════════════════════════════════════════════════════════════
// CASA ONE — Signal Types
// Seller's manual assessment of client purchase intent
// Uses diamond glyph visual language
// ═══════════════════════════════════════════════════════════════

export type ClientSignal = 'very_hot' | 'hot' | 'warm' | 'cold' | 'lost'

export interface SignalConfig {
  label: string
  description: string
  bgClass: string
  textClass: string
  borderClass: string
  color: string // Primary color for the glyph
}

export const SIGNAL_CONFIG: Record<ClientSignal, SignalConfig> = {
  very_hot: {
    label: 'Locked',
    description: 'Decision made. Conversion imminent.',
    bgClass: 'bg-red-50',
    textClass: 'text-red-800',
    borderClass: 'border-red-200',
    color: '#A32D2D',
  },
  hot: {
    label: 'Strong',
    description: 'Clear interest. Active engagement.',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-800',
    borderClass: 'border-orange-200',
    color: '#993C1D',
  },
  warm: {
    label: 'Open',
    description: 'Receptive but not committed.',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    color: '#854F0B',
  },
  cold: {
    label: 'Low',
    description: 'Minimal engagement.',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-800',
    borderClass: 'border-blue-200',
    color: '#185FA5',
  },
  lost: {
    label: 'Off',
    description: 'Off the radar. No response.',
    bgClass: 'bg-transparent',
    textClass: 'text-gray-500',
    borderClass: 'border-gray-300 border-dashed',
    color: '#5F5E5A',
  },
}

// Null signal configuration (not assessed yet)
export const NULL_SIGNAL_CONFIG = {
  label: 'Evaluate',
  description: 'Not assessed yet. Tap to evaluate.',
  bgClass: 'bg-transparent',
  textClass: 'text-[#003D2B]/40',
  borderClass: 'border-[#003D2B]/20 border-dashed',
  color: '#003D2B',
}

// Display order for signal selector
export const SIGNAL_ORDER: ClientSignal[] = ['very_hot', 'hot', 'warm', 'cold', 'lost']

// Simple label lookup
export const SIGNAL_LABELS: Record<ClientSignal, string> = {
  very_hot: 'Locked',
  hot: 'Strong',
  warm: 'Open',
  cold: 'Low',
  lost: 'Off',
}

// Priority for sorting (lower = higher priority)
// null gets priority 3 in sorting (middle of the pack)
export const SIGNAL_PRIORITY: Record<ClientSignal, number> = {
  very_hot: 0,
  hot: 1,
  warm: 2,
  cold: 4,
  lost: 5,
}

export const NULL_SIGNAL_PRIORITY = 3

// Helper to get signal config with null handling
export function getSignalConfig(signal: ClientSignal | null): SignalConfig & { isNull: boolean } {
  if (signal === null) {
    return { ...NULL_SIGNAL_CONFIG, isNull: true }
  }
  return { ...SIGNAL_CONFIG[signal], isNull: false }
}

// Helper to get signal priority with null handling
export function getSignalPriority(signal: ClientSignal | null): number {
  if (signal === null) {
    return NULL_SIGNAL_PRIORITY
  }
  return SIGNAL_PRIORITY[signal]
}
