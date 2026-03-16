import type { FirmwareReleaseInfo } from '../renderer/src/types/firmware'

interface ContextAPI {
  fetchLatestFirmwareRelease: (controllerType?: number) => Promise<FirmwareReleaseInfo>
  downloadUF2: (url: string) => Promise<string>
  detectBootDrive: () => Promise<string | null>
  copyToBootDrive: (uf2Path: string, drivePath: string) => Promise<void>
  getAppVersion: () => Promise<string>
  checkForAppUpdate: () => Promise<void>
  installAppUpdate: () => void
  onFirmwareDownloadProgress: (callback: (percent: number) => void) => () => void
  onAppUpdateAvailable: (callback: (version: string) => void) => () => void
  onAppUpdateProgress: (callback: (percent: number) => void) => () => void
  onAppUpdateDownloaded: (callback: () => void) => () => void
}

declare global {
  interface Window {
    context: ContextAPI
  }
}
