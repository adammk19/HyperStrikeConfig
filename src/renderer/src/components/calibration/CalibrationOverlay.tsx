import { useEffect, useRef, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { CalibrationButtonStatus } from './CalibrationButtonStatus'
import { useDeviceState } from '../../context/DeviceContext'
import { useCalibration } from '../../hooks/useCalibration'
import { useRealtimeData } from '../../hooks/useRealtimeData'
import { ControllerType } from '../../types/device'

// Labels vary by controller type: Mini/FE have 12 buttons (no M1/M2), Standard/Pro have 14
const LABELS_12 = ['L', 'R', 'U', 'D', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']
const LABELS_14 = ['L', 'R', 'U', 'D', 'B1', 'B2', 'B3', 'B4', 'M1', 'M2', 'B5', 'B6', 'B7', 'B8']

interface CalibrationOverlayProps {
  open: boolean
  onClose: () => void
}

export function CalibrationOverlay({ open, onClose }: CalibrationOverlayProps): React.JSX.Element {
  const { deviceInfo, isCalibrating } = useDeviceState()
  const { startCalibration, stopCalibration } = useCalibration()
  const { positions } = useRealtimeData()
  const [currentPositions, setCurrentPositions] = useState<number[]>([])
  const rafRef = useRef<number>(0)

  const buttonCount = deviceInfo?.buttonCount ?? 0
  const buttonLabels =
    deviceInfo?.controllerType === ControllerType.Mini ||
    deviceInfo?.controllerType === ControllerType.FoundersEdition
      ? LABELS_12
      : LABELS_14

  // Start calibration when overlay opens
  useEffect(() => {
    if (open && !isCalibrating) {
      setCurrentPositions(new Array(buttonCount).fill(0))
      startCalibration().catch(() => {})
    }
  }, [open, isCalibrating, buttonCount, startCalibration])

  // Track live positions for display
  useEffect(() => {
    if (!open || !isCalibrating) return

    const animate = (): void => {
      const pos = positions.current
      if (pos.length > 0) {
        setCurrentPositions([...pos])
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [open, isCalibrating, positions])

  const handleFinish = async (): Promise<void> => {
    await stopCalibration()
    onClose()
  }

  return (
    <Modal open={open} title="Calibrate Buttons" closable={false}>
      <div className="space-y-4">
        <div className="bg-surface-overlay rounded-lg p-4 text-sm text-text-secondary">
          <p className="font-medium text-text-primary mb-1">Instructions:</p>
          <p>
            Press each button fully down, then release it completely.
            Repeat for all buttons you want to calibrate.
            Click <strong>Finish</strong> when done.
          </p>
        </div>

        {/* Button status grid */}
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {Array.from({ length: buttonCount }, (_, i) => (
            <CalibrationButtonStatus
              key={i}
              label={buttonLabels[i] ?? `B${i + 1}`}
              currentPosition={currentPositions[i] ?? 0}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={handleFinish}>
            Finish Calibration
          </Button>
        </div>
      </div>
    </Modal>
  )
}
