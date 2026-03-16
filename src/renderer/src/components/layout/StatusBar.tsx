import { useEffect, useState } from 'react'
import { useAppUpdater } from '../../hooks/useAppUpdater'

export function StatusBar(): React.JSX.Element {
  const [appVersion, setAppVersion] = useState('')
  const {
    updateAvailable,
    updateVersion,
    downloadProgress,
    updateDownloaded,
    isDownloading,
    downloadUpdate,
    installUpdate
  } = useAppUpdater()

  useEffect(() => {
    window.context.getAppVersion().then(setAppVersion)
  }, [])

  return (
    <footer className="flex items-center justify-between px-6 py-2 bg-surface-raised border-t border-surface-border text-xs text-text-muted shrink-0">
      <span>HyperStrike Config v{appVersion}</span>
      {updateAvailable && (
        <div className="flex items-center gap-2">
          {updateDownloaded ? (
            <button
              onClick={installUpdate}
              className="text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              Install update v{updateVersion}
            </button>
          ) : isDownloading ? (
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Downloading...</span>
              <div className="w-24 h-1.5 bg-surface-overlay rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <span className="text-text-secondary">{downloadProgress}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-warning">Update v{updateVersion} available</span>
              <button
                onClick={downloadUpdate}
                className="text-primary hover:text-primary-hover transition-colors cursor-pointer"
              >
                Download
              </button>
            </div>
          )}
        </div>
      )}
    </footer>
  )
}
