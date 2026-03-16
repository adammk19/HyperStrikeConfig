import { useEffect, useState } from 'react'
import { useAppUpdater } from '../../hooks/useAppUpdater'

export function StatusBar(): React.JSX.Element {
  const [appVersion, setAppVersion] = useState('')
  const { updateAvailable, updateVersion, installUpdate, updateDownloaded } = useAppUpdater()

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
          ) : (
            <span className="text-warning">Update v{updateVersion} available</span>
          )}
        </div>
      )}
    </footer>
  )
}
