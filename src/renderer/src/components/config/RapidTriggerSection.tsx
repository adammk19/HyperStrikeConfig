import { Slider } from '../common/Slider'
import {
  MIN_RT_SENSITIVITY_FW,
  MAX_RT_SENSITIVITY_FW,
  FIRMWARE_SCALE
} from '../../types/config'

type RapidTriggerMode = 'off' | 'on' | 'continuous'

interface RapidTriggerSectionProps {
  rapidTrigger: boolean
  continuousRapidTrigger: boolean
  sensitivity: number
  onModeChange: (mode: RapidTriggerMode) => void
  onSensitivityChange: (value: number) => void
}

export function RapidTriggerSection({
  rapidTrigger,
  continuousRapidTrigger,
  sensitivity,
  onModeChange,
  onSensitivityChange
}: RapidTriggerSectionProps): React.JSX.Element {
  const mode: RapidTriggerMode = !rapidTrigger
    ? 'off'
    : continuousRapidTrigger
      ? 'continuous'
      : 'on'

  const modes: { value: RapidTriggerMode; label: string }[] = [
    { value: 'off', label: 'Off' },
    { value: 'on', label: 'On' },
    { value: 'continuous', label: 'Continuous' }
  ]

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-text-primary">Rapid Trigger</h4>

      {/* Mode selector */}
      <div className="flex rounded-lg border border-surface-border overflow-hidden">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            className={`
              flex-1 py-2 text-sm font-medium transition-colors cursor-pointer
              ${
                mode === m.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
              }
            `}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Sensitivity slider (only when RT is on) */}
      {mode !== 'off' && (
        <Slider
          min={MIN_RT_SENSITIVITY_FW}
          max={MAX_RT_SENSITIVITY_FW}
          step={FIRMWARE_SCALE / 10} // 0.1mm steps
          value={sensitivity}
          onChange={onSensitivityChange}
          label="Sensitivity"
        />
      )}
    </div>
  )
}
