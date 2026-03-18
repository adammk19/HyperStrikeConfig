import { useState } from 'react'
import { useDeviceState } from '../../context/DeviceContext'
import { useDeviceConnection } from '../../hooks/useDeviceConnection'
import { useFirmwareUpdate } from '../../hooks/useFirmwareUpdate'
import { CONTROLLER_NAMES, ControllerType } from '../../types/device'
import { Button } from '../common/Button'
import { UpdateProgressModal } from '../firmware/UpdateProgressModal'

const CONTROLLER_OPTIONS = [
  { value: ControllerType.Mini, label: CONTROLLER_NAMES[ControllerType.Mini] },
  { value: ControllerType.Standard, label: CONTROLLER_NAMES[ControllerType.Standard] },
  { value: ControllerType.Pro, label: CONTROLLER_NAMES[ControllerType.Pro] },
  { value: ControllerType.FoundersEdition, label: CONTROLLER_NAMES[ControllerType.FoundersEdition] }
]

export function ConnectPrompt(): React.JSX.Element {
  const { connect } = useDeviceConnection()
  const { connectionState, error } = useDeviceState()
  const { currentStep, downloadProgress, isCancelling, manualFlashWithType, cancelUpdate } =
    useFirmwareUpdate()
  const [selectedType, setSelectedType] = useState<ControllerType>(ControllerType.Standard)
  const [showProgress, setShowProgress] = useState(false)

  const handleManualFlash = async (): Promise<void> => {
    setShowProgress(true)
    await manualFlashWithType(selectedType)
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text-primary flex items-center justify-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 22q-.825 0-1.412-.587T10 20q0-.525.275-.975T11 18.3V16H8q-.825 0-1.412-.587T6 14v-2.3q-.45-.225-.725-.675T5 10q0-.825.588-1.413T7 8t1.413.588T9 10q0 .575-.275 1T8 11.7V14h3V6H9l3-4l3 4h-2v8h3v-2h-1V8h4v4h-1v2q0 .825-.587 1.413T16 16h-3v2.3q.475.25.738.7T14 20q0 .825-.587 1.413T12 22" />
            </svg>
            Connect Your Controller
          </h2>
          <p className="text-text-secondary">
            Plug in your HyperStrike controller and click the button below to get started.
          </p>
        </div>

        <Button onClick={connect} size="lg" disabled={connectionState === 'connecting'}>
          {connectionState === 'connecting' ? 'Connecting...' : 'Connect Controller'}
        </Button>

        {error && <p className="text-sm text-danger">{error}</p>}

        <p className="text-xs text-text-muted">
          Make sure your controller is plugged in via USB before connecting.
        </p>

        {/* Manual firmware flash for old controllers */}
        <div className="border-t border-surface-border pt-6 space-y-3">
          <h3 className="text-sm font-medium text-text-primary">Old Firmware?</h3>
          <p className="text-xs text-text-muted">
            If your controller has outdated firmware and won't connect, you can update it manually.
            Select your controller type, hold the BOOT button while plugging in your controller,
            then click Update.
          </p>
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(Number(e.target.value) as ControllerType)}
              className="flex-1 px-3 py-2 rounded-lg bg-surface-overlay border border-surface-border text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              {CONTROLLER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={handleManualFlash} size="sm">
              Update Firmware
            </Button>
          </div>
        </div>
      </div>

      <UpdateProgressModal
        open={showProgress}
        step={currentStep}
        downloadProgress={downloadProgress}
        onClose={() => setShowProgress(false)}
        onCancel={cancelUpdate}
        isCancelling={isCancelling}
        showConnectPrompt
      />
    </div>
  )
}
