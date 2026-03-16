import { access, copyFile, constants } from 'fs/promises'
import { join } from 'path'

const BOOT_DRIVE_LABEL = 'RPI-RP2'
const BOOT_MARKER_FILE = 'INFO_UF2.TXT'

export async function detectBootDrive(): Promise<string | null> {
  switch (process.platform) {
    case 'win32':
      return detectBootDriveWindows()
    case 'darwin':
      return detectBootDriveMacOS()
    case 'linux':
      return detectBootDriveLinux()
    default:
      throw new Error(`Unsupported platform: ${process.platform}`)
  }
}

async function detectBootDriveWindows(): Promise<string | null> {
  // Check drive letters D-Z for the RP2040 bootloader marker file.
  // Much faster and more reliable than PowerShell/WMI queries.
  for (let code = 68; code <= 90; code++) {
    const drivePath = `${String.fromCharCode(code)}:\\`
    try {
      await access(join(drivePath, BOOT_MARKER_FILE), constants.R_OK)
      return drivePath
    } catch {
      continue
    }
  }
  return null
}

async function detectBootDriveMacOS(): Promise<string | null> {
  const path = `/Volumes/${BOOT_DRIVE_LABEL}`
  try {
    await access(join(path, BOOT_MARKER_FILE), constants.R_OK)
    return path
  } catch {
    return null
  }
}

async function detectBootDriveLinux(): Promise<string | null> {
  const user = process.env.USER ?? process.env.LOGNAME ?? 'root'
  const paths = [`/media/${user}/${BOOT_DRIVE_LABEL}`, `/run/media/${user}/${BOOT_DRIVE_LABEL}`]

  for (const path of paths) {
    try {
      await access(join(path, BOOT_MARKER_FILE), constants.R_OK)
      return path
    } catch {
      continue
    }
  }
  return null
}

export async function copyToBootDrive(uf2Path: string, drivePath: string): Promise<void> {
  // Validate the drive path looks like a mount point
  if (process.platform === 'win32') {
    if (!/^[A-Z]:\\$/i.test(drivePath)) {
      throw new Error('Invalid boot drive path')
    }
  } else {
    if (!drivePath.startsWith('/Volumes/') && !drivePath.startsWith('/media/') && !drivePath.startsWith('/run/media/')) {
      throw new Error('Invalid boot drive path')
    }
  }

  const destPath = join(drivePath, 'firmware.uf2')
  await copyFile(uf2Path, destPath)
}
