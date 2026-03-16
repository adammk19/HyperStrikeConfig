import { useCallback } from 'react'
import { useDeviceState } from '../../context/DeviceContext'
import { useRealtimeData } from '../../hooks/useRealtimeData'
import { useButtonSelection } from '../../hooks/useButtonSelection'
import { ControllerType } from '../../types/device'
import { MiniLayout } from './MiniLayout'
import { StandardLayout } from './StandardLayout'
import { ProLayout } from './ProLayout'

interface ControllerViewProps {
  onSelectionChange: (selectedButtons: Set<number>) => void
}

export function ControllerView({ onSelectionChange }: ControllerViewProps): React.JSX.Element | null {
  const { deviceInfo, pendingConfig } = useDeviceState()
  const { positions, pressedMask, hasFirmwareMask } = useRealtimeData()

  const buttonCount = deviceInfo?.buttonCount ?? 0
  const stableOnSelectionChange = useCallback(
    (selected: Set<number>) => onSelectionChange(selected),
    [onSelectionChange]
  )
  const { selectedButtons, selectButton } = useButtonSelection(buttonCount, stableOnSelectionChange)

  const handleClick = (index: number, event: React.MouseEvent): void => {
    selectButton(index, event)
  }

  if (!deviceInfo || !pendingConfig) return null

  const actuationPoints = pendingConfig.actuationPoints
  const layoutProps = {
    selectedButtons,
    actuationPoints,
    positionsRef: positions,
    pressedMaskRef: pressedMask,
    hasFirmwareMaskRef: hasFirmwareMask,
    onButtonClick: handleClick
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="bg-surface-raised rounded-2xl border border-surface-border p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-secondary">
            Button Visualization
          </h3>
          <span className="text-xs text-text-muted">
            Click to select | Shift+click for range | Ctrl+click for multi
          </span>
        </div>

        {deviceInfo.controllerType === ControllerType.Mini && <MiniLayout {...layoutProps} />}
        {deviceInfo.controllerType === ControllerType.Standard && <StandardLayout {...layoutProps} />}
        {deviceInfo.controllerType === ControllerType.Pro && <ProLayout {...layoutProps} />}
        {deviceInfo.controllerType === ControllerType.FoundersEdition && <MiniLayout {...layoutProps} />}
      </div>
    </div>
  )
}
