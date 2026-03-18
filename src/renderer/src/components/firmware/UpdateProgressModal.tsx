import type { FirmwareUpdateStep } from '../../types/firmware'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'

interface UpdateProgressModalProps {
  open: boolean
  step: FirmwareUpdateStep
  downloadProgress: number
  onClose: () => void
  onCancel?: () => void
  isCancelling?: boolean
  showConnectPrompt?: boolean
}

const STEP_LABELS: Record<FirmwareUpdateStep, string> = {
  idle: '',
  checking: 'Checking for updates...',
  downloading: 'Downloading firmware...',
  rebooting: 'Rebooting controller to update mode...',
  'waiting-for-boot-drive': 'Waiting for controller to appear as USB drive...',
  copying: 'Copying firmware to controller...',
  'waiting-for-reconnect': 'Waiting for controller to restart...',
  complete: 'Update complete!',
  error: 'Update failed'
}

const STEPS_ORDER: FirmwareUpdateStep[] = [
  'downloading',
  'rebooting',
  'waiting-for-boot-drive',
  'copying',
  'waiting-for-reconnect',
  'complete'
]

export function UpdateProgressModal({
  open,
  step,
  downloadProgress,
  onClose,
  onCancel,
  isCancelling = false,
  showConnectPrompt = false
}: UpdateProgressModalProps): React.JSX.Element {
  const isComplete = step === 'complete'
  const isError = step === 'error'
  const isInProgress = step !== 'idle' && !isComplete && !isError
  const currentStepIndex = STEPS_ORDER.indexOf(step)

  return (
    <Modal open={open} title="Firmware Update" closable={isComplete || isError}>
      <div className="space-y-6">
        {/* Step list */}
        <div className="space-y-3">
          {STEPS_ORDER.map((s, i) => {
            const isDone = i < currentStepIndex
            const isCurrent = s === step
            const isPending = i > currentStepIndex

            return (
              <div key={s} className="flex items-center gap-3">
                {/* Status icon */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${isDone ? 'bg-success text-white' : ''}
                    ${isCurrent ? 'bg-primary text-white animate-pulse' : ''}
                    ${isPending ? 'bg-surface-overlay text-text-muted' : ''}
                    ${isError && isCurrent ? 'bg-danger text-white' : ''}
                  `}
                >
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M3 7l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-sm ${
                    isCurrent
                      ? 'text-text-primary font-medium'
                      : isDone
                        ? 'text-text-secondary'
                        : 'text-text-muted'
                  }`}
                >
                  {STEP_LABELS[s]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Download progress bar */}
        {step === 'downloading' && (
          <div className="space-y-1">
            <div className="h-2 bg-surface-overlay rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <span className="text-xs text-text-muted">{downloadProgress}%</span>
          </div>
        )}

        {/* Completion / Error actions */}
        {isComplete && (
          <div className="text-center space-y-3">
            <p className="text-success font-medium">Firmware updated successfully!</p>
            {showConnectPrompt && (
              <p className="text-sm text-text-secondary">
                Your controller will restart automatically. Click "Connect Controller" to get
                started.
              </p>
            )}
            <Button onClick={onClose}>Done</Button>
          </div>
        )}

        {isError && (
          <div className="text-center space-y-3">
            <p className="text-danger">Something went wrong during the update.</p>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        )}

        {isInProgress && onCancel && (
          <div className="flex justify-center">
            <Button onClick={onCancel} variant="secondary" disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Cancel Update'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
