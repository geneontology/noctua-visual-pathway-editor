import type React from 'react'

interface PillOption {
  value: string
  label: string
  description?: string
}

interface RadioPillGroupProps {
  name: string
  value: string
  options: PillOption[]
  onChange: (value: string) => void
}

const RadioPillGroup: React.FC<RadioPillGroupProps> = ({ name, value, options, onChange }) => (
  <div className="flex flex-col py-1">
    {options.map(opt => {
      const isSelected = value === opt.value
      return (
        <div
          key={opt.value}
          className="flex w-full items-center border-b border-primary-200 py-2 last:border-b-0"
        >
          <label className="flex w-45 shrink-0 cursor-pointer items-center gap-2 text-sm">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? 'border-blue-800' : 'border-gray-400'}`}
            >
              {isSelected && (
                <span className="block h-2 w-2 rounded-full bg-blue-800" />
              )}
            </span>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isSelected}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span className="text-neutral-500 font-black">{opt.label}</span>
          </label>
          {opt.description && (
            <span className="ml-3 grow text-sm text-neutral-500">
              {opt.description}
            </span>
          )}
        </div>
      )
    })}
  </div>
)

export default RadioPillGroup
