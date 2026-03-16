import { useDeviceState } from '../../context/DeviceContext'
import { CONTROLLER_NAMES, formatFirmwareVersion } from '../../types/device'
import { useTheme } from '../../hooks/useTheme'

export function Header(): React.JSX.Element {
  const { connectionState, deviceInfo } = useDeviceState()
  const { theme, toggleTheme } = useTheme()

  const statusColor = {
    disconnected: 'bg-red-500',
    connecting: 'bg-yellow-500 animate-pulse',
    connected: 'bg-green-500',
    reconnecting: 'bg-yellow-500 animate-pulse'
  }[connectionState]

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-surface-raised border-b border-surface-border shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-text-primary">HyperStrike Config</h1>
      </div>

      <div className="flex items-center gap-4">
        {deviceInfo && (
          <>
            <span className="text-sm text-text-secondary">
              {CONTROLLER_NAMES[deviceInfo.controllerType]}
            </span>
            <span className="text-xs text-text-muted font-mono">
              FW {formatFirmwareVersion(deviceInfo)}
            </span>
          </>
        )}

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          <span className="text-xs text-text-secondary capitalize">{connectionState}</span>
        </div>
      </div>
    </header>
  )
}
