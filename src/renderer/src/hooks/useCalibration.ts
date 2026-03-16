import { useCallback } from 'react'
import { useDeviceState, useDeviceDispatch } from '../context/DeviceContext'
import { CMD_CALIBRATE_START, CMD_CALIBRATE_STOP, CMD_GET_CONFIG, STATUS_OK } from '../types/hid-protocol'
import { sendCommand } from '../services/hid-connection'
import { deserializeConfig } from '../services/config-serializer'

export function useCalibration(): {
  startCalibration: () => Promise<void>
  stopCalibration: () => Promise<void>
  cancelCalibration: () => Promise<void>
} {
  const state = useDeviceState()
  const dispatch = useDeviceDispatch()

  const startCalibration = useCallback(async () => {
    if (!state.device) return

    const response = await sendCommand(state.device, CMD_CALIBRATE_START)
    if (response.status !== STATUS_OK) {
      throw new Error('Failed to start calibration')
    }
    dispatch({ type: 'CALIBRATION_START' })
  }, [state.device, dispatch])

  const stopCalibration = useCallback(async () => {
    if (!state.device || !state.deviceInfo) return

    const response = await sendCommand(state.device, CMD_CALIBRATE_STOP)
    if (response.status !== STATUS_OK) {
      throw new Error('Failed to stop calibration')
    }

    // Re-read config to get updated min/max values
    const configResponse = await sendCommand(state.device, CMD_GET_CONFIG)
    if (configResponse.status !== STATUS_OK) {
      throw new Error('Failed to read config after calibration')
    }
    const config = deserializeConfig(configResponse.payload, state.deviceInfo.buttonCount)
    dispatch({ type: 'CONFIG_LOADED', config })
    dispatch({ type: 'CALIBRATION_STOP' })
  }, [state.device, state.deviceInfo, dispatch])

  const cancelCalibration = useCallback(async () => {
    if (!state.device) return

    // Send stop without saving - firmware should discard partial calibration
    try {
      await sendCommand(state.device, CMD_CALIBRATE_STOP)
    } catch {
      // Best effort
    }
    dispatch({ type: 'CALIBRATION_STOP' })
  }, [state.device, dispatch])

  return { startCalibration, stopCalibration, cancelCalibration }
}
