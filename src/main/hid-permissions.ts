import { BrowserWindow, session } from 'electron'

// Placeholder USB identifiers - replace with actual values
const HYPERSTRIKE_VID = 0xcafe
const HYPERSTRIKE_PID = 0x4001

export function setupHIDPermissions(mainWindow: BrowserWindow): void {
  const ses = mainWindow.webContents.session

  // Auto-approve HID devices matching our VID/PID
  ses.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'hid') {
      const device = details.device as Electron.HIDDevice
      if (device.vendorId === HYPERSTRIKE_VID && device.productId === HYPERSTRIKE_PID) {
        return true
      }
    }
    return false
  })

  // Auto-select the matching device when WebHID requestDevice() is called
  ses.on('select-hid-device', (event, details, callback) => {
    event.preventDefault()
    const device = details.deviceList.find(
      (d) => d.vendorId === HYPERSTRIKE_VID && d.productId === HYPERSTRIKE_PID
    )
    if (device) {
      callback(device.deviceId)
    } else {
      // No matching device found - return empty string to cancel
      callback('')
    }
  })

  // Grant permission for previously-authorized devices on reconnect
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'hid') {
      return true
    }
    return false
  })
}
