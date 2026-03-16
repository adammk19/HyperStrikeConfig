import { useCallback, useEffect, useState } from 'react'

export function useAppUpdater(): {
  updateAvailable: boolean
  updateVersion: string
  downloadProgress: number
  updateDownloaded: boolean
  checkForUpdate: () => Promise<void>
  installUpdate: () => void
} {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateVersion, setUpdateVersion] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)

  useEffect(() => {
    const unsubs: (() => void)[] = []

    unsubs.push(
      window.context.onAppUpdateAvailable((version) => {
        setUpdateAvailable(true)
        setUpdateVersion(version)
      })
    )

    unsubs.push(
      window.context.onAppUpdateProgress((percent) => {
        setDownloadProgress(percent)
      })
    )

    unsubs.push(
      window.context.onAppUpdateDownloaded(() => {
        setUpdateDownloaded(true)
      })
    )

    return () => unsubs.forEach((fn) => fn())
  }, [])

  const checkForUpdate = useCallback(async () => {
    await window.context.checkForAppUpdate()
  }, [])

  const installUpdate = useCallback(() => {
    window.context.installAppUpdate()
  }, [])

  return {
    updateAvailable,
    updateVersion,
    downloadProgress,
    updateDownloaded,
    checkForUpdate,
    installUpdate
  }
}
