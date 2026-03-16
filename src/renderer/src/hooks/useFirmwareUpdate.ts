import { useCallback, useEffect, useState } from 'react'
import { useDeviceDispatch, useDeviceState } from '../context/DeviceContext'
import { deserializeConfig } from '../services/config-serializer'
import {
  getConnectedDevice,
  openDevice,
  sendCommand,
  sendCommandNoResponse
} from '../services/hid-connection'
import { type ControllerType, formatFirmwareVersion } from '../types/device'
import {
  compareVersions,
  type FirmwareReleaseInfo,
  type FirmwareUpdateStep
} from '../types/firmware'
import {
  CMD_ENTER_BOOTLOADER,
  CMD_GET_CONFIG,
  CMD_GET_DEVICE_INFO,
  STATUS_OK
} from '../types/hid-protocol'

const BOOT_DRIVE_POLL_INTERVAL = 2000
const BOOT_DRIVE_MAX_ATTEMPTS = 30
const BOOT_DRIVE_INITIAL_DELAY = 3000
const RECONNECT_POLL_INTERVAL = 2000
const RECONNECT_MAX_ATTEMPTS = 15

export function useFirmwareUpdate(): {
  latestRelease: FirmwareReleaseInfo | null
  updateAvailable: boolean
  currentStep: FirmwareUpdateStep
  downloadProgress: number
  checkForUpdate: () => Promise<void>
  performUpdate: () => Promise<void>
  manualFlashReset: () => Promise<void>
  manualFlashWithType: (controllerType: ControllerType) => Promise<void>
} {
  const state = useDeviceState()
  const dispatch = useDeviceDispatch()
  const [latestRelease, setLatestRelease] = useState<FirmwareReleaseInfo | null>(null)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [currentStep, setCurrentStep] = useState<FirmwareUpdateStep>('idle')
  const [downloadProgress, setDownloadProgress] = useState(0)

  const updateStep = useCallback(
    (step: FirmwareUpdateStep) => {
      setCurrentStep(step)
      dispatch({ type: 'FIRMWARE_UPDATE_STEP', step })
    },
    [dispatch]
  )

  const checkForUpdate = useCallback(async () => {
    try {
      updateStep('checking')
      const release = await window.context.fetchLatestFirmwareRelease(
        state.deviceInfo?.controllerType
      )
      setLatestRelease(release)

      if (state.deviceInfo) {
        const currentVersion = formatFirmwareVersion(state.deviceInfo)
        const hasUpdate = compareVersions(release.version, currentVersion) > 0
        setUpdateAvailable(hasUpdate)
        dispatch({ type: 'FIRMWARE_UPDATE_INFO', available: hasUpdate, version: release.version })
      }
      updateStep('idle')
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'Failed to check for updates'
      })
      updateStep('idle')
    }
  }, [state.deviceInfo, dispatch, updateStep])

  // Check for updates when device connects
  useEffect(() => {
    if (state.connectionState === 'connected' && state.deviceInfo) {
      checkForUpdate()
    }
  }, [state.connectionState, state.deviceInfo, checkForUpdate])

  // Subscribe to download progress
  useEffect(() => {
    const unsubscribe = window.context.onFirmwareDownloadProgress((percent) => {
      setDownloadProgress(percent)
    })
    return unsubscribe
  }, [])

  const performUpdate = useCallback(async () => {
    if (!latestRelease || !state.device) return

    try {
      // Step 1: Download UF2
      updateStep('downloading')
      setDownloadProgress(0)
      const uf2Path = await window.context.downloadUF2(latestRelease.downloadUrl)

      // Step 2: Enter bootloader
      updateStep('rebooting')
      // Suppress reconnect logic since we expect a disconnect
      ;(window as unknown as { __suppressReconnect: (v: boolean) => void }).__suppressReconnect(
        true
      )
      await sendCommandNoResponse(state.device, CMD_ENTER_BOOTLOADER)

      // Step 3: Wait for boot drive
      updateStep('waiting-for-boot-drive')
      const drivePath = await pollForBootDrive()
      if (!drivePath) {
        throw new Error('Timed out waiting for controller to enter update mode')
      }

      // Step 4: Copy UF2
      updateStep('copying')
      await window.context.copyToBootDrive(uf2Path, drivePath)

      // Step 5: Wait for reconnect
      updateStep('waiting-for-reconnect')
      const device = await pollForReconnect()
      if (!device) {
        throw new Error('Timed out waiting for controller to restart')
      }

      // Step 6: Verify new version
      await openDevice(device)
      const infoResponse = await sendCommand(device, CMD_GET_DEVICE_INFO)
      if (infoResponse.status === STATUS_OK) {
        const info = {
          controllerType: infoResponse.payload[0],
          buttonCount: infoResponse.payload[1],
          firmwareVersion: {
            major: infoResponse.payload[2],
            minor: infoResponse.payload[3],
            patch: infoResponse.payload[4]
          }
        }
        dispatch({ type: 'CONNECT_SUCCESS', device, info })

        const configResponse = await sendCommand(device, CMD_GET_CONFIG)
        if (configResponse.status === STATUS_OK) {
          const config = deserializeConfig(configResponse.payload, info.buttonCount)
          dispatch({ type: 'CONFIG_LOADED', config })
        }
      }

      ;(window as unknown as { __suppressReconnect: (v: boolean) => void }).__suppressReconnect(
        false
      )
      updateStep('complete')
    } catch (err) {
      ;(window as unknown as { __suppressReconnect: (v: boolean) => void }).__suppressReconnect(
        false
      )
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'Firmware update failed'
      })
      updateStep('error')
    }
  }, [latestRelease, state.device, dispatch, updateStep])

  const manualFlashReset = useCallback(async () => {
    if (!latestRelease) {
      await checkForUpdate()
    }

    try {
      // For legacy firmware: user manually holds BOOT + plugs in
      // We just poll for the boot drive
      updateStep('waiting-for-boot-drive')
      const drivePath = await pollForBootDrive()
      if (!drivePath) {
        throw new Error('Timed out waiting for controller in update mode')
      }

      if (latestRelease) {
        updateStep('downloading')
        setDownloadProgress(0)
        const uf2Path = await window.context.downloadUF2(latestRelease.downloadUrl)

        updateStep('copying')
        await window.context.copyToBootDrive(uf2Path, drivePath)

        updateStep('waiting-for-reconnect')
        await pollForReconnect()
      }

      updateStep('complete')
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        error: err instanceof Error ? err.message : 'Manual flash failed'
      })
      updateStep('error')
    }
  }, [latestRelease, dispatch, updateStep, checkForUpdate])

  const manualFlashWithType = useCallback(
    async (controllerType: ControllerType) => {
      try {
        // Fetch firmware for the selected controller type
        updateStep('checking')
        const release = await window.context.fetchLatestFirmwareRelease(controllerType)

        // Download UF2
        updateStep('downloading')
        setDownloadProgress(0)
        const uf2Path = await window.context.downloadUF2(release.downloadUrl)

        // Wait for user to put controller in BOOT mode
        updateStep('waiting-for-boot-drive')
        const drivePath = await pollForBootDrive()
        if (!drivePath) {
          throw new Error('Timed out waiting for controller in update mode')
        }

        // Copy firmware
        updateStep('copying')
        await window.context.copyToBootDrive(uf2Path, drivePath)

        updateStep('complete')
      } catch (err) {
        dispatch({
          type: 'SET_ERROR',
          error: err instanceof Error ? err.message : 'Manual flash failed'
        })
        updateStep('error')
      }
    },
    [dispatch, updateStep]
  )

  return {
    latestRelease,
    updateAvailable,
    currentStep,
    downloadProgress,
    checkForUpdate,
    performUpdate,
    manualFlashReset,
    manualFlashWithType
  }
}

async function pollForBootDrive(): Promise<string | null> {
  // Wait for RP2040 to reboot into bootloader and Windows to mount the drive
  await new Promise((r) => setTimeout(r, BOOT_DRIVE_INITIAL_DELAY))
  for (let i = 0; i < BOOT_DRIVE_MAX_ATTEMPTS; i++) {
    const drive = await window.context.detectBootDrive()
    if (drive) return drive
    await new Promise((r) => setTimeout(r, BOOT_DRIVE_POLL_INTERVAL))
  }
  return null
}

async function pollForReconnect(): Promise<HIDDevice | null> {
  for (let i = 0; i < RECONNECT_MAX_ATTEMPTS; i++) {
    const device = await getConnectedDevice()
    if (device) return device
    await new Promise((r) => setTimeout(r, RECONNECT_POLL_INTERVAL))
  }
  return null
}
