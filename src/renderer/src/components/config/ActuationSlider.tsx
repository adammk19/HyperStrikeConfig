import { Slider } from '../common/Slider'
import {
  MIN_ACTUATION_FW,
  MAX_ACTUATION_FW,
  FIRMWARE_SCALE
} from '../../types/config'

interface ActuationSliderProps {
  selectedButtons: Set<number>
  actuationPoints: number[]
  onChange: (buttonIndices: number[], value: number) => void
}

export function ActuationSlider({
  selectedButtons,
  actuationPoints,
  onChange
}: ActuationSliderProps): React.JSX.Element {
  const indices = Array.from(selectedButtons)
  const values = indices.map((i) => actuationPoints[i] ?? 500)
  const allSame = values.every((v) => v === values[0])
  const displayValue = allSame ? (values[0] ?? 500) : 500

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-text-primary">Actuation Point</h4>
        {!allSame && indices.length > 1 && (
          <span className="text-xs text-warning">Mixed values</span>
        )}
      </div>
      <Slider
        min={MIN_ACTUATION_FW}
        max={MAX_ACTUATION_FW}
        step={FIRMWARE_SCALE / 10} // 0.1mm steps = 25 units
        value={displayValue}
        onChange={(v) => onChange(indices, v)}
        label=""
        disabled={indices.length === 0}
      />
    </div>
  )
}
