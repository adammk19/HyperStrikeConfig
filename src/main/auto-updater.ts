import { autoUpdater } from 'electron-updater'
import type { BrowserWindow } from 'electron'

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('app:update-available', info.version)
  })

  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send('app:update-progress', Math.round(progress.percent))
  })

  autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('app:update-downloaded')
  })

  autoUpdater.on('error', (error) => {
    mainWindow.webContents.send('app:update-error', error.message)
  })
}

export function checkForUpdates(): void {
  autoUpdater.checkForUpdates()
}

export function downloadUpdate(): void {
  autoUpdater.downloadUpdate()
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}
