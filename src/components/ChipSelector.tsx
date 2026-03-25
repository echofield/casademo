'use client'

import { useState, useMemo } from 'react'

interface ChipOption {
  value: string
  label: string
}

interface ChipSelectorProps {
  options: ChipOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  allowCustom?: boolean
  searchable?: boolean
  placeholder?: string
  size?: 'sm' | 'md'
}

export function ChipSelector({
  options,
  selected,
  onChange,
  allowCustom = false,
  searchable = false,
  placeholder = 'Search...',
  size = 'sm',
}: ChipSelectorProps) {
  const [search, setSearch] = useState('')
  const [customInput, setCustomInput] = useState('')

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [options, search])

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value]
    )
  }

  const addCustom = () => {
    const val = customInput.trim().toLowerCase().replace(/\s+/g, '_')
    if (!val || selected.includes(val)) return
    onChange([...selected, val])
    setCustomInput('')
  }

  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'

  const optionValues = new Set(options.map(o => o.value))
  const customSelected = selected.filter(v => !optionValues.has(v))
  const formatLabel = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="space-y-2">
      {searchable && options.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="input-field w-full text-sm"
        />
      )}
      {(filtered.length > 0 || customSelected.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {filtered.map((opt) => {
            const isSelected = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={`
                  ${sizeClasses} rounded-full border transition-all duration-150 font-medium
                  ${isSelected
                    ? 'bg-[#003D2B] text-white border-[#003D2B]'
                    : 'bg-transparent text-text border-text/20 hover:border-text/40'
                  }
                `}
              >
                {opt.label}
              </button>
            )
          })}
          {customSelected.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => toggle(val)}
              className={`${sizeClasses} rounded-full border transition-all duration-150 font-medium bg-[#003D2B] text-white border-[#003D2B]`}
            >
              {formatLabel(val)} ×
            </button>
          ))}
        </div>
      )}
      {allowCustom && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            placeholder="Type and press Enter..."
            className="input-field flex-1 text-sm"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="label text-xs text-primary hover:text-primary-soft disabled:opacity-40"
          >
            + Add
          </button>
        </div>
      )}
    </div>
  )
}

// Single-select chip row — only one value active at a time, click again to deselect
interface SingleChipSelectorProps {
  options: ChipOption[]
  value: string | null
  onChange: (value: string | null) => void
  size?: 'sm' | 'md'
}

export function SingleChipSelector({
  options,
  value,
  onChange,
  size = 'sm',
}: SingleChipSelectorProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2.5 py-1' : 'text-sm px-3 py-1.5'

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(isSelected ? null : opt.value)}
            className={`
              ${sizeClasses} rounded-full border transition-all duration-150 font-medium
              ${isSelected
                ? 'bg-[#003D2B] text-white border-[#003D2B]'
                : 'bg-transparent text-text border-text/20 hover:border-text/40'
              }
            `}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
