import { firmwareToMm } from '../../types/config'

interface SliderProps {
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  label: string
  formatValue?: (value: number) => string
  disabled?: boolean
}

export function Slider({
  min,
  max,
  step,
  value,
  onChange,
  label,
  formatValue = (v) => `${firmwareToMm(v).toFixed(1)}mm`,
  disabled = false
}: SliderProps): React.JSX.Element {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-text-secondary">{label}</label>
        <span className="text-sm font-mono text-text-primary">{formatValue(value)}</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10"
          style={{
            background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${percent}%, var(--color-surface-overlay) ${percent}%, var(--color-surface-overlay) 100%)`
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}
