import { useDeviceConnection } from '../../hooks/useDeviceConnection'
import { useDeviceState } from '../../context/DeviceContext'
import { Button } from '../common/Button'

export function ConnectPrompt(): React.JSX.Element {
  const { connect } = useDeviceConnection()
  const { connectionState, error } = useDeviceState()

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text-primary flex items-center justify-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path  d="M12 22q-.825 0-1.412-.587T10 20q0-.525.275-.975T11 18.3V16H8q-.825 0-1.412-.587T6 14v-2.3q-.45-.225-.725-.675T5 10q0-.825.588-1.413T7 8t1.413.588T9 10q0 .575-.275 1T8 11.7V14h3V6H9l3-4l3 4h-2v8h3v-2h-1V8h4v4h-1v2q0 .825-.587 1.413T16 16h-3v2.3q.475.25.738.7T14 20q0 .825-.587 1.413T12 22"/>
            </svg>
            Connect Your Controller
          </h2>
          <p className="text-text-secondary">
            Plug in your HyperStrike controller and click the button below to get started.
          </p>
        </div>

        <Button
          onClick={connect}
          size="lg"
          disabled={connectionState === 'connecting'}
        >
          {connectionState === 'connecting' ? 'Connecting...' : 'Connect Controller'}
        </Button>

        {error && (
          <p className="text-sm text-danger">{error}</p>
        )}

        <p className="text-xs text-text-muted">
          Make sure your controller is plugged in via USB before connecting.
        </p>
      </div>
    </div>
  )
}
