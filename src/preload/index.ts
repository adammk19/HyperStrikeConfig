import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('Context isolation must be enabled for security reasons.')
}

const context = {
  // Firmware operations
  fetchLatestFirmwareRelease: (controllerType?: number) =>
    ipcRenderer.invoke('firmware:fetch-latest-release', controllerType),
  downloadUF2: (url: string) => ipcRenderer.invoke('firmware:download-uf2', url),
  detectBootDrive: () => ipcRenderer.invoke('firmware:detect-boot-drive'),
  copyToBootDrive: (uf2Path: string, drivePath: string) =>
    ipcRenderer.invoke('firmware:copy-to-boot-drive', uf2Path, drivePath),

  // App operations
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  checkForAppUpdate: () => ipcRenderer.invoke('app:check-update'),
  installAppUpdate: () => ipcRenderer.invoke('app:install-update'),

  // Event subscriptions (main -> renderer)
  onFirmwareDownloadProgress: (callback: (percent: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, percent: number): void => callback(percent)
    ipcRenderer.on('firmware:download-progress', handler)
    return () => {
      ipcRenderer.removeListener('firmware:download-progress', handler)
    }
  },
  onAppUpdateAvailable: (callback: (version: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, version: string): void => callback(version)
    ipcRenderer.on('app:update-available', handler)
    return () => {
      ipcRenderer.removeListener('app:update-available', handler)
    }
  },
  onAppUpdateProgress: (callback: (percent: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, percent: number): void => callback(percent)
    ipcRenderer.on('app:update-progress', handler)
    return () => {
      ipcRenderer.removeListener('app:update-progress', handler)
    }
  },
  onAppUpdateDownloaded: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('app:update-downloaded', handler)
    return () => {
      ipcRenderer.removeListener('app:update-downloaded', handler)
    }
  }
}

contextBridge.exposeInMainWorld('context', context)
