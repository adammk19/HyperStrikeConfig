import { useCallback, useEffect, useState } from 'react'

export function useAppUpdater(): {
  updateAvailable: boolean
  updateVersion: string
  downloadProgress: number
  updateDownloaded: boolean
  isDownloading: boolean
  updateError: string | null
  checkForUpdate: () => Promise<void>
  downloadUpdate: () => void
  installUpdate: () => void
} {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [updateVersion, setUpdateVersion] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

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
        setIsDownloading(false)
      })
    )

    unsubs.push(
      window.context.onAppUpdateError((message) => {
        setUpdateError(message)
        setIsDownloading(false)
      })
    )

    return () => unsubs.forEach((fn) => fn())
  }, [])

  const checkForUpdate = useCallback(async () => {
    await window.context.checkForAppUpdate()
  }, [])

  const downloadUpdate = useCallback(() => {
    setIsDownloading(true)
    setUpdateError(null)
    setDownloadProgress(0)
    window.context.downloadAppUpdate()
  }, [])

  const installUpdate = useCallback(() => {
    window.context.installAppUpdate()
  }, [])

  return {
    updateAvailable,
    updateVersion,
    downloadProgress,
    updateDownloaded,
    isDownloading,
    updateError,
    checkForUpdate,
    downloadUpdate,
    installUpdate
  }
}
