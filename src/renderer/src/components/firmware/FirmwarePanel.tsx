import { useState } from 'react'
import { useDeviceState } from '../../context/DeviceContext'
import { formatFirmwareVersion } from '../../types/device'
import { useFirmwareUpdate } from '../../hooks/useFirmwareUpdate'
import { Button } from '../common/Button'
import { UpdateProgressModal } from './UpdateProgressModal'

export function FirmwarePanel(): React.JSX.Element {
  const { deviceInfo } = useDeviceState()
  const {
    latestRelease,
    updateAvailable,
    currentStep,
    downloadProgress,
    performUpdate,
    manualFlashReset
  } = useFirmwareUpdate()
  const [showProgress, setShowProgress] = useState(false)

  const handleUpdate = async (): Promise<void> => {
    setShowProgress(true)
    await performUpdate()
  }

  const handleManualFlash = async (): Promise<void> => {
    setShowProgress(true)
    await manualFlashReset()
  }

  return (
    <>
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-text-primary">Firmware</h4>

        {/* Current version */}
        <div className="bg-surface-overlay rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Current Version</span>
            <span className="text-sm font-mono text-text-primary">
              {deviceInfo ? formatFirmwareVersion(deviceInfo) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">Latest Version</span>
            <span className="text-sm font-mono text-text-primary">
              {latestRelease?.version ?? '—'}
            </span>
          </div>
        </div>

        {/* Update button */}
        {updateAvailable && latestRelease && (
          <div className="space-y-2">
            <Button variant="primary" onClick={handleUpdate} className="w-full">
              Update to {latestRelease.version}
            </Button>
            {latestRelease.releaseNotes && (
              <details className="text-xs text-text-muted">
                <summary className="cursor-pointer hover:text-text-secondary">
                  Release notes
                </summary>
                <p className="mt-2 whitespace-pre-wrap bg-surface-overlay rounded p-3">
                  {latestRelease.releaseNotes}
                </p>
              </details>
            )}
          </div>
        )}

        {!updateAvailable && latestRelease && (
          <p className="text-sm text-success">Firmware is up to date</p>
        )}

        {/* Manual flash for legacy firmware */}
        <div className="border-t border-surface-border pt-4 space-y-2">
          <h5 className="text-xs font-medium text-text-secondary">Manual Flash</h5>
          <p className="text-xs text-text-muted">
            For controllers with outdated firmware that can't be updated over USB.
            Hold the BOOT button on your controller while plugging it in, then click below.
          </p>
          <Button variant="secondary" onClick={handleManualFlash} size="sm">
            Flash from BOOT Mode
          </Button>
        </div>
      </div>

      <UpdateProgressModal
        open={showProgress}
        step={currentStep}
        downloadProgress={downloadProgress}
        onClose={() => setShowProgress(false)}
      />
    </>
  )
}
