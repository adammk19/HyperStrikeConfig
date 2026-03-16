import { ipcMain, app } from 'electron'
import { fetchLatestRelease, downloadUF2 } from './firmware-service'
import { detectBootDrive, copyToBootDrive } from './boot-drive-detector'
import { checkForUpdates, downloadUpdate, installUpdate } from './auto-updater'
import type { BrowserWindow } from 'electron'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Firmware operations
  ipcMain.handle('firmware:fetch-latest-release', async (_event, controllerType?: number) => {
    return await fetchLatestRelease(controllerType)
  })

  ipcMain.handle('firmware:download-uf2', async (_event, url: string) => {
    const path = await downloadUF2(url, (percent) => {
      mainWindow.webContents.send('firmware:download-progress', percent)
    })
    return path
  })

  ipcMain.handle('firmware:detect-boot-drive', async () => {
    return await detectBootDrive()
  })

  ipcMain.handle('firmware:copy-to-boot-drive', async (_event, uf2Path: string, drivePath: string) => {
    await copyToBootDrive(uf2Path, drivePath)
  })

  // App operations
  ipcMain.handle('app:get-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:check-update', () => {
    checkForUpdates()
  })

  ipcMain.handle('app:download-update', () => {
    downloadUpdate()
  })

  ipcMain.handle('app:install-update', () => {
    installUpdate()
  })
}
